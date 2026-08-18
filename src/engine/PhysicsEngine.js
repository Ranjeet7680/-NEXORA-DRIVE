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
    this.damageHealth = 100;

    // ── Lighting & Indicator States ──
    this.headlightState = 'on'; // 'off' | 'on' | 'high'
    this.indicatorState = 'none'; // 'none' | 'left' | 'right' | 'hazard'
    this.indicatorBlinkTimer = 0;
    this.indicatorBlinkOn = false;

    // Control Inputs
    this.inputThrottle = 0; // 1 = Gas, -1 = Brake/Reverse
    this.inputSteer = 0;    // -1 = Left, +1 = Right
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

    const rideOffset = (upgrades.rideHeight || 0) * 0.05;
    this.position.y = this.terrainManager.getHeightAt(this.position.x, this.position.z) + config.wheelRadius + rideOffset;
  }

  toggleHeadlights() {
    if (this.headlightState === 'off') this.headlightState = 'on';
    else if (this.headlightState === 'on') this.headlightState = 'high';
    else this.headlightState = 'off';
    return this.headlightState;
  }

  toggleHazard() {
    this.indicatorState = (this.indicatorState === 'hazard') ? 'none' : 'hazard';
    return this.indicatorState;
  }

  toggleIndicator(dir) { // 'left' or 'right'
    this.indicatorState = (this.indicatorState === dir) ? 'none' : dir;
    return this.indicatorState;
  }

  update(deltaTime) {
    if (!this.vehicleMesh || !this.vehicleConfig) return;

    // 1. Detect current Biome & Surface Friction
    this.currentBiome = this.terrainManager.getBiomeAt(this.position.x, this.position.z);
    this.surfaceFriction = this.currentBiome.friction;
    this.surfaceFriction += (this.upgradeLevels.tires || 0) * 0.08;

    const damageFactor = Math.max(0.6, this.damageHealth / 100);

    // 2. Engine Torque & Acceleration / Braking
    const engineBonus = 1.0 + (this.upgradeLevels.engine || 0) * 0.15;
    const accelTorque = this.vehicleConfig.acceleration * engineBonus * 0.9 * damageFactor;

    let forwardForce = 0;
    if (this.inputThrottle > 0) {
      forwardForce = this.inputThrottle * accelTorque;
    } else if (this.inputThrottle < 0) {
      const brakeBonus = 1.0 + (this.upgradeLevels.brakes || 0) * 0.2;
      forwardForce = this.inputThrottle * this.vehicleConfig.braking * brakeBonus * 0.85;
    }

    // 3. Handbrake & Drifting
    if (this.inputHandbrake) {
      forwardForce *= 0.15;
      this.isDrifting = this.speedKmh > 20;
    } else {
      this.isDrifting = (this.surfaceFriction < 0.5 && this.speedKmh > 35 && Math.abs(this.inputSteer) > 0.4);
    }

    // 4. Steering Dynamics (Speed sensitive damping)
    const maxSteer = Math.PI / 5; // ~36° max wheel turn
    const speedDamping = Math.max(0.35, 1.0 - (this.speedKmh / (this.vehicleConfig.topSpeed * 1.2)));
    const targetSteer = this.inputSteer * maxSteer * speedDamping;
    
    this.steeringAngle += (targetSteer - this.steeringAngle) * Math.min(1.0, deltaTime * this.vehicleConfig.steeringSpeed * 3.5);

    // 5. Angular Velocity & Correct Yaw Turn Direction
    const turnRadius = this.vehicleConfig.dimensions.length / Math.tan(Math.max(0.01, Math.abs(this.steeringAngle)));
    const forwardSpeed = this.velocity.length();

    const driftSlipMultiplier = this.isDrifting ? (1.6 / Math.max(0.2, this.surfaceFriction)) : 1.0;
    const targetYawRate = -Math.sign(this.steeringAngle) * (forwardSpeed / turnRadius) * driftSlipMultiplier;
    
    this.angularVelocity += (targetYawRate - this.angularVelocity) * Math.min(1.0, deltaTime * 8.0);
    this.rotation.y += this.angularVelocity * deltaTime;

    // Body Roll on cornering
    const targetRoll = -this.steeringAngle * (this.speedKmh / 140) * 0.25;
    this.bodyRoll += (targetRoll - this.bodyRoll) * Math.min(1.0, deltaTime * 6.0);
    this.rotation.z = this.bodyRoll;

    // Body Pitch on braking/accel
    const targetPitch = -this.inputThrottle * 0.06;
    this.bodyPitch += (targetPitch - this.bodyPitch) * Math.min(1.0, deltaTime * 6.0);
    this.rotation.x = this.bodyPitch;

    // 6. Linear Acceleration & Vector Movement
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
    const accelVec = forwardDir.clone().multiplyScalar((forwardForce / (this.vehicleConfig.mass * 0.001)) * deltaTime);

    const gripFactor = this.isDrifting ? 0.25 * this.surfaceFriction : 0.92 * this.surfaceFriction;
    
    const currentForwardSpeed = this.velocity.dot(forwardDir);
    const sideDir = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
    const currentSideSpeed = this.velocity.dot(sideDir);

    const newForwardSpeed = (currentForwardSpeed + accelVec.dot(forwardDir)) * 0.994;
    const newSideSpeed = currentSideSpeed * (1.0 - gripFactor * Math.min(1.0, deltaTime * 10.0));

    this.velocity.copy(forwardDir.clone().multiplyScalar(newForwardSpeed))
      .add(sideDir.clone().multiplyScalar(newSideSpeed));

    // Top Speed Clamp
    const topSpeedMs = (this.vehicleConfig.topSpeed * (1 + (this.upgradeLevels.engine || 0) * 0.08)) / 3.6;
    if (this.velocity.length() > topSpeedMs) {
      this.velocity.setLength(topSpeedMs);
    }

    // 7. Position Integration
    this.position.addScaledVector(this.velocity, deltaTime);

    // ── 8. PHYSICAL OBSTACLE COLLISION DETECTION & RESPONSE ──
    // "Block ke aar ya paar nahi ho sakta"
    const vehicleRadius = Math.max(1.4, this.vehicleConfig.dimensions.length * 0.35);
    const collision = this.terrainManager.checkCollision(this.position.x, this.position.z, vehicleRadius);

    if (collision) {
      // 1. Push car OUT of solid obstacle so it NEVER penetrates/passes through
      this.position.x += collision.normalX * (collision.overlap + 0.05);
      this.position.z += collision.normalZ * (collision.overlap + 0.05);

      // 2. Velocity bounce / reflection
      const velDotNorm = this.velocity.x * collision.normalX + this.velocity.z * collision.normalZ;
      if (velDotNorm < 0) {
        // Elastic rebound
        const restitution = 0.35;
        this.velocity.x -= (1 + restitution) * velDotNorm * collision.normalX;
        this.velocity.z -= (1 + restitution) * velDotNorm * collision.normalZ;
        this.velocity.multiplyScalar(0.7); // Friction loss on impact

        // Impact damage
        const impactSpeed = Math.abs(velDotNorm) * 3.6;
        if (impactSpeed > 15) {
          this.damageHealth = Math.max(10, this.damageHealth - impactSpeed * 0.12);
        }
      }
    }

    // 9. Ground Height Snapping (Vehicle smoothly sits on road/terrain surface)
    const groundY = this.terrainManager.getHeightAt(this.position.x, this.position.z);
    const targetY = groundY + this.vehicleConfig.wheelRadius + ((this.upgradeLevels.rideHeight || 0) * 0.05);
    this.position.y += (targetY - this.position.y) * Math.min(1.0, deltaTime * 14.0);

    // Sync 3D Mesh
    this.vehicleMesh.position.copy(this.position);
    this.vehicleMesh.rotation.copy(this.rotation);

    // Steering Wheel Mesh Sync
    const swMesh = this.vehicleMesh.userData.steeringWheelMesh;
    if (swMesh) {
      swMesh.rotation.z = -this.steeringAngle * 2.8;
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

    // ── 10. REAL-TIME LIGHTING & HEADLIGHT SYNCHRONIZATION ──
    const headlights = this.vehicleMesh.userData.headlights;
    const lightBeams = this.vehicleMesh.userData.lightBeams;
    if (headlights && headlights.length >= 2) {
      if (this.headlightState === 'off') {
        headlights[0].intensity = 0;
        headlights[1].intensity = 0;
        if (lightBeams) { lightBeams[0].visible = false; lightBeams[1].visible = false; }
      } else if (this.headlightState === 'on') {
        headlights[0].intensity = 5.0;
        headlights[1].intensity = 5.0;
        headlights[0].distance = 80;
        headlights[1].distance = 80;
        if (lightBeams) { lightBeams[0].visible = true; lightBeams[1].visible = true; lightBeams[0].material.opacity = 0.15; lightBeams[1].material.opacity = 0.15; }
      } else if (this.headlightState === 'high') {
        headlights[0].intensity = 9.0;
        headlights[1].intensity = 9.0;
        headlights[0].distance = 140;
        headlights[1].distance = 140;
        if (lightBeams) { lightBeams[0].visible = true; lightBeams[1].visible = true; lightBeams[0].material.opacity = 0.28; lightBeams[1].material.opacity = 0.28; }
      }
    }

    // Active Brake Lights Flare
    const brakeLights = this.vehicleMesh.userData.brakeLights;
    if (brakeLights && brakeLights.length >= 2) {
      const isBraking = this.inputThrottle < 0;
      brakeLights.forEach(bl => {
        bl.material.emissiveIntensity = isBraking ? 3.5 : 0.8;
      });
    }

    // Turn Indicator Blinking Logic (0.4s blink interval)
    this.indicatorBlinkTimer += deltaTime;
    if (this.indicatorBlinkTimer > 0.4) {
      this.indicatorBlinkTimer = 0;
      this.indicatorBlinkOn = !this.indicatorBlinkOn;
    }

    const indicators = this.vehicleMesh.userData.indicators;
    if (indicators && indicators.length >= 2) {
      const leftOn = (this.indicatorState === 'left' || this.indicatorState === 'hazard') && this.indicatorBlinkOn;
      const rightOn = (this.indicatorState === 'right' || this.indicatorState === 'hazard') && this.indicatorBlinkOn;
      indicators[0].material.emissiveIntensity = leftOn ? 3.0 : 0.0;
      indicators[1].material.emissiveIntensity = rightOn ? 3.0 : 0.0;
    }

    // Speedometer (km/h)
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
