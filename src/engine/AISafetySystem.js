// Real-time AI Safety Assistant and Telemetry Coach for NEXORA DRIVE

export class AISafetySystem {
  constructor() {
    this.alerts = [];
    this.drivingScore = 100;
    this.hardBrakeCount = 0;
    this.speedingCount = 0;
    this.offroadCount = 0;
  }

  update(speedKmh, playerPos, trafficVehicles, biome, isHardBraking) {
    this.alerts = [];

    // 1. Forward Collision Warning
    if (trafficVehicles) {
      trafficVehicles.forEach(tv => {
        const dist = playerPos.distanceTo(tv.mesh.position);
        if (dist < 18 && speedKmh > 40) {
          this.alerts.push('⚠️ WARNING: Forward Collision Hazard Detected!');
        }
      });
    }

    // 2. Excessive Speed Warning
    if (biome.id === 'city' && speedKmh > 120) {
      this.alerts.push('⚠️ SPEED WARNING: Exceeding City Limit (120 KM/H)');
      this.speedingCount++;
    }

    // 3. Sharp Mountain Edge Warning
    if (biome.id === 'mountains' && speedKmh > 80) {
      this.alerts.push('⚠️ MOUNTAIN WARNING: Reduce speed before hairpin turns!');
    }

    // 4. Ice Traction Warning
    if (biome.id === 'ice' && speedKmh > 70) {
      this.alerts.push('❄️ TRACTION ALERT: Slippery Ice Road. Controlled drift recommended.');
    }

    // Telemetry Telematics
    if (isHardBraking) this.hardBrakeCount++;

    // Calculate Driving Score
    const penalties = (this.hardBrakeCount * 0.2) + (this.speedingCount * 0.1);
    this.drivingScore = Math.max(50, Math.round(100 - penalties));
  }

  getDrivingFeedback() {
    if (this.drivingScore > 90) {
      return `Driving Score: ${this.drivingScore}/100. Excellent smooth vehicle control!`;
    } else if (this.drivingScore > 75) {
      return `Driving Score: ${this.drivingScore}/100. Good speed control. Try braking earlier before mountain hairpin turns.`;
    } else {
      return `Driving Score: ${this.drivingScore}/100. Aggressive telemetry detected. Smooth out throttle and steering.`;
    }
  }
}
