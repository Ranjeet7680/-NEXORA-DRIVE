import * as THREE from 'three';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class TrafficManager {
  constructor(scene, terrainManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.trafficVehicles = [];
    this.maxTrafficCount = 36; // Bustling traffic across 8km Erangel Island
    this.sirenTimer = 0;
  }

  init() {
    const trafficPresets = [
      { type: 'car', color: 0xcc1100, name: 'Red Sports GT', speed: 92, finish: 'gloss' },
      { type: 'truck', color: 0x3b82f6, name: 'Heavy Freight Semi', speed: 65, finish: 'metallic' },
      { type: 'bus', color: 0x0284c7, name: 'Metro Express Bus', speed: 55, finish: 'gloss' },
      { type: 'suv', color: 0xffffff, name: 'White 4x4 Offroad', speed: 78, finish: 'gloss' },
      { type: 'taxi', color: 0xffbe0b, name: 'Metropolitan Taxi', speed: 80, finish: 'gloss' },
      { type: 'police', color: 0x0f172a, name: 'Pursuit Police Cruiser', speed: 105, finish: 'metallic' },
      { type: 'car', color: 0x10b981, name: 'Emerald Green Supercar', speed: 95, finish: 'metallic' },
      { type: 'suv', color: 0x334155, name: 'Midnight 4x4', speed: 75, finish: 'matte' },
      { type: 'truck', color: 0xe2e8f0, name: 'Titan Cargo Semi', speed: 60, finish: 'gloss' },
      { type: 'bus', color: 0xf59e0b, name: 'Island Shuttle Bus', speed: 52, finish: 'gloss' },
      { type: 'car', color: 0x8b5cf6, name: 'Purple GT Coupe', speed: 90, finish: 'metallic' },
      { type: 'taxi', color: 0xffc300, name: 'Erangel Cab', speed: 82, finish: 'gloss' }
    ];

    // 4 Distinct Patrol Routes on the 8km Erangel Island
    const route1Waypoints = [
      new THREE.Vector3(-2400, 0.5, -1400), // Georgopol
      new THREE.Vector3(400, 0.5, -400),    // Rozhok / School
      new THREE.Vector3(-400, 0.5, 500),    // Pochinki
      new THREE.Vector3(-800, 0.5, 1100),   // West Bridge North
      new THREE.Vector3(-800, 9.0, 1500),   // West Bridge Center Deck
      new THREE.Vector3(-800, 0.5, 1900),   // West Bridge South (Sosnovka)
      new THREE.Vector3(0, 0.5, 2300),      // Military Base Main Gate
      new THREE.Vector3(1500, 0.5, 1900),   // East Bridge South
      new THREE.Vector3(1500, 9.0, 1500),   // East Bridge Center Deck
      new THREE.Vector3(1500, 0.5, 1100),   // East Bridge North
      new THREE.Vector3(-400, 0.5, 500),    // Back to Pochinki
    ];
    const curve1 = new THREE.CatmullRomCurve3(route1Waypoints, true);

    const route2Waypoints = [
      new THREE.Vector3(-2000, 0.5, 400),   // Gatka Farmland
      new THREE.Vector3(-400, 0.5, 500),    // Pochinki
      new THREE.Vector3(1400, 0.5, 600),    // Farm
      new THREE.Vector3(3200, 0.5, 800),    // Mylta Power
      new THREE.Vector3(1800, 0.5, -1400),  // Yasnaya Polyana
      new THREE.Vector3(400, 0.5, -400),    // Rozhok
    ];
    const curve2 = new THREE.CatmullRomCurve3(route2Waypoints, true);

    const route3Waypoints = [
      new THREE.Vector3(-3200, 0.5, -3200), // Zharki
      new THREE.Vector3(0, 0.5, -3500),     // Severny
      new THREE.Vector3(2800, 0.5, -3200),  // Stalber Coast
      new THREE.Vector3(3400, 0.5, -1200),  // Lipovka
      new THREE.Vector3(3200, 0.5, 800),    // Mylta
      new THREE.Vector3(-800, 0.5, 1100),   // South Coast
      new THREE.Vector3(-2800, 0.5, 800),   // Primorsk
      new THREE.Vector3(-3400, 0.5, -1200), // Georgopol Coast
    ];
    const curve3 = new THREE.CatmullRomCurve3(route3Waypoints, true);

    const curves = [curve1, curve2, curve3];

    for (let i = 0; i < this.maxTrafficCount; i++) {
      const preset = trafficPresets[i % trafficPresets.length];
      const config = VEHICLE_CONFIGS[preset.type] || VEHICLE_CONFIGS.car;

      const mesh = VehicleBuilder.createVehicleMesh(config, {
        color: preset.color,
        finish: preset.finish,
        spoiler: preset.type === 'car' ? 'sport_wing' : 'none'
      });

      const curve = curves[i % curves.length];
      const progress = (i / this.maxTrafficCount);
      const pos = curve.getPointAt(progress);
      const tangent = curve.getTangentAt(progress);
      const rotY = Math.atan2(tangent.x, tangent.z);

      const laneOffset = (i % 2 === 0 ? 3.5 : -3.5);
      const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      pos.addScaledVector(normal, laneOffset);
      pos.y = this.terrainManager.getHeightAt(pos.x, pos.z) + config.wheelRadius + 0.05;

      mesh.position.copy(pos);
      mesh.rotation.y = rotY;

      if (mesh.userData.headlights) {
        mesh.userData.headlights.forEach(hl => { hl.intensity = 3.5; hl.distance = 60; });
      }

      this.scene.add(mesh);

      this.trafficVehicles.push({
        mesh,
        config,
        preset,
        speed: preset.speed + (Math.random() - 0.5) * 8, // km/h
        curve,
        progress,
        laneOffset
      });
    }
  }

  update(deltaTime, playerPosition) {
    if (!playerPosition) return;

    this.sirenTimer += deltaTime * 8.0;
    const sirenBlueOn = Math.sin(this.sirenTimer) > 0;

    this.trafficVehicles.forEach((tv, idx) => {
      const speedMs = (tv.speed / 3.6);

      // Police Siren Lights
      if (tv.preset.type === 'police' && tv.mesh.userData.policeLights && tv.mesh.userData.policeLights.length >= 2) {
        tv.mesh.userData.policeLights[0].material.emissiveIntensity = sirenBlueOn ? 5.0 : 0.5;
        tv.mesh.userData.policeLights[1].material.emissiveIntensity = sirenBlueOn ? 0.5 : 5.0;
      }

      // Advance along spline curve
      const totalLength = tv.curve.getLength();
      tv.progress = (tv.progress + (speedMs * deltaTime) / totalLength) % 1.0;

      const pos = tv.curve.getPointAt(tv.progress);
      const tangent = tv.curve.getTangentAt(tv.progress);
      const rotY = Math.atan2(tangent.x, tangent.z);

      const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      pos.addScaledVector(normal, tv.laneOffset);
      pos.y = this.terrainManager.getHeightAt(pos.x, pos.z) + tv.config.wheelRadius + 0.05;

      tv.mesh.position.copy(pos);
      tv.mesh.rotation.y = rotY;

      // Wheel Spin Animation when within 180m of player
      const dx = pos.x - playerPosition.x;
      const dz = pos.z - playerPosition.z;
      if (dx * dx + dz * dz < 32400) {
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
    });
  }
}
