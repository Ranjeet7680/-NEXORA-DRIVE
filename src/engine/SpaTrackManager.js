import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class SpaTrackManager {
  constructor(scene) {
    this.scene = scene;
    this.trackGroup = new THREE.Group();
    this.trackGroup.name = 'spa_francorchamps';
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

    // Spline-based 7.004km Scaled Circuit Points (with real elevation changes: Eau Rouge / Raidillon hill climb)
    this.trackSpline = this.createTrackSpline();
  }

  init() {
    this.buildTerrain();
    this.buildTrackRibbon();
    this.buildPitComplex();
    this.buildRaidillonGrandstand();
    this.buildForestSurroundings();
    this.buildBarriersAndKerbs();
    this.buildCheckpoints();
    this.spawnCompetitorRacers();
  }

  // 1. Spa 7.004km 3D Spline Path with Eau Rouge & Raidillon Uphill Elevation
  createTrackSpline() {
    const rawPoints = [
      // 1. Main Pit Straight (Start/Finish)
      new THREE.Vector3(0, 0, -250),
      new THREE.Vector3(120, 0, -250),

      // 2. La Source Hairpin (Turn 1 Right Hairpin)
      new THREE.Vector3(220, -2, -220),
      new THREE.Vector3(260, -4, -140),
      new THREE.Vector3(220, -5, -60),

      // 3. Downhill Run to Eau Rouge
      new THREE.Vector3(120, -12, 40),
      new THREE.Vector3(60, -18, 140),

      // 4. Eau Rouge Dip & Raidillon Steep Uphill Climb (Crest +28m)
      new THREE.Vector3(20, -14, 220),  // Eau Rouge Left Dip
      new THREE.Vector3(-10, 8, 300),   // Raidillon Right Flick
      new THREE.Vector3(-30, 26, 380),  // Raidillon Crest (Summit)

      // 5. Kemmel Straight (High-speed flat-out DRS Zone, +28m high plateau)
      new THREE.Vector3(-60, 28, 520),
      new THREE.Vector3(-100, 27, 720),
      new THREE.Vector3(-140, 26, 920),

      // 6. Les Combes Chicane (Turn 7, 8, 9 Right-Left-Right)
      new THREE.Vector3(-180, 24, 1020),
      new THREE.Vector3(-240, 20, 1060),
      new THREE.Vector3(-300, 15, 1040),

      // 7. Malmedy & Downhill Run to Bruxelles
      new THREE.Vector3(-380, 10, 940),
      new THREE.Vector3(-440, 4, 820),

      // 8. Rivage / Bruxelles (Turn 10 Tight Downhill Hairpin)
      new THREE.Vector3(-480, -2, 700),
      new THREE.Vector3(-520, -6, 620),
      new THREE.Vector3(-470, -10, 540),

      // 9. Speaker's Corner (No-Name Turn 11)
      new THREE.Vector3(-380, -14, 460),
      new THREE.Vector3(-320, -16, 360),

      // 10. Pouhon (Double-Apex High-Speed Left Hander)
      new THREE.Vector3(-340, -18, 240),
      new THREE.Vector3(-420, -20, 140),
      new THREE.Vector3(-450, -21, 20),

      // 11. Campus / Fagnes Chicane (Turn 14 & 15)
      new THREE.Vector3(-430, -20, -100),
      new THREE.Vector3(-380, -19, -200),
      new THREE.Vector3(-320, -18, -280),

      // 12. Stavelot (Fast Banking Right Curve)
      new THREE.Vector3(-260, -16, -350),
      new THREE.Vector3(-190, -13, -400),

      // 13. Paul Frère & Blanchimont (Flat-out 300 km/h Left Curve)
      new THREE.Vector3(-100, -8, -430),
      new THREE.Vector3(-20, -4, -400),
      new THREE.Vector3(40, -2, -350),

      // 14. Bus Stop Chicane (Turns 19 & 20 Right-Left tight flick into Main Straight)
      new THREE.Vector3(50, 0, -290),
      new THREE.Vector3(-10, 0, -270),
      new THREE.Vector3(-20, 0, -250),
    ];

    return new THREE.CatmullRomCurve3(rawPoints, true, 'centripetal', 0.25);
  }

  // Rolling Ardennes Forest Topography
  buildTerrain() {
    const size = 3200;
    const geo = new THREE.PlaneGeometry(size, size, 120, 120);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cDeepPine   = new THREE.Color(0x133e14);
    const cLushGrass  = new THREE.Color(0x27591e);
    const cRock       = new THREE.Color(0x423d38);
    const cRedSoil    = new THREE.Color(0x5a3e2a);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const worldX = vx;
      const worldZ = -vy;

      // Smooth multi-frequency hills matching Spa terrain
      const hill1 = Math.sin(worldX * 0.003) * Math.cos(worldZ * 0.003) * 35;
      const hill2 = Math.sin(worldX * 0.008 + worldZ * 0.008) * 16;
      const h = hill1 + hill2;
      pos.setZ(i, h - 2);

      let c = cLushGrass;
      if (h > 20) c = cDeepPine;
      else if (h < -10) c = cRedSoil;
      else if (Math.abs(h) > 15) c = cRock;

      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.position.y = -0.1;
    this.trackGroup.add(terrain);
  }

  // Extrude 3D Asphalt Road Ribbon with Red/White F1 Kerbs
  buildTrackRibbon() {
    const segments = 450;
    const trackWidth = 22; // 22m wide FIA Grade 1 Track
    const points = this.trackSpline.getSpacedPoints(segments);

    const asphaltMat = new THREE.MeshLambertMaterial({
      map: this.asphaltTexture,
      color: 0x222226,
    });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redKerbMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const yellowKerbMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Track Geometry Mesh
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

      // Left and Right vertices of track
      const leftP = p.clone().add(side.clone().multiplyScalar(trackWidth / 2));
      const rightP = p.clone().sub(side.clone().multiplyScalar(trackWidth / 2));

      positions.push(leftP.x, leftP.y + 0.15, leftP.z);
      positions.push(rightP.x, rightP.y + 0.15, rightP.z);

      const v = (i / segments) * 60;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }

      // Red & Yellow Alternating FIA Ripple Kerbs on Corner Edges
      if (i % 3 === 0) {
        const kerbMat = (Math.floor(i / 3) % 2 === 0) ? redKerbMat : yellowKerbMat;
        const kerbGeo = new THREE.BoxGeometry(1.6, 0.25, 4.5);
        const kerbL = new THREE.Mesh(kerbGeo, kerbMat);
        kerbL.position.copy(leftP).add(new THREE.Vector3(0, 0.15, 0));
        kerbL.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        this.trackGroup.add(kerbL);

        const kerbR = new THREE.Mesh(kerbGeo, kerbMat);
        kerbR.position.copy(rightP).add(new THREE.Vector3(0, 0.15, 0));
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

    // Start/Finish Line Decal
    const sfP = points[0];
    const sfLine = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.08, 1.5), whiteLineMat);
    sfLine.position.set(sfP.x, sfP.y + 0.18, sfP.z);
    this.trackGroup.add(sfLine);
  }

  // F1 Modern Pit Building & Control Tower on Main Straight
  buildPitComplex() {
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.7 });
    const redAccentMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    // 2-Story Pit Garage Complex (Length 180m)
    const pitBuilding = new THREE.Mesh(new THREE.BoxGeometry(160, 10, 22), pitMat);
    pitBuilding.position.set(60, 5, -275);
    this.trackGroup.add(pitBuilding);

    // Pit Building Glass VIP Lounge
    const vipGlass = new THREE.Mesh(new THREE.BoxGeometry(156, 4, 20), glassMat);
    vipGlass.position.set(60, 12, -275);
    this.trackGroup.add(vipGlass);

    // Red Roof Canopy
    const roof = new THREE.Mesh(new THREE.BoxGeometry(164, 1.2, 26), redAccentMat);
    roof.position.set(60, 14.6, -275);
    this.trackGroup.add(roof);

    // FIA Race Control Overhead Start/Finish Gantry
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(26, 2.0, 2.0), gantryMat);
    gantry.position.set(0, 11, -250);
    this.trackGroup.add(gantry);

    [-13, 13].forEach(gx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 11, 8), gantryMat);
      leg.position.set(gx, 5.5, -250);
      this.trackGroup.add(leg);
    });
  }

  // Legendary Raidillon Spectator Grandstand (Overlooking the hill climb)
  buildRaidillonGrandstand() {
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });

    const standGroup = new THREE.Group();
    standGroup.position.set(45, 14, 270);
    standGroup.rotation.y = -0.45;

    for (let t = 0; t < 6; t++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(90, 2.5, 3.2), concreteMat);
      step.position.set(0, t * 2.5, t * 3.2);
      standGroup.add(step);

      const seats = new THREE.Mesh(new THREE.BoxGeometry(88, 0.4, 2.6), seatMat);
      seats.position.set(0, t * 2.5 + 1.4, t * 3.2);
      standGroup.add(seats);
    }

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(94, 0.8, 26), canopyMat);
    canopy.position.set(0, 20, 10);
    standGroup.add(canopy);

    this.trackGroup.add(standGroup);
  }

  // Lush Ardennes Pine Forests along Kemmel Straight, Pouhon & Blanchimont
  buildForestSurroundings() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const pineMat = new THREE.MeshLambertMaterial({ color: 0x144018 });

    const treeLocations = [
      // Along Kemmel Straight
      { x: -160, z: 600, count: 25 },
      { x: 30, z: 750, count: 30 },
      // Surrounding Pouhon
      { x: -500, z: 200, count: 35 },
      { x: -280, z: 120, count: 25 },
      // Along Blanchimont
      { x: 80, z: -400, count: 30 },
      { x: -160, z: -480, count: 30 },
    ];

    treeLocations.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const tx = cluster.x + (Math.random() - 0.5) * 140;
        const tz = cluster.z + (Math.random() - 0.5) * 140;
        const ty = this.getHeightAt(tx, tz);

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, ty, tz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 5.0, 6), trunkMat);
        trunk.position.y = 2.5;
        treeGroup.add(trunk);

        for (let l = 0; l < 3; l++) {
          const foliage = new THREE.Mesh(new THREE.ConeGeometry(3.5 - l * 0.8, 4.5, 6), pineMat);
          foliage.position.y = 5.0 + l * 2.8;
          treeGroup.add(foliage);
        }

        this.trackGroup.add(treeGroup);
      }
    });
  }

  // Armco Steel Crash Barriers
  buildBarriersAndKerbs() {
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const points = this.trackSpline.getSpacedPoints(180);

    for (let i = 0; i < points.length; i += 4) {
      const p = points[i];
      const nextP = points[(i + 1) % points.length];
      const tangent = nextP.clone().sub(p).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Outer Armco Rail
      const outP = p.clone().add(side.clone().multiplyScalar(15));
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

  // Timing Checkpoints (Sector 1, Sector 2, Sector 3 splits)
  buildCheckpoints() {
    this.checkpoints = [
      { id: 'start_finish', x: 0, z: -250, radius: 25, name: 'Start/Finish Straight' },
      { id: 'eau_rouge', x: 20, z: 220, radius: 35, name: 'Eau Rouge (Sector 1 Entry)' },
      { id: 'raidillon', x: -30, z: 380, radius: 35, name: 'Raidillon Crest' },
      { id: 'kemmel', x: -140, z: 920, radius: 35, name: 'Kemmel Straight Speed Trap' },
      { id: 'les_combes', x: -240, z: 1060, radius: 40, name: 'Les Combes (Sector 1 Split)' },
      { id: 'bruxelles', x: -520, z: 620, radius: 40, name: 'Bruxelles Hairpin' },
      { id: 'pouhon', x: -420, z: 140, radius: 45, name: 'Pouhon Apex (Sector 2 Split)' },
      { id: 'stavelot', x: -190, z: -400, radius: 40, name: 'Stavelot Corner' },
      { id: 'blanchimont', x: 40, z: -350, radius: 35, name: 'Blanchimont Sweeper' },
      { id: 'bus_stop', x: 50, z: -290, radius: 30, name: 'Bus Stop Chicane (Sector 3 Split)' },
    ];
  }

  // Spawn AI GT3 / F1 Bot Racers on Circuit de Spa
  spawnCompetitorRacers() {
    const racerConfigs = [
      { type: 'mustang', color: 0xdc2626, name: 'Ferrari GT3 #51', speed: 245 },
      { type: 'car', color: 0x0284c7, name: 'Red Bull Racing #1', speed: 252 },
      { type: 'mustang', color: 0x000000, name: 'Mercedes AMG GT #44', speed: 248 },
      { type: 'car', color: 0xf97316, name: 'McLaren GT #4', speed: 244 },
      { type: 'mustang', color: 0x16a34a, name: 'Aston Martin AMR #14', speed: 242 },
      { type: 'car', color: 0xffffff, name: 'Porsche 911 GT3 #91', speed: 246 },
    ];

    racerConfigs.forEach((racer, idx) => {
      const cfg = VEHICLE_CONFIGS[racer.type] || VEHICLE_CONFIGS.car;
      const mesh = VehicleBuilder.createVehicleMesh(cfg, {
        color: racer.color,
        finish: 'metallic',
        spoiler: 'gt_wing',
        rimSize: 19
      });

      // Starting grid slots
      const progressT = 0.95 - (idx * 0.035);
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
    // 1. Step AI Racers along the 3D Spline
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

      // Spin wheels
      if (racer.mesh.userData.wheels) {
        const rotSpeed = (racer.speed / 0.35) * deltaTime;
        racer.mesh.userData.wheels.forEach(w => w.rotateX(rotSpeed));
      }
    });

    // 2. Check Player Lap Timing
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
            if (this.passedCheckpoints.size >= 5) {
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
    if (z < -100) return 0;
    const hill1 = Math.sin(x * 0.003) * Math.cos(z * 0.003) * 35;
    const hill2 = Math.sin(x * 0.008 + z * 0.008) * 16;
    return Math.max(0, hill1 + hill2 - 2);
  }

  getBiomeAt(x, z) {
    return { id: 'spa', name: 'Circuit de Spa-Francorchamps', friction: 1.10 };
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
