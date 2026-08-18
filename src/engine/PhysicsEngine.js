import * as THREE from 'three';
import { BIOMES } from '../config.js';

export class PhysicsEngine {
  constructor(terrainManager) {
    this.terrainManager = terrainManager;
    
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = 0;

    this.speedKmh = 0;
    this.rpm = 1000;
    this.gear = 1;
    this.steeringAngle = 0;
    this.isDrifting = false;
    this.surfaceFriction = 1.0;
    this.currentBiome = BIOMES.CITY;

    // Body Motion Roll / Pitch (Weight transfer)
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.damageHealth = 100; // Vehicle condition %

    // Control Inputs
    this.inputThrottle = 0;
    this.inputSteer = 0;
    this.inputHandbrake = false;

    this.vehicleConfig = null;
    this.upgradeLevels = { engine: 0, brakes: 0, tires: 0, suspension: 0 };
    this.vehicleMesh = null;
  }

  setVehicle(vehicleMesh, config, upgrades) {
    this.vehicleMesh = vehicleMesh;
    this.vehicleConfig = config;
    this.upgradeLevels = upgrades || { engine: 0, brakes: 0, tires: 0, suspension: 0 };

    this.position.copy(vehicleMesh.position);
    this.rotation.copy(vehicleMesh.rotation);
    this.velocity.set(0, 0, 0);
    this.angularVelocity = 0;
    this.speedKmh = 0;
    this.rpm = 1000;
    this.gear = 1;
    this.steeringAngle = 0;

    // Apply Stance Ride Height Offset
    const rideOffset = (upgrades.rideHeight || 0) * 0.1;
    this.position.y += rideOffset;
  }

  update(deltaTime) {
    if (!this.vehicleMesh || !this.vehicleConfig) return;

    // 1. Detect current Biome & Surface Friction
    this.currentBiome = this.terrainManager.getBiomeAt(this.position.x, this.position.z);
    this.surfaceFriction = this.currentBiome.friction;
    this.surfaceFriction += (this.upgradeLevels.tires || 0) * 0.08;

    // Damage degradation performance impact
    const damageFactor = Math.max(0.6, this.damageHealth / 100);

    // 2. Engine Torque & Acceleration
    const engineBonus = 1.0 + (this.upgradeLevels.engine || 0) * 0.15;
    const accelTorque = this.vehicleConfig.acceleration * engineBonus * 0.85 * damageFactor;

    let forwardForce = 0;
    if (this.inputThrottle > 0) {
      forwardForce = this.inputThrottle * accelTorque;
    } else if (this.inputThrottle < 0) {
      const brakeBonus = 1.0 + (this.upgradeLevels.brakes || 0) * 0.2;
      forwardForce = this.inputThrottle * this.vehicleConfig.braking * brakeBonus * 0.8;
    }

    // 3. Handbrake & Drifting
    if (this.inputHandbrake) {
      forwardForce *= 0.2;
      this.isDrifting = this.speedKmh > 20;
    } else {
      this.isDrifting = (this.surfaceFriction < 0.5 && this.speedKmh > 35 && Math.abs(this.inputSteer) > 0.4);
    }

    // 4. Steering Dynamics with speed-sensitivity
    const maxSteer = Math.PI / 5;
    const speedDamping = Math.max(0.3, 1.0 - (this.speedKmh / (this.vehicleConfig.topSpeed * 1.2)));
    const targetSteer = this.inputSteer * maxSteer * speedDamping;
    
    this.steeringAngle += (targetSteer - this.steeringAngle) * Math.min(1.0, deltaTime * this.vehicleConfig.steeringSpeed * 3);

    // 5. Angular Velocity & Body Roll/Pitch Simulation
    const turnRadius = this.vehicleConfig.dimensions.length / Math.tan(Math.max(0.01, Math.abs(this.steeringAngle)));
    const forwardSpeed = this.velocity.z;

    const driftSlipMultiplier = this.isDrifting ? (1.5 / Math.max(0.2, this.surfaceFriction)) : 1.0;
    const yawRate = (forwardSpeed / turnRadius) * Math.sign(this.steeringAngle) * driftSlipMultiplier;
    
    this.angularVelocity += (yawRate - this.angularVelocity) * Math.min(1.0, deltaTime * 8.0);
    this.rotation.y += this.angularVelocity * deltaTime;

    // Body Roll on cornering
    const targetRoll = -this.steeringAngle * (this.speedKmh / 150) * 0.2;
    this.bodyRoll += (targetRoll - this.bodyRoll) * Math.min(1.0, deltaTime * 6.0);
    this.rotation.z = this.bodyRoll;

    // Body Pitch on braking/accel
    const targetPitch = -this.inputThrottle * 0.05;
    this.bodyPitch += (targetPitch - this.bodyPitch) * Math.min(1.0, deltaTime * 6.0);
    this.rotation.x = this.bodyPitch;

    // 6. Linear Acceleration & Surface Friction
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
    const accelVec = forwardDir.clone().multiplyScalar((forwardForce / (this.vehicleConfig.mass * 0.001)) * deltaTime);

    const gripFactor = this.isDrifting ? 0.3 * this.surfaceFriction : 0.92 * this.surfaceFriction;
    
    const currentForwardSpeed = this.velocity.dot(forwardDir);
    const sideDir = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
    const currentSideSpeed = this.velocity.dot(sideDir);

    const newForwardSpeed = (currentForwardSpeed + accelVec.dot(forwardDir)) * 0.995;
    const newSideSpeed = currentSideSpeed * (1.0 - gripFactor * Math.min(1.0, deltaTime * 10));

    this.velocity.copy(forwardDir.clone().multiplyScalar(newForwardSpeed))
      .add(sideDir.clone().multiplyScalar(newSideSpeed));

    // Top Speed Clamp
    const topSpeedMs = (this.vehicleConfig.topSpeed * (1 + (this.upgradeLevels.engine || 0) * 0.08)) / 3.6;
    if (this.velocity.length() > topSpeedMs) {
      this.velocity.setLength(topSpeedMs);
    }

    // Position Update
    this.position.addScaledVector(this.velocity, deltaTime);

    // Ground Height
    const groundY = this.terrainManager.getHeightAt(this.position.x, this.position.z);
    const targetY = groundY + this.vehicleConfig.wheelRadius + ((this.upgradeLevels.rideHeight || 0) * 0.05);
    this.position.y += (targetY - this.position.y) * Math.min(1.0, deltaTime * 12.0);

    // Sync Mesh
    this.vehicleMesh.position.copy(this.position);
    this.vehicleMesh.rotation.copy(this.rotation);

    // Steering Wheel Mesh Sync
    const swMesh = this.vehicleMesh.userData.steeringWheelMesh;
    if (swMesh) {
      swMesh.rotation.z = -this.steeringAngle * 2.5;
    }

    // Front Wheels Rotation Sync
    const wheels = this.vehicleMesh.userData.wheels;
    if (wheels && wheels.length >= 2) {
      wheels[0].rotation.y = this.steeringAngle;
      wheels[1].rotation.y = this.steeringAngle;
      wheels.forEach(w => {
        w.children[0].rotation.x += (currentForwardSpeed * deltaTime) / this.vehicleConfig.wheelRadius;
      });
    }

    this.speedKmh = Math.round(Math.abs(currentForwardSpeed) * 3.6);
    this.updateRpmAndGear();
  }

  updateRpmAndGear() {
    const maxS = this.vehicleConfig.topSpeed;
    const ratio = Math.min(1.0, this.speedKmh / maxS);

    if (ratio < 0.15) this.gear = 1;
    else if (ratio < 0.35) this.gear = 2;
    else if (ratio < 0.55) this.gear = 3;
    else if (ratio < 0.75) this.gear = 4;
    else if (ratio < 0.9) this.gear = 5;
    else this.gear = 6;

    if (this.inputThrottle < 0 && this.speedKmh < 5) {
      this.gear = 'R';
    }

    const gearRange = maxS / 6;
    const speedInGear = this.speedKmh % gearRange;
    this.rpm = Math.round(1200 + (speedInGear / gearRange) * 5800 + (this.inputThrottle * 800));
  }

  respawn() {
    this.position.set(0, 2, 0);
    this.rotation.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.angularVelocity = 0;
    this.speedKmh = 0;
    this.rpm = 1000;
  }
}
