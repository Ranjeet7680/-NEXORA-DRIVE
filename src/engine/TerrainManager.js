import * as THREE from 'three';
import { BIOMES } from '../config.js';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * 8KM X 8KM ERANGEL BATTLEGROUND ISLAND - ENHANCED MASTER VERSION
 * - Island Land Baseline at Y = +6.0m (Well above sea level Y = 0.0m)
 * - True 8000m x 8000m Island World
 * - Full Sosnovka Military Airport: Control Tower, C-130 Hercules Transport, Fighter Jets, Runway Lights, Windsock
 * - Rich 3D Grass Tufts & Wildflower Clusters (Poppies, Dandelions, Cornflowers)
 * - Complete Towns with Detailed Houses: Pochinki, Severny, Primorsk, Zharki, Rozhok, Novorepnoye
 * - Working Gas Stations with Canopies, Pumps & 24/7 Convenience Stores
 * - 2 Iconic Suspension Bridges, Coastal Lighthouses & Wooden Fishing Piers
 * - Stalber Mountain Peak (+80m), Georgopol Container Terminal, Mylta Power Plant
 * - Spatial Grid for 60fps High-Performance Collision Checking
 */
export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.size = 8000;
    this.segments = 160;
    this.terrainMesh = null;
    this.oceanMesh = null;
    this.roadMeshes = [];
    this.buildings = [];
    this.trees = [];
    this.runwayLights = [];
    this.waterTime = 0;

    // Physical Obstacle Colliders
    this.colliders = [];
    this.gridCellSize = 100;
    this.grid = new Map();

    // Textures
    this.asphaltTexture = TextureGenerator.createAsphaltTexture();
    this.grassTexture = TextureGenerator.createGrassTexture();
    this.buildingTextures = [
      TextureGenerator.createBuildingFacadeTexture(0),
      TextureGenerator.createBuildingFacadeTexture(1),
      TextureGenerator.createBuildingFacadeTexture(2),
      TextureGenerator.createBuildingFacadeTexture(3)
    ];
  }

  generateWorld() {
    this.createTerrainGeometry();
    this.createOceanWater();
    this.createTwoSuspensionBridges();
    this.createRoadNetwork();
    this.createDenseVegetation();
    this.create3DGrassAndFlowers();
    this.createDetailedTownsAndHouses();
    this.createCompleteAirport();
    this.createPochinkiTown();
    this.createGeorgopolPort();
    this.createMyltaPowerPlant();
    this.createSchoolAndRozhok();
    this.createYasnayaPolyana();
    this.createWorkingGasStations();
    this.createCoastalLighthousesAndPiers();
    this.createTransmissionPylons();
    this.createRoadsideDetails();
    this._buildSpatialGrid();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ELEVATION & TOPOGRAPHY FOR 8KM ERANGEL ISLAND
  // ═══════════════════════════════════════════════════════════════════════════
  getHeightAt(x, z) {
    // 1. Suspension Bridges Check (West Bridge x: -800, East Bridge x: 1500)
    if (z >= 1100 && z <= 1900) {
      if (Math.abs(x - (-800)) < 16) return 14.0; // West Bridge Deck
      if (Math.abs(x - 1500) < 16) return 14.0;  // East Bridge Deck
      // Sea channel between Mainland and Sosnovka Island (Below Sea Level)
      return -8.0;
    }

    // 2. Surrounding Ocean Outer Boundaries (Beyond 3600m radius)
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 3800) {
      return -12.0; // Deep outer ocean
    }
    if (distFromCenter > 3400) {
      // Coastal slope into ocean
      const t = (distFromCenter - 3400) / 400;
      return 6.0 * (1 - t) - 12.0 * t;
    }

    // 3. Georgopol River Inlet Channel
    if (x >= -3600 && x <= -1800 && z >= -1850 && z <= -1450) {
      return -5.0; // Georgopol water inlet
    }

    // 4. Stalber Mountain Peak (NE: x ~ 1800 to 3000, z ~ -3200 to -1900)
    if (x > 1400 && z < -1600 && x < 3300 && z > -3500) {
      const dx = (x - 2300) / 700;
      const dz = (z - (-2600)) / 700;
      const distSq = dx * dx + dz * dz;
      if (distSq < 2.5) {
        const peak = Math.max(0, (1 - distSq * 0.4)) * 75;
        const rugged = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 10;
        return 6.0 + peak + rugged;
      }
    }

    // 5. Sosnovka Military Island Central Hill (South: x ~ -300 to 400, z ~ 2400 to 3200)
    if (z > 1900 && z < 3700) {
      // Airport Runway is flat at Y = 6.0m
      if (Math.abs(x) < 45 && z > 2100 && z < 3500) {
        return 6.0;
      }
      const dx = (x - 0) / 700;
      const dz = (z - 2800) / 600;
      const distSq = dx * dx + dz * dz;
      if (distSq < 2.0) {
        return 6.0 + Math.max(0, (1 - distSq * 0.5)) * 38;
      }
      return 6.0;
    }

    // 6. Rozhok / School Hill (Center: x ~ 100 to 700, z ~ -700 to -100)
    if (x > 0 && x < 800 && z > -800 && z < 0) {
      const dx = (x - 400) / 350;
      const dz = (z - (-400)) / 300;
      const distSq = dx * dx + dz * dz;
      if (distSq < 1.8) {
        return 6.0 + Math.max(0, (1 - distSq * 0.5)) * 20;
      }
    }

    // 7. General Farmlands & Rolling Valleys (Pochinki, Gatka, Farm)
    // BASELINE ELEVATION = 6.0m (Always well above sea level 0.0m!)
    const gentleHills = Math.sin(x * 0.003) * Math.cos(z * 0.003) * 3.5;
    return 6.0 + Math.max(0, gentleHills);
  }

  getBiomeAt(x, z) {
    if (z >= 1100 && z <= 1900) {
      if (Math.abs(x - (-800)) < 24 || Math.abs(x - 1500) < 24) return BIOMES.BRIDGE;
    }
    if (z > 1900) return BIOMES.MILITARY;
    if (x > 1400 && z < -1600) return BIOMES.STALBER;
    if (x < -1400 && z < -800) return BIOMES.GEORGOPOL;
    if (x > 1800 && z > 0) return BIOMES.MYLTA;
    if (Math.abs(x) < 800 && z < -1200) return BIOMES.FOREST;
    return BIOMES.POCHINKI;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. 8000M TERRAIN GEOMETRY & OCEAN WATER
  // ═══════════════════════════════════════════════════════════════════════════
  createTerrainGeometry() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cGrass = new THREE.Color(0x387d22);      // Vivid rich grass green
    const cDeepForest = new THREE.Color(0x1e4f16); // Coniferous pine understory
    const cFarmland = new THREE.Color(0x918838);   // Golden wheat fields
    const cRock = new THREE.Color(0x605b54);       // Mountain granite
    const cSnowRock = new THREE.Color(0x8c867e);   // High peaks
    const cSand = new THREE.Color(0xd4b574);       // Beach sand
    const cWaterbed = new THREE.Color(0x132b3f);   // Submerged sea floor

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const worldX = vx;
      const worldZ = -vy;

      const height = this.getHeightAt(worldX, worldZ);
      pos.setZ(i, height);

      let c;
      if (height < 1.0) {
        c = (height < -3) ? cWaterbed : cSand;
      } else if (height < 5.0) {
        c = cSand; // Coastal sand belt
      } else if (height > 40) {
        c = (height > 65) ? cSnowRock : cRock;
      } else if (worldX > -1600 && worldX < 600 && worldZ > 0 && worldZ < 1000) {
        c = cFarmland; // Pochinki & Gatka wheat fields
      } else if (worldZ < -1000 && Math.abs(worldX) < 1200) {
        c = cDeepForest;
      } else {
        c = cGrass;
      }

      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Non-metallic, non-reflective material with high roughness for realistic earth/grass
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.90,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createOceanWater() {
    // Water sits at Y = 0.0m, while the island land is at Y = +6.0m!
    const waterGeo = new THREE.PlaneGeometry(9600, 9600, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x005588,
      roughness: 0.25,
      metalness: 0.35,
      transparent: true,
      opacity: 0.78
    });

    this.oceanMesh = new THREE.Mesh(waterGeo, waterMat);
    this.oceanMesh.position.set(0, 0.0, 0);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  updateWater(deltaTime) {
    if (!this.oceanMesh) return;
    this.waterTime += deltaTime;
    this.oceanMesh.position.y = Math.sin(this.waterTime * 1.5) * 0.04;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TWO SUSPENSION BRIDGES (WEST & EAST BRIDGES)
  // ═══════════════════════════════════════════════════════════════════════════
  createTwoSuspensionBridges() {
    const bridgeLocations = [
      { name: 'West Bridge', x: -800, zStart: 1100, zEnd: 1900 },
      { name: 'East Bridge', x: 1500, zStart: 1100, zEnd: 1900 }
    ];

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.3, metalness: 0.85 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.2, metalness: 0.95 });
    const deckMat = new THREE.MeshLambertMaterial({ map: this.asphaltTexture, color: 0x222226 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x8892b0, roughness: 0.2, metalness: 0.9 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x818a99, roughness: 0.8 });

    bridgeLocations.forEach(b => {
      const length = b.zEnd - b.zStart;
      const midZ = (b.zStart + b.zEnd) / 2;
      const width = 24;

      // Asphalt Deck (Elevation Y = 13.0m)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, length), deckMat);
      deck.position.set(b.x, 13.0, midZ);
      deck.receiveShadow = true;
      this.scene.add(deck);

      // Yellow Center Line
      const yLine = new THREE.Mesh(new THREE.PlaneGeometry(1.2, length).rotateX(-Math.PI / 2), lineMat);
      yLine.position.set(b.x, 14.3, midZ);
      this.scene.add(yLine);

      // Concrete Underwater Piers
      [-220, 0, 220].forEach(oz => {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(width + 6, 26, 18), concreteMat);
        pier.position.set(b.x, 2.0, midZ + oz);
        this.scene.add(pier);
      });

      // Towers (48m High)
      [-180, 180].forEach(oz => {
        const towerZ = midZ + oz;
        [-width / 2 - 2, width / 2 + 2].forEach(ox => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(3.5, 52, 3.5), steelMat);
          col.position.set(b.x + ox, 32, towerZ);
          this.scene.add(col);
        });

        const cross = new THREE.Mesh(new THREE.BoxGeometry(width + 8, 4, 3.5), steelMat);
        cross.position.set(b.x, 52, towerZ);
        this.scene.add(cross);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
        beacon.position.set(b.x, 55, towerZ);
        this.scene.add(beacon);
      });

      // Suspension Cables
      [-width / 2 - 2, width / 2 + 2].forEach(ox => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(b.x + ox, 14.5, b.zStart),
          new THREE.Vector3(b.x + ox, 52, midZ - 180),
          new THREE.Vector3(b.x + ox, 18, midZ),
          new THREE.Vector3(b.x + ox, 52, midZ + 180),
          new THREE.Vector3(b.x + ox, 14.5, b.zEnd),
        ]);
        const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.45, 8, false), cableMat);
        this.scene.add(cableMesh);
      });

      // Guardrails
      [-width / 2 + 0.8, width / 2 - 0.8].forEach(ox => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, length), barrierMat);
        rail.position.set(b.x + ox, 15.1, midZ);
        this.scene.add(rail);

        this.colliders.push({
          type: 'box',
          minX: b.x + ox - 1.2,
          maxX: b.x + ox + 1.2,
          minZ: b.zStart,
          maxZ: b.zEnd,
          height: 18
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ROAD NETWORK
  // ═══════════════════════════════════════════════════════════════════════════
  createRoadNetwork() {
    const roadMat = new THREE.MeshLambertMaterial({ map: this.asphaltTexture, color: 0x28282e });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

    const buildRoadStrip = (x1, z1, x2, z2, width = 24) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const totalLen = Math.sqrt(dx * dx + dz * dz);
      if (totalLen < 1) return;

      const segLen = 40;
      const numSegs = Math.max(1, Math.ceil(totalLen / segLen));
      const nx = -dz / totalLen;
      const nz = dx / totalLen;
      const halfW = width * 0.5;

      const roadVerts = [];
      const roadIndices = [];
      const roadUvs = [];

      const yVerts = [];
      const yIndices = [];
      const yHalfW = 0.6;

      const wVerts = [];
      const wIndices = [];
      const wHalfW = 0.4;
      const edgeOffset = halfW - 1.5;

      for (let i = 0; i <= numSegs; i++) {
        const t = i / numSegs;
        const cx = x1 + dx * t;
        const cz = z1 + dz * t;

        const lx = cx + nx * halfW;
        const lz = cz + nz * halfW;
        const rx = cx - nx * halfW;
        const rz = cz - nz * halfW;
        const ly = this.getHeightAt(lx, lz) + 0.12;
        const ry = this.getHeightAt(rx, rz) + 0.12;
        const midY = (ly + ry) * 0.5;

        roadVerts.push(lx, ly, lz, rx, ry, rz);
        roadUvs.push(0, t * (totalLen / 12), 1, t * (totalLen / 12));

        if (i < numSegs) {
          const base = i * 2;
          roadIndices.push(base, base + 1, base + 2);
          roadIndices.push(base + 1, base + 3, base + 2);
        }

        const ylx = cx + nx * yHalfW;
        const ylz = cz + nz * yHalfW;
        const yrx = cx - nx * yHalfW;
        const yrz = cz - nz * yHalfW;
        yVerts.push(ylx, midY + 0.04, ylz, yrx, midY + 0.04, yrz);
        if (i < numSegs) {
          const b = i * 2;
          yIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }

        const leftMidX = cx + nx * edgeOffset;
        const leftMidZ = cz + nz * edgeOffset;
        const rightMidX = cx - nx * edgeOffset;
        const rightMidZ = cz - nz * edgeOffset;

        const w1lx = leftMidX + nx * wHalfW;
        const w1lz = leftMidZ + nz * wHalfW;
        const w1rx = leftMidX - nx * wHalfW;
        const w1rz = leftMidZ - nz * wHalfW;

        const w2lx = rightMidX + nx * wHalfW;
        const w2lz = rightMidZ + nz * wHalfW;
        const w2rx = rightMidX - nx * wHalfW;
        const w2rz = rightMidZ - nz * wHalfW;

        const wIdxBase = i * 4;
        wVerts.push(w1lx, ly + 0.04, w1lz, w1rx, ly + 0.04, w1rz);
        wVerts.push(w2lx, ry + 0.04, w2lz, w2rx, ry + 0.04, w2rz);

        if (i < numSegs) {
          wIndices.push(wIdxBase, wIdxBase + 1, wIdxBase + 4);
          wIndices.push(wIdxBase + 1, wIdxBase + 5, wIdxBase + 4);
          wIndices.push(wIdxBase + 2, wIdxBase + 3, wIdxBase + 6);
          wIndices.push(wIdxBase + 3, wIdxBase + 7, wIdxBase + 6);
        }
      }

      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
      roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
      roadGeo.setIndex(roadIndices);
      roadGeo.computeVertexNormals();

      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);
      this.roadMeshes.push(roadMesh);

      const yGeo = new THREE.BufferGeometry();
      yGeo.setAttribute('position', new THREE.Float32BufferAttribute(yVerts, 3));
      yGeo.setIndex(yIndices);
      yGeo.computeVertexNormals();
      const yLine = new THREE.Mesh(yGeo, yellowMat);
      this.scene.add(yLine);

      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wVerts, 3));
      wGeo.setIndex(wIndices);
      wGeo.computeVertexNormals();
      const wLine = new THREE.Mesh(wGeo, whiteMat);
      this.scene.add(wLine);
    };

    // Coastal Highway
    const coastal = [
      { x: -3200, z: -3200 }, { x: 0, z: -3500 }, { x: 2800, z: -3200 },
      { x: 3400, z: -1200 }, { x: 3200, z: 800 }, { x: 1500, z: 1100 },
      { x: -800, z: 1100 }, { x: -2800, z: 800 }, { x: -3400, z: -1200 }, { x: -3200, z: -3200 }
    ];
    for (let i = 0; i < coastal.length - 1; i++) {
      buildRoadStrip(coastal[i].x, coastal[i].z, coastal[i + 1].x, coastal[i + 1].z, 26);
    }

    // Cross Island Arterials
    buildRoadStrip(-2400, -1400, 400, -400, 24);
    buildRoadStrip(400, -400, -400, 500, 24);
    buildRoadStrip(-400, 500, -800, 1100, 24);
    buildRoadStrip(-400, 500, 1500, 1100, 24);
    buildRoadStrip(-2000, 400, -400, 500, 24);
    buildRoadStrip(-400, 500, 1400, 600, 24);
    buildRoadStrip(1400, 600, 3200, 800, 24);
    buildRoadStrip(400, -400, 1800, -1400, 24);
    buildRoadStrip(1800, -1400, 3400, -1200, 24);

    // Sosnovka Ring
    buildRoadStrip(-800, 1900, 0, 2300, 24);
    buildRoadStrip(1500, 1900, 0, 2300, 24);
    buildRoadStrip(0, 2300, 1600, 3200, 22);
    buildRoadStrip(1600, 3200, -1200, 3400, 22);
    buildRoadStrip(-1200, 3400, -800, 1900, 22);

    // Pochinki Grid
    for (let ox = -600; ox <= -200; ox += 100) buildRoadStrip(ox, 300, ox, 700, 16);
    for (let oz = 350; oz <= 650; oz += 100) buildRoadStrip(-650, oz, -150, oz, 16);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. VEGETATION: 1,200 TREES, 600 SHRUBS, 80 HAY BALES
  // ═══════════════════════════════════════════════════════════════════════════
  createDenseVegetation() {
    const trunkPineMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.85 });
    const leavesPineMat = new THREE.MeshStandardMaterial({ color: 0x184218, roughness: 0.8 });
    const trunkBirchMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.6 });
    const leavesBirchMat = new THREE.MeshStandardMaterial({ color: 0x629c2a, roughness: 0.7 });
    const trunkOakMat = new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.9 });
    const leavesOakMat = new THREE.MeshStandardMaterial({ color: 0x2e7320, roughness: 0.75 });

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x3d7826, roughness: 0.8 });
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xdfb15b, roughness: 0.9 });

    const pineTrunkGeo = new THREE.CylinderGeometry(0.7, 1.1, 8, 7);
    const pineConeGeo1 = new THREE.ConeGeometry(7.5, 9, 7);
    const pineConeGeo2 = new THREE.ConeGeometry(6.0, 8, 7);
    const pineConeGeo3 = new THREE.ConeGeometry(4.2, 7, 7);

    const birchTrunkGeo = new THREE.CylinderGeometry(0.45, 0.65, 12, 7);
    const birchCanopyGeo1 = new THREE.SphereGeometry(4.5, 7, 6);
    const birchCanopyGeo2 = new THREE.SphereGeometry(3.5, 7, 6);

    const oakTrunkGeo = new THREE.CylinderGeometry(1.2, 1.8, 7, 8);
    const oakCanopyGeo = new THREE.DodecahedronGeometry(8.5, 1);

    for (let i = 0; i < 1200; i++) {
      const rx = (Math.random() - 0.5) * 7200;
      const rz = (Math.random() - 0.5) * 7200;
      const ry = this.getHeightAt(rx, rz);

      if (ry < 4.5) continue; // Don't place trees in water or beaches
      if (Math.abs(rx - (-400)) < 180 && Math.abs(rz - 500) < 180) continue;
      if (Math.abs(rx) < 250 && Math.abs(rz - 2800) < 350) continue; // Clear runway

      const treeGroup = new THREE.Group();
      const treeType = i % 3;

      if (treeType === 0) {
        const trunk = new THREE.Mesh(pineTrunkGeo, trunkPineMat); trunk.position.y = 4;
        treeGroup.add(trunk);
        const c1 = new THREE.Mesh(pineConeGeo1, leavesPineMat); c1.position.y = 10;
        const c2 = new THREE.Mesh(pineConeGeo2, leavesPineMat); c2.position.y = 15;
        const c3 = new THREE.Mesh(pineConeGeo3, leavesPineMat); c3.position.y = 19;
        treeGroup.add(c1); treeGroup.add(c2); treeGroup.add(c3);
      } else if (treeType === 1) {
        const trunk = new THREE.Mesh(birchTrunkGeo, trunkBirchMat); trunk.position.y = 6;
        treeGroup.add(trunk);
        const l1 = new THREE.Mesh(birchCanopyGeo1, leavesBirchMat); l1.position.set(0, 13, 0);
        const l2 = new THREE.Mesh(birchCanopyGeo2, leavesBirchMat); l2.position.set(1.5, 17, 0);
        treeGroup.add(l1); treeGroup.add(l2);
      } else {
        const trunk = new THREE.Mesh(oakTrunkGeo, trunkOakMat); trunk.position.y = 3.5;
        treeGroup.add(trunk);
        const dome = new THREE.Mesh(oakCanopyGeo, leavesOakMat); dome.position.y = 12;
        treeGroup.add(dome);
      }

      const scale = 0.8 + Math.random() * 0.6;
      treeGroup.scale.set(scale, scale, scale);
      treeGroup.position.set(rx, ry, rz);
      treeGroup.castShadow = true;
      this.scene.add(treeGroup);
      this.trees.push(treeGroup);

      this.colliders.push({
        type: 'circle',
        x: rx,
        z: rz,
        radius: 1.4 * scale,
        height: 18 * scale
      });
    }

    // Bushes
    const bushGeo = new THREE.DodecahedronGeometry(2.5, 1);
    for (let i = 0; i < 600; i++) {
      const bx = (Math.random() - 0.5) * 6800;
      const bz = (Math.random() - 0.5) * 6800;
      const by = this.getHeightAt(bx, bz);
      if (by < 4.5) continue;
      if (Math.abs(bx - (-400)) < 180 && Math.abs(bz - 500) < 180) continue;
      if (Math.abs(bx) < 250 && Math.abs(bz - 2800) < 350) continue;

      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(bx, by + 1.2, bz);
      const bScale = 0.7 + Math.random() * 0.8;
      bush.scale.set(bScale * 1.5, bScale, bScale * 1.5);
      this.scene.add(bush);
    }

    // Hay Bales in farmlands
    const hayGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.6, 12).rotateZ(Math.PI / 2);
    for (let i = 0; i < 80; i++) {
      const hx = -1600 + Math.random() * 1400;
      const hz = 200 + Math.random() * 800;
      const hy = this.getHeightAt(hx, hz) + 1.8;

      const hay = new THREE.Mesh(hayGeo, hayMat);
      hay.position.set(hx, hy, hz);
      hay.rotation.y = Math.random() * Math.PI;
      hay.castShadow = true;
      this.scene.add(hay);

      this.colliders.push({ type: 'circle', x: hx, z: hz, radius: 2.2, height: 3.6 });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. 3D GRASS TUFTS & VIBRANT WILDFLOWERS
  // ═══════════════════════════════════════════════════════════════════════════
  create3DGrassAndFlowers() {
    const grassMat1 = new THREE.MeshStandardMaterial({ color: 0x4d9e26, roughness: 0.9, side: THREE.DoubleSide });
    const grassMat2 = new THREE.MeshStandardMaterial({ color: 0x6fb83b, roughness: 0.85, side: THREE.DoubleSide });
    const flowerRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
    const flowerYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const flowerBlueMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });

    const bladeGeo = new THREE.PlaneGeometry(1.8, 1.4);
    bladeGeo.translate(0, 0.7, 0);

    for (let i = 0; i < 900; i++) {
      const gx = (Math.random() - 0.5) * 6400;
      const gz = (Math.random() - 0.5) * 6400;
      const gy = this.getHeightAt(gx, gz);
      if (gy < 5.0 || gy > 35) continue;
      if (Math.abs(gx - (-400)) < 180 && Math.abs(gz - 500) < 180) continue;
      if (Math.abs(gx) < 250 && Math.abs(gz - 2800) < 350) continue;

      const grassGroup = new THREE.Group();
      const m1 = new THREE.Mesh(bladeGeo, (i % 2 === 0) ? grassMat1 : grassMat2);
      const m2 = new THREE.Mesh(bladeGeo, (i % 2 === 0) ? grassMat1 : grassMat2);
      m2.rotation.y = Math.PI / 2;
      grassGroup.add(m1);
      grassGroup.add(m2);

      if (Math.random() < 0.35) {
        const flowerColor = [flowerRedMat, flowerYellowMat, flowerBlueMat][i % 3];
        const flowerPetal = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), flowerColor);
        flowerPetal.position.set((Math.random() - 0.5) * 0.8, 1.3, (Math.random() - 0.5) * 0.8);
        grassGroup.add(flowerPetal);
      }

      grassGroup.position.set(gx, gy, gz);
      const s = 0.8 + Math.random() * 0.6;
      grassGroup.scale.set(s, s, s);
      grassGroup.rotation.y = Math.random() * Math.PI;
      this.scene.add(grassGroup);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. COMPLETE SOSNOVKA AIRPORT
  // ═══════════════════════════════════════════════════════════════════════════
  createCompleteAirport() {
    const ax = 0;
    const az = 2800;
    const ay = this.getHeightAt(ax, az); // 6.0m
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x828a99, roughness: 0.8 });
    const darkAsphaltMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.9 });
    const camoPlaneMat = new THREE.MeshStandardMaterial({ color: 0x54606e, roughness: 0.4, metalness: 0.75 });
    const jetMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.35, metalness: 0.85 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4, roughness: 0.1 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Main Runway Strip
    const runwayGeo = new THREE.PlaneGeometry(55, 1400).rotateX(-Math.PI / 2);
    const runway = new THREE.Mesh(runwayGeo, darkAsphaltMat);
    runway.position.set(ax, ay + 0.05, az);
    runway.receiveShadow = true;
    this.scene.add(runway);

    // Centerline Dashes
    for (let z = az - 600; z <= az + 600; z += 40) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 20).rotateX(-Math.PI / 2), whiteMat);
      dash.position.set(ax, ay + 0.08, z);
      this.scene.add(dash);
    }

    // Threshold Markings
    [-650, 650].forEach(endZ => {
      for (let k = -7; k <= 7; k++) {
        const key = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 32).rotateX(-Math.PI / 2), whiteMat);
        key.position.set(ax + k * 3.2, ay + 0.08, az + endZ);
        this.scene.add(key);
      }
    });

    // Runway Edge Lights
    for (let z = az - 680; z <= az + 680; z += 50) {
      [-27, 27].forEach(ox => {
        const isThreshold = Math.abs(z - (az - 680)) < 40 || Math.abs(z - (az + 680)) < 40;
        const lightColor = isThreshold ? 0x22c55e : 0xffffff;
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8), new THREE.MeshBasicMaterial({ color: lightColor }));
        lamp.position.set(ax + ox, ay + 0.4, z);
        this.scene.add(lamp);
        this.runwayLights.push(lamp);
      });
    }

    // Air Traffic Control Tower (32m High)
    const towerGroup = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6.0, 26, 12), concreteMat);
    col.position.y = 13;
    towerGroup.add(col);

    const cabBase = new THREE.Mesh(new THREE.CylinderGeometry(9.0, 4.5, 3.5, 8), concreteMat);
    cabBase.position.y = 27.5;
    towerGroup.add(cabBase);

    const cabGlass = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 4.5, 8), glassMat);
    cabGlass.position.y = 31.5;
    towerGroup.add(cabGlass);

    const cabRoof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.0, 8), concreteMat);
    cabRoof.position.y = 35.0;
    towerGroup.add(cabRoof);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0022 }));
    beacon.position.y = 37.0;
    towerGroup.add(beacon);

    towerGroup.position.set(ax + 90, ay, az - 120);
    towerGroup.castShadow = true;
    this.scene.add(towerGroup);

    this.colliders.push({ type: 'circle', x: ax + 90, z: az - 120, radius: 7.0, height: 38 });

    // C-130 Hercules Transport Plane
    const hercules = new THREE.Group();
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 45, 16).rotateX(Math.PI / 2), camoPlaneMat);
    fuse.position.y = 6.5;
    hercules.add(fuse);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(4.2, 10, 16).rotateX(-Math.PI / 2), camoPlaneMat);
    nose.position.set(0, 6.5, 27.5);
    hercules.add(nose);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(48, 0.9, 8), camoPlaneMat);
    wings.position.set(0, 8.8, 5);
    hercules.add(wings);

    [-18, -9, 9, 18].forEach(ex => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 6.5, 10).rotateX(Math.PI / 2), camoPlaneMat);
      nacelle.position.set(ex, 8.2, 7.5);
      hercules.add(nacelle);

      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.0, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      spinner.position.set(ex, 8.2, 11);
      hercules.add(spinner);
    });

    const vTail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 11, 7), camoPlaneMat);
    vTail.position.set(0, 13.5, -20);
    hercules.add(vTail);

    const hTail = new THREE.Mesh(new THREE.BoxGeometry(18, 0.7, 5), camoPlaneMat);
    hTail.position.set(0, 18.5, -21);
    hercules.add(hTail);

    hercules.position.set(ax - 100, ay, az + 80);
    hercules.rotation.y = Math.PI / 3;
    hercules.castShadow = true;
    this.scene.add(hercules);

    this.colliders.push({ type: 'box', minX: ax - 130, maxX: ax - 70, minZ: az + 55, maxZ: az + 105, height: 18 });

    // Two Fighter Jets
    [-60, 60].forEach((oz) => {
      const jet = new THREE.Group();
      const jetBody = new THREE.Mesh(new THREE.ConeGeometry(1.6, 18, 12).rotateX(-Math.PI / 2), jetMat);
      jetBody.position.y = 2.4;
      jet.add(jetBody);

      const jWings = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 7), jetMat);
      jWings.position.set(0, 2.4, -2);
      jet.add(jWings);

      [-1.8, 1.8].forEach(tx => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.0, 3.5), jetMat);
        fin.position.set(tx, 4.2, -7);
        fin.rotation.z = (tx > 0 ? -0.2 : 0.2);
        jet.add(fin);
      });

      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8).scale(0.8, 1.0, 3.0), glassMat);
      canopy.position.set(0, 3.4, 2.0);
      jet.add(canopy);

      jet.position.set(ax - 90, ay, az - 180 + oz);
      jet.rotation.y = Math.PI / 2;
      jet.castShadow = true;
      this.scene.add(jet);

      this.colliders.push({ type: 'circle', x: ax - 90, z: az - 180 + oz, radius: 7, height: 6 });
    });

    // Windsock
    const sockGroup = new THREE.Group();
    const sockPole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd4d4d8 }));
    sockPole.position.y = 5;
    sockGroup.add(sockPole);

    const sock = new THREE.Mesh(new THREE.ConeGeometry(1.2, 5.0, 10).rotateZ(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    sock.position.set(2.5, 9.5, 0);
    sockGroup.add(sock);

    sockGroup.position.set(ax + 45, ay, az + 200);
    this.scene.add(sockGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. DETAILED TOWNS & HOUSES
  // ═══════════════════════════════════════════════════════════════════════════
  createDetailedTownsAndHouses() {
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x9b4a38, roughness: 0.7 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c5835, roughness: 0.85 });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xdcd6cd, roughness: 0.75 });
    const roofRed = new THREE.MeshStandardMaterial({ color: 0x882d22, roughness: 0.6 });
    const roofGrey = new THREE.MeshStandardMaterial({ color: 0x3d4852, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2, metalness: 0.8 });

    const townCenters = [
      { name: 'Pochinki Outskirts', x: -400, z: 500, count: 16, mat: brickMat, roof: roofRed },
      { name: 'Severny', x: 0, z: -3400, count: 12, mat: plasterMat, roof: roofGrey },
      { name: 'Primorsk', x: -2800, z: 800, count: 10, mat: brickMat, roof: roofRed },
      { name: 'Zharki', x: -3200, z: -3100, count: 9, mat: woodMat, roof: roofGrey },
      { name: 'Novorepnoye', x: 1600, z: 3200, count: 14, mat: plasterMat, roof: roofRed },
      { name: 'Rozhok', x: 400, z: -250, count: 12, mat: brickMat, roof: roofGrey }
    ];

    townCenters.forEach(tc => {
      for (let i = 0; i < tc.count; i++) {
        const ox = ((i % 4) - 1.5) * 65 + (Math.random() - 0.5) * 15;
        const oz = (Math.floor(i / 4) - 1.0) * 65 + (Math.random() - 0.5) * 15;
        const hx = tc.x + ox;
        const hz = tc.z + oz;
        const hy = this.getHeightAt(hx, hz);
        if (hy < 4.5) continue;

        const w = 18; const d = 14; const h = 9;
        const house = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), tc.mat);
        body.position.y = h / 2;
        house.add(body);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.74, 4.5, 4), tc.roof);
        roof.position.y = h + 2.25;
        roof.rotation.y = Math.PI / 4;
        house.add(roof);

        const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.0, 1.8), brickMat);
        chimney.position.set(w * 0.28, h + 2.5, d * 0.2);
        house.add(chimney);

        const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 4), tc.roof);
        porchRoof.position.set(0, 4.2, d / 2 + 2);
        house.add(porchRoof);

        [-2.7, 2.7].forEach(px => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.2, 6), woodMat);
          post.position.set(px, 2.1, d / 2 + 3.8);
          house.add(post);
        });

        [[-w * 0.25, h * 0.6], [w * 0.25, h * 0.6]].forEach(([wx, wy]) => {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), glassMat);
          win.position.set(wx, wy, d / 2 + 0.05);
          house.add(win);
        });

        house.position.set(hx, hy, hz);
        house.rotation.y = (Math.random() - 0.5) * 0.6;
        house.castShadow = true;
        this.scene.add(house);

        this.colliders.push({
          type: 'box',
          minX: hx - w / 2 - 1,
          maxX: hx + w / 2 + 1,
          minZ: hz - d / 2 - 1,
          maxZ: hz + d / 2 + 4,
          height: h + 5
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. WORKING GAS STATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  createWorkingGasStations() {
    const stations = [
      { name: 'Pochinki Gas', x: -400, z: 250 },
      { name: 'Military Access Gas', x: -400, z: 2100 },
      { name: 'Mylta Coast Gas', x: 2600, z: 700 },
      { name: 'Georgopol Entrance Gas', x: -2100, z: -1200 },
      { name: 'Severny Road Gas', x: 0, z: -3200 }
    ];

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const storeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.1, metalness: 0.8 });

    stations.forEach(st => {
      const sy = this.getHeightAt(st.x, st.z);
      if (sy < 4.5) return;

      const stationGroup = new THREE.Group();

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(36, 1.8, 22), canopyMat);
      canopy.position.y = 8.5;
      stationGroup.add(canopy);

      [[-14, -7], [14, -7], [-14, 7], [14, 7]].forEach(([px, pz]) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 8.5, 8), whiteMat);
        col.position.set(px, 4.25, pz);
        stationGroup.add(col);
      });

      [[-8, -4], [8, -4], [-8, 4], [8, 4]].forEach(([px, pz]) => {
        const island = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 7.0), whiteMat);
        island.position.set(px, 0.25, pz);
        stationGroup.add(island);

        const pump = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, 1.8), pumpMat);
        pump.position.set(px, 2.3, pz);
        stationGroup.add(pump);
      });

      const store = new THREE.Mesh(new THREE.BoxGeometry(26, 7.5, 14), storeMat);
      store.position.set(0, 3.75, -20);
      stationGroup.add(store);

      const storeGlass = new THREE.Mesh(new THREE.PlaneGeometry(20, 4.5), glassMat);
      storeGlass.position.set(0, 3.5, -12.9);
      stationGroup.add(storeGlass);

      const totem = new THREE.Mesh(new THREE.BoxGeometry(3.5, 11, 1.2), canopyMat);
      totem.position.set(-24, 5.5, 12);
      stationGroup.add(totem);

      stationGroup.position.set(st.x, sy, st.z);
      stationGroup.castShadow = true;
      this.scene.add(stationGroup);

      this.colliders.push({
        type: 'box',
        minX: st.x - 18,
        maxX: st.x + 18,
        minZ: st.z - 28,
        maxZ: st.z + 12,
        height: 9
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. COASTAL LIGHTHOUSES & PIERS
  // ═══════════════════════════════════════════════════════════════════════════
  createCoastalLighthousesAndPiers() {
    const lighthouses = [
      { x: -3000, z: 900 },
      { x: 200, z: -3600 }
    ];

    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });

    lighthouses.forEach(lh => {
      const ly = this.getHeightAt(lh.x, lh.z);
      const lhGroup = new THREE.Group();

      for (let s = 0; s < 5; s++) {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(3.2 - s * 0.3, 3.5 - s * 0.3, 6, 12),
          (s % 2 === 0) ? whiteMat : redMat
        );
        seg.position.y = 3 + s * 6;
        lhGroup.add(seg);
      }

      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.5, 8), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
      lantern.position.y = 32;
      lhGroup.add(lantern);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
      dome.position.y = 33.8;
      lhGroup.add(dome);

      lhGroup.position.set(lh.x, ly, lh.z);
      lhGroup.castShadow = true;
      this.scene.add(lhGroup);

      this.colliders.push({ type: 'circle', x: lh.x, z: lh.z, radius: 4.5, height: 36 });
    });

    [
      { x: 1600, z: 3400, len: 70 },
      { x: -3000, z: 700, len: 60 }
    ].forEach(pier => {
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, pier.len), woodMat);
      pMesh.position.set(pier.x, 1.2, pier.z);
      pMesh.receiveShadow = true;
      this.scene.add(pMesh);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. POCHINKI TOWN & ORTHODOX CHURCH
  // ═══════════════════════════════════════════════════════════════════════════
  createPochinkiTown() {
    const cx = -400; const cz = 500;
    const cy = this.getHeightAt(cx, cz); // 6.0m
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.2, metalness: 0.9 });

    const churchGroup = new THREE.Group();
    const nave = new THREE.Mesh(new THREE.BoxGeometry(26, 16, 42), whiteMat);
    nave.position.y = 8;
    churchGroup.add(nave);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(12, 34, 12), whiteMat);
    tower.position.set(0, 17, 18);
    churchGroup.add(tower);

    const domeGeo = new THREE.SphereGeometry(6, 16, 16).scale(1, 1.6, 1);
    const dome = new THREE.Mesh(domeGeo, goldMat);
    dome.position.set(0, 39, 18);
    churchGroup.add(dome);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), goldMat);
    crossV.position.set(0, 48, 18);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 0.6), goldMat);
    crossH.position.set(0, 49.5, 18);
    churchGroup.add(crossV);
    churchGroup.add(crossH);

    churchGroup.position.set(cx, cy, cz);
    churchGroup.castShadow = true;
    this.scene.add(churchGroup);

    this.colliders.push({ type: 'box', minX: cx - 14, maxX: cx + 14, minZ: cz - 22, maxZ: cz + 26, height: 40 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. GEORGOPOL CONTAINER PORT
  // ═══════════════════════════════════════════════════════════════════════════
  createGeorgopolPort() {
    const gx = -2400; const gz = -1400;
    const gy = this.getHeightAt(gx, gz);
    const containerColors = [
      new THREE.MeshStandardMaterial({ color: 0xd03020, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x1860a8, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x208848, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xe09818, roughness: 0.6 }),
    ];
    const cGeo = new THREE.BoxGeometry(6, 6, 14);

    for (let row = -3; row <= 3; row++) {
      for (let col = -3; col <= 3; col++) {
        const stackHeight = 1 + (Math.abs(row + col) % 3);
        for (let h = 0; h < stackHeight; h++) {
          const container = new THREE.Mesh(cGeo, containerColors[(row + col + h + 10) % containerColors.length]);
          const px = gx + col * 9 + 80;
          const pz = gz + row * 18 - 80;
          container.position.set(px, gy + 3 + h * 6, pz);
          container.castShadow = true;
          this.scene.add(container);

          if (h === 0) {
            this.colliders.push({ type: 'box', minX: px - 3.2, maxX: px + 3.2, minZ: pz - 7.2, maxZ: pz + 7.2, height: stackHeight * 6 });
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. MYLTA POWER PLANT
  // ═══════════════════════════════════════════════════════════════════════════
  createMyltaPowerPlant() {
    const px = 3200; const pz = 800;
    const py = this.getHeightAt(px, pz);
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x8a929e, roughness: 0.8 });

    // 50m Hyperboloid Cooling Tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(14, 22, 50, 24, 1, true), concreteMat);
    tower.position.set(px, py + 25, pz);
    tower.castShadow = true;
    this.scene.add(tower);

    this.colliders.push({ type: 'circle', x: px, z: pz, radius: 22, height: 50 });

    const reactor = new THREE.Mesh(new THREE.BoxGeometry(50, 18, 38), concreteMat);
    reactor.position.set(px - 60, py + 9, pz);
    reactor.castShadow = true;
    this.scene.add(reactor);

    this.colliders.push({ type: 'box', minX: px - 60 - 26, maxX: px - 60 + 26, minZ: pz - 20, maxZ: pz + 20, height: 18 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. SCHOOL, YASNAYA, PYLONS & SIGNAGE
  // ═══════════════════════════════════════════════════════════════════════════
  createSchoolAndRozhok() {
    const sx = 400; const sz = -400;
    const sy = this.getHeightAt(sx, sz);
    const schoolMat = new THREE.MeshStandardMaterial({ color: 0xd5c4a1, roughness: 0.7 });

    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(60, 12, 24), schoolMat);
    mainWing.position.set(sx, sy + 6.5, sz);
    this.scene.add(mainWing);

    const gymWing = new THREE.Mesh(new THREE.BoxGeometry(32, 16, 28), schoolMat);
    gymWing.position.set(sx + 45, sy + 8.5, sz + 20);
    this.scene.add(gymWing);

    this.colliders.push({ type: 'box', minX: sx - 32, maxX: sx + 62, minZ: sz - 14, maxZ: sz + 36, height: 16 });
  }

  createYasnayaPolyana() {
    const yx = 1800; const yz = -1400;
    const yy = this.getHeightAt(yx, yz);
    const aptMat = new THREE.MeshStandardMaterial({ map: this.buildingTextures[1], roughness: 0.5 });

    [-120, 0, 120].forEach(ox => {
      [-80, 80].forEach(oz => {
        const apt = new THREE.Mesh(new THREE.BoxGeometry(28, 28, 20), aptMat);
        apt.position.set(yx + ox, yy + 14.5, yz + oz);
        apt.castShadow = true;
        this.scene.add(apt);

        this.colliders.push({ type: 'box', minX: yx + ox - 15, maxX: yx + ox + 15, minZ: yz + oz - 11, maxZ: yz + oz + 11, height: 28 });
      });
    });
  }

  createTransmissionPylons() {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.8 });
    for (let step = -4; step <= 4; step++) {
      const px = step * 650; const pz = -200 + step * 250;
      const py = this.getHeightAt(px, pz);

      const pylon = new THREE.Group();
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3.5, 36, 4), steelMat);
      mast.position.y = 18;
      pylon.add(mast);

      const arm1 = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 1.2), steelMat); arm1.position.y = 30;
      const arm2 = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 1.2), steelMat); arm2.position.y = 34;
      pylon.add(arm1); pylon.add(arm2);

      pylon.position.set(px, py, pz);
      pylon.castShadow = true;
      this.scene.add(pylon);

      this.colliders.push({ type: 'circle', x: px, z: pz, radius: 3.5, height: 36 });
    }
  }

  createRoadsideDetails() {
    const signs = [
      { x: -400, z: 320, text: 'POCHINKI' },
      { x: -750, z: 1050, text: 'WEST BRIDGE' },
      { x: 1450, z: 1050, text: 'EAST BRIDGE' },
      { x: 0, z: 2200, text: 'MILITARY AIRPORT' },
      { x: -2300, z: -1300, text: 'GEORGOPOL' },
      { x: 3100, z: 700, text: 'MYLTA POWER' },
      { x: 1700, z: -1300, text: 'YASNAYA' }
    ];

    signs.forEach(sl => {
      const sy = this.getHeightAt(sl.x, sl.z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 8), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      pole.position.set(sl.x, sy + 3.5, sl.z);
      this.scene.add(pole);

      const board = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x1e5a2b }));
      board.position.set(sl.x, sy + 6.2, sl.z);
      this.scene.add(board);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. SPATIAL GRID FOR ZERO-LAG COLLISION DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  _buildSpatialGrid() {
    this.grid.clear();
    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];
      let minX, maxX, minZ, maxZ;
      if (col.type === 'box') {
        minX = col.minX; maxX = col.maxX; minZ = col.minZ; maxZ = col.maxZ;
      } else {
        minX = col.x - col.radius; maxX = col.x + col.radius;
        minZ = col.z - col.radius; maxZ = col.z + col.radius;
      }

      const cellX1 = Math.floor(minX / this.gridCellSize);
      const cellX2 = Math.floor(maxX / this.gridCellSize);
      const cellZ1 = Math.floor(minZ / this.gridCellSize);
      const cellZ2 = Math.floor(maxZ / this.gridCellSize);

      for (let cx = cellX1; cx <= cellX2; cx++) {
        for (let cz = cellZ1; cz <= cellZ2; cz++) {
          const key = `${cx},${cz}`;
          if (!this.grid.has(key)) this.grid.set(key, []);
          this.grid.get(key).push(col);
        }
      }
    }
  }

  checkCollision(posX, posZ, vehicleRadius = 1.6) {
    const cellX = Math.floor(posX / this.gridCellSize);
    const cellZ = Math.floor(posZ / this.gridCellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${cellX + dx},${cellZ + dz}`;
        const list = this.grid.get(key);
        if (!list) continue;

        for (let i = 0; i < list.length; i++) {
          const col = list[i];
          if (col.type === 'box') {
            const closestX = Math.max(col.minX, Math.min(posX, col.maxX));
            const closestZ = Math.max(col.minZ, Math.min(posZ, col.maxZ));
            const diffX = posX - closestX;
            const diffZ = posZ - closestZ;
            const distSq = diffX * diffX + diffZ * diffZ;

            if (distSq < vehicleRadius * vehicleRadius) {
              const dist = Math.sqrt(distSq) || 0.001;
              return { normalX: diffX / dist, normalZ: diffZ / dist, overlap: vehicleRadius - dist };
            }
          } else if (col.type === 'circle') {
            const diffX = posX - col.x;
            const diffZ = posZ - col.z;
            const minDist = col.radius + vehicleRadius;
            const distSq = diffX * diffX + diffZ * diffZ;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq) || 0.001;
              return { normalX: diffX / dist, normalZ: diffZ / dist, overlap: minDist - dist };
            }
          }
        }
      }
    }

    return null;
  }

  updateWater(deltaTime) {
    if (!this.oceanMesh) return;
    this.waterTime += deltaTime;
    this.oceanMesh.position.y = Math.sin(this.waterTime * 0.9) * 0.08;
  }
}
