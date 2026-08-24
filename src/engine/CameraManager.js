import * as THREE from 'three';
import { CAMERA_MODES } from '../config.js';

export class CameraManager {
  constructor(camera) {
    this.camera = camera;
    this.currentModeIndex = 0; // Default 3rd Person Chase (Full view of Car & 3D World)
    this.targetVehicleGroup = null;
    this.vehicleConfig = null;

    this.smoothPos = new THREE.Vector3();
    this.smoothLookAt = new THREE.Vector3();
    this.camYaw = 0; // Smoothed camera heading
    this.currentFov = 60;
    this.targetFov = 60;
    this.initialized = false;

    // G-Force & Head Bob Simulation for Cockpit FPP
    this.vibrationTime = 0;
  }

  setVehicle(vehicleGroup, config) {
    this.targetVehicleGroup = vehicleGroup;
    this.vehicleConfig = config;
    this.initialized = false;
  }

  reset() {
    this.initialized = false;
  }

  getCurrentMode() {
    return CAMERA_MODES[this.currentModeIndex];
  }

  nextCameraMode() {
    this.currentModeIndex = (this.currentModeIndex + 1) % CAMERA_MODES.length;
    return this.getCurrentMode();
  }

  setCameraMode(modeId) {
    const idx = CAMERA_MODES.findIndex(m => m.id === modeId);
    if (idx !== -1) {
      this.currentModeIndex = idx;
    }
  }

  update(deltaTime, telemetry = {}) {
    if (!this.targetVehicleGroup || !this.vehicleConfig) return;

    const mode = this.getCurrentMode();
    const offsets = this.vehicleConfig.cameraOffsets;
    const speedKmh = telemetry.speedKmh || 0;
    const isNitro = telemetry.nitroActive || false;
    const inputThrottle = telemetry.inputThrottle || 0;
    const inputSteer = telemetry.inputSteer || 0;

    const vPos = new THREE.Vector3();
    this.targetVehicleGroup.getWorldPosition(vPos);

    const vRot = new THREE.Quaternion();
    this.targetVehicleGroup.getWorldQuaternion(vRot);

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(vRot);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(vRot);

    // ── 1. Smooth Dynamic FOV (Subtle speed zoom, max 68) ──
    const speedRatio = Math.min(1.0, speedKmh / 240);
    this.targetFov = 60 + (speedRatio * 5) + (isNitro ? 5 : 0);
    this.currentFov += (this.targetFov - this.currentFov) * Math.min(1.0, deltaTime * 4.0);
    
    if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // ── 2. Animate 3D Steering Wheel inside Cockpit ──
    const wheelMesh = this.targetVehicleGroup.userData.steeringWheelMesh;
    if (wheelMesh) {
      const targetSteerAngle = -inputSteer * Math.PI * 0.75;
      wheelMesh.rotation.z += (targetSteerAngle - wheelMesh.rotation.z) * Math.min(1.0, deltaTime * 14.0);
    }

    switch (mode.id) {
      // ═════════════════════════════════════════════════════════════════════
      // TPP: STABILIZED 3RD PERSON CHASE (LOCKED WITHIN 120° CONE, NO EXCESSIVE MOVEMENT)
      // ═════════════════════════════════════════════════════════════════════
      case 'chase': {
        const off = offsets.chase;
        
        // Stable speed-dependent distance
        const dynamicDist = off.distance + (speedRatio * 0.8);
        const dynamicHeight = off.height;

        // Vehicle forward heading angle
        const carYaw = Math.atan2(forward.x, forward.z);
        const idealCamYaw = carYaw + Math.PI; // Directly behind car

        if (!this.initialized) {
          this.camYaw = idealCamYaw;
          this.smoothPos.set(
            vPos.x + Math.sin(this.camYaw) * dynamicDist,
            vPos.y + dynamicHeight,
            vPos.z + Math.cos(this.camYaw) * dynamicDist
          );
          this.smoothLookAt.copy(vPos).add(new THREE.Vector3(0, 1.1, 0));
          this.initialized = true;
        }

        // Compute angle difference between camera heading and car's rear heading
        let angleDiff = idealCamYaw - this.camYaw;
        // Normalize angle to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // ── STRICT 120-DEGREE CONE CLAMP (Max ±60° relative to vehicle rear) ──
        // Camera will NEVER rotate beyond 60 degrees from car's rear centerline (total 120° sweep)
        const maxConeAngle = (60 * Math.PI) / 180; // 60 degrees (1.047 rad)
        if (Math.abs(angleDiff) > maxConeAngle) {
          angleDiff = Math.sign(angleDiff) * maxConeAngle;
          this.camYaw = idealCamYaw - angleDiff;
        }

        // Smooth follow without overshoot or wild swinging
        const followSpeed = 7.5;
        this.camYaw += angleDiff * Math.min(1.0, deltaTime * followSpeed);

        // Compute stabilized camera position
        const targetCamPos = new THREE.Vector3(
          vPos.x + Math.sin(this.camYaw) * dynamicDist,
          vPos.y + dynamicHeight,
          vPos.z + Math.cos(this.camYaw) * dynamicDist
        );

        // Stable target look-at (slightly ahead of the car hood)
        const targetLookAt = vPos.clone()
          .add(new THREE.Vector3(0, 1.05, 0))
          .add(forward.clone().multiplyScalar(1.2));

        // Smoothly interpolate position and lookAt target
        this.smoothPos.lerp(targetCamPos, Math.min(1.0, deltaTime * 12.0));
        this.smoothLookAt.lerp(targetLookAt, Math.min(1.0, deltaTime * 14.0));

        this.camera.position.copy(this.smoothPos);
        this.camera.lookAt(this.smoothLookAt);

        // Keep camera roll completely level (no disorienting sideways tilt)
        this.camera.rotation.z = 0;
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // FPP: 1ST PERSON DRIVER COCKPIT (NATURAL EYE LEVEL, SUBTLE ROAD FEEL)
      // ═════════════════════════════════════════════════════════════════════
      case 'fpv': {
        const off = offsets.fpv;
        
        // Gentle road vibration only at high speed
        this.vibrationTime += deltaTime * (10 + speedRatio * 20);
        const roadVibeY = (speedKmh > 30 ? Math.sin(this.vibrationTime) * 0.0015 * speedRatio : 0);
        const accelG = (inputThrottle > 0 ? -0.02 * inputThrottle : (inputThrottle < 0 ? 0.03 * Math.abs(inputThrottle) : 0));

        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y + roadVibeY, off.z + accelG).applyQuaternion(vRot));
        
        const lookTarget = targetPos.clone()
          .add(forward.clone().multiplyScalar(14.0))
          .add(up.clone().multiplyScalar(-0.10));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        this.camera.rotation.z = 0;
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // DASHBOARD CAMERA
      // ═════════════════════════════════════════════════════════════════════
      case 'dash': {
        const off = offsets.dash;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(12.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        this.camera.rotation.z = 0;
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // STEERING WHEEL CENTERED CAMERA
      // ═════════════════════════════════════════════════════════════════════
      case 'wheel': {
        const off = offsets.wheel;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(10.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        this.camera.rotation.z = 0;
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // FRONT HOOD / BUMPER CAMERA
      // ═════════════════════════════════════════════════════════════════════
      case 'hood': {
        const off = offsets.hood;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(18.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        this.camera.rotation.z = 0;
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // WIDE ORBIT CINEMATIC DRONE CAMERA
      // ═════════════════════════════════════════════════════════════════════
      case 'cinematic': {
        const off = offsets.cinematic;
        const time = Date.now() * 0.0003;
        const radius = off.distance;
        const camX = vPos.x + Math.sin(time) * radius;
        const camZ = vPos.z + Math.cos(time) * radius;
        const camY = vPos.y + off.height;

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(vPos.clone().add(new THREE.Vector3(0, 1.1, 0)));
        this.camera.rotation.z = 0;
        break;
      }
    }
  }
}
