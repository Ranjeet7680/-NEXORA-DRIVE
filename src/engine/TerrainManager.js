import * as THREE from 'three';
import { BIOMES } from '../config.js';
import { TextureGenerator } from './TextureGenerator.js';

export class TerrainManager {
  constructor(scene) {
    this.scene = scene;
    this.size = 2400; // 2400x2400 world map
    this.segments = 160;
    this.terrainMesh = null;
    this.roadMeshes = [];
    this.buildings = [];
    this.trees = [];
    this.checkpoints = [];
    this.busStops = [];
    this.waterMesh = null;
    this.waterTime = 0;

    // ── Physical Obstacle Colliders ──
    // Every obstacle has { type: 'box'|'circle', x, z, width, depth, minX, maxX, minZ, maxZ, radius, height }
    this.colliders = [];

    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));

    // Procedural Textures
    this.asphaltTexture = TextureGenerator.createAsphaltTexture();
    this.buildingTextures = [
      TextureGenerator.createBuildingFacadeTexture(0),
      TextureGenerator.createBuildingFacadeTexture(1),
      TextureGenerator.createBuildingFacadeTexture(2),
      TextureGenerator.createBuildingFacadeTexture(3)
    ];
    this.sidewalkTexture = TextureGenerator.createSidewalkTexture();
  }

  generateWorld() {
    this.createTerrainGeometry();
    this.createRoadNetwork();
    this.createWaterBody();
    this.createCityBuildings();
    this.createCityDetails();
    this.createForestVegetation();
    this.createMountainElements();
    this.createIceElements();
    this.createStreetLightsAndSigns();
    this.createBillboards();
    this.createFuelStations();
  }

  // Multi-frequency elevation noise for 5 biomes
  getHeightAt(x, z) {
    const half = this.size * 0.5;
    const nx = x / half;
    const nz = z / half;

    // Flatten central hub & ring highway road circuit (Radius 565)
    const distFromOrigin = Math.sqrt(x * x + z * z);
    if (distFromOrigin < 290) return 0;

    // North-East: Alpine Mountains (High steep peaks)
    if (nx > 0.1 && nz < -0.1) {
      const hill1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 80;
      const hill2 = Math.sin(x * 0.035 + z * 0.035) * 45;
      const hill3 = Math.cos(x * 0.06) * 20;
      const detail = Math.sin(x * 0.12 + z * 0.09) * 8;
      return Math.max(0, hill1 + hill2 + hill3 + detail);
    }

    // South-East: Ice Hills & Glaciers (Rolling snow mountains)
    if (nx > 0.1 && nz > 0.1) {
      const hill = Math.sin(x * 0.012) * Math.sin(z * 0.012) * 60;
      const peak = Math.cos(x * 0.025 + z * 0.025) * 28;
      const detail = Math.sin(x * 0.08 + z * 0.06) * 6;
      return Math.max(0, hill + peak + detail);
    }

    // North-West: Forest Valley (Gentle rolling hills)
    if (nx < -0.1 && nz < -0.1) {
      const roll = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 22;
      const detail = Math.sin(x * 0.06 + z * 0.04) * 5;
      return Math.max(0, roll + detail);
    }

    // South-West: River & Beach Basin
    if (nx < -0.1 && nz > 0.1) {
      const basin = -14 + Math.sin(x * 0.012) * 6;
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

    const colorCity    = new THREE.Color(0x383e47);  // Dark asphalt city
    const colorForest  = new THREE.Color(0x245a24);  // Rich forest green
    const colorMountain= new THREE.Color(0x6a6054);  // Rocky mountain grey
    const colorRiver   = new THREE.Color(0xd4b585);  // Sandy beach
    const colorIce     = new THREE.Color(0xe8f4ff);  // Snow white-blue
    const colorGrass   = new THREE.Color(0x3e6c35);  // Grass green

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
      if (biome === BIOMES.FOREST) {
        if (height > 15) c = colorMountain.clone().lerp(colorForest, 0.5);
        else c = colorGrass.clone().lerp(colorForest, 0.7);
      } else if (biome === BIOMES.MOUNTAINS) {
        if (height > 60) c = new THREE.Color(0xfafafa);
        else if (height > 30) c = new THREE.Color(0x9a8c7e);
        else c = colorMountain;
      } else if (biome === BIOMES.RIVER) {
        c = colorRiver;
      } else if (biome === BIOMES.ICE) {
        if (height > 40) c = new THREE.Color(0xffffff);
        else if (height > 20) c = new THREE.Color(0xd0eeff);
        else c = colorIce;
      }

      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createRoadNetwork() {
    // High-Detail Asphalt with Map Texture
    const asphaltMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTexture,
      roughness: 0.55,
      metalness: 0.15
    });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x7799bb, roughness: 0.25, metalness: 0.9 });

    // 1. Main Outer Ring Highway (Radius 565, Width 36)
    const ringGeo = new THREE.RingGeometry(546, 584, 160);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, asphaltMat);
    ringMesh.position.y = 0.22;
    ringMesh.receiveShadow = true;
    this.scene.add(ringMesh);

    // Double Yellow Center Line
    const yellowLineGeo = new THREE.RingGeometry(563, 565.5, 160);
    yellowLineGeo.rotateX(-Math.PI / 2);
    const ylMesh = new THREE.Mesh(yellowLineGeo, yellowLineMat);
    ylMesh.position.y = 0.25;
    this.scene.add(ylMesh);

    // White Edge Lines (inner & outer)
    [549, 581].forEach(r => {
      const wGeo = new THREE.RingGeometry(r, r + 1.5, 160);
      wGeo.rotateX(-Math.PI / 2);
      const wMesh = new THREE.Mesh(wGeo, whiteLineMat);
      wMesh.position.y = 0.25;
      this.scene.add(wMesh);
    });

    // Lane divider dashes — dotted white line on outer lane
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 48) {
      const r = 572;
      const dx = Math.sin(angle) * r;
      const dz = Math.cos(angle) * r;
      const dashGeo = new THREE.PlaneGeometry(1.2, 12);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, whiteLineMat);
      dash.position.set(dx, 0.26, dz);
      dash.rotation.y = angle;
      this.scene.add(dash);
    }

    // Metallic Guardrails outer edge + Collision bounding boxes
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
      const gx = Math.sin(angle) * 588;
      const gz = Math.cos(angle) * 588;
      const railGeo = new THREE.BoxGeometry(14, 1.4, 0.5);
      const rail = new THREE.Mesh(railGeo, guardrailMat);
      rail.position.set(gx, 0.9, gz);
      rail.rotation.y = angle + Math.PI / 2;
      rail.castShadow = true;
      this.scene.add(rail);

      const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 6);
      const post = new THREE.Mesh(postGeo, guardrailMat);
      post.position.set(gx, 1.0, gz);
      this.scene.add(post);

      // Register guardrail collider
      this.colliders.push({
        type: 'circle',
        x: gx,
        z: gz,
        radius: 3.5,
        height: 2.0
      });
    }

    // Inner guardrails + Collision
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
      const gx = Math.sin(angle) * 543;
      const gz = Math.cos(angle) * 543;
      const railGeo = new THREE.BoxGeometry(14, 1.4, 0.5);
      const rail = new THREE.Mesh(railGeo, guardrailMat);
      rail.position.set(gx, 0.9, gz);
      rail.rotation.y = angle + Math.PI / 2;
      this.scene.add(rail);

      this.colliders.push({
        type: 'circle',
        x: gx,
        z: gz,
        radius: 3.5,
        height: 2.0
      });
    }

    // 2. City Grid Asphalt Roads
    const cityRoadWidth = 24;
    for (let x = -400; x <= 400; x += 120) {
      const roadGeo = new THREE.PlaneGeometry(cityRoadWidth, 800);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(x, 0.23, 0);
      road.receiveShadow = true;
      this.scene.add(road);

      const ylGeo = new THREE.PlaneGeometry(1.2, 800);
      ylGeo.rotateX(-Math.PI / 2);
      const yl = new THREE.Mesh(ylGeo, yellowLineMat);
      yl.position.set(x, 0.26, 0);
      this.scene.add(yl);
    }
    for (let z = -400; z <= 400; z += 120) {
      const roadGeo = new THREE.PlaneGeometry(800, cityRoadWidth);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(0, 0.23, z);
      road.receiveShadow = true;
      this.scene.add(road);

      const ylGeo = new THREE.PlaneGeometry(800, 1.2);
      ylGeo.rotateX(-Math.PI / 2);
      const yl = new THREE.Mesh(ylGeo, yellowLineMat);
      yl.position.set(0, 0.26, z);
      this.scene.add(yl);
    }

    // Crosswalk stripes at intersections
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
    [[-120, -120], [0, -120], [120, -120], [-120, 0], [120, 0], [-120, 120], [0, 120], [120, 120]].forEach(([cx, cz]) => {
      for (let i = -3; i <= 3; i++) {
        const cwGeo = new THREE.PlaneGeometry(cityRoadWidth, 2.5);
        cwGeo.rotateX(-Math.PI / 2);
        const cw = new THREE.Mesh(cwGeo, crosswalkMat);
        cw.position.set(cx, 0.28, cz + i * 4);
        this.scene.add(cw);
      }
    });

    // 3. Mountain Winding Road
    const mountainRoadGeo = new THREE.PlaneGeometry(28, 800);
    mountainRoadGeo.rotateX(-Math.PI / 2);
    mountainRoadGeo.rotateY(Math.PI / 4);
    const mountainRoad = new THREE.Mesh(mountainRoadGeo, asphaltMat);
    mountainRoad.position.set(450, 0.28, -450);
    mountainRoad.receiveShadow = true;
    this.scene.add(mountainRoad);

    // 4. Ice Mountain Road
    const iceRoadMat = new THREE.MeshStandardMaterial({ color: 0x99ddff, roughness: 0.08, metalness: 0.6 });
    const iceRoadGeo = new THREE.PlaneGeometry(28, 800);
    iceRoadGeo.rotateX(-Math.PI / 2);
    iceRoadGeo.rotateY(-Math.PI / 4);
    const iceRoad = new THREE.Mesh(iceRoadGeo, iceRoadMat);
    iceRoad.position.set(450, 0.28, 450);
    iceRoad.receiveShadow = true;
    this.scene.add(iceRoad);

    // 5. Forest Dirt Road
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5c3e2a, roughness: 0.95 });
    const dirtGeo = new THREE.PlaneGeometry(22, 750);
    dirtGeo.rotateX(-Math.PI / 2);
    dirtGeo.rotateY(-Math.PI / 3);
    const dirtRoad = new THREE.Mesh(dirtGeo, dirtMat);
    dirtRoad.position.set(-450, 0.28, -450);
    dirtRoad.receiveShadow = true;
    this.scene.add(dirtRoad);
  }

  createWaterBody() {
    const waterGeo = new THREE.PlaneGeometry(950, 950, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x006bb3,
      roughness: 0.0,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(-450, -0.5, 450);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // Wooden Bridge
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x7a5030, roughness: 0.85 });
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.9 });
    const bridgeGeo = new THREE.BoxGeometry(36, 5, 200);
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(-450, 2.5, 300);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.scene.add(bridge);

    // Bridge Railing Colliders (so vehicle cannot fall off bridge sides)
    this.colliders.push({
      type: 'box',
      minX: -450 - 20,
      maxX: -450 - 16,
      minZ: 300 - 100,
      maxZ: 300 + 100,
      height: 10
    });
    this.colliders.push({
      type: 'box',
      minX: -450 + 16,
      maxX: -450 + 20,
      minZ: 300 - 100,
      maxZ: 300 + 100,
      height: 10
    });
  }

  createCityBuildings() {
    // Procedural Textured Building Materials
    const buildingMaterials = this.buildingTextures.map(tex => new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.3,
      metalness: 0.5
    }));

    const neonMat  = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.2 });
    const neonMatR = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 1.0 });

    // City grid: place buildings in 4 quadrants
    const gridOffsets = [
      { xMin: -420, xMax: -40, zMin: -420, zMax: -40 },
      { xMin:  40,  xMax:  420, zMin: -420, zMax: -40 },
      { xMin: -420, xMax: -40, zMin:  40,  zMax:  420 },
      { xMin:  40,  xMax:  420, zMin:  40,  zMax:  420 },
    ];

    gridOffsets.forEach(quad => {
      for (let x = quad.xMin; x <= quad.xMax; x += 90) {
        for (let z = quad.zMin; z <= quad.zMax; z += 90) {
          if (Math.abs(x % 120) < 18 || Math.abs(z % 120) < 18) continue;
          if (Math.sqrt(x*x + z*z) > 500) continue;

          const height = 30 + Math.random() * 120;
          const width  = 30 + Math.random() * 18;
          const depth  = 30 + Math.random() * 18;

          const geo = new THREE.BoxGeometry(width, height, depth);
          const mat = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
          const bMesh = new THREE.Mesh(geo, mat);
          bMesh.position.set(x, height * 0.5, z);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          this.scene.add(bMesh);
          this.buildings.push(bMesh);

          // ── PHYSICAL COLLIDER for this building (AABB Box) ──
          // Block ke aar ya paar nahi hoga!
          this.colliders.push({
            type: 'box',
            minX: x - width * 0.5,
            maxX: x + width * 0.5,
            minZ: z - depth * 0.5,
            maxZ: z + depth * 0.5,
            height: height
          });

          // Neon signs
          if (Math.random() < 0.3) {
            const signMat = Math.random() < 0.5 ? neonMat : neonMatR;
            const signGeo = new THREE.BoxGeometry(width * 0.6, 3.5, 0.5);
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(x, height + 2, z + depth * 0.5 + 0.5);
            this.scene.add(sign);
          }
        }
      }
    });

    // Tall Landmark Skyscrapers
    const landmarks = [
      { x: -200, z: -200, h: 200, w: 38, d: 38, mat: buildingMaterials[0] },
      { x:  200, z: -200, h: 175, w: 34, d: 52, mat: buildingMaterials[1] },
      { x: -200, z:  200, h: 190, w: 42, d: 34, mat: buildingMaterials[2] },
      { x:  200, z:  200, h: 180, w: 38, d: 38, mat: buildingMaterials[3] },
      { x:    0, z: -300, h: 220, w: 45, d: 45, mat: buildingMaterials[0] },
    ];
    landmarks.forEach(l => {
      const geo = new THREE.BoxGeometry(l.w, l.h, l.d);
      const mesh = new THREE.Mesh(geo, l.mat);
      mesh.position.set(l.x, l.h * 0.5, l.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.buildings.push(mesh);

      // Register Landmark Collider
      this.colliders.push({
        type: 'box',
        minX: l.x - l.w * 0.5,
        maxX: l.x + l.w * 0.5,
        minZ: l.z - l.d * 0.5,
        maxZ: l.z + l.d * 0.5,
        height: l.h
      });

      if (l.h >= 200) {
        const antGeo = new THREE.CylinderGeometry(0.5, 0.5, 40, 6);
        const antMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9 });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(l.x, l.h + 20, l.z);
        this.scene.add(ant);

        const lightGeo = new THREE.SphereGeometry(1.5, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(l.x, l.h + 42, l.z);
        this.scene.add(light);
      }
    });
  }

  createCityDetails() {
    // Textured Sidewalks
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.sidewalkTexture,
      roughness: 0.75
    });
    for (let x = -400; x <= 400; x += 120) {
      [-14, 14].forEach(offset => {
        const swGeo = new THREE.BoxGeometry(6, 0.3, 800);
        const sw = new THREE.Mesh(swGeo, sidewalkMat);
        sw.position.set(x + offset, 0.3, 0);
        this.scene.add(sw);
      });
    }

    // Traffic Signal Poles + Colliders
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
    const redMat  = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2.0 });
    const greenMat= new THREE.MeshStandardMaterial({ color: 0x00ee44, emissive: 0x00ee44, emissiveIntensity: 2.0 });

    [[-120, -120], [0, -120], [120, -120], [-120, 0], [120, 0], [-120, 120], [0, 120], [120, 120]].forEach(([ix, iz]) => {
      const poleGeo = new THREE.CylinderGeometry(0.35, 0.35, 11, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(ix + 16, 5.5, iz + 16);
      this.scene.add(pole);

      const boxGeo = new THREE.BoxGeometry(2.5, 6, 2.5);
      const box = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x111122 }));
      box.position.set(ix + 16, 11.5, iz + 16);
      this.scene.add(box);

      const rLight = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), redMat);
      rLight.position.set(ix + 17.3, 13, iz + 16);
      this.scene.add(rLight);

      const gLight = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), greenMat);
      gLight.position.set(ix + 17.3, 10, iz + 16);
      this.scene.add(gLight);

      // Register Traffic Pole Collider
      this.colliders.push({
        type: 'circle',
        x: ix + 16,
        z: iz + 16,
        radius: 1.2,
        height: 11
      });
    });
  }

  createForestVegetation() {
    const trunkMat1  = new THREE.MeshStandardMaterial({ color: 0x5c3010 });
    const trunkMat2  = new THREE.MeshStandardMaterial({ color: 0x4a2e1b });
    const pineLeaves = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.8 });
    const oakLeaves  = new THREE.MeshStandardMaterial({ color: 0x2d6e2d, roughness: 0.7 });

    const pTrunkGeo = new THREE.CylinderGeometry(0.7, 1.1, 7, 8);
    const pLeavesGeo= new THREE.ConeGeometry(7, 18, 8);

    for (let i = 0; i < 250; i++) {
      const x = -180 - Math.random() * 620;
      const z = -180 - Math.random() * 620;
      const y = this.getHeightAt(x, z);
      if (y < 0) continue;

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(pTrunkGeo, trunkMat1);
      trunk.position.y = 3.5;
      const leaves = new THREE.Mesh(pLeavesGeo, pineLeaves);
      leaves.position.y = 14;
      treeGroup.add(trunk);
      treeGroup.add(leaves);

      const scale = 0.7 + Math.random() * 0.8;
      treeGroup.scale.set(scale, scale, scale);
      treeGroup.position.set(x, y, z);
      treeGroup.castShadow = true;
      this.scene.add(treeGroup);
      this.trees.push(treeGroup);

      // Register Tree Trunk Collider
      this.colliders.push({
        type: 'circle',
        x: x,
        z: z,
        radius: 1.2 * scale,
        height: 15 * scale
      });
    }
  }

  createMountainElements() {
    const rockMats = [
      new THREE.MeshStandardMaterial({ color: 0x6b6056, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x8a7e72, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.95 }),
    ];

    for (let i = 0; i < 60; i++) {
      const x = 180 + Math.random() * 620;
      const z = -180 - Math.random() * 620;
      const y = this.getHeightAt(x, z);

      const scale = 4 + Math.random() * 12;
      const rGeo = new THREE.DodecahedronGeometry(scale, 1);
      const rock = new THREE.Mesh(rGeo, rockMats[Math.floor(Math.random() * rockMats.length)]);
      rock.position.set(x, y + scale * 0.5, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);

      // Register Rock Collider
      this.colliders.push({
        type: 'circle',
        x: x,
        z: z,
        radius: scale * 0.9,
        height: scale
      });
    }

    // Tunnel Arch Collider
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2f, roughness: 0.95 });
    const tunnelGeo = new THREE.BoxGeometry(48, 32, 80);
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(450, 16, -300);
    this.scene.add(tunnel);

    this.colliders.push({
      type: 'box',
      minX: 450 - 24,
      maxX: 450 - 15,
      minZ: -300 - 40,
      maxZ: -300 + 40,
      height: 32
    });
    this.colliders.push({
      type: 'box',
      minX: 450 + 15,
      maxX: 450 + 24,
      minZ: -300 - 40,
      maxZ: -300 + 40,
      height: 32
    });
  }

  createIceElements() {
    const glacierMat = new THREE.MeshStandardMaterial({ color: 0x99ccff, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.9 });

    for (let i = 0; i < 20; i++) {
      const gx = 250 + Math.random() * 550;
      const gz = 250 + Math.random() * 550;
      const gy = this.getHeightAt(gx, gz);

      const h = 40 + Math.random() * 50;
      const gGeo = new THREE.ConeGeometry(18 + Math.random() * 22, h, 6);
      const glacier = new THREE.Mesh(gGeo, glacierMat);
      glacier.position.set(gx, gy + h * 0.5, gz);
      glacier.castShadow = true;
      this.scene.add(glacier);

      // Register Glacier Collider
      this.colliders.push({
        type: 'circle',
        x: gx,
        z: gz,
        radius: 16,
        height: h
      });
    }
  }

  createStreetLightsAndSigns() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.5 });
    const armMat  = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.7 });

    const poleGeo = new THREE.CylinderGeometry(0.22, 0.26, 10, 8);
    const lampGeo = new THREE.SphereGeometry(1.0, 12, 8);
    const armGeo  = new THREE.CylinderGeometry(0.1, 0.1, 3, 6);

    for (let x = -400; x <= 400; x += 120) {
      for (let z = -380; z <= 380; z += 40) {
        [-16, 16].forEach(ox => {
          const lg = new THREE.Group();
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.y = 5;
          const arm = new THREE.Mesh(armGeo, armMat);
          arm.rotation.z = -Math.PI / 4;
          arm.position.set(ox > 0 ? -1.5 : 1.5, 10.5, 0);
          const lamp = new THREE.Mesh(lampGeo, lampMat);
          lamp.position.set(ox > 0 ? -3 : 3, 10.8, 0);

          // Real PointLight on Streetlamps for Night illumination
          const pLight = new THREE.PointLight(0xfffaed, 1.2, 35, 1.5);
          pLight.position.set(ox > 0 ? -3 : 3, 10.5, 0);
          lg.add(pLight);

          lg.add(pole); lg.add(arm); lg.add(lamp);
          lg.position.set(x + ox, 0, z);
          this.scene.add(lg);

          // Register Light Pole Collider
          this.colliders.push({
            type: 'circle',
            x: x + ox,
            z: z,
            radius: 0.8,
            height: 10
          });
        });
      }
    }
  }

  createBillboards() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.5 });
    const adMats = [
      new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x33aaff, emissive: 0x0088ff, emissiveIntensity: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x22cc44, emissive: 0x00aa22, emissiveIntensity: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.6 }),
    ];

    const billboardPositions = [
      {x: 0, z: -530, ry: 0},
      {x: 530, z: 0, ry: Math.PI/2},
      {x: 0, z: 530, ry: Math.PI},
      {x: -530, z: 0, ry: -Math.PI/2},
    ];

    billboardPositions.forEach((bp, idx) => {
      const height = 18;
      const postGeo = new THREE.CylinderGeometry(0.7, 0.7, height, 8);
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(bp.x, height/2, bp.z);
      this.scene.add(post);

      const panelGeo = new THREE.BoxGeometry(22, 11, 0.8);
      const panel = new THREE.Mesh(panelGeo, adMats[idx % adMats.length]);
      panel.position.set(bp.x, height + 5, bp.z);
      panel.rotation.y = bp.ry;
      panel.castShadow = true;
      this.scene.add(panel);

      // Register Billboard Post Collider
      this.colliders.push({
        type: 'circle',
        x: bp.x,
        z: bp.z,
        radius: 1.5,
        height: height
      });
    });
  }

  createFuelStations() {
    const stationMat  = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
    const canopyMat   = new THREE.MeshStandardMaterial({ color: 0x2244ff, roughness: 0.3 });
    const pumpMat     = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });

    const fuelPositions = [
      {x: 0, z: -100},
      {x: 0, z:  100},
      {x: -480, z: -480},
      {x: 480, z: -480},
    ];

    fuelPositions.forEach(fp => {
      const canopyGeo = new THREE.BoxGeometry(50, 2, 30);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(fp.x, 8, fp.z);
      this.scene.add(canopy);

      [-22, 22].forEach(cx => {
        const colGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        const col = new THREE.Mesh(colGeo, stationMat);
        col.position.set(fp.x + cx, 4, fp.z);
        this.scene.add(col);

        // Column Colliders
        this.colliders.push({
          type: 'circle',
          x: fp.x + cx,
          z: fp.z,
          radius: 1.4,
          height: 8
        });
      });

      [-8, 0, 8].forEach(px => {
        const pumpGeo = new THREE.BoxGeometry(1.8, 5, 1.8);
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(fp.x + px, 2.5, fp.z);
        pump.castShadow = true;
        this.scene.add(pump);

        // Pump Colliders
        this.colliders.push({
          type: 'circle',
          x: fp.x + px,
          z: fp.z,
          radius: 1.5,
          height: 5
        });
      });
    });
  }

  // Fast Collision Detection Helper ("Aar ya paar nahi ho sakta")
  checkCollision(posX, posZ, vehicleRadius = 1.6) {
    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];

      if (col.type === 'box') {
        // Nearest point on AABB box to circle center
        const closestX = Math.max(col.minX, Math.min(posX, col.maxX));
        const closestZ = Math.max(col.minZ, Math.min(posZ, col.maxZ));

        const dx = posX - closestX;
        const dz = posZ - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < vehicleRadius * vehicleRadius) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = vehicleRadius - dist;
          const normalX = distSq > 0.0001 ? (dx / dist) : 1;
          const normalZ = distSq > 0.0001 ? (dz / dist) : 0;
          return {
            collided: true,
            overlap: overlap,
            normalX: normalX,
            normalZ: normalZ,
            collider: col
          };
        }
      } else if (col.type === 'circle') {
        const dx = posX - col.x;
        const dz = posZ - col.z;
        const minDist = col.radius + vehicleRadius;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          return {
            collided: true,
            overlap: overlap,
            normalX: dx / dist,
            normalZ: dz / dist,
            collider: col
          };
        }
      }
    }

    return null;
  }

  updateWater(deltaTime) {
    if (!this.waterMesh) return;
    this.waterTime += deltaTime;
    const wColor = new THREE.Color();
    wColor.setHSL(0.58, 0.9, 0.35 + Math.sin(this.waterTime * 0.8) * 0.04);
    this.waterMesh.material.color.lerp(wColor, 0.05);
  }
}
