import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class SepangTrackManager {
  constructor(scene) {
    this.scene = scene;
    this.trackGroup = new THREE.Group();
    this.trackGroup.name = 'sepang_international_circuit';
    this.scene.add(this.trackGroup);

    this.colliders = [];
    this.aiRacers = [];
    this.checkpoints = [];

    // Lap Timing System
    this.currentLap = 1;
    this.totalLaps = 3;
    this.lapStartTime = 0;
    this.currentLapTime = 0;
    this.bestLapTime = 0;
    this.lastLapTime = 0;
    this.passedCheckpoints = new Set();
    this.isRacing = true;

    this.asphaltTexture = TextureGenerator.createAsphaltTexture();
    this.grassTexture = TextureGenerator.createGrassTexture();

    // 5.543 KM Official Sepang 2025 Layout 3D Spline Path
    this.trackSpline = this.createTrackSpline();
  }

  init() {
    this.buildTerrain();
    this.buildTrackRibbon();
    this.buildHibiscusGrandstand();
    this.buildPitComplex();
    this.buildTropicalPalms();
    this.buildBarriersAndKerbs();
    this.buildCheckpoints();
    this.spawnCompetitorRacers();
  }

  // 1. Sepang International Circuit 5.543km 3D Spline Geometry
  createTrackSpline() {
    const rawPoints = [
      // 1. Main Pit Straight (Start/Finish) - Heading North
      new THREE.Vector3(0, 0, -450),
      new THREE.Vector3(0, 0, -200),
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(0, 0, 300),
      new THREE.Vector3(0, 0, 480),

      // 2. Turn 1 & Turn 2 (Pangkor) - Sharp Right downhill into Left
      new THREE.Vector3(35, -1, 560),
      new THREE.Vector3(80, -2, 590),
      new THREE.Vector3(120, -3, 560),
      new THREE.Vector3(100, -3, 490),
      new THREE.Vector3(60, -2, 440),

      // 3. Turn 3 & Turn 4 - Sweeping Right Uphill into Left Chicane
      new THREE.Vector3(70, 0, 340),
      new THREE.Vector3(120, 3, 240),
      new THREE.Vector3(180, 5, 160),
      new THREE.Vector3(260, 4, 120),
      new THREE.Vector3(320, 2, 80),

      // 4. Turns 5 & 6 (Langkawi) - High-Speed Double-Apex Left
      new THREE.Vector3(380, 0, 20),
      new THREE.Vector3(420, -2, -60),
      new THREE.Vector3(400, -3, -150),
      new THREE.Vector3(340, -2, -220),

      // 5. Turns 7 & 8 (Tioman) - Fast Right-Left S-Curves
      new THREE.Vector3(260, 0, -260),
      new THREE.Vector3(200, 2, -310),
      new THREE.Vector3(180, 3, -370),
      new THREE.Vector3(220, 2, -430),

      // 6. Turn 9 (Berjaya Hairpin) - Downhill Off-Camber Left Hairpin
      new THREE.Vector3(280, 0, -490),
      new THREE.Vector3(310, -2, -550),
      new THREE.Vector3(280, -4, -600),
      new THREE.Vector3(220, -3, -580),
      new THREE.Vector3(160, -1, -520),

      // 7. Turns 10 & 11 (Perhentian) - Long Uphill Right Sweeper
      new THREE.Vector3(120, 2, -420),
      new THREE.Vector3(110, 5, -300),
      new THREE.Vector3(130, 7, -180),
      new THREE.Vector3(170, 8, -80),

      // 8. Turns 12 & 13 (Redang) - Left-Right Transition
      new THREE.Vector3(180, 6, 20),
      new THREE.Vector3(150, 4, 120),
      new THREE.Vector3(100, 2, 200),

      // 9. Turn 14 - Sharp Right into 900m Back Straight
      new THREE.Vector3(70, 0, 290),
      new THREE.Vector3(60, 0, 370),

      // 10. Back Straightaway - 900m Flat-Out (Parallel to Main Straight)
      new THREE.Vector3(60, 0, 200),
      new THREE.Vector3(60, 0, 0),
      new THREE.Vector3(60, 0, -200),
      new THREE.Vector3(60, 0, -400),
      new THREE.Vector3(60, 0, -520),

      // 11. Turn 15 (Sunway Hairpin) - Legendary 180° Left Hairpin onto Main Straight
      new THREE.Vector3(50, 0, -580),
      new THREE.Vector3(25, 0, -600),
      new THREE.Vector3(-10, 0, -570),
      new THREE.Vector3(0, 0, -500),
    ];

    return new THREE.CatmullRomCurve3(rawPoints, true, 'centripetal', 0.25);
  }

  // Tropical Malaysian Green Terrain
  buildTerrain() {
    const size = 3200;
    const geo = new THREE.PlaneGeometry(size, size, 100, 100);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cLushTropics = new THREE.Color(0x1e6622);
    const cGrass = new THREE.Color(0x2d7a28);
    const cSoil = new THREE.Color(0x5c4228);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const worldX = vx;
      const worldZ = -vy;

      const hill = Math.sin(worldX * 0.003) * Math.cos(worldZ * 0.003) * 18;
      pos.setZ(i, hill - 1);

      let c = (hill > 6) ? cLushTropics : (hill < -4 ? cSoil : cGrass);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.position.y = -0.15;
    this.trackGroup.add(terrain);
  }

  // 3D Asphalt Track Ribbon with Red & White FIA Kerbs
  buildTrackRibbon() {
    const segments = 500;
    const trackWidth = 24; // 24m wide FIA Grade 1 Track
    const points = this.trackSpline.getSpacedPoints(segments);

    const asphaltMat = new THREE.MeshLambertMaterial({
      map: this.asphaltTexture,
      color: 0x242428,
    });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redKerbMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const whiteKerbMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    const trackGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const p = points[i % points.length];
      const nextP = points[(i + 1) % points.length];
      const tangent = nextP.clone().sub(p).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const leftP = p.clone().add(side.clone().multiplyScalar(trackWidth / 2));
      const rightP = p.clone().sub(side.clone().multiplyScalar(trackWidth / 2));

      positions.push(leftP.x, leftP.y + 0.15, leftP.z);
      positions.push(rightP.x, rightP.y + 0.15, rightP.z);

      const v = (i / segments) * 80;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }

      // Red & White Ripple Kerbs
      if (i % 2 === 0) {
        const kerbMat = (Math.floor(i / 2) % 2 === 0) ? redKerbMat : whiteKerbMat;
        const kerbGeo = new THREE.BoxGeometry(1.5, 0.22, 3.8);

        const kerbL = new THREE.Mesh(kerbGeo, kerbMat);
        kerbL.position.copy(leftP).add(new THREE.Vector3(0, 0.12, 0));
        kerbL.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        this.trackGroup.add(kerbL);

        const kerbR = new THREE.Mesh(kerbGeo, kerbMat);
        kerbR.position.copy(rightP).add(new THREE.Vector3(0, 0.12, 0));
        kerbR.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        this.trackGroup.add(kerbR);
      }
    }

    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeo.setIndex(indices);
    trackGeo.computeVertexNormals();

    const trackMesh = new THREE.Mesh(trackGeo, asphaltMat);
    trackMesh.receiveShadow = true;
    this.trackGroup.add(trackMesh);

    // Start/Finish Line
    const sfP = points[0];
    const sfLine = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.08, 1.8), whiteLineMat);
    sfLine.position.set(sfP.x, sfP.y + 0.18, sfP.z);
    this.trackGroup.add(sfLine);
  }

  // The Iconic Double-Sided Hibiscus Petal Grandstand (Between Main & Back Straights)
  buildHibiscusGrandstand() {
    const standGroup = new THREE.Group();
    standGroup.position.set(30, 0, -100);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.2, metalness: 0.1 });
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

    // 8 Huge Hibiscus Flower Canopy Pods
    for (let gz = -300; gz <= 300; gz += 85) {
      // Bleachers facing Main Straight (West)
      const seatWest = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 75), concreteMat);
      seatWest.position.set(-10, 4, gz);
      standGroup.add(seatWest);

      // Bleachers facing Back Straight (East)
      const seatEast = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 75), concreteMat);
      seatEast.position.set(10, 4, gz);
      standGroup.add(seatEast);

      // Massive Curving Hibiscus Palm-Frond Roof
      const roofL = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 80), canopyMat);
      roofL.position.set(-14, 18, gz);
      roofL.rotation.z = 0.22;
      standGroup.add(roofL);

      const roofR = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 80), canopyMat);
      roofR.position.set(14, 18, gz);
      roofR.rotation.z = -0.22;
      standGroup.add(roofR);

      // Steel Support Pillars
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 12), trussMat);
      pillar.position.set(0, 10, gz);
      standGroup.add(pillar);
    }

    this.trackGroup.add(standGroup);
  }

  // Modern F1/MotoGP Pit Building & Paddock
  buildPitComplex() {
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.75 });
    const yellowStripe = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Pit Complex running along West side of Main Straight
    const pitBuilding = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 360), pitMat);
    pitBuilding.position.set(-32, 6, -100);
    this.trackGroup.add(pitBuilding);

    const vipLounge = new THREE.Mesh(new THREE.BoxGeometry(20, 4.5, 350), glassMat);
    vipLounge.position.set(-32, 14, -100);
    this.trackGroup.add(vipLounge);

    // Overhead Race Control Gantry
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(28, 2.2, 2.2), pitMat);
    gantry.position.set(0, 12, -450);
    this.trackGroup.add(gantry);
  }

  // Tropical Malaysian Palm Trees
  buildTropicalPalms() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const palmFrondMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });

    const palmClusters = [
      { x: 140, z: 400, count: 25 },
      { x: 260, z: 20, count: 30 },
      { x: 340, z: -350, count: 25 },
      { x: -80, z: -100, count: 30 },
      { x: 450, z: -100, count: 20 },
    ];

    palmClusters.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const px = cluster.x + (Math.random() - 0.5) * 120;
        const pz = cluster.z + (Math.random() - 0.5) * 120;
        const py = this.getHeightAt(px, pz);

        const palmGroup = new THREE.Group();
        palmGroup.position.set(px, py, pz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 7.0, 6), trunkMat);
        trunk.position.y = 3.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        palmGroup.add(trunk);

        for (let f = 0; f < 6; f++) {
          const frond = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 4.0), palmFrondMat);
          frond.position.set(0, 7.0, 1.8);
          frond.rotation.x = 0.5;
          frond.rotation.y = (f / 6) * Math.PI * 2;
          palmGroup.add(frond);
        }

        this.trackGroup.add(palmGroup);
      }
    });
  }

  // Steel Armco Crash Barriers
  buildBarriersAndKerbs() {
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const points = this.trackSpline.getSpacedPoints(180);

    for (let i = 0; i < points.length; i += 4) {
      const p = points[i];
      const nextP = points[(i + 1) % points.length];
      const tangent = nextP.clone().sub(p).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const outP = p.clone().add(side.clone().multiplyScalar(16));
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 18), barrierMat);
      rail.position.set(outP.x, outP.y + 0.7, outP.z);
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      this.trackGroup.add(rail);

      this.colliders.push({
        type: 'box',
        x: outP.x,
        z: outP.z,
        width: 12,
        depth: 12,
        minX: outP.x - 6,
        maxX: outP.x + 6,
        minZ: outP.z - 6,
        maxZ: outP.z + 6,
        height: 2.0
      });
    }
  }

  // Timing Checkpoints (Sector 1, 2, 3 splits)
  buildCheckpoints() {
    this.checkpoints = [
      { id: 'start_finish', x: 0, z: -450, radius: 30, name: 'Main Pit Straight (Start/Finish)' },
      { id: 'turn_1', x: 80, z: 590, radius: 40, name: 'Turn 1 & 2 (Pangkor Hairpin)' },
      { id: 'turn_4', x: 260, z: 120, radius: 40, name: 'Turn 4 Chicane (Sector 1 Split)' },
      { id: 'langkawi', x: 420, z: -60, radius: 45, name: 'Turns 5 & 6 (Langkawi Sweeper)' },
      { id: 'berjaya', x: 310, z: -550, radius: 40, name: 'Turn 9 (Berjaya Hairpin)' },
      { id: 'perhentian', x: 170, z: -80, radius: 45, name: 'Turns 10 & 11 (Sector 2 Split)' },
      { id: 'back_straight', x: 60, z: -200, radius: 35, name: '900m Back Straight Speed Trap' },
      { id: 'sunway_hairpin', x: 25, z: -600, radius: 35, name: 'Turn 15 (Sunway Final Hairpin)' },
    ];
  }

  // Spawn AI Competitors
  spawnCompetitorRacers() {
    const racerConfigs = [
      { type: 'mustang', color: 0xdc2626, name: 'Petronas Racing #44', speed: 255 },
      { type: 'car', color: 0x0284c7, name: 'Oracle Red Bull #1', speed: 258 },
      { type: 'mustang', color: 0xf59e0b, name: 'DHL Porsche GT #99', speed: 252 },
      { type: 'car', color: 0x10b981, name: 'Aston Martin F1 #14', speed: 250 },
      { type: 'mustang', color: 0x9333ea, name: 'Sepang GT V8 #77', speed: 253 },
      { type: 'car', color: 0xffffff, name: 'Williams Gulf #23', speed: 251 },
    ];

    racerConfigs.forEach((racer, idx) => {
      const cfg = VEHICLE_CONFIGS[racer.type] || VEHICLE_CONFIGS.car;
      const mesh = VehicleBuilder.createVehicleMesh(cfg, {
        color: racer.color,
        finish: 'metallic',
        spoiler: 'gt_wing',
        rimSize: 19
      });

      const progressT = 0.96 - (idx * 0.035);
      const pos = this.trackSpline.getPointAt(progressT);
      const tangent = this.trackSpline.getTangentAt(progressT);
      const rotY = Math.atan2(tangent.x, tangent.z);

      mesh.position.set(pos.x + ((idx % 2 === 0) ? -4 : 4), pos.y + 0.45, pos.z);
      mesh.rotation.y = rotY;
      this.trackGroup.add(mesh);

      this.aiRacers.push({
        mesh,
        config: cfg,
        color: racer.color,
        name: racer.name,
        speed: racer.speed / 3.6,
        progressT,
        laneOffset: (idx % 2 === 0) ? -3.5 : 3.5
      });
    });
  }

  // Update loop for AI racers & player lap timing
  update(deltaTime, playerPos) {
    const splineLength = this.trackSpline.getLength();

    this.aiRacers.forEach(racer => {
      const tDelta = (racer.speed * deltaTime) / splineLength;
      racer.progressT = (racer.progressT + tDelta) % 1.0;

      const p = this.trackSpline.getPointAt(racer.progressT);
      const tangent = this.trackSpline.getTangentAt(racer.progressT);
      const normal = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const carP = p.clone().add(side.multiplyScalar(racer.laneOffset));
      racer.mesh.position.set(carP.x, carP.y + 0.42, carP.z);
      racer.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      if (racer.mesh.userData.wheels) {
        const rotSpeed = (racer.speed / 0.35) * deltaTime;
        racer.mesh.userData.wheels.forEach(w => w.rotateX(rotSpeed));
      }
    });

    if (playerPos) {
      this.checkPlayerCheckpoints(playerPos);
    }
  }

  checkPlayerCheckpoints(playerPos) {
    this.checkpoints.forEach(cp => {
      const dx = playerPos.x - cp.x;
      const dz = playerPos.z - cp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < cp.radius) {
        if (!this.passedCheckpoints.has(cp.id)) {
          this.passedCheckpoints.add(cp.id);

          if (cp.id === 'start_finish') {
            if (this.passedCheckpoints.size >= 4) {
              const now = performance.now();
              if (this.lapStartTime > 0) {
                this.lastLapTime = (now - this.lapStartTime) / 1000;
                if (this.bestLapTime === 0 || this.lastLapTime < this.bestLapTime) {
                  this.bestLapTime = this.lastLapTime;
                }
                this.currentLap = Math.min(this.totalLaps, this.currentLap + 1);
              }
              this.lapStartTime = now;
              this.passedCheckpoints.clear();
              this.passedCheckpoints.add('start_finish');
            } else if (this.lapStartTime === 0) {
              this.lapStartTime = performance.now();
            }
          }
        }
      }
    });

    if (this.lapStartTime > 0) {
      this.currentLapTime = (performance.now() - this.lapStartTime) / 1000;
    }
  }

  getTelemetry() {
    return {
      currentLap: this.currentLap,
      totalLaps: this.totalLaps,
      currentLapTime: this.currentLapTime,
      bestLapTime: this.bestLapTime,
      lastLapTime: this.lastLapTime
    };
  }

  getHeightAt(x, z) {
    return 0; // Flat racetrack plane
  }

  getBiomeAt(x, z) {
    return { id: 'sepang', name: 'Sepang International Circuit', friction: 1.12 };
  }

  checkCollision(x, z, radius = 1.4) {
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (c.type === 'box') {
        const closestX = Math.max(c.minX, Math.min(x, c.maxX));
        const closestZ = Math.max(c.minZ, Math.min(z, c.maxZ));
        const dx = x - closestX;
        const dz = z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          const dist = Math.max(0.001, Math.sqrt(distSq));
          const overlap = radius - dist;
          return {
            normalX: dx / dist,
            normalZ: dz / dist,
            overlap: overlap
          };
        }
      }
    }
    return null;
  }

  destroy() {
    this.scene.remove(this.trackGroup);
    this.colliders = [];
    this.aiRacers = [];
  }
}
