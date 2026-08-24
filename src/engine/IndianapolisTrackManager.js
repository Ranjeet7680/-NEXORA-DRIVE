import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { VehicleBuilder } from '../vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../config.js';

export class IndianapolisTrackManager {
  constructor(scene) {
    this.scene = scene;
    this.trackGroup = new THREE.Group();
    this.trackGroup.name = 'indianapolis_speedway';
    this.scene.add(this.trackGroup);

    this.colliders = [];
    this.aiRacers = [];
    this.checkpoints = [];

    // Lap Timing System
    this.currentLap = 1;
    this.totalLaps = 5;
    this.lapStartTime = 0;
    this.currentLapTime = 0;
    this.bestLapTime = 0;
    this.lastLapTime = 0;
    this.passedCheckpoints = new Set();
    this.isRacing = true;

    // Track Geometry Specs (2.5 Mile Scaled Oval)
    // Straightaways: 900m long, Radius of Turns: 220m, Chutes: 180m
    this.straightLength = 900;
    this.chuteLength = 180;
    this.turnRadius = 220;
    this.trackWidth = 38;

    this.asphaltTexture = TextureGenerator.createAsphaltTexture();
    this.grassTexture = TextureGenerator.createGrassTexture();
  }

  init() {
    this.buildTerrain();
    this.buildOvalTrack();
    this.buildYardOfBricks();
    this.buildPagodaTower();
    this.buildScoringPylon();
    this.buildGrandstands();
    this.buildPitLane();
    this.buildInfieldScenery();
    this.buildOuterSAFERBarriers();
    this.buildCheckpoints();
    this.spawnCompetitorRacers();
  }

  // Flattened Racetrack Terrain & Green Infield
  buildTerrain() {
    const size = 3200;
    const geo = new THREE.PlaneGeometry(size, size, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshLambertMaterial({
      color: 0x245c1a,
      map: this.grassTexture,
      roughness: 0.9
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    this.trackGroup.add(terrain);

    // Infield Lake
    const lakeGeo = new THREE.PlaneGeometry(350, 180);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x1a6688,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.88
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(120, 0.02, 50);
    this.trackGroup.add(lake);
  }

  // Build the 2.5-Mile Oval Raceway Surface & Banked Corners
  buildOvalTrack() {
    const asphaltMat = new THREE.MeshLambertMaterial({
      map: this.asphaltTexture,
      color: 0x222228
    });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    const L = this.straightLength; // 900
    const C = this.chuteLength;    // 180
    const R = this.turnRadius;     // 220
    const W = this.trackWidth;     // 38

    // 1. Front Straightaway (Main Stretch, South)
    const frontStraight = new THREE.Mesh(new THREE.PlaneGeometry(L, W), asphaltMat);
    frontStraight.rotateX(-Math.PI / 2);
    frontStraight.position.set(0, 0.05, -(R + C / 2));
    frontStraight.receiveShadow = true;
    this.trackGroup.add(frontStraight);

    // 2. Back Straightaway (North)
    const backStraight = new THREE.Mesh(new THREE.PlaneGeometry(L, W), asphaltMat);
    backStraight.rotateX(-Math.PI / 2);
    backStraight.position.set(0, 0.05, (R + C / 2));
    backStraight.receiveShadow = true;
    this.trackGroup.add(backStraight);

    // 3. Short Chute East (Between Turn 1 and Turn 2)
    const eastChute = new THREE.Mesh(new THREE.PlaneGeometry(W, C), asphaltMat);
    eastChute.rotateX(-Math.PI / 2);
    eastChute.position.set(L / 2 + R, 0.05, 0);
    eastChute.receiveShadow = true;
    this.trackGroup.add(eastChute);

    // 4. Short Chute West (Between Turn 3 and Turn 4)
    const westChute = new THREE.Mesh(new THREE.PlaneGeometry(W, C), asphaltMat);
    westChute.rotateX(-Math.PI / 2);
    westChute.position.set(-(L / 2 + R), 0.05, 0);
    westChute.receiveShadow = true;
    this.trackGroup.add(westChute);

    // 4 Banked 90-Degree Curved Corners
    const cornerCenters = [
      { x: L / 2, z: -(C / 2), startAngle: -Math.PI / 2, endAngle: 0, name: 'Turn 1' },
      { x: L / 2, z: (C / 2),  startAngle: 0, endAngle: Math.PI / 2, name: 'Turn 2' },
      { x: -L / 2, z: (C / 2), startAngle: Math.PI / 2, endAngle: Math.PI, name: 'Turn 3' },
      { x: -L / 2, z: -(C / 2), startAngle: Math.PI, endAngle: Math.PI * 1.5, name: 'Turn 4' },
    ];

    cornerCenters.forEach(cc => {
      const ringGeo = new THREE.RingGeometry(R - W / 2, R + W / 2, 48, 1, cc.startAngle, Math.PI / 2);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, asphaltMat);
      ringMesh.position.set(cc.x, 0.05, cc.z);
      ringMesh.receiveShadow = true;
      this.trackGroup.add(ringMesh);

      // Yellow Center Line
      const yelGeo = new THREE.RingGeometry(R - 0.5, R + 0.5, 48, 1, cc.startAngle, Math.PI / 2);
      yelGeo.rotateX(-Math.PI / 2);
      const yelMesh = new THREE.Mesh(yelGeo, yellowLineMat);
      yelMesh.position.set(cc.x, 0.07, cc.z);
      this.trackGroup.add(yelMesh);
    });

    // Straightaway Double Yellow Center Lines & White Boundary Lines
    [-1, 1].forEach(dir => {
      const zPos = dir * (R + C / 2);
      const yelLine = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.8), yellowLineMat);
      yelLine.rotateX(-Math.PI / 2);
      yelLine.position.set(0, 0.07, zPos);
      this.trackGroup.add(yelLine);

      // White Edge Lines
      [-W / 2 + 1.5, W / 2 - 1.5].forEach(offset => {
        const whiteLine = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.6), whiteLineMat);
        whiteLine.rotateX(-Math.PI / 2);
        whiteLine.position.set(0, 0.07, zPos + offset);
        this.trackGroup.add(whiteLine);
      });
    });
  }

  // The Historic "Yard of Bricks" Start/Finish Line & Overhead Checkered Gantry
  buildYardOfBricks() {
    const R = this.turnRadius;
    const C = this.chuteLength;
    const zPos = -(R + C / 2);

    // 1-Yard Width Red Brick Strip
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x992b1e,
      roughness: 0.95,
      metalness: 0.05
    });
    const bricksGeo = new THREE.BoxGeometry(this.trackWidth, 0.08, 0.914); // Exactly 1 yard (3 feet)
    const bricks = new THREE.Mesh(bricksGeo, brickMat);
    bricks.position.set(0, 0.08, zPos);
    this.trackGroup.add(bricks);

    // White Checkered Pattern on Bricks
    const checkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let x = -this.trackWidth / 2 + 1; x < this.trackWidth / 2 - 1; x += 2) {
      const square = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.45), checkMat);
      square.rotateX(-Math.PI / 2);
      square.position.set(x, 0.12, zPos);
      this.trackGroup.add(square);
    }

    // Overhead Checkered Start/Finish Timing Gantry Truss
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const gantryW = this.trackWidth + 6;
    const gantryH = 14;

    // Dual Support Pillars
    [-gantryW / 2, gantryW / 2].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, gantryH, 12), metalMat);
      post.position.set(px, gantryH / 2, zPos);
      this.trackGroup.add(post);
    });

    // Cross Truss Arch
    const truss = new THREE.Mesh(new THREE.BoxGeometry(gantryW, 1.8, 1.8), metalMat);
    truss.position.set(0, gantryH, zPos);
    this.trackGroup.add(truss);

    // Checkered Flag Billboard Display
    const bannerGeo = new THREE.BoxGeometry(gantryW * 0.75, 2.5, 0.4);
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, gantryH, zPos);
    this.trackGroup.add(banner);

    // Green Flag / Red Flag Race Light Pods
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    [-6, 0, 6].forEach(lx => {
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), greenLightMat);
      gl.position.set(lx, gantryH - 1.5, zPos - 0.3);
      this.trackGroup.add(gl);
    });
  }

  // The Iconic 13-Story Pagoda Race Control Tower
  buildPagodaTower() {
    const R = this.turnRadius;
    const C = this.chuteLength;
    const zPos = -(R + C / 2) + 42; // Infield side of start/finish line

    const pagodaGroup = new THREE.Group();
    pagodaGroup.position.set(0, 0, zPos);

    const greenRoofMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });
    const whiteWallMat = new THREE.MeshStandardMaterial({ color: 0xeeece2, roughness: 0.6 });

    // Base Level
    const base = new THREE.Mesh(new THREE.BoxGeometry(28, 6, 22), whiteWallMat);
    base.position.y = 3;
    pagodaGroup.add(base);

    // 6 Stepped Glass & Tiered Roof Levels
    let currentH = 6;
    let currentW = 24;
    let currentD = 18;

    for (let level = 0; level < 6; level++) {
      const tierH = 4.5;
      const tierMesh = new THREE.Mesh(new THREE.BoxGeometry(currentW, tierH, currentD), glassMat);
      tierMesh.position.y = currentH + tierH / 2;
      pagodaGroup.add(tierMesh);

      // Pagoda Overhanging Eaves Roof
      const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(currentW + 4, 0.6, currentD + 4), greenRoofMat);
      roofMesh.position.y = currentH + tierH;
      pagodaGroup.add(roofMesh);

      currentH += tierH;
      currentW -= 2.2;
      currentD -= 1.8;
    }

    // Pagoda Top Antenna Spire
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 18, 8), greenRoofMat);
    antenna.position.y = currentH + 9;
    pagodaGroup.add(antenna);

    this.trackGroup.add(pagodaGroup);
  }

  // 100-Foot Electronic Scoring Pylon / Leaderboard Tower
  buildScoringPylon() {
    const R = this.turnRadius;
    const C = this.chuteLength;
    const pylonX = -35;
    const pylonZ = -(R + C / 2) + 38;

    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    // Tower Body (Height 36m)
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 36, 3.5), pylonMat);
    tower.position.set(pylonX, 18, pylonZ);
    this.trackGroup.add(tower);

    // Electronic LED Position Indicators (1 to 10)
    for (let pos = 1; pos <= 8; pos++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.2), ledMat);
      led.position.set(pylonX, 32 - pos * 3.5, pylonZ - 1.8);
      this.trackGroup.add(led);
    }
  }

  // Massive Multi-Tier Grandstands with Canopy Roofs
  buildGrandstands() {
    const L = this.straightLength;
    const R = this.turnRadius;
    const C = this.chuteLength;
    const standZ = -(R + C / 2) - 34; // Outer side of front stretch

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });

    // 10 Massive Grandstand Sections along Main Stretch
    for (let gx = -L / 2 + 50; gx <= L / 2 - 50; gx += 85) {
      const standGroup = new THREE.Group();
      standGroup.position.set(gx, 0, standZ);

      // Stepped Bleachers (5 tiers)
      for (let t = 0; t < 5; t++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(78, 2.5, 3.5), concreteMat);
        step.position.set(0, (t + 1) * 2.5, t * 3.5);
        standGroup.add(step);

        const seats = new THREE.Mesh(new THREE.BoxGeometry(76, 0.5, 2.8), seatMat);
        seats.position.set(0, (t + 1) * 2.5 + 1.4, t * 3.5);
        standGroup.add(seats);
      }

      // Canopy Roof Overhang
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(82, 0.8, 24), canopyMat);
      canopy.position.set(0, 18, 6);
      canopy.rotation.x = 0.08;
      standGroup.add(canopy);

      this.trackGroup.add(standGroup);
    }
  }

  // Pit Lane, Pit Wall, & 33 Pit Crew Stalls
  buildPitLane() {
    const L = this.straightLength * 0.75;
    const R = this.turnRadius;
    const C = this.chuteLength;
    const pitZ = -(R + C / 2) + 24;

    const pitAsphaltMat = new THREE.MeshLambertMaterial({ map: this.asphaltTexture, color: 0x33333b });
    const concreteWallMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });

    // Pit Road Surface (Width 16m)
    const pitRoad = new THREE.Mesh(new THREE.PlaneGeometry(L, 16), pitAsphaltMat);
    pitRoad.rotateX(-Math.PI / 2);
    pitRoad.position.set(0, 0.06, pitZ);
    this.trackGroup.add(pitRoad);

    // Concrete Pit Wall Separator
    const pitWall = new THREE.Mesh(new THREE.BoxGeometry(L, 1.2, 0.8), concreteWallMat);
    pitWall.position.set(0, 0.6, -(R + C / 2) + 16);
    this.trackGroup.add(pitWall);

    this.colliders.push({
      type: 'box',
      x: 0,
      z: -(R + C / 2) + 16,
      width: L,
      depth: 0.8,
      minX: -L / 2,
      maxX: L / 2,
      minZ: -(R + C / 2) + 15.6,
      maxZ: -(R + C / 2) + 16.4,
      height: 1.2
    });

    // 24 Pit Boxes & Fuel Overhead Rig Stalls
    const stallMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5 });
    for (let px = -L / 2 + 30; px <= L / 2 - 30; px += 28) {
      const fuelRig = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.0, 2.4), stallMat);
      fuelRig.position.set(px, 2.0, pitZ + 7);
      this.trackGroup.add(fuelRig);
    }
  }

  // Infield Scenery (Helipad, Support Garages, RVs)
  buildInfieldScenery() {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });

    // Helipad Circle
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.2, 32), whiteMat);
    pad.position.set(-180, 0.1, 80);
    this.trackGroup.add(pad);

    // Garage Pavilions (Gasoline Alley Garages)
    for (let gx = -120; gx <= 120; gx += 80) {
      const garage = new THREE.Mesh(new THREE.BoxGeometry(45, 7, 24), whiteMat);
      garage.position.set(gx, 3.5, -40);
      this.trackGroup.add(garage);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(47, 1.2, 26), blueMat);
      roof.position.set(gx, 7.6, -40);
      this.trackGroup.add(roof);
    }
  }

  // High-Banked Outer Concrete SAFER Barriers & Catch Fences
  buildOuterSAFERBarriers() {
    const L = this.straightLength;
    const R = this.turnRadius;
    const C = this.chuteLength;
    const W = this.trackWidth;
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Outer Straightaway Barriers (South & North)
    [-1, 1].forEach(dir => {
      const zPos = dir * (R + C / 2 + W / 2 + 1.2);
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(L, 1.6, 0.8), barrierMat);
      barrier.position.set(0, 0.8, zPos);
      this.trackGroup.add(barrier);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(L, 0.4, 0.85), yellowStripeMat);
      stripe.position.set(0, 0.8, zPos);
      this.trackGroup.add(stripe);

      this.colliders.push({
        type: 'box',
        x: 0,
        z: zPos,
        width: L,
        depth: 0.8,
        minX: -L / 2,
        maxX: L / 2,
        minZ: zPos - 0.4,
        maxZ: zPos + 0.4,
        height: 1.6
      });
    });
  }

  // Checkpoints for Lap Timing & Direction Tracking
  buildCheckpoints() {
    const L = this.straightLength;
    const R = this.turnRadius;
    const C = this.chuteLength;

    this.checkpoints = [
      { id: 'start_finish', x: 0, z: -(R + C / 2), radius: 35, name: 'Yard of Bricks (Start/Finish)' },
      { id: 'turn_1', x: L / 2 + R * 0.7, z: -(C / 2), radius: 45, name: 'Turn 1 Exit' },
      { id: 'turn_2', x: L / 2 + R * 0.7, z: (C / 2), radius: 45, name: 'Turn 2 (East Chute)' },
      { id: 'backstretch', x: 0, z: (R + C / 2), radius: 35, name: 'Back Straightaway (Sector 2)' },
      { id: 'turn_3', x: -(L / 2 + R * 0.7), z: (C / 2), radius: 45, name: 'Turn 3 Entry' },
      { id: 'turn_4', x: -(L / 2 + R * 0.7), z: -(C / 2), radius: 45, name: 'Turn 4 (Front Chute)' },
    ];
  }

  // Spawn AI Competitor Bot Race Cars on the Speedway
  spawnCompetitorRacers() {
    const racerConfigs = [
      { type: 'mustang', color: 0x0066ff, name: 'Apex Racing #22', speed: 235 },
      { type: 'car', color: 0xff0033, name: 'Bavaria M-Sport #5', speed: 228 },
      { type: 'mustang', color: 0xffaa00, name: 'Sunoco GT #77', speed: 232 },
      { type: 'car', color: 0x10b981, name: 'Castrol Turbo #11', speed: 226 },
      { type: 'mustang', color: 0x9333ea, name: 'Velocity V8 #99', speed: 230 },
      { type: 'car', color: 0xffffff, name: 'Penske White #2', speed: 234 },
    ];

    const L = this.straightLength;
    const R = this.turnRadius;
    const C = this.chuteLength;
    const totalTrackPerimeter = (2 * L) + (2 * C) + (2 * Math.PI * R);

    racerConfigs.forEach((racer, idx) => {
      const cfg = VEHICLE_CONFIGS[racer.type] || VEHICLE_CONFIGS.car;
      const mesh = VehicleBuilder.createVehicleMesh(cfg, {
        color: racer.color,
        finish: 'metallic',
        spoiler: 'gt_wing',
        rimSize: 19
      });

      // Starting grid positions (spaced out behind start/finish)
      const startDist = (idx + 1) * 35;
      const startX = -startDist;
      const startZ = -(R + C / 2) + ((idx % 2 === 0) ? -5 : 5);

      mesh.position.set(startX, 0.45, startZ);
      mesh.rotation.y = Math.PI / 2; // Facing forward along front straight
      this.trackGroup.add(mesh);

      this.aiRacers.push({
        mesh,
        config: cfg,
        color: racer.color,
        name: racer.name,
        targetSpeed: racer.speed / 3.6, // m/s
        currentSpeed: (racer.speed - 20) / 3.6,
        progressDist: (startX + L / 2) % totalTrackPerimeter,
        laneOffset: (idx % 2 === 0) ? -4 : 4
      });
    });
  }

  // Update loop for AI racers & player lap timing
  update(deltaTime, playerPos) {
    // 1. Update AI Racers around the 2.5-mile oval
    const L = this.straightLength;
    const R = this.turnRadius;
    const C = this.chuteLength;

    this.aiRacers.forEach(racer => {
      racer.progressDist += racer.targetSpeed * deltaTime;

      // Compute position on track oval from 1D progress distance
      const pos = this.getTrackPosAtDist(racer.progressDist, racer.laneOffset);
      racer.mesh.position.set(pos.x, 0.42, pos.z);
      racer.mesh.rotation.y = pos.rotY;

      // Spin racer wheels
      if (racer.mesh.userData.wheels) {
        const wheelRotSpeed = (racer.targetSpeed / 0.35) * deltaTime;
        racer.mesh.userData.wheels.forEach(w => w.rotateX(wheelRotSpeed));
      }
    });

    // 2. Check Player Lap Timing
    if (playerPos) {
      this.checkPlayerCheckpoints(playerPos);
    }
  }

  // Helper: map 1D distance to (x, z, rotY) along the rectangular oval
  getTrackPosAtDist(dist, laneOffset = 0) {
    const L = this.straightLength; // 900
    const C = this.chuteLength;    // 180
    const R = this.turnRadius;     // 220
    const quarterTurn = (Math.PI / 2) * R;
    const totalLap = 2 * L + 2 * C + 4 * quarterTurn;

    let d = ((dist % totalLap) + totalLap) % totalLap;

    // Segment 1: Front Straight (Main Stretch, Eastbound)
    if (d < L) {
      const x = -L / 2 + d;
      const z = -(R + C / 2) + laneOffset;
      return { x, z, rotY: Math.PI / 2 };
    }
    d -= L;

    // Segment 2: Turn 1 (East Corner South)
    if (d < quarterTurn) {
      const angle = -Math.PI / 2 + (d / quarterTurn) * (Math.PI / 2);
      const rad = R + laneOffset;
      const x = L / 2 + Math.cos(angle) * rad;
      const z = -(C / 2) + Math.sin(angle) * rad;
      return { x, z, rotY: -angle + Math.PI / 2 };
    }
    d -= quarterTurn;

    // Segment 3: Short Chute East (Northbound)
    if (d < C) {
      const x = L / 2 + R + laneOffset;
      const z = -(C / 2) + d;
      return { x, z, rotY: 0 };
    }
    d -= C;

    // Segment 4: Turn 2 (East Corner North)
    if (d < quarterTurn) {
      const angle = (d / quarterTurn) * (Math.PI / 2);
      const rad = R + laneOffset;
      const x = L / 2 + Math.cos(angle) * rad;
      const z = (C / 2) + Math.sin(angle) * rad;
      return { x, z, rotY: -angle + Math.PI / 2 };
    }
    d -= quarterTurn;

    // Segment 5: Back Straight (Westbound)
    if (d < L) {
      const x = L / 2 - d;
      const z = (R + C / 2) - laneOffset;
      return { x, z, rotY: -Math.PI / 2 };
    }
    d -= L;

    // Segment 6: Turn 3 (West Corner North)
    if (d < quarterTurn) {
      const angle = Math.PI / 2 + (d / quarterTurn) * (Math.PI / 2);
      const rad = R + laneOffset;
      const x = -L / 2 + Math.cos(angle) * rad;
      const z = (C / 2) + Math.sin(angle) * rad;
      return { x, z, rotY: -angle + Math.PI / 2 };
    }
    d -= quarterTurn;

    // Segment 7: Short Chute West (Southbound)
    if (d < C) {
      const x = -(L / 2 + R) - laneOffset;
      const z = (C / 2) - d;
      return { x, z, rotY: Math.PI };
    }
    d -= C;

    // Segment 8: Turn 4 (West Corner South)
    const angle = Math.PI + (d / quarterTurn) * (Math.PI / 2);
    const rad = R + laneOffset;
    const x = -L / 2 + Math.cos(angle) * rad;
    const z = -(C / 2) + Math.sin(angle) * rad;
    return { x, z, rotY: -angle + Math.PI / 2 };
  }

  // Lap Tracking Logic
  checkPlayerCheckpoints(playerPos) {
    this.checkpoints.forEach(cp => {
      const dx = playerPos.x - cp.x;
      const dz = playerPos.z - cp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < cp.radius) {
        if (!this.passedCheckpoints.has(cp.id)) {
          this.passedCheckpoints.add(cp.id);

          // If crossed Start/Finish line and completed all sectors
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
    return 0; // Completely flat track
  }

  getBiomeAt(x, z) {
    return { id: 'speedway', name: 'Indianapolis Motor Speedway', friction: 1.05 };
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
