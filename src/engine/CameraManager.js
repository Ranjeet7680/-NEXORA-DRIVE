import * as THREE from 'three';
import { CAMERA_MODES } from '../config.js';

export class CameraManager {
  constructor(camera) {
    this.camera = camera;
    this.currentModeIndex = 0; // Default FPV (1st person driver seat)
    this.targetVehicleGroup = null;
    this.vehicleConfig = null;

    this.smoothPos = new THREE.Vector3();
    this.smoothLookAt = new THREE.Vector3();
  }

  setVehicle(vehicleGroup, config) {
    this.targetVehicleGroup = vehicleGroup;
    this.vehicleConfig = config;
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

  update(deltaTime) {
    if (!this.targetVehicleGroup || !this.vehicleConfig) return;

    const mode = this.getCurrentMode();
    const chassis = this.targetVehicleGroup.userData.chassis || this.targetVehicleGroup;
    const offsets = this.vehicleConfig.cameraOffsets;

    const vPos = new THREE.Vector3();
    this.targetVehicleGroup.getWorldPosition(vPos);

    const vRot = new THREE.Quaternion();
    this.targetVehicleGroup.getWorldQuaternion(vRot);

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(vRot);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(vRot);

    switch (mode.id) {
      case 'fpv': {
        // Driver Seat POV
        const off = offsets.fpv;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(10.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        break;
      }

      case 'dash': {
        // Dashboard POV
        const off = offsets.dash;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(10.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        break;
      }

      case 'wheel': {
        // Steering Wheel Centered POV
        const off = offsets.wheel;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(8.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        break;
      }

      case 'hood': {
        // Front Hood POV
        const off = offsets.hood;
        const targetPos = vPos.clone()
          .add(new THREE.Vector3(off.x, off.y, off.z).applyQuaternion(vRot));
        const lookTarget = targetPos.clone().add(forward.clone().multiplyScalar(15.0));

        this.camera.position.copy(targetPos);
        this.camera.lookAt(lookTarget);
        break;
      }

      case 'chase': {
        // 3rd Person Chase Camera
        const off = offsets.chase;
        const idealCamPos = vPos.clone()
          .sub(forward.clone().multiplyScalar(off.distance))
          .add(new THREE.Vector3(0, off.height, 0));

        const lookTarget = vPos.clone().add(new THREE.Vector3(0, 1.2, 0));

        // Smooth spring interpolation
        this.smoothPos.lerp(idealCamPos, Math.min(1.0, deltaTime * 8.0));
        this.smoothLookAt.lerp(lookTarget, Math.min(1.0, deltaTime * 10.0));

        this.camera.position.copy(this.smoothPos);
        this.camera.lookAt(this.smoothLookAt);
        break;
      }

      case 'cinematic': {
        // Wide Orbiting Cinematic Camera
        const off = offsets.cinematic;
        const time = Date.now() * 0.0005;
        const radius = off.distance;
        const camX = vPos.x + Math.sin(time) * radius;
        const camZ = vPos.z + Math.cos(time) * radius;
        const camY = vPos.y + off.height;

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(vPos.clone().add(new THREE.Vector3(0, 1.0, 0)));
        break;
      }
    }
  }
}
