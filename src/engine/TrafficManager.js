import * as THREE from 'three';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class TrafficManager {
  constructor(scene, terrainManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.trafficVehicles = [];
    this.maxTrafficCount = 28; // Rich bustling traffic
    this.spawnDistanceAhead = 250;
    this.despawnDistanceBehind = 120;
  }

  init() {
    // Variety of realistic bot traffic models (Matching Image 1)
    const trafficPresets = [
      { type: 'suv', color: 0xffffff, name: 'White Pickup 4x4', speed: 65 },
      { type: 'car', color: 0xcc1100, name: 'Red Sports Car', speed: 85 },
      { type: 'car', color: 0x1d4ed8, name: 'Blue Classic Sedan', speed: 70 },
      { type: 'truck', color: 0xf8fafc, name: 'Semi Truck Cargo', speed: 55 },
      { type: 'taxi', color: 0xfacc15, name: 'Metro Taxi', speed: 75 },
      { type: 'police', color: 0x0f172a, name: 'Pursuit Interceptor', speed: 90 },
      { type: 'bus', color: 0x0284c7, name: 'Transit Bus', speed: 50 },
      { type: 'suv', color: 0x334155, name: 'Dark SUV', speed: 72 }
    ];

    // Highway lanes offsets: Inner lane (+6m), Center lane (0m), Outer lane (-6m)
    const laneOffsets = [-7, -2.5, 2.5, 7];

    for (let i = 0; i < this.maxTrafficCount; i++) {
      const preset = trafficPresets[i % trafficPresets.length];
      const config = VEHICLE_CONFIGS[preset.type] || VEHICLE_CONFIGS.car;

      const mesh = VehicleBuilder.createVehicleMesh(config, {
        color: preset.color,
        finish: 'gloss'
      });

      // Distribute cars along the ring highway (radius 565) and city main thoroughfares
      const isHighway = i < 20;
      let pos = new THREE.Vector3();
      let rotY = 0;
      let laneOffset = laneOffsets[i % laneOffsets.length];
      let laneRadius = 565 + laneOffset;
      let currentAngle = (i / 20) * Math.PI * 2;

      if (isHighway) {
        pos.x = Math.sin(currentAngle) * laneRadius;
        pos.z = Math.cos(currentAngle) * laneRadius;
        pos.y = this.terrainManager.getHeightAt(pos.x, pos.z) + config.wheelRadius + 0.05;
        rotY = currentAngle + Math.PI / 2;
      } else {
        // City grid roads
        const gridX = ((i % 4) - 2) * 120;
        const gridZ = (Math.random() - 0.5) * 600;
        pos.set(gridX + laneOffset, 0.5, gridZ);
        rotY = (i % 2 === 0) ? 0 : Math.PI;
      }

      mesh.position.copy(pos);
      mesh.rotation.y = rotY;

      // Turn on traffic headlights & taillights
      if (mesh.userData.headlights) {
        mesh.userData.headlights.forEach(hl => { hl.intensity = 2.5; hl.distance = 45; });
      }

      this.scene.add(mesh);

      this.trafficVehicles.push({
        mesh,
        config,
        speed: preset.speed + (Math.random() - 0.5) * 15, // km/h
        isHighway,
        laneAngle: currentAngle,
        radius: laneRadius,
        laneOffset,
        direction: 1 // 1 = forward, -1 = reverse/oncoming
      });
    }
  }

  update(deltaTime, playerPosition) {
    if (!playerPosition) return;

    const playerAngle = Math.atan2(playerPosition.x, playerPosition.z);

    this.trafficVehicles.forEach((tv, idx) => {
      const speedMs = (tv.speed / 3.6);

      if (tv.isHighway) {
        // Advance angle along ring road
        tv.laneAngle += (speedMs / tv.radius) * deltaTime * tv.direction;
        
        const x = Math.sin(tv.laneAngle) * tv.radius;
        const z = Math.cos(tv.laneAngle) * tv.radius;
        const y = this.terrainManager.getHeightAt(x, z) + tv.config.wheelRadius + 0.05;

        tv.mesh.position.set(x, y, z);
        tv.mesh.rotation.y = tv.laneAngle + (tv.direction > 0 ? Math.PI / 2 : -Math.PI / 2);

        // Dynamic Recycle: Keep traffic dense around player position!
        const dx = x - playerPosition.x;
        const dz = z - playerPosition.z;
        const distSq = dx * dx + dz * dz;
        
        // If traffic car gets too far behind or ahead (> 260m), recycle it into player's forward view
        if (distSq > 67600) {
          const forwardOffset = (0.08 + Math.random() * 0.22);
          tv.laneAngle = playerAngle + forwardOffset;
          tv.radius = 565 + [-7, -2.5, 2.5, 7][idx % 4];
        }

        // Distance Culling for fine details (wheel spin)
        if (distSq < 14400) { // < 120m
          const wheels = tv.mesh.userData.wheels;
          if (wheels && wheels.length >= 2) {
            const rotDelta = (speedMs * deltaTime) / tv.config.wheelRadius;
            wheels.forEach(w => {
              if (w.children[0]) {
                w.children[0].rotation.x += rotDelta;
              }
            });
          }
        }
      } else {
        // Move along city grid straight lines
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(tv.mesh.rotation);
        tv.mesh.position.addScaledVector(forward, speedMs * deltaTime);

        if (Math.abs(tv.mesh.position.z) > 420) {
          tv.mesh.position.z = -Math.sign(tv.mesh.position.z) * 400;
        }

        const dx = tv.mesh.position.x - playerPosition.x;
        const dz = tv.mesh.position.z - playerPosition.z;
        if (dx * dx + dz * dz < 14400) {
          const wheels = tv.mesh.userData.wheels;
          if (wheels && wheels.length >= 2) {
            const rotDelta = (speedMs * deltaTime) / tv.config.wheelRadius;
            wheels.forEach(w => {
              if (w.children[0]) {
                w.children[0].rotation.x += rotDelta;
              }
            });
          }
        }
      }
    });
  }
}
