import * as THREE from 'three';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class TrafficManager {
  constructor(scene, terrainManager) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.trafficVehicles = [];
    this.pedestrians = [];
    this.spawnRadius = 400;
    this.maxTrafficCount = 15;
  }

  init() {
    // Pre-spawn initial traffic vehicles around the ring highway and city grid
    const trafficTypes = ['car', 'taxi', 'bus', 'suv'];
    
    for (let i = 0; i < this.maxTrafficCount; i++) {
      const typeKey = trafficTypes[i % trafficTypes.length];
      const config = VEHICLE_CONFIGS[typeKey];
      
      const colorHex = Math.floor(Math.random() * 0xffffff);
      const mesh = VehicleBuilder.createVehicleMesh(config, colorHex);

      // Random position along ring road (radius 565)
      const angle = (i / this.maxTrafficCount) * Math.PI * 2;
      const x = Math.sin(angle) * 565;
      const z = Math.cos(angle) * 565;
      const y = this.terrainManager.getHeightAt(x, z) + config.wheelRadius;

      mesh.position.set(x, y, z);
      mesh.rotation.y = angle + Math.PI / 2;

      this.scene.add(mesh);
      this.trafficVehicles.push({
        mesh,
        config,
        speed: 35 + Math.random() * 25, // km/h
        laneAngle: angle,
        radius: 565
      });
    }

    // Pedestrians in City
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const pedGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8);

    for (let i = 0; i < 20; i++) {
      const pMesh = new THREE.Mesh(pedGeo, pedMat);
      const px = -300 + Math.random() * 300;
      const pz = -300 + Math.random() * 300;
      pMesh.position.set(px, 0.85, pz);
      this.scene.add(pMesh);
      this.pedestrians.push({ mesh: pMesh, dir: (Math.random() > 0.5 ? 1 : -1) });
    }
  }

  update(deltaTime, playerPosition) {
    // 1. Move AI Traffic along circuit paths
    this.trafficVehicles.forEach(tv => {
      tv.laneAngle += (tv.speed / tv.radius) * 0.05 * deltaTime;
      const x = Math.sin(tv.laneAngle) * tv.radius;
      const z = Math.cos(tv.laneAngle) * tv.radius;
      const y = this.terrainManager.getHeightAt(x, z) + tv.config.wheelRadius;

      tv.mesh.position.set(x, y, z);
      tv.mesh.rotation.y = tv.laneAngle + Math.PI / 2;

      // Distance check to player for optimization/despawn re-positioning
      if (playerPosition) {
        const dist = tv.mesh.position.distanceTo(playerPosition);
        if (dist > this.spawnRadius + 200) {
          // Relocate ahead of player
          tv.laneAngle = Math.atan2(playerPosition.x, playerPosition.z) + (Math.random() - 0.5) * 1.0;
        }
      }
    });

    // 2. Animate Pedestrians
    this.pedestrians.forEach(p => {
      p.mesh.position.x += p.dir * deltaTime * 1.5;
      if (Math.abs(p.mesh.position.x) > 350) {
        p.dir *= -1;
      }
    });
  }
}
