import * as THREE from 'three';
import { BIOMES } from '../config.js';

export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.size = 2400; // 2400x2400 world map
    this.segments = 120;
    this.terrainMesh = null;
    this.roadMeshes = [];
    this.buildings = [];
    this.trees = [];
    this.checkpoints = [];
    this.busStops = [];
    this.waterMesh = null;
    
    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));
  }

  generateWorld() {
    this.createTerrainGeometry();
    this.createRoadNetwork();
    this.createWaterBody();
    this.createCityBuildings();
    this.createForestVegetation();
    this.createMountainElements();
    this.createIceElements();
    this.createStreetLightsAndSigns();
  }

  // Height formula for the 5 biomes based on world coordinates (x, z)
  getHeightAt(x, z) {
    const half = this.size * 0.5;
    const nx = x / half;
    const nz = z / half;

    // Flatten central hub & ring highway road circuit
    const distFromOrigin = Math.sqrt(x * x + z * z);
    if (distFromOrigin < 280) return 0; // Flat central hub

    // North-East: Mountains (High steep peaks)
    if (nx > 0.1 && nz < -0.1) {
      const hill1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 55;
      const hill2 = Math.sin(x * 0.03 + z * 0.03) * 30;
      return Math.max(0, hill1 + hill2);
    }

    // South-East: Ice Hills & Glaciers (Snow mountains)
    if (nx > 0.1 && nz > 0.1) {
      const hill = Math.sin(x * 0.012) * Math.sin(z * 0.012) * 45;
      return Math.max(0, hill);
    }

    // North-West: Forest (Gentle rolling hills)
    if (nx < -0.1 && nz < -0.1) {
      return Math.max(0, Math.sin(x * 0.02) * Math.cos(z * 0.02) * 15);
    }

    // South-West: River & Beach Basin
    if (nx < -0.1 && nz > 0.1) {
      const basin = -10 + Math.sin(x * 0.01) * 5;
      return Math.min(2, basin);
    }

    return 0;
  }

  getBiomeAt(x, z) {
    const half = this.size * 0.5;
    const nx = x / half;
    const nz = z / half;

    if (nx > 0.1 && nz < -0.1) return BIOMES.MOUNTAINS;
    if (nx > 0.1 && nz > 0.1) return BIOMES.ICE;
    if (nx < -0.1 && nz < -0.1) return BIOMES.FOREST;
    if (nx < -0.1 && nz > 0.1) return BIOMES.RIVER;
    return BIOMES.CITY;
  }

  createTerrainGeometry() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const colorCity = new THREE.Color(0x404850);
    const colorForest = new THREE.Color(0x345e32);
    const colorMountain = new THREE.Color(0x6e6a62);
    const colorRiver = new THREE.Color(0xdfc299);
    const colorIce = new THREE.Color(0xeef6ff);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      const worldX = vx;
      const worldZ = -vy;

      const height = this.getHeightAt(worldX, worldZ);
      pos.setZ(i, height);
      this.heightData[i] = height;

      const biome = this.getBiomeAt(worldX, worldZ);
      let c = colorCity;
      if (biome === BIOMES.FOREST) c = colorForest;
      else if (biome === BIOMES.MOUNTAINS) c = colorMountain;
      else if (biome === BIOMES.RIVER) c = colorRiver;
      else if (biome === BIOMES.ICE) c = colorIce;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.15
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createRoadNetwork() {
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.45, metalness: 0.2 });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.3, metalness: 0.8 });

    // 1. Main Outer Ring Highway (Radius 565, Width 32)
    const ringGeo = new THREE.RingGeometry(548, 582, 128);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, asphaltMat);
    ringMesh.position.y = 0.25;
    ringMesh.receiveShadow = true;
    this.scene.add(ringMesh);

    // Double Yellow Center Line Ring
    const yellowLineGeo = new THREE.RingGeometry(564, 566, 128);
    yellowLineGeo.rotateX(-Math.PI / 2);
    const yellowLineMesh = new THREE.Mesh(yellowLineGeo, yellowLineMat);
    yellowLineMesh.position.y = 0.27;
    this.scene.add(yellowLineMesh);

    // White Edge Markings
    const whiteInnerGeo = new THREE.RingGeometry(550, 551, 128);
    whiteInnerGeo.rotateX(-Math.PI / 2);
    const whiteInnerMesh = new THREE.Mesh(whiteInnerGeo, whiteLineMat);
    whiteInnerMesh.position.y = 0.27;
    this.scene.add(whiteInnerMesh);

    const whiteOuterGeo = new THREE.RingGeometry(579, 580, 128);
    whiteOuterGeo.rotateX(-Math.PI / 2);
    const whiteOuterMesh = new THREE.Mesh(whiteOuterGeo, whiteLineMat);
    whiteOuterMesh.position.y = 0.27;
    this.scene.add(whiteOuterMesh);

    // Highway Guardrails along Ring Curve
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
      const gx = Math.sin(angle) * 584;
      const gz = Math.cos(angle) * 584;
      const railGeo = new THREE.BoxGeometry(12, 1.2, 0.4);
      const rail = new THREE.Mesh(railGeo, guardrailMat);
      rail.position.set(gx, 0.8, gz);
      rail.rotation.y = angle + Math.PI / 2;
      this.scene.add(rail);
    }

    // 2. City Grid Asphalt Roads
    for (let x = -300; x <= 300; x += 150) {
      const roadGeo = new THREE.PlaneGeometry(20, 600);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(x, 0.26, 0);
      road.receiveShadow = true;
      this.scene.add(road);
    }
    for (let z = -300; z <= 300; z += 150) {
      const roadGeo = new THREE.PlaneGeometry(600, 20);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(0, 0.26, z);
      road.receiveShadow = true;
      this.scene.add(road);
    }

    // 3. Mountain Road Pass
    const mountainRoadGeo = new THREE.PlaneGeometry(26, 750);
    mountainRoadGeo.rotateX(-Math.PI / 2);
    mountainRoadGeo.rotateY(Math.PI / 4);
    const mountainRoad = new THREE.Mesh(mountainRoadGeo, asphaltMat);
    mountainRoad.position.set(450, 0.28, -450);
    mountainRoad.receiveShadow = true;
    this.scene.add(mountainRoad);

    // 4. Ice Mountain Slippery Highway
    const iceRoadMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.5 });
    const iceRoadGeo = new THREE.PlaneGeometry(26, 750);
    iceRoadGeo.rotateX(-Math.PI / 2);
    iceRoadGeo.rotateY(-Math.PI / 4);
    const iceRoad = new THREE.Mesh(iceRoadGeo, iceRoadMat);
    iceRoad.position.set(450, 0.28, 450);
    iceRoad.receiveShadow = true;
    this.scene.add(iceRoad);

    // 5. Forest Dirt Road Track
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const dirtGeo = new THREE.PlaneGeometry(22, 700);
    dirtGeo.rotateX(-Math.PI / 2);
    dirtGeo.rotateY(-Math.PI / 3);
    const dirtRoad = new THREE.Mesh(dirtGeo, dirtMat);
    dirtRoad.position.set(-450, 0.28, -450);
    dirtRoad.receiveShadow = true;
    this.scene.add(dirtRoad);
  }

  createWaterBody() {
    const waterGeo = new THREE.PlaneGeometry(900, 900);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0077be,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(-450, 0.1, 450);
    this.scene.add(this.waterMesh);

    // Wooden Bridge across River
    const bridgeGeo = new THREE.BoxGeometry(32, 4, 180);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2d, roughness: 0.8 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(-450, 2.0, 300);
    bridge.castShadow = true;
    this.scene.add(bridge);
  }

  createCityBuildings() {
    const buildingMat1 = new THREE.MeshStandardMaterial({ color: 0x526075, roughness: 0.3 });
    const buildingMat2 = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2 });
    const buildingMat3 = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.5 });

    for (let x = -350; x <= -50; x += 100) {
      for (let z = -350; z <= -50; z += 100) {
        if (Math.abs(x % 150) < 25 || Math.abs(z % 150) < 25) continue;

        const height = 50 + Math.random() * 100;
        const width = 32 + Math.random() * 18;
        const depth = 32 + Math.random() * 18;

        const geo = new THREE.BoxGeometry(width, height, depth);
        const mats = [buildingMat1, buildingMat2, buildingMat3];
        const mat = mats[Math.floor(Math.random() * mats.length)];

        const bMesh = new THREE.Mesh(geo, mat);
        bMesh.position.set(x, height * 0.5, z);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        this.scene.add(bMesh);
        this.buildings.push(bMesh);

        // Window strips
        const winGeo = new THREE.BoxGeometry(width + 0.3, height * 0.75, depth + 0.3);
        const winMesh = new THREE.Mesh(winGeo, windowMat);
        winMesh.position.set(x, height * 0.5, z);
        this.scene.add(winMesh);
      }
    }
  }

  createForestVegetation() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b });
    const pineLeavesMat = new THREE.MeshStandardMaterial({ color: 0x1c3d1c, roughness: 0.7 });

    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 5, 8);
    const leavesGeo = new THREE.ConeGeometry(6, 14, 8);

    for (let i = 0; i < 150; i++) {
      const x = -150 - Math.random() * 650;
      const z = -150 - Math.random() * 650;
      const y = this.getHeightAt(x, z);

      if (y < 0) continue;

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.5;
      const leaves = new THREE.Mesh(leavesGeo, pineLeavesMat);
      leaves.position.y = 11;

      treeGroup.add(trunk);
      treeGroup.add(leaves);
      treeGroup.position.set(x, y, z);
      treeGroup.castShadow = true;

      this.scene.add(treeGroup);
      this.trees.push(treeGroup);
    }
  }

  createMountainElements() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a5652, roughness: 0.8 });
    for (let i = 0; i < 40; i++) {
      const x = 200 + Math.random() * 600;
      const z = -200 - Math.random() * 600;
      const y = this.getHeightAt(x, z);

      const rGeo = new THREE.DodecahedronGeometry(4 + Math.random() * 7, 1);
      const rock = new THREE.Mesh(rGeo, rockMat);
      rock.position.set(x, y + 2, z);
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // Tunnel Arch
    const tunnelGeo = new THREE.BoxGeometry(45, 30, 70);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.9 });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(450, 15, -300);
    this.scene.add(tunnel);
  }

  createIceElements() {
    // Ice Hills & Glacier Formations
    const glacierMat = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.1, metalness: 0.5 });
    const snowLeavesMat = new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.6 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b });

    // Glacier Ice Peaks
    for (let i = 0; i < 15; i++) {
      const gx = 300 + Math.random() * 500;
      const gz = 300 + Math.random() * 500;
      const gy = this.getHeightAt(gx, gz);

      const gGeo = new THREE.ConeGeometry(15 + Math.random() * 20, 40 + Math.random() * 30, 6);
      const glacier = new THREE.Mesh(gGeo, glacierMat);
      glacier.position.set(gx, gy + 15, gz);
      glacier.castShadow = true;
      this.scene.add(glacier);
    }

    // Snow Pine Trees
    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 5, 8);
    const leavesGeo = new THREE.ConeGeometry(6, 14, 8);

    for (let i = 0; i < 120; i++) {
      const x = 200 + Math.random() * 600;
      const z = 200 + Math.random() * 600;
      const y = this.getHeightAt(x, z);

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.5;
      const leaves = new THREE.Mesh(leavesGeo, snowLeavesMat);
      leaves.position.y = 11;

      treeGroup.add(trunk);
      treeGroup.add(leaves);
      treeGroup.position.set(x, y, z);
      this.scene.add(treeGroup);
    }
  }

  createStreetLightsAndSigns() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 1.2 });

    const poleGeo = new THREE.CylinderGeometry(0.18, 0.18, 9, 8);
    const lampGeo = new THREE.SphereGeometry(0.7, 12, 12);

    for (let x = -300; x <= 300; x += 150) {
      for (let z = -300; z <= 300; z += 150) {
        const lightGroup = new THREE.Group();
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4.5;
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(0, 9, 0);

        lightGroup.add(pole);
        lightGroup.add(lamp);
        lightGroup.position.set(x + 12, 0, z + 12);
        this.scene.add(lightGroup);
      }
    }
  }
}
