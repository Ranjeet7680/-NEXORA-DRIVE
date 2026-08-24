import * as THREE from 'three';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class TrafficManager {
  constructor(scene, terrainManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.trafficVehicles = [];
    this.maxTrafficCount = 32; // Bustling open-world bot traffic
    this.sirenTimer = 0;
  }

  init() {
    // Variety of realistic bot traffic models (Sports cars, Semi Trucks, Transit Buses, SUVs, Police, Taxis)
    const trafficPresets = [
      { type: 'car', color: 0xcc1100, name: 'Red Sports GT', speed: 88, finish: 'gloss' },
      { type: 'truck', color: 0x3b82f6, name: 'Heavy Freight Semi', speed: 60, finish: 'metallic' },
      { type: 'bus', color: 0x0284c7, name: 'Metro Express Bus', speed: 52, finish: 'gloss' },
      { type: 'suv', color: 0xffffff, name: 'White 4x4 Pickup', speed: 70, finish: 'gloss' },
      { type: 'taxi', color: 0xffbe0b, name: 'Metropolitan Taxi', speed: 76, finish: 'gloss' },
      { type: 'police', color: 0x0f172a, name: 'Pursuit Police Cruiser', speed: 95, finish: 'metallic' },
      { type: 'car', color: 0x10b981, name: 'Emerald Green Supercar', speed: 90, finish: 'metallic' },
      { type: 'suv', color: 0x334155, name: 'Midnight SUV', speed: 74, finish: 'matte' },
      { type: 'truck', color: 0xe2e8f0, name: 'Titan Cargo Semi', speed: 58, finish: 'gloss' },
      { type: 'bus', color: 0xf59e0b, name: 'City Shuttle Bus', speed: 50, finish: 'gloss' },
      { type: 'car', color: 0x8b5cf6, name: 'Purple GT Coupe', speed: 85, finish: 'metallic' },
      { type: 'taxi', color: 0xffc300, name: 'Airport Yellow Cab', speed: 78, finish: 'gloss' }
    ];

    // Highway lanes offsets: Inner fast lane (+7m), Middle lane (+2.5m), Center lane (-2.5m), Outer lane (-7m)
    const laneOffsets = [-7.0, -2.5, 2.5, 7.0];

    for (let i = 0; i < this.maxTrafficCount; i++) {
      const preset = trafficPresets[i % trafficPresets.length];
      const config = VEHICLE_CONFIGS[preset.type] || VEHICLE_CONFIGS.car;

      const mesh = VehicleBuilder.createVehicleMesh(config, {
        color: preset.color,
        finish: preset.finish,
        spoiler: preset.type === 'car' ? 'sport_wing' : 'none'
      });

      // Distribute cars along the ring highway (radius 565) and city grid roads
      const isHighway = i < 24;
      let pos = new THREE.Vector3();
      let rotY = 0;
      let laneOffset = laneOffsets[i % laneOffsets.length];
      let laneRadius = 565 + laneOffset;
      let currentAngle = (i / 24) * Math.PI * 2;
      const direction = (laneOffset > 0) ? 1 : -1; // Opposing traffic flow lanes!

      if (isHighway) {
        pos.x = Math.sin(currentAngle) * laneRadius;
        pos.z = Math.cos(currentAngle) * laneRadius;
        pos.y = this.terrainManager.getHeightAt(pos.x, pos.z) + config.wheelRadius + 0.05;
        rotY = currentAngle + (direction > 0 ? Math.PI / 2 : -Math.PI / 2);
      } else {
        // City grid roads
        const gridX = ((i % 6) - 3) * 120;
        const gridZ = (Math.random() - 0.5) * 700;
        pos.set(gridX + laneOffset * 0.5, 0.45, gridZ);
        rotY = (i % 2 === 0) ? 0 : Math.PI;
      }

      mesh.position.copy(pos);
      mesh.rotation.y = rotY;

      // Activate traffic headlights & taillights
      if (mesh.userData.headlights) {
        mesh.userData.headlights.forEach(hl => { hl.intensity = 3.5; hl.distance = 60; });
      }

      this.scene.add(mesh);

      this.trafficVehicles.push({
        mesh,
        config,
        preset,
        speed: preset.speed + (Math.random() - 0.5) * 10, // km/h
        isHighway,
        laneAngle: currentAngle,
        radius: laneRadius,
        laneOffset,
        direction
      });
    }
  }

  update(deltaTime, playerPosition) {
    if (!playerPosition) return;

    this.sirenTimer += deltaTime * 8.0;
    const sirenBlueOn = Math.sin(this.sirenTimer) > 0;

    const playerAngle = Math.atan2(playerPosition.x, playerPosition.z);

    this.trafficVehicles.forEach((tv, idx) => {
      const speedMs = (tv.speed / 3.6);

      // Animate police bot siren lights
      if (tv.preset.type === 'police' && tv.mesh.userData.policeLights && tv.mesh.userData.policeLights.length >= 2) {
        tv.mesh.userData.policeLights[0].material.emissiveIntensity = sirenBlueOn ? 5.0 : 0.5;
        tv.mesh.userData.policeLights[1].material.emissiveIntensity = sirenBlueOn ? 0.5 : 5.0;
      }

      if (tv.isHighway) {
        // Advance angle along ring road
        tv.laneAngle += (speedMs / tv.radius) * deltaTime * tv.direction;
        
        const x = Math.sin(tv.laneAngle) * tv.radius;
        const z = Math.cos(tv.laneAngle) * tv.radius;
        const y = this.terrainManager.getHeightAt(x, z) + tv.config.wheelRadius + 0.05;

        tv.mesh.position.set(x, y, z);
        tv.mesh.rotation.y = tv.laneAngle + (tv.direction > 0 ? Math.PI / 2 : -Math.PI / 2);

        // Dynamic Traffic Recycling: Keep the world bustling around player!
        const dx = x - playerPosition.x;
        const dz = z - playerPosition.z;
        const distSq = dx * dx + dz * dz;
        
        // If traffic car gets too far (> 280m), reposition it into player forward view
        if (distSq > 78400) {
          const forwardOffset = (0.06 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1);
          tv.laneAngle = playerAngle + forwardOffset;
          tv.radius = 565 + [-7.0, -2.5, 2.5, 7.0][idx % 4];
          tv.direction = (tv.radius > 565) ? 1 : -1;
        }

        // Wheel Rotation Animation (LOD culled < 140m)
        if (distSq < 19600) {
          const wheels = tv.mesh.userData.wheels;
          if (wheels && wheels.length >= 2) {
            const rotDelta = (speedMs * deltaTime) / tv.config.wheelRadius;
            wheels.forEach(w => {
              const hub = w.getObjectByName('spinHub');
              if (hub) {
                hub.rotation.x += rotDelta;
              } else if (w.children[0]) {
                w.children[0].rotation.x += rotDelta;
              }
            });
          }
        }
      } else {
        // Move along city grid straight lines
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(tv.mesh.rotation);
        tv.mesh.position.addScaledVector(forward, speedMs * deltaTime);

        if (Math.abs(tv.mesh.position.z) > 440) {
          tv.mesh.position.z = -Math.sign(tv.mesh.position.z) * 420;
        }

        const dx = tv.mesh.position.x - playerPosition.x;
        const dz = tv.mesh.position.z - playerPosition.z;
        if (dx * dx + dz * dz < 19600) {
          const wheels = tv.mesh.userData.wheels;
          if (wheels && wheels.length >= 2) {
            const rotDelta = (speedMs * deltaTime) / tv.config.wheelRadius;
            wheels.forEach(w => {
              const hub = w.getObjectByName('spinHub');
              if (hub) {
                hub.rotation.x += rotDelta;
              } else if (w.children[0]) {
                w.children[0].rotation.x += rotDelta;
              }
            });
          }
        }
      }
    });
  }
}
