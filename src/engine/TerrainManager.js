import * as THREE from 'three';
import { BIOMES } from '../config.js';

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

    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));
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

    const colorCity    = new THREE.Color(0x48515c);  // Dark asphalt city
    const colorForest  = new THREE.Color(0x2a6b2a);  // Rich forest green
    const colorMountain= new THREE.Color(0x7a6e60);  // Rocky mountain grey
    const colorRiver   = new THREE.Color(0xd4b585);  // Sandy beach
    const colorIce     = new THREE.Color(0xe8f4ff);  // Snow white-blue
    const colorGrass   = new THREE.Color(0x4a7c3f);  // Grass green

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
        // Height-based: dark soil at bottom, grass mid, rock at top
        if (height > 15) c = colorMountain.clone().lerp(colorForest, 0.5);
        else c = colorGrass.clone().lerp(colorForest, 0.7);
      } else if (biome === BIOMES.MOUNTAINS) {
        // Rock with snow caps
        if (height > 60) c = new THREE.Color(0xfafafa); // Snow cap
        else if (height > 30) c = new THREE.Color(0x9a8c7e); // High rock
        else c = colorMountain;
      } else if (biome === BIOMES.RIVER) {
        c = colorRiver;
      } else if (biome === BIOMES.ICE) {
        // Icy blue-white gradient
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
    // Procedural Asphalt
    const asphaltMat   = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.55, metalness: 0.15 });
    const yellowLineMat= new THREE.MeshBasicMaterial({ color: 0xffcc00 });
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

    // Metallic Guardrails outer edge
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
      const gx = Math.sin(angle) * 588;
      const gz = Math.cos(angle) * 588;
      const railGeo = new THREE.BoxGeometry(14, 1.4, 0.5);
      const rail = new THREE.Mesh(railGeo, guardrailMat);
      rail.position.set(gx, 0.9, gz);
      rail.rotation.y = angle + Math.PI / 2;
      rail.castShadow = true;
      this.scene.add(rail);

      // Rail post
      const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 6);
      const post = new THREE.Mesh(postGeo, guardrailMat);
      post.position.set(gx, 1.0, gz);
      this.scene.add(post);
    }

    // Inner guardrails
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
      const gx = Math.sin(angle) * 543;
      const gz = Math.cos(angle) * 543;
      const railGeo = new THREE.BoxGeometry(14, 1.4, 0.5);
      const rail = new THREE.Mesh(railGeo, guardrailMat);
      rail.position.set(gx, 0.9, gz);
      rail.rotation.y = angle + Math.PI / 2;
      this.scene.add(rail);
    }

    // 2. City Grid Asphalt Roads — wider with lane markings
    const cityRoadWidth = 24;
    for (let x = -400; x <= 400; x += 120) {
      const roadGeo = new THREE.PlaneGeometry(cityRoadWidth, 800);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(x, 0.23, 0);
      road.receiveShadow = true;
      this.scene.add(road);
      // Center yellow line
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

    // Crosswalk stripes at major intersections
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

    // 6. Highway ramp from city to ring road (straight connector)
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x232328, roughness: 0.5 });
    [[0, 560, 0], [560, 0, 0], [0, -560, 0], [-560, 0, 0]].forEach(([rx, _, rz], idx) => {
      // Simplified: connect city edge to ring road
    });
  }

  createWaterBody() {
    // Animated water with scroll UV effect (simulated via color shift in update)
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

    // Water foam edge
    const foamGeo = new THREE.RingGeometry(470, 480, 64);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0.55 });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.position.set(-450, 0.0, 450);
    this.scene.add(foam);

    // Wooden Bridge (wider, with railings)
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x7a5030, roughness: 0.85 });
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.9 });
    const bridgeGeo = new THREE.BoxGeometry(36, 5, 200);
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(-450, 2.5, 300);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.scene.add(bridge);
    // Bridge railings
    for (let bz = -90; bz <= 90; bz += 20) {
      [-20, 20].forEach(bx => {
        const postGeo = new THREE.BoxGeometry(1.5, 7, 1.5);
        const post = new THREE.Mesh(postGeo, railingMat);
        post.position.set(-450 + bx, 6.5, 300 + bz);
        this.scene.add(post);
      });
    }
    // Horizontal railing bars
    const hrGeo1 = new THREE.BoxGeometry(1.2, 1.0, 200);
    [-20, 20].forEach(bx => {
      const hr = new THREE.Mesh(hrGeo1, railingMat);
      hr.position.set(-450 + bx, 9, 300);
      this.scene.add(hr);
    });
  }

  createCityBuildings() {
    // Multiple material types for visual variety
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.25, metalness: 0.6 }),  // Glass tower
      new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.4,  metalness: 0.3 }),  // Dark concrete
      new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.3,  metalness: 0.5 }),  // Light steel
      new THREE.MeshStandardMaterial({ color: 0x553c2e, roughness: 0.6,  metalness: 0.1 }),  // Brick/terracotta
      new THREE.MeshStandardMaterial({ color: 0x3a4a6b, roughness: 0.2,  metalness: 0.7 }),  // Blue glass
    ];
    const neonMat  = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8 });
    const neonMatR = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.7 });
    const windowMat= new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 });

    // City grid: place buildings in all 4 quadrants of city centre
    const gridOffsets = [
      // Quadrant range, step
      { xMin: -420, xMax: -40, zMin: -420, zMax: -40 },
      { xMin:  40,  xMax:  420, zMin: -420, zMax: -40 },
      { xMin: -420, xMax: -40, zMin:  40,  zMax:  420 },
      { xMin:  40,  xMax:  420, zMin:  40,  zMax:  420 },
    ];

    gridOffsets.forEach(quad => {
      for (let x = quad.xMin; x <= quad.xMax; x += 90) {
        for (let z = quad.zMin; z <= quad.zMax; z += 90) {
          // Skip road zones
          if (Math.abs(x % 120) < 15 || Math.abs(z % 120) < 15) continue;
          // Skip ring highway radius zone
          if (Math.sqrt(x*x + z*z) > 500) continue;

          const height = 25 + Math.random() * 130;
          const width  = 28 + Math.random() * 20;
          const depth  = 28 + Math.random() * 20;

          const geo = new THREE.BoxGeometry(width, height, depth);
          const mat = mats[Math.floor(Math.random() * mats.length)];
          const bMesh = new THREE.Mesh(geo, mat);
          bMesh.position.set(x, height * 0.5, z);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          this.scene.add(bMesh);
          this.buildings.push(bMesh);

          // Window rows (emissive panel on tall buildings)
          if (height > 40) {
            const winH = height * 0.7;
            const winGeo = new THREE.BoxGeometry(width * 0.85, winH, depth * 0.85);
            const winMesh = new THREE.Mesh(winGeo, windowMat);
            winMesh.position.set(x, height * 0.5 + 3, z);
            this.scene.add(winMesh);
          }

          // Neon signs on some buildings
          if (Math.random() < 0.25) {
            const signMat = Math.random() < 0.5 ? neonMat : neonMatR;
            const signGeo = new THREE.BoxGeometry(width * 0.6, 3, 0.5);
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(x, height + 2, z + depth * 0.5 + 0.5);
            this.scene.add(sign);
          }
        }
      }
    });

    // Extra tall landmark skyscrapers at city centre cardinal points
    const landmarks = [
      { x: -200, z: -200, h: 200, w: 35, d: 35, mat: mats[4] },
      { x:  200, z: -200, h: 175, w: 30, d: 50, mat: mats[0] },
      { x: -200, z:  200, h: 190, w: 40, d: 30, mat: mats[2] },
      { x:  200, z:  200, h: 180, w: 35, d: 35, mat: mats[3] },
      { x:    0, z: -300, h: 220, w: 42, d: 42, mat: mats[1] }, // Tallest spire
    ];
    landmarks.forEach(l => {
      const geo = new THREE.BoxGeometry(l.w, l.h, l.d);
      const mesh = new THREE.Mesh(geo, l.mat);
      mesh.position.set(l.x, l.h * 0.5, l.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.buildings.push(mesh);
      // Antenna on tallest
      if (l.h >= 200) {
        const antGeo = new THREE.CylinderGeometry(0.5, 0.5, 40, 6);
        const antMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9 });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(l.x, l.h + 20, l.z);
        this.scene.add(ant);
        // Red warning light on antenna
        const lightGeo = new THREE.SphereGeometry(1.5, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.5 });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(l.x, l.h + 42, l.z);
        this.scene.add(light);
      }
    });
  }

  createCityDetails() {
    // Sidewalks along roads
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x9eaab8, roughness: 0.8 });
    for (let x = -400; x <= 400; x += 120) {
      [-14, 14].forEach(offset => {
        const swGeo = new THREE.BoxGeometry(6, 0.3, 800);
        const sw = new THREE.Mesh(swGeo, sidewalkMat);
        sw.position.set(x + offset, 0.3, 0);
        this.scene.add(sw);
      });
    }

    // Benches in park areas
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    for (let i = 0; i < 20; i++) {
      const bx = (Math.random() - 0.5) * 400;
      const bz = (Math.random() - 0.5) * 400;
      if (Math.sqrt(bx*bx + bz*bz) > 450) continue;
      if (Math.abs(bx % 120) < 20 || Math.abs(bz % 120) < 20) continue;
      const benchGeo = new THREE.BoxGeometry(4, 0.8, 1.2);
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(bx, 0.5, bz);
      this.scene.add(bench);
    }

    // Traffic signal poles at intersections
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5 });
    const redMat  = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 1.2 });
    const greenMat= new THREE.MeshStandardMaterial({ color: 0x00ee44, emissive: 0x00ee44, emissiveIntensity: 1.2 });

    [[-120, -120], [0, -120], [120, -120], [-120, 0], [120, 0], [-120, 120], [0, 120], [120, 120]].forEach(([ix, iz]) => {
      const poleGeo = new THREE.CylinderGeometry(0.25, 0.25, 11, 6);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(ix + 16, 5.5, iz + 16);
      this.scene.add(pole);

      // Signal box
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
    });

    // Park trees in city centre
    const parkTreeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e });
    const parkTreeLeavesMat= new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const ptGeo = new THREE.CylinderGeometry(0.6, 0.9, 6, 8);
    const plGeo = new THREE.SphereGeometry(5, 10, 8);
    for (let i = 0; i < 60; i++) {
      const ptx = (Math.random() - 0.5) * 800;
      const ptz = (Math.random() - 0.5) * 800;
      if (Math.sqrt(ptx*ptx + ptz*ptz) > 490) continue;
      if (Math.abs(ptx % 120) < 18 || Math.abs(ptz % 120) < 18) continue;
      const tG = new THREE.Group();
      const tr = new THREE.Mesh(ptGeo, parkTreeTrunkMat);
      tr.position.y = 3;
      const lv = new THREE.Mesh(plGeo, parkTreeLeavesMat);
      lv.position.y = 10;
      tG.add(tr); tG.add(lv);
      tG.position.set(ptx, 0, ptz);
      tG.castShadow = true;
      this.scene.add(tG);
    }
  }

  createForestVegetation() {
    const trunkMat1  = new THREE.MeshStandardMaterial({ color: 0x5c3010 });
    const trunkMat2  = new THREE.MeshStandardMaterial({ color: 0x4a2e1b });
    const pineLeaves = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.8 });
    const oakLeaves  = new THREE.MeshStandardMaterial({ color: 0x2d6e2d, roughness: 0.7 });
    const fallLeaves = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });

    // Pine trees (cone shape)
    const pTrunkGeo = new THREE.CylinderGeometry(0.7, 1.1, 7, 8);
    const pLeavesGeo= new THREE.ConeGeometry(7, 18, 8);

    // Oak trees (sphere foliage)
    const oTrunkGeo = new THREE.CylinderGeometry(0.9, 1.3, 6, 8);
    const oLeavesGeo= new THREE.SphereGeometry(6.5, 10, 8);

    // Dense forest in NW quadrant
    for (let i = 0; i < 250; i++) {
      const x = -180 - Math.random() * 620;
      const z = -180 - Math.random() * 620;
      const y = this.getHeightAt(x, z);
      if (y < 0) continue;

      const type = Math.random();
      const treeGroup = new THREE.Group();

      if (type < 0.5) {
        // Pine
        const trunk = new THREE.Mesh(pTrunkGeo, trunkMat1);
        trunk.position.y = 3.5;
        const leaves = new THREE.Mesh(pLeavesGeo, pineLeaves);
        leaves.position.y = 14;
        treeGroup.add(trunk); treeGroup.add(leaves);
      } else if (type < 0.8) {
        // Oak
        const trunk = new THREE.Mesh(oTrunkGeo, trunkMat2);
        trunk.position.y = 3;
        const leaves = new THREE.Mesh(oLeavesGeo, oakLeaves);
        leaves.position.y = 12;
        treeGroup.add(trunk); treeGroup.add(leaves);
      } else {
        // Fall oak
        const trunk = new THREE.Mesh(oTrunkGeo, trunkMat2);
        trunk.position.y = 3;
        const leaves = new THREE.Mesh(oLeavesGeo, fallLeaves);
        leaves.position.y = 12;
        leaves.scale.set(0.9, 0.8, 0.9);
        treeGroup.add(trunk); treeGroup.add(leaves);
      }

      const scale = 0.7 + Math.random() * 0.8;
      treeGroup.scale.set(scale, scale, scale);
      treeGroup.position.set(x, y, z);
      treeGroup.rotation.y = Math.random() * Math.PI * 2;
      treeGroup.castShadow = true;
      this.scene.add(treeGroup);
      this.trees.push(treeGroup);
    }

    // Forest floor ground cover (flat low bushes)
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x1e5c1e, roughness: 0.9 });
    for (let i = 0; i < 80; i++) {
      const x = -200 - Math.random() * 600;
      const z = -200 - Math.random() * 600;
      const y = this.getHeightAt(x, z);
      if (y < 0) continue;
      const bushGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 6, 5);
      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(x, y + 1.2, z);
      bush.scale.set(1, 0.5, 1);
      bush.castShadow = true;
      this.scene.add(bush);
    }
  }

  createMountainElements() {
    const rockMats = [
      new THREE.MeshStandardMaterial({ color: 0x6b6056, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x8a7e72, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.95 }),
    ];
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xfafaff, roughness: 0.6 });

    // Rock clusters with snow caps on high peaks
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

      // Snow cap on high rocks
      if (y > 35 && Math.random() < 0.6) {
        const snowGeo = new THREE.ConeGeometry(scale * 0.6, scale * 0.4, 8);
        const snow = new THREE.Mesh(snowGeo, snowMat);
        snow.position.set(x, y + scale + 1, z);
        this.scene.add(snow);
      }
    }

    // Mountain pine trees (sparse)
    const mPineTrunkGeo  = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const mPineLeavesGeo = new THREE.ConeGeometry(4.5, 12, 8);
    const mPineMat = new THREE.MeshStandardMaterial({ color: 0x0d3b0d, roughness: 0.8 });
    const mTrunkMat= new THREE.MeshStandardMaterial({ color: 0x4a2e1b });
    for (let i = 0; i < 80; i++) {
      const x = 200 + Math.random() * 580;
      const z = -200 - Math.random() * 580;
      const y = this.getHeightAt(x, z);
      if (y < 0 || y > 70) continue;
      const tG = new THREE.Group();
      const tr = new THREE.Mesh(mPineTrunkGeo, mTrunkMat);
      tr.position.y = 2.5;
      const lv = new THREE.Mesh(mPineLeavesGeo, mPineMat);
      lv.position.y = 10;
      tG.add(tr); tG.add(lv);
      tG.position.set(x, y, z);
      tG.castShadow = true;
      this.scene.add(tG);
    }

    // Tunnel Arch (mountain pass)
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2f, roughness: 0.95 });
    const tunnelGeo = new THREE.BoxGeometry(48, 32, 80);
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(450, 16, -300);
    tunnel.castShadow = true;
    this.scene.add(tunnel);
    // Tunnel opening arch
    const archGeo = new THREE.TorusGeometry(12, 3, 8, 24, Math.PI);
    const arch = new THREE.Mesh(archGeo, tunnelMat);
    arch.position.set(450, 14, -261);
    arch.rotation.y = Math.PI;
    this.scene.add(arch);
  }

  createIceElements() {
    const glacierMat = new THREE.MeshStandardMaterial({ color: 0x99ccff, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.9 });
    const snowMat    = new THREE.MeshStandardMaterial({ color: 0xedf8ff, roughness: 0.7 });
    const iceTreeMat = new THREE.MeshStandardMaterial({ color: 0xd4eeff, roughness: 0.7 });
    const iceTreeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4838 });

    // Large glacier ice peaks
    for (let i = 0; i < 20; i++) {
      const gx = 250 + Math.random() * 550;
      const gz = 250 + Math.random() * 550;
      const gy = this.getHeightAt(gx, gz);

      const h = 40 + Math.random() * 50;
      const gGeo = new THREE.ConeGeometry(18 + Math.random() * 22, h, 6);
      const glacier = new THREE.Mesh(gGeo, glacierMat);
      glacier.position.set(gx, gy + h * 0.5, gz);
      glacier.rotation.y = Math.random() * Math.PI;
      glacier.castShadow = true;
      this.scene.add(glacier);

      // Snow cap
      const scGeo = new THREE.ConeGeometry(8, 15, 6);
      const sc = new THREE.Mesh(scGeo, snowMat);
      sc.position.set(gx, gy + h + 4, gz);
      this.scene.add(sc);
    }

    // Smaller ice shards
    for (let i = 0; i < 40; i++) {
      const gx = 200 + Math.random() * 600;
      const gz = 200 + Math.random() * 600;
      const gy = this.getHeightAt(gx, gz);
      const h = 8 + Math.random() * 20;
      const sGeo = new THREE.ConeGeometry(3 + Math.random() * 5, h, 5);
      const shard = new THREE.Mesh(sGeo, glacierMat);
      shard.position.set(gx, gy + h * 0.5, gz);
      shard.rotation.set((Math.random()-0.5)*0.4, Math.random()*Math.PI, (Math.random()-0.5)*0.3);
      this.scene.add(shard);
    }

    // Snow-covered pine trees
    const tTrunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 5, 8);
    const tLeavesGeo= new THREE.ConeGeometry(5.5, 14, 8);
    for (let i = 0; i < 160; i++) {
      const x = 180 + Math.random() * 620;
      const z = 180 + Math.random() * 620;
      const y = this.getHeightAt(x, z);
      if (y < 0 || y > 45) continue;

      const tG = new THREE.Group();
      const tr = new THREE.Mesh(tTrunkGeo, iceTreeTrunkMat);
      tr.position.y = 2.5;
      const lv = new THREE.Mesh(tLeavesGeo, iceTreeMat);
      lv.position.y = 11;
      tG.add(tr); tG.add(lv);
      const sc = 0.8 + Math.random() * 0.7;
      tG.scale.set(sc, sc, sc);
      tG.position.set(x, y, z);
      this.scene.add(tG);
    }

    // Frozen lake
    const lakeGeo = new THREE.CircleGeometry(120, 32);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.02, metalness: 0.9, transparent: true, opacity: 0.8 });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(500, 0.5, 500);
    this.scene.add(lake);
  }

  createStreetLightsAndSigns() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 1.5 });
    const armMat  = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.7 });

    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 10, 8);
    const lampGeo = new THREE.SphereGeometry(0.9, 12, 8);
    const armGeo  = new THREE.CylinderGeometry(0.1, 0.1, 3, 6);

    // Street lights along city grid roads
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
          lg.add(pole); lg.add(arm); lg.add(lamp);
          lg.position.set(x + ox, 0, z);
          this.scene.add(lg);
        });
      }
    }

    // Highway ring road lamp posts every 60m
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 30) {
      const r = 542; // just inside inner edge
      const px = Math.sin(angle) * r;
      const pz = Math.cos(angle) * r;
      const lg = new THREE.Group();
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 5;
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.y = 10.5;
      lg.add(pole); lg.add(lamp);
      lg.position.set(px, 0, pz);
      this.scene.add(lg);
    }
  }

  createBillboards() {
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.5 });
    // Coloured ad panels
    const adMats = [
      new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x33aaff, emissive: 0x0088ff, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x22cc44, emissive: 0x00aa22, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.3 }),
    ];

    const billboardPositions = [
      {x: 0, z: -530, ry: 0},
      {x: 530, z: 0, ry: Math.PI/2},
      {x: 0, z: 530, ry: Math.PI},
      {x: -530, z: 0, ry: -Math.PI/2},
      {x: 300, z: -200, ry: 0.5},
      {x: -300, z: 200, ry: 2.5},
    ];

    billboardPositions.forEach((bp, idx) => {
      const height = 18 + Math.random() * 8;
      // Post
      const postGeo = new THREE.CylinderGeometry(0.5, 0.5, height, 8);
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(bp.x, height/2, bp.z);
      this.scene.add(post);
      // Board panel
      const panelGeo = new THREE.BoxGeometry(20, 10, 0.5);
      const panel = new THREE.Mesh(panelGeo, adMats[idx % adMats.length]);
      panel.position.set(bp.x, height + 5, bp.z);
      panel.rotation.y = bp.ry;
      panel.castShadow = true;
      this.scene.add(panel);
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
      // Canopy roof
      const canopyGeo = new THREE.BoxGeometry(50, 2, 30);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(fp.x, 8, fp.z);
      this.scene.add(canopy);
      // Support columns
      [-22, 22].forEach(cx => {
        const colGeo = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        const col = new THREE.Mesh(colGeo, stationMat);
        col.position.set(fp.x + cx, 4, fp.z);
        this.scene.add(col);
      });
      // Fuel pumps
      [-8, 0, 8].forEach(px => {
        const pumpGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(fp.x + px, 2.5, fp.z);
        pump.castShadow = true;
        this.scene.add(pump);
        // Pump screen
        const screenGeo = new THREE.BoxGeometry(1.0, 1.5, 0.1);
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.8 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(fp.x + px, 3.5, fp.z + 0.8);
        this.scene.add(screen);
      });
    });
  }

  // Call in game loop for water animation
  updateWater(deltaTime) {
    if (!this.waterMesh) return;
    this.waterTime += deltaTime;
    const wColor = new THREE.Color();
    wColor.setHSL(0.58, 0.9, 0.35 + Math.sin(this.waterTime * 0.8) * 0.04);
    this.waterMesh.material.color.lerp(wColor, 0.05);
  }
}
