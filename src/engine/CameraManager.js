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
    this.currentFov = 60;
    this.targetFov = 60;
    this.initialized = false;

    // G-Force & Head Bob Simulation for Cockpit FPP
    this.headBob = new THREE.Vector3();
    this.vibrationTime = 0;
  }

  setVehicle(vehicleGroup, config) {
    this.targetVehicleGroup = vehicleGroup;
    this.vehicleConfig = config;
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
    const isDrifting = telemetry.isDrifting || false;
    const inputThrottle = telemetry.inputThrottle || 0;
    const inputSteer = telemetry.inputSteer || 0;

    const vPos = new THREE.Vector3();
    this.targetVehicleGroup.getWorldPosition(vPos);

    const vRot = new THREE.Quaternion();
    this.targetVehicleGroup.getWorldQuaternion(vRot);

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(vRot);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(vRot);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(vRot);

    // ── 1. Dynamic FOV (Widens with speed & Nitro boost) ──
    const speedRatio = Math.min(1.0, speedKmh / 220);
    this.targetFov = 60 + (speedRatio * 8) + (isNitro ? 8 : 0);
    this.currentFov += (this.targetFov - this.currentFov) * Math.min(1.0, deltaTime * 5.0);
    
    if (this.camera.fov !== this.currentFov) {
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
      // TPP: 3RD PERSON DYNAMIC CHASE CAMERA (SPEED ZOOM, DRIFT TILT, SPRING)
      // ═════════════════════════════════════════════════════════════════════
      case 'chase': {
        const off = offsets.chase;
        
        // Speed-dependent camera pushback (zooms out as you go faster)
        const dynamicDist = off.distance + (speedRatio * 1.5) + (isNitro ? 0.8 : 0);
        const dynamicHeight = off.height - (speedRatio * 0.2);

        // Centrifugal tilt & sway on high-speed turns & drifts
        const driftSway = (isDrifting ? inputSteer * 0.6 : inputSteer * 0.25);
        
        const idealCamPos = vPos.clone()
          .sub(forward.clone().multiplyScalar(dynamicDist))
          .add(up.clone().multiplyScalar(dynamicHeight))
          .add(right.clone().multiplyScalar(driftSway));

        const lookTarget = vPos.clone()
          .add(up.clone().multiplyScalar(1.1))
          .add(forward.clone().multiplyScalar(speedRatio * 2.0));

        if (!this.initialized) {
          this.smoothPos.copy(idealCamPos);
          this.smoothLookAt.copy(lookTarget);
          this.initialized = true;
        } else {
          // Responsive spring-damper lerp
          this.smoothPos.lerp(idealCamPos, Math.min(1.0, deltaTime * 9.0));
          this.smoothLookAt.lerp(lookTarget, Math.min(1.0, deltaTime * 12.0));
        }

        this.camera.position.copy(this.smoothPos);
        this.camera.lookAt(this.smoothLookAt);

        // Dynamic roll tilt in corners
        const targetRoll = -inputSteer * 0.03 * (speedRatio + 0.2);
        this.camera.rotation.z += (targetRoll - this.camera.rotation.z) * Math.min(1.0, deltaTime * 6.0);
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // FPP: 1ST PERSON DRIVER COCKPIT (HEAD INERTIA, VIBRATION, DASHBOARD)
      // ═════════════════════════════════════════════════════════════════════
      case 'fpv': {
        const off = offsets.fpv;
        
        // G-force head physics: acceleration pushes back, braking pushes forward
        this.vibrationTime += deltaTime * (10 + speedRatio * 35);
        const roadVibeY = (speedKmh > 10 ? Math.sin(this.vibrationTime) * 0.003 * speedRatio : 0);
        const accelG = (inputThrottle > 0 ? -0.04 * inputThrottle : (inputThrottle < 0 ? 0.06 * Math.abs(inputThrottle) : 0));
        const steerG = -inputSteer * 0.03 * speedRatio;

        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x + steerG, off.y + roadVibeY, off.z + accelG).applyQuaternion(vRot));
        
        const lookTarget = targetPos.clone()
          .add(forward.clone().multiplyScalar(12.0))
          .add(up.clone().multiplyScalar(-0.15));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);

        // Subtle head roll on turns
        this.camera.rotation.z = -inputSteer * 0.02 * speedRatio;
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
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // WIDE ORBIT CINEMATIC DRONE CAMERA
      // ═════════════════════════════════════════════════════════════════════
      case 'cinematic': {
        const off = offsets.cinematic;
        const time = Date.now() * 0.0004;
        const radius = off.distance;
        const camX = vPos.x + Math.sin(time) * radius;
        const camZ = vPos.z + Math.cos(time) * radius;
        const camY = vPos.y + off.height;

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(vPos.clone().add(new THREE.Vector3(0, 1.2, 0)));
        break;
      }
    }
  }
}
