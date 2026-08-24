import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class VehicleBuilder {
  static createVehicleMesh(config, customUpgrades = {}) {
    const group = new THREE.Group();
    group.name = `vehicle_${config.id}`;

    // Base Color Determination
    let colorHex = customUpgrades.color;
    if (!colorHex) {
      if (config.id === 'taxi') colorHex = 0xffbe0b;
      else if (config.id === 'police') colorHex = 0x0f172a;
      else if (config.id === 'bus') colorHex = 0x0284c7;
      else if (config.id === 'truck') colorHex = 0x334155;
      else if (config.id === 'suv') colorHex = 0x2e3846;
      else if (config.id === 'bike') colorHex = 0xd90429;
      else colorHex = 0xcc1100; // Sporty Red for default car
    }
    
    // PBR Material Finish Selection
    const finish = customUpgrades.finish || 'gloss';
    let roughness = 0.22;
    let metalness = 0.75;
    if (finish === 'matte') { roughness = 0.85; metalness = 0.1; }
    else if (finish === 'metallic') { roughness = 0.12; metalness = 0.95; }
    else if (finish === 'carbon') { roughness = 0.35; metalness = 0.8; }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: roughness,
      metalness: metalness
    });

    const bodyAccentMaterial = new THREE.MeshStandardMaterial({
      color: (config.id === 'police') ? 0xffffff : 0x111622,
      roughness: 0.3,
      metalness: 0.8
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.85,
      transmission: 0.85,
      side: THREE.DoubleSide
    });

    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.75, metalness: 0.2 });
    const carbonMaterial = new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.35, metalness: 0.8 });
    const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.1, metalness: 0.98 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 2.8 });
    const brakeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff1122, emissive: 0xdd0011, emissiveIntensity: 2.2 });
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff7700, emissiveIntensity: 0.0 });
    const interiorLeatherMat = new THREE.MeshStandardMaterial({ color: 0x1e2029, roughness: 0.65, metalness: 0.1 });
    const redCaliperMat = new THREE.MeshStandardMaterial({ color: 0xdd1100, roughness: 0.2, metalness: 0.8 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0xccd4e0, roughness: 0.25, metalness: 0.95 });

    // Chassis Base Group
    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    group.add(chassis);

    // Build specific vehicle body architecture
    switch (config.id) {
      case 'car':
      case 'taxi':
      case 'police':
        VehicleBuilder.buildSedanBody(chassis, config, bodyMaterial, bodyAccentMaterial, glassMaterial, darkMaterial, carbonMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial, interiorLeatherMat, customUpgrades);
        break;
      case 'bus':
        VehicleBuilder.buildBusBody(chassis, config, bodyMaterial, bodyAccentMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial, interiorLeatherMat);
        break;
      case 'bike':
        VehicleBuilder.buildBikeBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial);
        break;
      case 'truck':
        VehicleBuilder.buildTruckBody(chassis, config, bodyMaterial, bodyAccentMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial, interiorLeatherMat);
        break;
      case 'suv':
        VehicleBuilder.buildSuvBody(chassis, config, bodyMaterial, bodyAccentMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial, interiorLeatherMat);
        break;
    }

    // ── Detailed Performance Alloy Wheels with Brake Discs & Calipers ──
    const rimSizeInches = customUpgrades.rimSize || 18;
    const rimScale = rimSizeInches / 18;
    
    const wheels = [];
    const wheelPositions = VehicleBuilder.getWheelPositions(config);

    wheelPositions.forEach((pos, wIdx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);
      wheelGroup.name = `wheel_${wIdx}`;

      const r = config.wheelRadius * rimScale;
      const w = config.id === 'bike' ? 0.13 : (config.id === 'truck' ? 0.38 : (config.id === 'bus' ? 0.34 : 0.26));
      
      const spinHub = new THREE.Group();
      spinHub.name = 'spinHub';

      // 1. Rubber Tire with Tread Silhouette
      const tireGeo = new THREE.CylinderGeometry(r, r, w, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, darkMaterial);
      tireMesh.castShadow = true;
      spinHub.add(tireMesh);

      // 2. High-Tech Multi-Spoke Alloy Rim
      const rimOuterGeo = new THREE.CylinderGeometry(r * 0.72, r * 0.72, w + 0.015, 16);
      rimOuterGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimOuterGeo, chromeMaterial);
      spinHub.add(rimMesh);

      // 3. Center Hub Cap
      const hubCapGeo = new THREE.CylinderGeometry(r * 0.22, r * 0.22, w + 0.025, 8);
      hubCapGeo.rotateZ(Math.PI / 2);
      const hubCap = new THREE.Mesh(hubCapGeo, carbonMaterial);
      spinHub.add(hubCap);

      // 4. Alloy Wheel Spokes
      for (let sp = 0; sp < 5; sp++) {
        const spokeAngle = (sp / 5) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(w + 0.02, r * 0.65, 0.04);
        const spoke = new THREE.Mesh(spokeGeo, chromeMaterial);
        spoke.rotation.x = spokeAngle;
        spinHub.add(spoke);
      }

      wheelGroup.add(spinHub);

      // 5. Ventilated Steel Brake Rotor Disc (Non-spinning with wheel hub)
      if (config.id !== 'bike') {
        const rotorGeo = new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.03, 16);
        rotorGeo.rotateZ(Math.PI / 2);
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.x = (pos.x > 0 ? -0.05 : 0.05);
        wheelGroup.add(rotor);

        // 6. Brembo Sport Brake Caliper
        const caliperGeo = new THREE.BoxGeometry(0.06, r * 0.32, r * 0.22);
        const caliper = new THREE.Mesh(caliperGeo, redCaliperMat);
        caliper.position.set(pos.x > 0 ? -0.05 : 0.05, r * 0.35, 0);
        wheelGroup.add(caliper);
      }

      group.add(wheelGroup);
      wheels.push(wheelGroup);
    });

    // ── Real-Time Neon Underglow Kit ──
    const underColor = customUpgrades.underglowHex || 0x00f0ff;
    const glowGeo = new THREE.PlaneGeometry(config.dimensions.width * 1.35, config.dimensions.length * 1.15);
    glowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: underColor,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.set(0, 0.08, 0);
    chassis.add(glowMesh);

    // Dynamic ground illumination under chassis
    const underLightF = new THREE.PointLight(underColor, 2.5, 7.0, 1.2);
    const underLightR = new THREE.PointLight(underColor, 2.5, 7.0, 1.2);
    underLightF.position.set(0, 0.2, config.dimensions.length * 0.25);
    underLightR.position.set(0, 0.2, -config.dimensions.length * 0.25);
    chassis.add(underLightF);
    chassis.add(underLightR);

    // ── Functional High-Power Dual Spotlights ──
    const headZ = config.dimensions.length * 0.5;
    const headX = config.dimensions.width * 0.36;
    const headY = config.dimensions.height * 0.42;

    const headlightLeft = new THREE.SpotLight(0xfffaee, 8.5, 120, Math.PI / 4.5, 0.25, 1.0);
    const headlightRight = new THREE.SpotLight(0xfffaee, 8.5, 120, Math.PI / 4.5, 0.25, 1.0);
    headlightLeft.castShadow = true;
    headlightRight.castShadow = true;
    headlightLeft.shadow.mapSize.width = 1024;
    headlightLeft.shadow.mapSize.height = 1024;
    headlightRight.shadow.mapSize.width = 1024;
    headlightRight.shadow.mapSize.height = 1024;

    headlightLeft.position.set(-headX, headY, headZ);
    headlightRight.position.set(headX, headY, headZ);

    const targetLeft = new THREE.Object3D();
    const targetRight = new THREE.Object3D();
    targetLeft.position.set(-headX, headY - 0.4, headZ + 50);
    targetRight.position.set(headX, headY - 0.4, headZ + 50);

    chassis.add(targetLeft);
    chassis.add(targetRight);
    headlightLeft.target = targetLeft;
    headlightRight.target = targetRight;

    chassis.add(headlightLeft);
    chassis.add(headlightRight);

    // Front Headlight Lens Flare Bulbs
    const haloGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const haloL = new THREE.Mesh(haloGeo, haloMat);
    const haloR = new THREE.Mesh(haloGeo, haloMat);
    haloL.position.set(-headX, headY, headZ + 0.05);
    haloR.position.set(headX, headY, headZ + 0.05);
    chassis.add(haloL);
    chassis.add(haloR);

    // ── Volumetric Forward Light Beams ──
    const beamGeo = new THREE.ConeGeometry(5.5, 45, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 22.5);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffaed,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beamLeft = new THREE.Mesh(beamGeo, beamMat);
    const beamRight = new THREE.Mesh(beamGeo, beamMat);
    beamLeft.position.set(-headX, headY, headZ);
    beamRight.position.set(headX, headY, headZ);
    beamLeft.visible = false;
    beamRight.visible = false;
    chassis.add(beamLeft);
    chassis.add(beamRight);

    // ── Cockpit Interior Lighting (Dome light + Dashboard backlights) ──
    const fpv = config.cameraOffsets.fpv;
    const domeLight = new THREE.PointLight(0xfffaee, 1.2, 3.5);
    domeLight.position.set(0, fpv.y + 0.22, fpv.z);
    chassis.add(domeLight);

    const dashBacklight = new THREE.PointLight(0x00f0ff, 1.5, 2.5);
    dashBacklight.position.set(fpv.x, fpv.y - 0.1, fpv.z + 0.25);
    chassis.add(dashBacklight);

    // ── Rear Taillight & Brake PointLight ──
    const rearBrakeLight = new THREE.PointLight(0xff0000, 2.0, 6.0);
    rearBrakeLight.position.set(0, headY, -config.dimensions.length * 0.52);
    chassis.add(rearBrakeLight);

    group.userData = {
      chassis,
      wheels,
      headlights: [headlightLeft, headlightRight],
      lightBeams: [beamLeft, beamRight],
      interiorLight: domeLight,
      rearBrakeLight,
      brakeLights: chassis.userData.brakeLights || [],
      indicators: chassis.userData.indicators || [],
      policeLights: chassis.userData.policeLights || [],
      config,
      steeringWheelMesh: chassis.getObjectByName('steeringWheelMesh'),
      wiperMesh: chassis.getObjectByName('wiperMesh')
    };

    return group;
  }

  static getWheelPositions(config) {
    const halfL = config.dimensions.length * 0.35;
    const halfW = config.dimensions.width * 0.48;
    const r = config.wheelRadius;

    if (config.id === 'bike') {
      return [{ x: 0, y: r, z: halfL * 0.8 }, { x: 0, y: r, z: -halfL * 0.8 }];
    }

    if (config.id === 'bus' || config.id === 'truck') {
      return [
        { x: -halfW, y: r, z: halfL * 1.1 }, { x: halfW, y: r, z: halfL * 1.1 },
        { x: -halfW, y: r, z: -halfL * 0.7 }, { x: halfW, y: r, z: -halfL * 0.7 },
        { x: -halfW, y: r, z: -halfL * 1.3 }, { x: halfW, y: r, z: -halfL * 1.3 }
      ];
    }

    return [
      { x: -halfW, y: r, z: halfL }, { x: halfW, y: r, z: halfL },
      { x: -halfW, y: r, z: -halfL }, { x: halfW, y: r, z: -halfL }
    ];
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 1. HIGH-PERFORMANCE SPORTS COUPE / HYPERCAR / POLICE / TAXI SEDAN
  // ═════════════════════════════════════════════════════════════════════════
  static buildSedanBody(chassis, config, bodyMat, accentMat, glassMat, darkMat, carbonMat, chromeMat, lightMat, brakeMat, indicatorMat, leatherMat, customUpgrades) {
    const { length, width, height } = config.dimensions;

    // ── Lower Aerodynamic Tub / Floorpan ──
    const lowerGeo = new THREE.BoxGeometry(width * 0.98, height * 0.32, length * 0.98);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.y = height * 0.28;
    lowerMesh.castShadow = true;
    chassis.add(lowerMesh);

    // Front Carbon Splitter
    const splitterGeo = new THREE.BoxGeometry(width * 1.02, 0.04, length * 0.15);
    const splitter = new THREE.Mesh(splitterGeo, carbonMat);
    splitter.position.set(0, height * 0.12, length * 0.48);
    splitter.castShadow = true;
    chassis.add(splitter);

    // Carbon Side Skirts (Left & Right)
    [-width * 0.5, width * 0.5].forEach(sx => {
      const skirtGeo = new THREE.BoxGeometry(0.06, 0.08, length * 0.7);
      const skirt = new THREE.Mesh(skirtGeo, carbonMat);
      skirt.position.set(sx, height * 0.15, 0);
      chassis.add(skirt);
    });

    // ── Aggressive Front Grille & Radiator Mesh ──
    const grilleGeo = new THREE.BoxGeometry(width * 0.65, height * 0.22, 0.08);
    const grille = new THREE.Mesh(grilleGeo, darkMat);
    grille.position.set(0, height * 0.32, length * 0.505);
    chassis.add(grille);

    // Chrome Emblem in center of Grille
    const emblemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
    emblemGeo.rotateX(Math.PI / 2);
    const emblem = new THREE.Mesh(emblemGeo, chromeMat);
    emblem.position.set(0, height * 0.34, length * 0.515);
    chassis.add(emblem);

    // ── Slanted Aerodynamic Hood with Dual Air Extraction Ducts ──
    const hoodGeo = new THREE.BoxGeometry(width * 0.92, height * 0.12, length * 0.38);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
    hoodMesh.position.set(0, height * 0.46, length * 0.28);
    hoodMesh.castShadow = true;
    chassis.add(hoodMesh);

    // Dual Hood Vent Inlets
    [-width * 0.22, width * 0.22].forEach(vx => {
      const ventGeo = new THREE.BoxGeometry(width * 0.16, 0.03, length * 0.12);
      const vent = new THREE.Mesh(ventGeo, carbonMat);
      vent.position.set(vx, height * 0.525, length * 0.26);
      chassis.add(vent);
    });

    // ── Hollow Cabin Architecture (Open Cockpit for FPV) ──
    // Thin Roof Slab
    const roofGeo = new THREE.BoxGeometry(width * 0.84, 0.04, length * 0.42);
    const roofMesh = new THREE.Mesh(roofGeo, (config.id === 'police') ? accentMat : carbonMat);
    roofMesh.position.set(0, height * 0.94, -length * 0.06);
    roofMesh.castShadow = true;
    chassis.add(roofMesh);

    // A-Pillars (Front Windshield Struts)
    [-width * 0.41, width * 0.41].forEach(ax => {
      const aPillarGeo = new THREE.BoxGeometry(0.05, height * 0.45, 0.06);
      const aPillar = new THREE.Mesh(aPillarGeo, bodyMat);
      aPillar.position.set(ax, height * 0.68, length * 0.08);
      aPillar.rotation.x = -0.42;
      chassis.add(aPillar);
    });

    // C-Pillars (Rear Windshield Struts)
    [-width * 0.41, width * 0.41].forEach(cx => {
      const cPillarGeo = new THREE.BoxGeometry(0.05, height * 0.45, 0.06);
      const cPillar = new THREE.Mesh(cPillarGeo, bodyMat);
      cPillar.position.set(cx, height * 0.68, -length * 0.22);
      cPillar.rotation.x = 0.42;
      chassis.add(cPillar);
    });

    // Clear Panoramic Windscreen
    const windshieldGeo = new THREE.BoxGeometry(width * 0.82, height * 0.44, 0.02);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, height * 0.70, length * 0.12);
    windshield.rotation.x = -0.40;
    chassis.add(windshield);

    // Rear Window Glass
    const rearGlassGeo = new THREE.BoxGeometry(width * 0.80, height * 0.40, 0.02);
    const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
    rearGlass.position.set(0, height * 0.70, -length * 0.24);
    rearGlass.rotation.x = 0.40;
    chassis.add(rearGlass);

    // Side Windows (Left & Right)
    [-width * 0.43, width * 0.43].forEach(wx => {
      const sideGlassGeo = new THREE.BoxGeometry(0.02, height * 0.36, length * 0.36);
      const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      sideGlass.position.set(wx, height * 0.70, -length * 0.06);
      chassis.add(sideGlass);

      // Aerodynamic Side Mirrors with reflective chrome face
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), darkMat);
      mirrorArm.position.set(wx > 0 ? wx + 0.04 : wx - 0.04, height * 0.60, length * 0.16);
      chassis.add(mirrorArm);

      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.16), bodyMat);
      mirrorHousing.position.set(wx > 0 ? wx + 0.10 : wx - 0.10, height * 0.61, length * 0.16);
      chassis.add(mirrorHousing);

      const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.14), chromeMat);
      mirrorGlass.position.set(wx > 0 ? wx + 0.095 : wx - 0.095, height * 0.61, length * 0.16);
      mirrorGlass.rotation.y = wx > 0 ? -Math.PI / 2 : Math.PI / 2;
      chassis.add(mirrorGlass);
    });

    // ── Modern Angular LED Headlights & Turn Signals ──
    const headBulbGeo = new THREE.BoxGeometry(width * 0.20, height * 0.12, 0.08);
    const headL = new THREE.Mesh(headBulbGeo, lightMat);
    const headR = new THREE.Mesh(headBulbGeo, lightMat);
    headL.position.set(-width * 0.33, height * 0.38, length * 0.49);
    headR.position.set(width * 0.33, height * 0.38, length * 0.49);
    chassis.add(headL);
    chassis.add(headR);

    // Amber Turn Indicators (Front Corners)
    const indGeo = new THREE.BoxGeometry(width * 0.08, height * 0.08, 0.06);
    const indFL = new THREE.Mesh(indGeo, indicatorMat);
    const indFR = new THREE.Mesh(indGeo, indicatorMat);
    indFL.position.set(-width * 0.46, height * 0.38, length * 0.47);
    indFR.position.set(width * 0.46, height * 0.38, length * 0.47);
    chassis.add(indFL);
    chassis.add(indFR);

    // ── Full-Width Rear LED Taillight Bar & Reverse Lights ──
    const brakeBulbGeo = new THREE.BoxGeometry(width * 0.86, height * 0.09, 0.06);
    const brakeLightBar = new THREE.Mesh(brakeBulbGeo, brakeMat);
    brakeLightBar.position.set(0, height * 0.48, -length * 0.495);
    chassis.add(brakeLightBar);

    chassis.userData.brakeLights = [brakeLightBar];
    chassis.userData.indicators = [indFL, indFR];

    // ── Rear Carbon Diffuser & Quad Titanium Exhaust Tips ──
    const diffuserGeo = new THREE.BoxGeometry(width * 0.88, height * 0.16, length * 0.12);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
    diffuser.position.set(0, height * 0.20, -length * 0.48);
    chassis.add(diffuser);

    // Quad Exhaust Pipes
    [-0.32, -0.20, 0.20, 0.32].forEach(ex => {
      const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16);
      exhaustGeo.rotateX(Math.PI / 2);
      const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x2266aa, metalness: 0.95, roughness: 0.1 });
      const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat);
      exhaustMesh.position.set(ex * width, height * 0.20, -length * 0.52);
      chassis.add(exhaustMesh);
    });

    // ── Active Sport GT Spoiler / Wing ──
    const spoilerLevel = customUpgrades.spoiler || 'sport_wing';
    if (spoilerLevel !== 'none') {
      const wingW = width * 0.92;
      const wingH = spoilerLevel === 'carbon_wing' ? 0.32 : 0.18;
      
      // Dual Upright Mount Stanchions
      [-width * 0.25, width * 0.25].forEach(sx => {
        const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.04, wingH, 0.14), carbonMat);
        stanchion.position.set(sx, height * 0.52 + wingH * 0.5, -length * 0.44);
        chassis.add(stanchion);
      });

      // Wing Blade Airfoil
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.04, 0.24), carbonMat);
      wingBlade.position.set(0, height * 0.52 + wingH, -length * 0.44);
      wingBlade.rotation.x = -0.08;
      wingBlade.castShadow = true;
      chassis.add(wingBlade);

      // Wing Endplates
      [-wingW * 0.5, wingW * 0.5].forEach(wx => {
        const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.28), carbonMat);
        endplate.position.set(wx, height * 0.52 + wingH, -length * 0.44);
        chassis.add(endplate);
      });
    }

    // ── Special Edition: Police Cruiser Siren & Push Bumper ──
    if (config.id === 'police') {
      // Front Heavy Steel Push Bumper (Ram Bar)
      const pushBarGeo = new THREE.BoxGeometry(width * 0.65, height * 0.35, 0.08);
      const pushBar = new THREE.Mesh(pushBarGeo, darkMat);
      pushBar.position.set(0, height * 0.32, length * 0.53);
      chassis.add(pushBar);

      // Low-Profile LED Roof Lightbar
      const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(width * 0.65, 0.06, 0.20), darkMat);
      lightbarBase.position.set(0, height * 0.98, -length * 0.06);
      chassis.add(lightbarBase);

      const blueSirenMat = new THREE.MeshStandardMaterial({ color: 0x0044ff, emissive: 0x0088ff, emissiveIntensity: 4.0 });
      const redSirenMat  = new THREE.MeshStandardMaterial({ color: 0xff0022, emissive: 0xff0000, emissiveIntensity: 4.0 });

      const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(width * 0.30, 0.08, 0.16), blueSirenMat);
      const sirenRed  = new THREE.Mesh(new THREE.BoxGeometry(width * 0.30, 0.08, 0.16), redSirenMat);
      sirenBlue.position.set(-width * 0.16, height * 1.02, -length * 0.06);
      sirenRed.position.set(width * 0.16, height * 1.02, -length * 0.06);
      chassis.add(sirenBlue);
      chassis.add(sirenRed);

      chassis.userData.policeLights = [sirenBlue, sirenRed];
    }

    // ── Special Edition: Yellow Taxi Cab Roof Beacon & Decals ──
    if (config.id === 'taxi') {
      const taxiSignMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffaa00, emissiveIntensity: 2.2 });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, 0.12, 0.22), taxiSignMat);
      taxiSign.position.set(0, height * 1.02, -length * 0.06);
      chassis.add(taxiSign);

      const taxiTextGeo = new THREE.BoxGeometry(width * 0.32, 0.06, 0.23);
      const taxiText = new THREE.Mesh(taxiTextGeo, darkMat);
      taxiText.position.set(0, height * 1.02, -length * 0.06);
      chassis.add(taxiText);
    }

    // ── Add Full Cockpit Interior (Seats, Dashboard, Interactive Wheel) ──
    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. HEAVY-DUTY SEMI TRUCK + ARTICULATED CARGO FREIGHT TRAILER
  // ═════════════════════════════════════════════════════════════════════════
  static buildTruckBody(chassis, config, bodyMat, accentMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat, leatherMat) {
    const { length, width, height } = config.dimensions;

    // ── Semi Cab Tractor Body ──
    const cabGeo = new THREE.BoxGeometry(width * 0.95, height * 0.65, length * 0.42);
    const cabMesh = new THREE.Mesh(cabGeo, bodyMat);
    cabMesh.position.set(0, height * 0.52, length * 0.22);
    cabMesh.castShadow = true;
    chassis.add(cabMesh);

    // Aerodynamic Sleeper Cab High Roof Fairing
    const roofFairingGeo = new THREE.BoxGeometry(width * 0.90, height * 0.25, length * 0.35);
    const roofFairing = new THREE.Mesh(roofFairingGeo, bodyMat);
    roofFairing.position.set(0, height * 0.92, length * 0.18);
    chassis.add(roofFairing);

    // Massive Chrome Front Grille
    const grilleGeo = new THREE.BoxGeometry(width * 0.72, height * 0.38, 0.12);
    const grille = new THREE.Mesh(grilleGeo, chromeMat);
    grille.position.set(0, height * 0.36, length * 0.44);
    chassis.add(grille);

    // Heavy Steel Bumper with Fog Lights
    const bumperGeo = new THREE.BoxGeometry(width * 1.02, height * 0.16, 0.18);
    const bumper = new THREE.Mesh(bumperGeo, chromeMat);
    bumper.position.set(0, height * 0.16, length * 0.44);
    chassis.add(bumper);

    // Front Windshield Glass
    const windshieldGeo = new THREE.BoxGeometry(width * 0.88, height * 0.28, 0.04);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, height * 0.68, length * 0.42);
    chassis.add(windshield);

    // Amber Rooftop Cab Clearance Marker Lights (5 lights)
    for (let c = -2; c <= 2; c++) {
      const clrMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 2.5 });
      const clr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), clrMat);
      clr.position.set(c * (width * 0.18), height * 1.06, length * 0.32);
      chassis.add(clr);
    }

    // Dual Tall Vertical Chrome Exhaust Smoke Stacks
    [-width * 0.50, width * 0.50].forEach(ex => {
      const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, height * 0.85, 16);
      const pipe = new THREE.Mesh(pipeGeo, chromeMat);
      pipe.position.set(ex, height * 0.68, length * 0.02);
      chassis.add(pipe);

      // Curved Stack Tip
      const tipGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16);
      tipGeo.rotateZ(ex > 0 ? 0.35 : -0.35);
      const tip = new THREE.Mesh(tipGeo, chromeMat);
      tip.position.set(ex > 0 ? ex + 0.06 : ex - 0.06, height * 1.12, length * 0.02);
      chassis.add(tip);
    });

    // Dual Chrome Diesel Fuel Tanks with Straps
    [-width * 0.52, width * 0.52].forEach(tx => {
      const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, length * 0.28, 16);
      tankGeo.rotateX(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, chromeMat);
      tank.position.set(tx, height * 0.24, length * 0.12);
      chassis.add(tank);
    });

    // ── Full-Size Articulated Cargo Freight Trailer ──
    const trailerMat = new THREE.MeshStandardMaterial({ color: 0xd8e0e8, metalness: 0.85, roughness: 0.25 });
    const trailerGeo = new THREE.BoxGeometry(width * 0.98, height * 0.85, length * 0.62);
    const trailer = new THREE.Mesh(trailerGeo, trailerMat);
    trailer.position.set(0, height * 0.62, -length * 0.24);
    trailer.castShadow = true;
    chassis.add(trailer);

    // Front Refrigeration Cooling Unit (Thermo King Box)
    const thermoGeo = new THREE.BoxGeometry(width * 0.72, height * 0.35, 0.22);
    const thermo = new THREE.Mesh(thermoGeo, darkMat);
    thermo.position.set(0, height * 0.75, length * 0.08);
    chassis.add(thermo);

    // Trailer Rear Roll-up Cargo Door & Safety Hazard Stripes
    const doorGeo = new THREE.BoxGeometry(width * 0.88, height * 0.72, 0.06);
    const door = new THREE.Mesh(doorGeo, accentMat);
    door.position.set(0, height * 0.60, -length * 0.55);
    chassis.add(door);

    // Dual Rear Mudflaps
    [-width * 0.40, width * 0.40].forEach(mx => {
      const flapGeo = new THREE.BoxGeometry(0.28, 0.35, 0.03);
      const flap = new THREE.Mesh(flapGeo, darkMat);
      flap.position.set(mx, height * 0.16, -length * 0.54);
      chassis.add(flap);
    });

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. METRO CITY EXPRESS TRANSIT BUS
  // ═════════════════════════════════════════════════════════════════════════
  static buildBusBody(chassis, config, bodyMat, accentMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat, leatherMat) {
    const { length, width, height } = config.dimensions;

    // ── Main Aerodynamic Transit Bus Body Shell ──
    const bodyGeo = new THREE.BoxGeometry(width * 0.98, height * 0.80, length * 0.96);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, height * 0.50, 0);
    bodyMesh.castShadow = true;
    chassis.add(bodyMesh);

    // Lower Dark Protective Skirt Band
    const skirtGeo = new THREE.BoxGeometry(width * 1.01, height * 0.18, length * 0.98);
    const skirt = new THREE.Mesh(skirtGeo, darkMat);
    skirt.position.set(0, height * 0.14, 0);
    chassis.add(skirt);

    // Front Illuminated Electronic LED Destination Display Board
    const destTex = TextureGenerator.createHighwaySignTexture('101 METROPOLIS', 'CITY CENTER', 'AIRPORT');
    const destGeo = new THREE.PlaneGeometry(width * 0.75, height * 0.14);
    const destMat = new THREE.MeshBasicMaterial({ map: destTex, side: THREE.DoubleSide });
    const destMesh = new THREE.Mesh(destGeo, destMat);
    destMesh.position.set(0, height * 0.82, length * 0.485);
    chassis.add(destMesh);

    // Front Curved Panoramic Windshield Glass
    const frontWindshieldGeo = new THREE.BoxGeometry(width * 0.90, height * 0.42, 0.04);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    frontWindshield.position.set(0, height * 0.54, length * 0.48);
    frontWindshield.rotation.x = -0.12;
    chassis.add(frontWindshield);

    // Side Panoramic Passenger Tinted Windows
    [-width * 0.50, width * 0.50].forEach(sx => {
      const sideGlassGeo = new THREE.BoxGeometry(0.04, height * 0.42, length * 0.82);
      const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      sideGlass.position.set(sx, height * 0.58, -length * 0.04);
      chassis.add(sideGlass);
    });

    // Roof-Mounted Dual AC Climate Control Units
    [-length * 0.22, length * 0.18].forEach(rz => {
      const acUnitGeo = new THREE.BoxGeometry(width * 0.65, 0.22, length * 0.18);
      const acUnit = new THREE.Mesh(acUnitGeo, darkMat);
      acUnit.position.set(0, height * 0.96, rz);
      chassis.add(acUnit);
    });

    // Passenger Entry Doors with Glass Windows
    const doorGeo = new THREE.BoxGeometry(0.08, height * 0.65, 1.2);
    const doorMesh = new THREE.Mesh(doorGeo, darkMat);
    doorMesh.position.set(width * 0.49, height * 0.42, length * 0.28);
    chassis.add(doorMesh);

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. MAMMOTH 4x4 OFF-ROAD ADVENTURE SUV / PICKUP
  // ═════════════════════════════════════════════════════════════════════════
  static buildSuvBody(chassis, config, bodyMat, accentMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat, leatherMat) {
    const { length, width, height } = config.dimensions;

    // ── High-Stance 4x4 SUV Body ──
    const bodyGeo = new THREE.BoxGeometry(width * 0.96, height * 0.58, length * 0.94);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, height * 0.48, 0);
    bodyMesh.castShadow = true;
    chassis.add(bodyMesh);

    // Matte Black Flared Wheel Arches
    [-width * 0.48, width * 0.48].forEach(fx => {
      const archF = new THREE.Mesh(new THREE.BoxGeometry(0.12, height * 0.22, length * 0.25), darkMat);
      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.12, height * 0.22, length * 0.25), darkMat);
      archF.position.set(fx, height * 0.32, length * 0.32);
      archR.position.set(fx, height * 0.32, -length * 0.32);
      chassis.add(archF);
      chassis.add(archR);
    });

    // Heavy Steel Tubular Front Bullbar with Recovery Winch
    const bullbarGeo = new THREE.BoxGeometry(width * 0.85, height * 0.32, 0.16);
    const bullbar = new THREE.Mesh(bullbarGeo, darkMat);
    bullbar.position.set(0, height * 0.30, length * 0.50);
    chassis.add(bullbar);

    // Dual Amber Rally Fog Lights on Bullbar
    [-width * 0.22, width * 0.22].forEach(fx => {
      const fogMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 2.8 });
      const fogLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.08, 16), fogMat);
      fogLamp.rotateX(Math.PI / 2);
      fogLamp.position.set(fx, height * 0.38, length * 0.54);
      chassis.add(fogLamp);
    });

    // Roof Expedition Cargo Basket Rack with Lightbar
    const rackGeo = new THREE.BoxGeometry(width * 0.84, 0.14, length * 0.55);
    const rack = new THREE.Mesh(rackGeo, darkMat);
    rack.position.set(0, height * 0.86, -length * 0.05);
    chassis.add(rack);

    // Roof High-Intensity Forward LED Lightbar (5000 lumens)
    const ledBarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.5 });
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.06, 0.08), ledBarMat);
    ledBar.position.set(0, height * 0.90, length * 0.22);
    chassis.add(ledBar);

    // Rear Mounted Exterior Spare Wheel
    const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(config.wheelRadius, config.wheelRadius, 0.24, 20), darkMat);
    spareTire.rotateZ(Math.PI / 2);
    spareTire.position.set(0, height * 0.50, -length * 0.52);
    chassis.add(spareTire);

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. HYPERBLADE 1000RR RACING SUPERBIKE
  // ═════════════════════════════════════════════════════════════════════════
  static buildBikeBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat) {
    const { length, width, height } = config.dimensions;

    // Sculpted Racing Fuel Tank
    const tankGeo = new THREE.BoxGeometry(width * 0.85, height * 0.35, length * 0.42);
    const tankMesh = new THREE.Mesh(tankGeo, bodyMat);
    tankMesh.position.set(0, height * 0.55, length * 0.08);
    chassis.add(tankMesh);

    // Aerodynamic Front Fairing with Dual Cat-Eye Headlights
    const fairingGeo = new THREE.BoxGeometry(width * 0.88, height * 0.48, length * 0.35);
    const fairing = new THREE.Mesh(fairingGeo, bodyMat);
    fairing.position.set(0, height * 0.58, length * 0.32);
    chassis.add(fairing);

    // Windscreen
    const screenGeo = new THREE.BoxGeometry(width * 0.65, height * 0.28, 0.03);
    const screen = new THREE.Mesh(screenGeo, glassMat);
    screen.position.set(0, height * 0.82, length * 0.34);
    screen.rotation.x = -0.45;
    chassis.add(screen);

    // Exposed Engine Block with Stainless Exhaust
    const engineGeo = new THREE.BoxGeometry(width * 0.75, height * 0.35, length * 0.35);
    const engine = new THREE.Mesh(engineGeo, chromeMat);
    engine.position.set(0, height * 0.28, 0);
    chassis.add(engine);

    // Slip-on Carbon Exhaust Muffler
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.55, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    exhaustGeo.rotateY(0.2);
    const exhaust = new THREE.Mesh(exhaustGeo, darkMat);
    exhaust.position.set(width * 0.38, height * 0.25, -length * 0.28);
    chassis.add(exhaust);

    // Solo Rider Seat & Aerodynamic Tail Cowl
    const seatGeo = new THREE.BoxGeometry(width * 0.70, 0.08, length * 0.32);
    const seat = new THREE.Mesh(seatGeo, darkMat);
    seat.position.set(0, height * 0.52, -length * 0.18);
    chassis.add(seat);

    const cowlGeo = new THREE.BoxGeometry(width * 0.65, height * 0.25, length * 0.28);
    const cowl = new THREE.Mesh(cowlGeo, bodyMat);
    cowl.position.set(0, height * 0.62, -length * 0.38);
    chassis.add(cowl);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. REALISTIC LUXURY COCKPIT INTERIOR (SEATS, DASH, INTERACTIVE WHEEL)
  // ═════════════════════════════════════════════════════════════════════════
  static addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat) {
    if (config.id === 'bike') return;

    const fpv = config.cameraOffsets.fpv;
    const w = config.dimensions.width;
    const h = config.dimensions.height;

    // ── 1. Dual Sport Bucket Racing Seats (Driver & Passenger) ──
    [-w * 0.25, w * 0.25].forEach(sx => {
      // Seat Base Cushion
      const seatBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, 0.14, 0.55), leatherMat);
      seatBase.position.set(sx, fpv.y - 0.38, fpv.z - 0.12);
      chassis.add(seatBase);

      // Ergonomic Seat Backrest with Side Bolsters
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(w * 0.36, 0.62, 0.12), leatherMat);
      seatBack.position.set(sx, fpv.y - 0.08, fpv.z - 0.38);
      seatBack.rotation.x = 0.12;
      chassis.add(seatBack);

      // Headrest
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, 0.18, 0.10), leatherMat);
      headrest.position.set(sx, fpv.y + 0.28, fpv.z - 0.42);
      chassis.add(headrest);
    });

    // ── 2. Center Console (Armrest, Shifter, Cup Holders) ──
    const consoleGeo = new THREE.BoxGeometry(w * 0.22, 0.28, 0.85);
    const consoleMesh = new THREE.Mesh(consoleGeo, darkMat);
    consoleMesh.position.set(0, fpv.y - 0.32, fpv.z + 0.12);
    chassis.add(consoleMesh);

    // Chrome Gear Shifter Lever
    const shifterShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), chromeMat);
    const shifterKnob  = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), darkMat);
    shifterShaft.position.set(0, fpv.y - 0.14, fpv.z + 0.22);
    shifterKnob.position.set(0, fpv.y - 0.07, fpv.z + 0.22);
    chassis.add(shifterShaft);
    chassis.add(shifterKnob);

    // ── 3. Cockpit Dashboard Table ──
    const dashGeo = new THREE.BoxGeometry(w * 0.94, 0.30, 0.58);
    const dashMesh = new THREE.Mesh(dashGeo, darkMat);
    dashMesh.position.set(0, fpv.y - 0.25, fpv.z + 0.52);
    chassis.add(dashMesh);

    // ── 4. Realistic Dual Analog/Digital Sport Gauge Cluster ──
    const dashTex = TextureGenerator.createDashboardTexture();
    const clusterGeo = new THREE.PlaneGeometry(0.68, 0.26);
    const clusterMat = new THREE.MeshBasicMaterial({ map: dashTex, transparent: true });
    const clusterMesh = new THREE.Mesh(clusterGeo, clusterMat);
    clusterMesh.position.set(fpv.x, fpv.y - 0.10, fpv.z + 0.38);
    clusterMesh.rotation.x = -0.12;
    chassis.add(clusterMesh);

    // ── 5. Infotainment Touchscreen Tablet with Live GPS Navigation ──
    const infoTex = TextureGenerator.createInfotainmentTexture();
    const infoGeo = new THREE.BoxGeometry(0.38, 0.26, 0.03);
    const infoMat = new THREE.MeshBasicMaterial({ map: infoTex });
    const infoMesh = new THREE.Mesh(infoGeo, infoMat);
    infoMesh.position.set(0.32, fpv.y - 0.08, fpv.z + 0.44);
    infoMesh.rotation.y = -0.25; // Angled toward driver
    infoMesh.rotation.x = -0.06;
    chassis.add(infoMesh);

    // ── 6. Rear-View Mirror at Top Center Windshield ──
    const mirrorFrameGeo = new THREE.BoxGeometry(0.34, 0.10, 0.03);
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, darkMat);
    mirrorFrame.position.set(0, fpv.y + 0.26, fpv.z + 0.32);
    mirrorFrame.rotation.x = 0.15;
    
    const mirrorGlassGeo = new THREE.PlaneGeometry(0.32, 0.08);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x99ccff, roughness: 0.1, metalness: 0.95 });
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeo, mirrorGlassMat);
    mirrorGlass.position.set(0, 0, -0.016);
    mirrorGlass.rotation.y = Math.PI;
    mirrorFrame.add(mirrorGlass);
    chassis.add(mirrorFrame);

    // ── 7. Chrome Circular Air Conditioning Vents ──
    [-w * 0.42, w * 0.42].forEach(vx => {
      const ventGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
      ventGeo.rotateX(Math.PI / 2);
      const vent = new THREE.Mesh(ventGeo, chromeMat);
      vent.position.set(vx, fpv.y - 0.15, fpv.z + 0.42);
      chassis.add(vent);
    });

    // ── 8. Interactive 3D Realistic Sport Steering Wheel Mesh ──
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'steeringWheelMesh';
    wheelGroup.position.set(fpv.x, fpv.y - 0.16, fpv.z + 0.28);

    // Outer Grip Ring (Leather wrap with grip notches)
    const ringGeo = new THREE.TorusGeometry(0.18, 0.024, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.4, metalness: 0.15 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    wheelGroup.add(ringMesh);

    // 3-Spoke Sport Hub & Center Horn with Logo
    const centerHubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.03, 16);
    centerHubGeo.rotateX(Math.PI / 2);
    const centerHub = new THREE.Mesh(centerHubGeo, darkMat);
    wheelGroup.add(centerHub);

    // 3 Chrome Spokes (Left, Right, Bottom)
    [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(spAngle => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.15, 0.015), chromeMat);
      spoke.position.set(Math.sin(spAngle) * 0.08, Math.cos(spAngle) * 0.08, 0);
      spoke.rotation.z = -spAngle;
      wheelGroup.add(spoke);
    });

    // Left & Right Paddle Shifters behind wheel
    [-0.14, 0.14].forEach(px => {
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.01), chromeMat);
      paddle.position.set(px, 0.02, -0.03);
      wheelGroup.add(paddle);
    });

    chassis.add(wheelGroup);
  }
}
