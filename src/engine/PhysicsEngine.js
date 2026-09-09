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
    this.surfaceFriction += (this.upgradeLevels.tires || 0) * 0.10;

    const damageFactor = Math.max(0.65, this.damageHealth / 100);

    // 2. Engine Torque & High-Performance V8 / GT Power Curve
    const engineBonus = 1.0 + (this.upgradeLevels.engine || 0) * 0.18;
    const accelTorque = this.vehicleConfig.acceleration * engineBonus * 1.05 * damageFactor;

    let forwardForce = 0;
    if (this.inputThrottle > 0) {
      // Dynamic V8 torque: extra punch at low/mid RPMs with smooth top-end pull
      const rpmFactor = 0.85 + 0.35 * Math.sin(Math.min(1.0, this.rpm / 6500) * Math.PI);
      forwardForce = this.inputThrottle * accelTorque * rpmFactor;
    } else if (this.inputThrottle < 0) {
      const brakeBonus = 1.0 + (this.upgradeLevels.brakes || 0) * 0.22;
      forwardForce = this.inputThrottle * this.vehicleConfig.braking * brakeBonus * 0.95;
    }

    // 3. Realistic Tire Slip, Handbrake & Progressive Drift Dynamics
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
    const sideDir = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
    const forwardSpeed = this.velocity.dot(forwardDir);
    const sideSpeed = this.velocity.dot(sideDir);

    if (this.inputHandbrake) {
      forwardForce *= 0.10;
      this.isDrifting = this.speedKmh > 18;
    } else {
      // Natural drift when lateral force exceeds tire adhesion threshold
      const lateralG = Math.abs(sideSpeed) / Math.max(1.0, Math.abs(forwardSpeed));
      this.isDrifting = (this.speedKmh > 32 && lateralG > 0.22 && Math.abs(this.inputSteer) > 0.35);
    }

    // 4. Progressive Steering Dynamics (Speed-sensitive steering ratio)
    const maxSteer = Math.PI / 4.8; // ~37.5° max wheel lock
    const speedRatio = Math.min(1.0, this.speedKmh / this.vehicleConfig.topSpeed);
    const speedDamping = Math.max(0.40, 1.0 - (speedRatio * 0.55));
    const targetSteer = this.inputSteer * maxSteer * speedDamping;
    
    const steerResponsiveness = this.vehicleConfig.steeringSpeed * 4.2;
    this.steeringAngle += (targetSteer - this.steeringAngle) * Math.min(1.0, deltaTime * steerResponsiveness);

    // 5. Angular Velocity & Natural Drift Counter-steering
    const turnRadius = this.vehicleConfig.dimensions.length / Math.tan(Math.max(0.012, Math.abs(this.steeringAngle)));
    const absForwardSpeed = Math.abs(forwardSpeed);

    // Aerodynamic Downforce: Increases with speed squared (v^2)
    const aeroDownforceGrip = 1.0 + Math.pow(speedRatio, 1.8) * 0.45;

    const driftMultiplier = this.isDrifting ? (1.75 / Math.max(0.25, this.surfaceFriction)) : 1.0;
    const targetYawRate = -Math.sign(this.steeringAngle) * (absForwardSpeed / turnRadius) * driftMultiplier;
    
    this.angularVelocity += (targetYawRate - this.angularVelocity) * Math.min(1.0, deltaTime * 9.5);
    this.rotation.y += this.angularVelocity * deltaTime;

    // 6. Dynamic Suspension Weight Transfer (Body Pitch & Roll)
    // Lateral body roll under centrifugal cornering force
    const targetRoll = -this.steeringAngle * Math.min(1.2, this.speedKmh / 110) * 0.22;
    this.bodyRoll += (targetRoll - this.bodyRoll) * Math.min(1.0, deltaTime * 7.5);
    this.rotation.z = this.bodyRoll;

    // Longitudinal body pitch: nose dive on braking, rear squat on hard acceleration
    const targetPitch = (this.inputThrottle < 0 ? 0.08 * Math.abs(this.inputThrottle) : -0.05 * this.inputThrottle);
    this.bodyPitch += (targetPitch - this.bodyPitch) * Math.min(1.0, deltaTime * 7.5);
    this.rotation.x = this.bodyPitch;

    // 7. Linear Acceleration & Vector Movement with Friction Ellipse
    const accelVec = forwardDir.clone().multiplyScalar((forwardForce / (this.vehicleConfig.mass * 0.001)) * deltaTime);

    // Grip Factor: High static grip, progressive dynamic drift slide
    const baseGrip = this.isDrifting ? 0.28 : 0.94;
    const totalGrip = baseGrip * this.surfaceFriction * aeroDownforceGrip;
    
    const newForwardSpeed = (forwardSpeed + accelVec.dot(forwardDir)) * 0.995;
    const newSideSpeed = sideSpeed * (1.0 - Math.min(0.98, totalGrip * deltaTime * 12.0));

    this.velocity.copy(forwardDir.clone().multiplyScalar(newForwardSpeed))
      .add(sideDir.clone().multiplyScalar(newSideSpeed));

    // Top Speed Dynamic Cap with Upgrades
    const topSpeedMs = (this.vehicleConfig.topSpeed * (1 + (this.upgradeLevels.engine || 0) * 0.08)) / 3.6;
    if (this.velocity.length() > topSpeedMs) {
      this.velocity.setLength(topSpeedMs);
    }

    const currentForwardSpeed = this.velocity.dot(forwardDir);

    // 8. Position Integration & Ground Adhesion
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
        if (w.children && w.children[0]) {
          w.children[0].rotation.x += (currentForwardSpeed * deltaTime) / this.vehicleConfig.wheelRadius;
        }
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

    // Police Siren Lightbar Strobe Animation
    const policeLights = this.vehicleMesh.userData.policeLights;
    if (policeLights && policeLights.length >= 2) {
      policeLights[0].material.emissiveIntensity = this.indicatorBlinkOn ? 5.0 : 0.3;
      policeLights[1].material.emissiveIntensity = this.indicatorBlinkOn ? 0.3 : 5.0;
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
