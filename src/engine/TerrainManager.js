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
    const nx = x / half; // -1 to 1
    const nz = z / half; // -1 to 1

    // Flatten near central ring roads
    const distFromOrigin = Math.sqrt(x * x + z * z);
    if (distFromOrigin < 250) return 0; // Flat central hub

    // North-East: Mountains (High steep peaks)
    if (nx > 0.1 && nz < -0.1) {
      const hill1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 60;
      const hill2 = Math.sin(x * 0.03 + z * 0.03) * 35;
      return Math.max(0, hill1 + hill2);
    }

    // South-East: Ice Hills (Rolling snowy mountains)
    if (nx > 0.1 && nz > 0.1) {
      const hill = Math.sin(x * 0.012) * Math.sin(z * 0.012) * 45;
      return Math.max(0, hill);
    }

    // North-West: Forest (Gentle hills and dirt paths)
    if (nx < -0.1 && nz < -0.1) {
      return Math.sin(x * 0.02) * Math.cos(z * 0.02) * 15;
    }

    // South-West: River & Beach (Depressed basin for water)
    if (nx < -0.1 && nz > 0.1) {
      const basin = -12 + Math.sin(x * 0.01) * 6;
      return Math.min(2, basin);
    }

    // City Area (Central East): Flat ground
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
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const colorCity = new THREE.Color(0x3a4046);
    const colorForest = new THREE.Color(0x2a5028);
    const colorMountain = new THREE.Color(0x605d58);
    const colorRiver = new THREE.Color(0xd2b48c); // Sand beach
    const colorIce = new THREE.Color(0xe6f2ff);   // Snow

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      const vy = this.getHeightAt(vx, vz);
      pos.setY(i, vy);
      this.heightData[i] = vy;

      // Vertex color blending based on biome and elevation
      const biome = this.getBiomeAt(vx, vz);
      let c = colorCity;
      if (biome === BIOMES.FOREST) c = colorForest;
      else if (biome === BIOMES.MOUNTAINS) c = colorMountain;
      else if (biome === BIOMES.RIVER) c = colorRiver;
      else if (biome === BIOMES.ICE) c = colorIce;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createRoadNetwork() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.6 });
    const iceRoadMat = new THREE.MeshStandardMaterial({ color: 0xaaccee, roughness: 0.1, metalness: 0.5 });
    const dirtRoadMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // Main Outer Ring Highway connecting all 5 biomes
    const ringGeo = new THREE.RingGeometry(550, 580, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, roadMat);
    ringMesh.position.y = 0.1;
    ringMesh.receiveShadow = true;
    this.scene.add(ringMesh);

    // Inner Grid Roads in City Biome
    for (let x = -300; x <= 300; x += 150) {
      const roadGeo = new THREE.PlaneGeometry(16, 600);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(x, 0.12, 0);
      road.receiveShadow = true;
      this.scene.add(road);
    }
    for (let z = -300; z <= 300; z += 150) {
      const roadGeo = new THREE.PlaneGeometry(600, 16);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(0, 0.12, z);
      road.receiveShadow = true;
      this.scene.add(road);
    }

    // Mountain Road Pass (Elevated winding path)
    const mountainRoadGeo = new THREE.PlaneGeometry(24, 700);
    mountainRoadGeo.rotateX(-Math.PI / 2);
    mountainRoadGeo.rotateY(Math.PI / 4);
    const mountainRoad = new THREE.Mesh(mountainRoadGeo, roadMat);
    mountainRoad.position.set(450, 20, -450);
    mountainRoad.receiveShadow = true;
    this.scene.add(mountainRoad);

    // Ice Mountain Highway (Slippery surface)
    const iceRoadGeo = new THREE.PlaneGeometry(24, 700);
    iceRoadGeo.rotateX(-Math.PI / 2);
    iceRoadGeo.rotateY(-Math.PI / 4);
    const iceRoad = new THREE.Mesh(iceRoadGeo, iceRoadMat);
    iceRoad.position.set(450, 15, 450);
    iceRoad.receiveShadow = true;
    this.scene.add(iceRoad);

    // Forest Dirt Track
    const dirtGeo = new THREE.PlaneGeometry(20, 650);
    dirtGeo.rotateX(-Math.PI / 2);
    dirtGeo.rotateY(-Math.PI / 3);
    const dirtRoad = new THREE.Mesh(dirtGeo, dirtRoadMat);
    dirtRoad.position.set(-450, 5, -450);
    dirtRoad.receiveShadow = true;
    this.scene.add(dirtRoad);
  }

  createWaterBody() {
    // Water plane at Y = -4 in River/Beach quadrant
    const waterGeo = new THREE.PlaneGeometry(1000, 1000);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0066aa,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(-500, -3.5, 500);
    this.scene.add(this.waterMesh);

    // Wooden Bridge across River
    const bridgeGeo = new THREE.BoxGeometry(30, 4, 180);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(-500, 1.5, 300);
    this.scene.add(bridge);
  }

  createCityBuildings() {
    const buildingMat1 = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.3 });
    const buildingMat2 = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.2 });
    const buildingMat3 = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.4 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xaaaa66, emissiveIntensity: 0.4 });

    // Procedural skyscrapers in City quadrant
    for (let x = -350; x <= -50; x += 100) {
      for (let z = -350; z <= -50; z += 100) {
        if (Math.abs(x % 150) < 20 || Math.abs(z % 150) < 20) continue; // Leave room for roads

        const height = 40 + Math.random() * 90;
        const width = 30 + Math.random() * 20;
        const depth = 30 + Math.random() * 20;

        const geo = new THREE.BoxGeometry(width, height, depth);
        const mats = [buildingMat1, buildingMat2, buildingMat3];
        const mat = mats[Math.floor(Math.random() * mats.length)];

        const bMesh = new THREE.Mesh(geo, mat);
        bMesh.position.set(x, height * 0.5, z);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        this.scene.add(bMesh);
        this.buildings.push(bMesh);

        // Window glow strips
        const winGeo = new THREE.BoxGeometry(width + 0.2, height * 0.8, depth + 0.2);
        const winMesh = new THREE.Mesh(winGeo, windowMat);
        winMesh.position.set(x, height * 0.5, z);
        this.scene.add(winMesh);
      }
    }
  }

  createForestVegetation() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const pineLeavesMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.8 });

    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
    const leavesGeo = new THREE.ConeGeometry(5, 12, 8);

    // Populate Forest quadrant
    for (let i = 0; i < 180; i++) {
      const x = -100 - Math.random() * 700;
      const z = -100 - Math.random() * 700;
      const y = this.getHeightAt(x, z);

      if (y < 0) continue;

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2;
      const leaves = new THREE.Mesh(leavesGeo, pineLeavesMat);
      leaves.position.y = 9;

      treeGroup.add(trunk);
      treeGroup.add(leaves);
      treeGroup.position.set(x, y, z);

      treeGroup.castShadow = true;
      this.scene.add(treeGroup);
      this.trees.push(treeGroup);
    }
  }

  createMountainElements() {
    // Rock boulders & Guardrails in Mountain quadrant
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
    for (let i = 0; i < 40; i++) {
      const x = 200 + Math.random() * 600;
      const z = -200 - Math.random() * 600;
      const y = this.getHeightAt(x, z);

      const rGeo = new THREE.DodecahedronGeometry(3 + Math.random() * 6, 1);
      const rock = new THREE.Mesh(rGeo, rockMat);
      rock.position.set(x, y + 2, z);
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // Mountain Tunnel Arch
    const tunnelGeo = new THREE.BoxGeometry(40, 25, 60);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(450, 15, -300);
    this.scene.add(tunnel);
  }

  createIceElements() {
    // Snow-laden pine trees & Ice crystals in Ice Hills quadrant
    const snowLeavesMat = new THREE.MeshStandardMaterial({ color: 0xe6f2ff, roughness: 0.7 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });

    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
    const leavesGeo = new THREE.ConeGeometry(5, 12, 8);

    for (let i = 0; i < 120; i++) {
      const x = 200 + Math.random() * 600;
      const z = 200 + Math.random() * 600;
      const y = this.getHeightAt(x, z);

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2;
      const leaves = new THREE.Mesh(leavesGeo, snowLeavesMat);
      leaves.position.y = 9;

      treeGroup.add(trunk);
      treeGroup.add(leaves);
      treeGroup.position.set(x, y, z);
      this.scene.add(treeGroup);
    }
  }

  createStreetLightsAndSigns() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffff88, emissiveIntensity: 1.0 });

    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
    const lampGeo = new THREE.SphereGeometry(0.6, 12, 12);

    // Streetlights along City roads
    for (let x = -300; x <= 300; x += 150) {
      for (let z = -300; z <= 300; z += 150) {
        const lightGroup = new THREE.Group();
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4;
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(0, 8, 0);

        lightGroup.add(pole);
        lightGroup.add(lamp);
        lightGroup.position.set(x + 10, 0, z + 10);
        this.scene.add(lightGroup);
      }
    }
  }
}
