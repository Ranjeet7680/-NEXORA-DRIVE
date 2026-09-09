import * as THREE from 'three';
import { BIOMES } from '../config.js';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * 8KM X 8KM ERANGEL BATTLEGROUND ISLAND TERRAIN MANAGER
 * - Size: 8000m x 8000m (from X: -4000 to +4000, Z: -4000 to +4000)
 * - Mainland Continent & Southern Sosnovka Military Island
 * - 2 Iconic Sea Suspension Bridges (West & East Bridges)
 * - Stalber Mountain Peak (+80m), Rozhok Hills, Pochinki Farmlands, Georgopol Bay
 * - Thousands of Trees (Scots Pines, Silver Birches, Summer Oaks), Bushes, Hay Bales
 * - Pochinki Town, Sosnovka Military Base (Radar Tower, Hangars), Mylta Power, Georgopol Port
 * - High-speed spatial grid collision detection
 */
export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.size = 8000; // 8.0 km x 8.0 km
    this.segments = 160;
    this.terrainMesh = null;
    this.oceanMesh = null;
    this.roadMeshes = [];
    this.buildings = [];
    this.trees = [];
    this.waterTime = 0;

    // Physical Obstacle Colliders
    this.colliders = [];
    // Spatial grid for fast O(1) collision queries
    this.gridCellSize = 100;
    this.grid = new Map();

    // Procedural Textures
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
    this.createPochinkiTown();
    this.createSosnovkaMilitaryBase();
    this.createGeorgopolPort();
    this.createMyltaPowerPlant();
    this.createSchoolAndRozhok();
    this.createYasnayaPolyana();
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
      if (Math.abs(x - (-800)) < 16) {
        return 9.0; // West Bridge Deck
      }
      if (Math.abs(x - 1500) < 16) {
        return 9.0; // East Bridge Deck
      }
      // Sea channel between Mainland and Sosnovka Island
      return -8.0;
    }

    // 2. Surrounding Ocean Boundaries
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 3800) {
      return -12.0; // Deep outer sea
    }

    // 3. Georgopol River / Bay Inlet
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
        const rugged = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 12;
        return Math.max(0.45, peak + rugged);
      }
    }

    // 5. Sosnovka Military Island Central Hill (South: x ~ -300 to 400, z ~ 2400 to 3200)
    if (z > 1900 && z < 3700) {
      const dx = (x - 0) / 700;
      const dz = (z - 2800) / 600;
      const distSq = dx * dx + dz * dz;
      if (distSq < 2.0) {
        const hill = Math.max(0, (1 - distSq * 0.5)) * 42;
        return Math.max(0.45, hill);
      }
      return 0.45; // Flat military runway / coastal perimeter
    }

    // 6. Rozhok / School Hill (Center: x ~ 100 to 700, z ~ -700 to -100)
    if (x > 0 && x < 800 && z > -800 && z < 0) {
      const dx = (x - 400) / 350;
      const dz = (z - (-400)) / 300;
      const distSq = dx * dx + dz * dz;
      if (distSq < 1.8) {
        return Math.max(0.45, (1 - distSq * 0.5) * 22);
      }
    }

    // 7. General Farmlands & Rolling Valleys (Pochinki, Gatka, Farm)
    const gentleHills = Math.sin(x * 0.003) * Math.cos(z * 0.003) * 4.5;
    return Math.max(0.45, 0.45 + gentleHills);
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

    // Erangel Palette
    const cGrass = new THREE.Color(0x38761d);       // Lush Erangel grass green
    const cDeepForest = new THREE.Color(0x1f5119);  // Pine forest floor
    const cFarmland = new THREE.Color(0x8a9a40);    // Golden wheat field tints
    const cRock = new THREE.Color(0x625d56);        // Stalber mountain crags
    const cSnowRock = new THREE.Color(0x8a847c);    // High peak rock
    const cSand = new THREE.Color(0xd4b272);        // Coastal beach sand
    const cWaterbed = new THREE.Color(0x1a3848);    // Submerged sea floor

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const worldX = vx;
      const worldZ = -vy;

      const height = this.getHeightAt(worldX, worldZ);
      pos.setZ(i, height);

      let c;
      if (height < 0) {
        c = (height < -4) ? cWaterbed : cSand;
      } else if (height < 2.0) {
        c = (Math.sin(worldX * 0.05 + worldZ * 0.05) > 0.3) ? cSand : cGrass;
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

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createOceanWater() {
    // 9600m x 9600m expansive ocean plane surrounding the Erangel island
    const waterGeo = new THREE.PlaneGeometry(9600, 9600, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0066aa,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.82
    });

    this.oceanMesh = new THREE.Mesh(waterGeo, waterMat);
    this.oceanMesh.position.set(0, 0.0, 0);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TWO ICONIC SEA SUSPENSION BRIDGES (WEST & EAST BRIDGES)
  // ═══════════════════════════════════════════════════════════════════════════
  createTwoSuspensionBridges() {
    const bridgeLocations = [
      { name: 'West Bridge (Primorsk - Sosnovka)', x: -800, zStart: 1100, zEnd: 1900 },
      { name: 'East Bridge (Mylta - Novorepnoye)', x: 1500, zStart: 1100, zEnd: 1900 }
    ];

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.3, metalness: 0.85 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.2, metalness: 0.95 });
    const deckMat = new THREE.MeshLambertMaterial({ map: this.asphaltTexture, color: 0x222226 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x8892b0, roughness: 0.2, metalness: 0.9 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x818a99, roughness: 0.8 });

    bridgeLocations.forEach(b => {
      const length = b.zEnd - b.zStart; // 800m sea crossing
      const midZ = (b.zStart + b.zEnd) / 2;
      const width = 24; // 4-lane wide bridge

      // 1. Asphalt Deck
      const deckGeo = new THREE.BoxGeometry(width, 2.5, length);
      const deckMesh = new THREE.Mesh(deckGeo, deckMat);
      deckMesh.position.set(b.x, 8.0, midZ);
      deckMesh.receiveShadow = true;
      this.scene.add(deckMesh);

      // Yellow Center Line & White Edge Lines
      const lineGeo = new THREE.PlaneGeometry(1.2, length);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(b.x, 9.3, midZ);
      this.scene.add(lineMesh);

      // 2. Concrete Underwater Caisson Piers
      [-220, 0, 220].forEach(oz => {
        const pierGeo = new THREE.BoxGeometry(width + 6, 22, 18);
        const pier = new THREE.Mesh(pierGeo, concreteMat);
        pier.position.set(b.x, -2, midZ + oz);
        this.scene.add(pier);
      });

      // 3. Two Towering Steel Suspension Pylons (42m High)
      [-180, 180].forEach(oz => {
        const towerZ = midZ + oz;
        [-width / 2 - 2, width / 2 + 2].forEach(ox => {
          const colGeo = new THREE.BoxGeometry(3.5, 48, 3.5);
          const col = new THREE.Mesh(colGeo, steelMat);
          col.position.set(b.x + ox, 28, towerZ);
          this.scene.add(col);
        });

        // Cross-beam over tower
        const crossGeo = new THREE.BoxGeometry(width + 8, 4, 3.5);
        const cross = new THREE.Mesh(crossGeo, steelMat);
        cross.position.set(b.x, 48, towerZ);
        this.scene.add(cross);

        // Tower warning light
        const redLight = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
        redLight.position.set(b.x, 51, towerZ);
        this.scene.add(redLight);
      });

      // 4. Suspension Main Steel Cables Arching Across
      [-width / 2 - 2, width / 2 + 2].forEach(ox => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(b.x + ox, 9.5, b.zStart),
          new THREE.Vector3(b.x + ox, 48, midZ - 180),
          new THREE.Vector3(b.x + ox, 14, midZ),
          new THREE.Vector3(b.x + ox, 48, midZ + 180),
          new THREE.Vector3(b.x + ox, 9.5, b.zEnd),
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.45, 8, false);
        const cableMesh = new THREE.Mesh(tubeGeo, cableMat);
        this.scene.add(cableMesh);
      });

      // 5. Steel Crash Guardrails on Left & Right
      [-width / 2 + 0.8, width / 2 - 0.8].forEach(ox => {
        const railGeo = new THREE.BoxGeometry(1.2, 1.8, length);
        const rail = new THREE.Mesh(railGeo, barrierMat);
        rail.position.set(b.x + ox, 10.1, midZ);
        this.scene.add(rail);

        // Add Solid Box Colliders along Bridge Edges (Prevents Falling into Sea!)
        this.colliders.push({
          type: 'box',
          minX: b.x + ox - 1.2,
          maxX: b.x + ox + 1.2,
          minZ: b.zStart,
          maxZ: b.zEnd,
          height: 15
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EXTENSIVE 8KM ROAD NETWORK CONNECTING TOWNS & BRIDGES
  // ═══════════════════════════════════════════════════════════════════════════
  createRoadNetwork() {
    const roadMat = new THREE.MeshLambertMaterial({ map: this.asphaltTexture, color: 0x28282e });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

    const buildRoadStrip = (x1, z1, x2, z2, width = 24) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;

      const roadGeo = new THREE.PlaneGeometry(width, length);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.position.set(midX, 0.52, midZ);
      roadMesh.rotation.y = angle;
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);
      this.roadMeshes.push(roadMesh);

      // Yellow Center Line
      const yLineGeo = new THREE.PlaneGeometry(1.2, length);
      yLineGeo.rotateX(-Math.PI / 2);
      const yLine = new THREE.Mesh(yLineGeo, yellowMat);
      yLine.position.set(midX, 0.56, midZ);
      yLine.rotation.y = angle;
      this.scene.add(yLine);

      // White Edge Lines
      [-width / 2 + 1.5, width / 2 - 1.5].forEach(ox => {
        const wLineGeo = new THREE.PlaneGeometry(0.8, length);
        wLineGeo.rotateX(-Math.PI / 2);
        const wLine = new THREE.Mesh(wLineGeo, whiteMat);
        const worldOx = ox * Math.cos(angle);
        const worldOz = -ox * Math.sin(angle);
        wLine.position.set(midX + worldOx, 0.56, midZ + worldOz);
        wLine.rotation.y = angle;
        this.scene.add(wLine);
      });
    };

    // ── A. Coastal Outer Ring Highway (Encircling 8km Island) ──
    const coastalPoints = [
      { x: -3200, z: -3200 }, // Zharki
      { x: 0, z: -3500 },     // Severny
      { x: 2800, z: -3200 },  // Stalber Coast
      { x: 3400, z: -1200 },  // Lipovka
      { x: 3200, z: 800 },    // Mylta Power
      { x: 1500, z: 1100 },   // East Bridge North Entrance
      { x: -800, z: 1100 },   // West Bridge North Entrance
      { x: -2800, z: 800 },   // Primorsk
      { x: -3400, z: -1200 }, // Georgopol Coast
      { x: -3200, z: -3200 }, // Back to Zharki
    ];
    for (let i = 0; i < coastalPoints.length - 1; i++) {
      buildRoadStrip(coastalPoints[i].x, coastalPoints[i].z, coastalPoints[i + 1].x, coastalPoints[i + 1].z, 26);
    }

    // ── B. Main North-South Central Expressway (Georgopol -> Rozhok -> Pochinki -> Bridges) ──
    buildRoadStrip(-2400, -1400, 400, -400, 24);   // Georgopol to Rozhok/School
    buildRoadStrip(400, -400, -400, 500, 24);     // Rozhok to Pochinki
    buildRoadStrip(-400, 500, -800, 1100, 24);    // Pochinki to West Bridge
    buildRoadStrip(-400, 500, 1500, 1100, 24);    // Pochinki to East Bridge

    // ── C. Main East-West Highway (Gatka -> Pochinki -> Farm -> Mylta) ──
    buildRoadStrip(-2000, 400, -400, 500, 24);    // Gatka to Pochinki
    buildRoadStrip(-400, 500, 1400, 600, 24);     // Pochinki to Farm
    buildRoadStrip(1400, 600, 3200, 800, 24);     // Farm to Mylta Power

    // ── D. Yasnaya Polyana Arterial Road ──
    buildRoadStrip(400, -400, 1800, -1400, 24);   // Rozhok to Yasnaya Polyana
    buildRoadStrip(1800, -1400, 3400, -1200, 24); // Yasnaya to Lipovka Coast
    buildRoadStrip(1800, -1400, 2800, -3200, 22); // Yasnaya to Stalber

    // ── E. Sosnovka Island Highway Network ──
    buildRoadStrip(-800, 1900, 0, 2300, 24);      // West Bridge to Military Base
    buildRoadStrip(1500, 1900, 0, 2300, 24);      // East Bridge to Military Base
    buildRoadStrip(0, 2300, 1600, 3200, 22);      // Military Base to Novorepnoye Port
    buildRoadStrip(1600, 3200, -1200, 3400, 22);  // Novorepnoye around South Coast
    buildRoadStrip(-1200, 3400, -800, 1900, 22);  // South Coast back to West Bridge

    // ── F. Pochinki Town Street Grid ──
    for (let ox = -600; ox <= -200; ox += 100) {
      buildRoadStrip(ox, 300, ox, 700, 16);
    }
    for (let oz = 350; oz <= 650; oz += 100) {
      buildRoadStrip(-650, oz, -150, oz, 16);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. THOUSANDS OF TREES, PLANTS, SHRUBS & HAY BALES
  // ═══════════════════════════════════════════════════════════════════════════
  createDenseVegetation() {
    const trunkPineMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.85 });
    const leavesPineMat = new THREE.MeshStandardMaterial({ color: 0x184218, roughness: 0.8 });
    const trunkBirchMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.6 });
    const leavesBirchMat = new THREE.MeshStandardMaterial({ color: 0x629c2a, roughness: 0.7 });
    const trunkOakMat = new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.9 });
    const leavesOakMat = new THREE.MeshStandardMaterial({ color: 0x2e7320, roughness: 0.75 });

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x3d7826, roughness: 0.8 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x605d58, roughness: 0.9 });
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xdfb15b, roughness: 0.9 });

    // Scots Pine Geometry
    const pineTrunkGeo = new THREE.CylinderGeometry(0.7, 1.1, 8, 7);
    const pineConeGeo1 = new THREE.ConeGeometry(7.5, 9, 7);
    const pineConeGeo2 = new THREE.ConeGeometry(6.0, 8, 7);
    const pineConeGeo3 = new THREE.ConeGeometry(4.2, 7, 7);

    // Birch Tree Geometry
    const birchTrunkGeo = new THREE.CylinderGeometry(0.45, 0.65, 12, 7);
    const birchCanopyGeo1 = new THREE.SphereGeometry(4.5, 7, 6);
    const birchCanopyGeo2 = new THREE.SphereGeometry(3.5, 7, 6);

    // Broad Oak Tree Geometry
    const oakTrunkGeo = new THREE.CylinderGeometry(1.2, 1.8, 7, 8);
    const oakCanopyGeo = new THREE.DodecahedronGeometry(8.5, 1);

    // Spawn 1,200 Trees across all biomes
    for (let i = 0; i < 1200; i++) {
      const rx = (Math.random() - 0.5) * 7200;
      const rz = (Math.random() - 0.5) * 7200;
      const ry = this.getHeightAt(rx, rz);

      if (ry < 0.5) continue;
      if (Math.abs(rx - (-400)) < 180 && Math.abs(rz - 500) < 180) continue;
      if (Math.abs(rx) < 250 && Math.abs(rz - 2800) < 300) continue;

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

    // 600 Roadside Shrubs & Bushes
    const bushGeo = new THREE.DodecahedronGeometry(2.5, 1);
    for (let i = 0; i < 600; i++) {
      const bx = (Math.random() - 0.5) * 6800;
      const bz = (Math.random() - 0.5) * 6800;
      const by = this.getHeightAt(bx, bz);
      if (by < 0.5) continue;

      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(bx, by + 1.2, bz);
      const bScale = 0.7 + Math.random() * 0.8;
      bush.scale.set(bScale * 1.5, bScale, bScale * 1.5);
      bush.castShadow = true;
      this.scene.add(bush);
    }

    // 80 Golden Straw Bales in Farmlands
    const hayGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.6, 12);
    hayGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 80; i++) {
      const hx = -1600 + Math.random() * 1400;
      const hz = 200 + Math.random() * 800;
      const hy = this.getHeightAt(hx, hz) + 1.8;

      const hay = new THREE.Mesh(hayGeo, hayMat);
      hay.position.set(hx, hy, hz);
      hay.rotation.y = Math.random() * Math.PI;
      hay.castShadow = true;
      this.scene.add(hay);

      this.colliders.push({
        type: 'circle',
        x: hx,
        z: hz,
        radius: 2.2,
        height: 3.6
      });
    }

    // 90 Natural Granite Rocks on Ridges & Stalber
    const rockGeo = new THREE.DodecahedronGeometry(5.0, 1);
    for (let i = 0; i < 90; i++) {
      const rx = 1600 + Math.random() * 1500;
      const rz = -3200 + Math.random() * 1400;
      const ry = this.getHeightAt(rx, rz);

      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, ry + 2.5, rz);
      const s = 1.0 + Math.random() * 2.2;
      rock.scale.set(s, s * 0.8, s);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);

      this.colliders.push({
        type: 'circle',
        x: rx,
        z: rz,
        radius: 4.5 * s,
        height: 6 * s
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. POCHINKI TOWN
  // ═══════════════════════════════════════════════════════════════════════════
  createPochinkiTown() {
    const cx = -400;
    const cz = 500;
    const brickMat1 = new THREE.MeshStandardMaterial({ color: 0x9b4a38, roughness: 0.7 });
    const brickMat2 = new THREE.MeshStandardMaterial({ color: 0xba6a48, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3d4852, roughness: 0.6 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.2, metalness: 0.9 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.8 });

    // 1. Pochinki Russian Orthodox Church with Golden Onion Dome
    const churchGroup = new THREE.Group();
    const nave = new THREE.Mesh(new THREE.BoxGeometry(26, 16, 42), whiteMat);
    nave.position.y = 8;
    churchGroup.add(nave);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(12, 34, 12), whiteMat);
    tower.position.set(0, 17, 18);
    churchGroup.add(tower);

    const domeGeo = new THREE.SphereGeometry(6, 16, 16);
    domeGeo.scale(1, 1.6, 1);
    const dome = new THREE.Mesh(domeGeo, goldMat);
    dome.position.set(0, 39, 18);
    churchGroup.add(dome);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), goldMat);
    crossV.position.set(0, 48, 18);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 0.6), goldMat);
    crossH.position.set(0, 49.5, 18);
    churchGroup.add(crossV);
    churchGroup.add(crossH);

    churchGroup.position.set(cx, 0.5, cz);
    churchGroup.castShadow = true;
    this.scene.add(churchGroup);

    this.colliders.push({
      type: 'box',
      minX: cx - 14,
      maxX: cx + 14,
      minZ: cz - 22,
      maxZ: cz + 26,
      height: 40
    });

    // 2. Residential Brick Houses
    const houseOffsets = [
      { x: -120, z: -80 }, { x: -120, z: 80 }, { x: 120, z: -80 }, { x: 120, z: 80 },
      { x: -220, z: -40 }, { x: -220, z: 60 }, { x: 220, z: -40 }, { x: 220, z: 60 },
      { x: -60, z: -160 }, { x: 60, z: -160 }, { x: -60, z: 160 }, { x: 60, z: 160 }
    ];

    houseOffsets.forEach((ho, idx) => {
      const hx = cx + ho.x;
      const hz = cz + ho.z;
      const w = 18;
      const d = 14;
      const h = 10;

      const houseGroup = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), (idx % 2 === 0) ? brickMat1 : brickMat2);
      body.position.y = h / 2;
      houseGroup.add(body);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 4.5, 4), roofMat);
      roof.position.y = h + 2.25;
      roof.rotation.y = Math.PI / 4;
      houseGroup.add(roof);

      houseGroup.position.set(hx, 0.5, hz);
      houseGroup.castShadow = true;
      this.scene.add(houseGroup);

      this.colliders.push({
        type: 'box',
        minX: hx - w / 2,
        maxX: hx + w / 2,
        minZ: hz - d / 2,
        maxZ: hz + d / 2,
        height: h + 5
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SOSNOVKA MILITARY BASE
  // ═══════════════════════════════════════════════════════════════════════════
  createSosnovkaMilitaryBase() {
    const mx = 0;
    const mz = 2800;
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x4c566a, roughness: 0.3, metalness: 0.85 });
    const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.6 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x7c828d, roughness: 0.75 });

    // Airfield Runway
    const runwayGeo = new THREE.PlaneGeometry(45, 1200);
    runwayGeo.rotateX(-Math.PI / 2);
    const runwayMesh = new THREE.Mesh(runwayGeo, new THREE.MeshLambertMaterial({ color: 0x333842 }));
    runwayMesh.position.set(mx, 0.55, mz);
    runwayMesh.receiveShadow = true;
    this.scene.add(runwayMesh);

    // Giant Radar Dish Antenna Tower
    const radarGroup = new THREE.Group();
    const towerPillar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4.5, 30, 8), steelMat);
    towerPillar.position.y = 15;
    radarGroup.add(towerPillar);

    const dishMesh = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), steelMat);
    dishMesh.position.set(0, 32, 0);
    dishMesh.rotation.x = Math.PI / 3;
    radarGroup.add(dishMesh);

    const hornMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 6), steelMat);
    hornMesh.position.set(0, 35, 6);
    radarGroup.add(hornMesh);

    radarGroup.position.set(mx + 120, 0.5, mz - 200);
    radarGroup.castShadow = true;
    this.scene.add(radarGroup);

    this.colliders.push({
      type: 'circle',
      x: mx + 120,
      z: mz - 200,
      radius: 6,
      height: 38
    });

    // 3 Large Aircraft Hangars
    [-180, 0, 180].forEach(ox => {
      const hangarGeo = new THREE.CylinderGeometry(18, 18, 55, 16, 1, false, 0, Math.PI);
      hangarGeo.rotateZ(Math.PI / 2);
      const hangar = new THREE.Mesh(hangarGeo, oliveMat);
      hangar.position.set(mx + ox, 0.5, mz + 150);
      hangar.castShadow = true;
      this.scene.add(hangar);

      this.colliders.push({
        type: 'box',
        minX: mx + ox - 28,
        maxX: mx + ox + 28,
        minZ: mz + 150 - 18,
        maxZ: mz + 150 + 18,
        height: 18
      });
    });

    // Barracks
    [-120, 120].forEach(ox => {
      const barrack = new THREE.Mesh(new THREE.BoxGeometry(45, 8, 18), concreteMat);
      barrack.position.set(mx + ox, 4.5, mz - 120);
      barrack.castShadow = true;
      this.scene.add(barrack);

      this.colliders.push({
        type: 'box',
        minX: mx + ox - 23,
        maxX: mx + ox + 23,
        minZ: mz - 120 - 10,
        maxZ: mz - 120 + 10,
        height: 8
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. GEORGOPOL SHIPPING CONTAINER PORT
  // ═══════════════════════════════════════════════════════════════════════════
  createGeorgopolPort() {
    const gx = -2400;
    const gz = -1400;

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
          const mat = containerColors[(row + col + h + 10) % containerColors.length];
          const container = new THREE.Mesh(cGeo, mat);
          const px = gx + col * 9 + 80;
          const pz = gz + row * 18 - 80;
          container.position.set(px, 3 + h * 6, pz);
          container.castShadow = true;
          this.scene.add(container);

          if (h === 0) {
            this.colliders.push({
              type: 'box',
              minX: px - 3.2,
              maxX: px + 3.2,
              minZ: pz - 7.2,
              maxZ: pz + 7.2,
              height: stackHeight * 6
            });
          }
        }
      }
    }

    // Warehouses
    const whMat = new THREE.MeshStandardMaterial({ color: 0x556070, roughness: 0.65 });
    [-120, 120].forEach(oz => {
      const wh = new THREE.Mesh(new THREE.BoxGeometry(45, 14, 28), whMat);
      wh.position.set(gx - 80, 7.5, gz + oz);
      wh.castShadow = true;
      this.scene.add(wh);

      this.colliders.push({
        type: 'box',
        minX: gx - 80 - 23,
        maxX: gx - 80 + 23,
        minZ: gz + oz - 15,
        maxZ: gz + oz + 15,
        height: 14
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. MYLTA POWER PLANT
  // ═══════════════════════════════════════════════════════════════════════════
  createMyltaPowerPlant() {
    const px = 3200;
    const pz = 800;
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x8a929e, roughness: 0.8 });

    // Hyperboloid Nuclear Cooling Tower (50m High, 38m Diameter)
    const towerGeo = new THREE.CylinderGeometry(14, 22, 50, 24, 1, true);
    const tower = new THREE.Mesh(towerGeo, concreteMat);
    tower.position.set(px, 25, pz);
    tower.castShadow = true;
    this.scene.add(tower);

    this.colliders.push({
      type: 'circle',
      x: px,
      z: pz,
      radius: 22,
      height: 50
    });

    // Reactor Building
    const reactor = new THREE.Mesh(new THREE.BoxGeometry(50, 18, 38), concreteMat);
    reactor.position.set(px - 60, 9, pz);
    reactor.castShadow = true;
    this.scene.add(reactor);

    this.colliders.push({
      type: 'box',
      minX: px - 60 - 26,
      maxX: px - 60 + 26,
      minZ: pz - 20,
      maxZ: pz + 20,
      height: 18
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. SCHOOL & ROZHOK
  // ═══════════════════════════════════════════════════════════════════════════
  createSchoolAndRozhok() {
    const sx = 400;
    const sz = -400;
    const schoolMat = new THREE.MeshStandardMaterial({ color: 0xd5c4a1, roughness: 0.7 });

    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(60, 12, 24), schoolMat);
    mainWing.position.set(sx, 6.5, sz);
    this.scene.add(mainWing);

    const gymWing = new THREE.Mesh(new THREE.BoxGeometry(32, 16, 28), schoolMat);
    gymWing.position.set(sx + 45, 8.5, sz + 20);
    this.scene.add(gymWing);

    this.colliders.push({
      type: 'box',
      minX: sx - 32,
      maxX: sx + 62,
      minZ: sz - 14,
      maxZ: sz + 36,
      height: 16
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. YASNAYA POLYANA
  // ═══════════════════════════════════════════════════════════════════════════
  createYasnayaPolyana() {
    const yx = 1800;
    const yz = -1400;
    const aptMat = new THREE.MeshStandardMaterial({
      map: this.buildingTextures[1],
      roughness: 0.5
    });

    [-120, 0, 120].forEach(ox => {
      [-80, 80].forEach(oz => {
        const apt = new THREE.Mesh(new THREE.BoxGeometry(28, 28, 20), aptMat);
        apt.position.set(yx + ox, 14.5, yz + oz);
        apt.castShadow = true;
        this.scene.add(apt);

        this.colliders.push({
          type: 'box',
          minX: yx + ox - 15,
          maxX: yx + ox + 15,
          minZ: yz + oz - 11,
          maxZ: yz + oz + 11,
          height: 28
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. HIGH-VOLTAGE POWER TRANSMISSION PYLONS
  // ═══════════════════════════════════════════════════════════════════════════
  createTransmissionPylons() {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.8 });

    for (let step = -4; step <= 4; step++) {
      const px = step * 650;
      const pz = -200 + step * 250;
      const py = this.getHeightAt(px, pz);

      const pylonGroup = new THREE.Group();
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3.5, 36, 4), steelMat);
      mast.position.y = 18;
      pylonGroup.add(mast);

      const arm1 = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 1.2), steelMat);
      arm1.position.y = 30;
      const arm2 = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 1.2), steelMat);
      arm2.position.y = 34;
      pylonGroup.add(arm1);
      pylonGroup.add(arm2);

      pylonGroup.position.set(px, py, pz);
      pylonGroup.castShadow = true;
      this.scene.add(pylonGroup);

      this.colliders.push({
        type: 'circle',
        x: px,
        z: pz,
        radius: 3.5,
        height: 36
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. ROADSIDE SIGNAGE & SPEED MONITORING
  // ═══════════════════════════════════════════════════════════════════════════
  createRoadsideDetails() {
    const signLocations = [
      { x: -400, z: 320, text: 'POCHINKI CENTER' },
      { x: -750, z: 1050, text: 'SOSNOVKA WEST BRIDGE' },
      { x: 1450, z: 1050, text: 'SOSNOVKA EAST BRIDGE' },
      { x: 0, z: 2200, text: 'MILITARY BASE RUNWAY' },
      { x: -2300, z: -1300, text: 'GEORGOPOL CONTAINER PORT' },
      { x: 3100, z: 700, text: 'MYLTA POWER STATION' },
      { x: 1700, z: -1300, text: 'YASNAYA POLYANA' }
    ];

    signLocations.forEach(sl => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 8), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      pole.position.set(sl.x, 3.5, sl.z);
      this.scene.add(pole);

      const board = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x1e5a2b }));
      board.position.set(sl.x, 6.2, sl.z);
      this.scene.add(board);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. SPATIAL GRID FOR FAST HIGH-PERFORMANCE COLLISION DETECTION
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
          if (!this.grid.has(key)) {
            this.grid.set(key, []);
          }
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
              return {
                normalX: diffX / dist,
                normalZ: diffZ / dist,
                overlap: vehicleRadius - dist
              };
            }
          } else if (col.type === 'circle') {
            const diffX = posX - col.x;
            const diffZ = posZ - col.z;
            const minDist = col.radius + vehicleRadius;
            const distSq = diffX * diffX + diffZ * diffZ;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq) || 0.001;
              return {
                normalX: diffX / dist,
                normalZ: diffZ / dist,
                overlap: minDist - dist
              };
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
    const wave = Math.sin(this.waterTime * 0.9) * 0.08;
    this.oceanMesh.position.y = wave;
  }
}
