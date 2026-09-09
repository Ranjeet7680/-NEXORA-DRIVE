import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class VehicleBuilder {
  static createVehicleMesh(config, customUpgrades = {}) {
    const group = new THREE.Group();
    group.name = `vehicle_${config.id}`;

    // Base Color Determination (Default: Brooklyn Grey Metallic like BMW reference photo)
    let colorHex = customUpgrades.color;
    if (!colorHex) {
      if (config.id === 'taxi') colorHex = 0xffbe0b;
      else if (config.id === 'police') colorHex = 0x0f172a;
      else if (config.id === 'bus') colorHex = 0x0284c7;
      else if (config.id === 'truck') colorHex = 0x334155;
      else if (config.id === 'suv') colorHex = 0x2e3846;
      else if (config.id === 'bike') colorHex = 0xd90429;
      else colorHex = 0x1d4ed8; // Deep vibrant BMW M Performance Blue!
    }
    
    // PBR Material Finish Selection
    const finish = customUpgrades.finish || 'gloss';
    let roughness = 0.35;
    let metalness = 0.40;
    if (finish === 'matte') { roughness = 0.82; metalness = 0.08; }
    else if (finish === 'metallic') { roughness = 0.22; metalness = 0.60; }
    else if (finish === 'carbon') { roughness = 0.38; metalness = 0.45; }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: roughness,
      metalness: metalness
    });

    const bodyAccentMaterial = new THREE.MeshStandardMaterial({
      color: (config.id === 'police') ? 0xffffff : 0x111318, // Gloss Shadowline Black
      roughness: 0.30,
      metalness: 0.35
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x111c28,
      transparent: true,
      opacity: 0.70,
      roughness: 0.15,
      metalness: 0.45
    });

    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.55, metalness: 0.4 });
    const carbonMaterial = new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.35, metalness: 0.8 });
    const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.08, metalness: 0.98 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3.2 });
    const brakeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff1122, emissive: 0xee0011, emissiveIntensity: 2.5 });
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff7700, emissiveIntensity: 0.0 });
    const interiorLeatherMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.65, metalness: 0.1 });
    const blueCaliperMat = new THREE.MeshStandardMaterial({ color: 0x0055b8, roughness: 0.2, metalness: 0.85 }); // BMW M Sport Blue Caliper
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e2, roughness: 0.25, metalness: 0.95 });

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
      case 'mustang':
        VehicleBuilder.buildMustangBody(chassis, config, bodyMaterial, bodyAccentMaterial, glassMaterial, darkMaterial, carbonMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial, interiorLeatherMat, customUpgrades);
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

    // ── Detailed BMW M Sport Bicolour Alloy Wheels ──
    const rimSizeInches = customUpgrades.rimSize || 19;
    const rimScale = rimSizeInches / 19;
    
    const wheels = [];
    const wheelPositions = VehicleBuilder.getWheelPositions(config);
    const bmwEmblemTex = TextureGenerator.createBmwEmblemTexture();

    wheelPositions.forEach((pos, wIdx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);
      wheelGroup.name = `wheel_${wIdx}`;

      const r = config.wheelRadius * rimScale;
      const w = config.id === 'bike' ? 0.13 : (config.id === 'truck' ? 0.38 : (config.id === 'bus' ? 0.34 : 0.26));
      
      const spinHub = new THREE.Group();
      spinHub.name = 'spinHub';

      // 1. Rubber Performance Low-Profile Tire
      const tireGeo = new THREE.CylinderGeometry(r, r, w, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, darkMaterial);
      tireMesh.castShadow = true;
      spinHub.add(tireMesh);

      // 2. High-Tech BMW M Double-Spoke Bicolour Diamond Cut Rim
      const rimOuterGeo = new THREE.CylinderGeometry(r * 0.76, r * 0.76, w + 0.015, 16);
      rimOuterGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimOuterGeo, darkMaterial);
      spinHub.add(rimMesh);

      // 3. BMW Center Roundel Wheel Cap
      const hubCapGeo = new THREE.CylinderGeometry(r * 0.24, r * 0.24, w + 0.028, 16);
      hubCapGeo.rotateZ(Math.PI / 2);
      const hubCapMat = new THREE.MeshBasicMaterial({ map: bmwEmblemTex });
      const hubCap = new THREE.Mesh(hubCapGeo, hubCapMat);
      spinHub.add(hubCap);

      // 4. Diamond-Cut M Double-Spokes (5 Y-spoke pairs)
      for (let sp = 0; sp < 5; sp++) {
        const spokeAngle = (sp / 5) * Math.PI * 2;
        [-0.04, 0.04].forEach(spOff => {
          const spokeGeo = new THREE.BoxGeometry(w + 0.025, r * 0.68, 0.032);
          const spoke = new THREE.Mesh(spokeGeo, chromeMaterial);
          spoke.position.set(0, Math.cos(spokeAngle) * (r * 0.36) + spOff, Math.sin(spokeAngle) * (r * 0.36));
          spoke.rotation.x = spokeAngle;
          spinHub.add(spoke);
        });
      }

      wheelGroup.add(spinHub);

      // 5. Ventilated Steel Cross-Drilled Brake Rotor Disc
      if (config.id !== 'bike') {
        const rotorGeo = new THREE.CylinderGeometry(r * 0.64, r * 0.64, 0.03, 16);
        rotorGeo.rotateZ(Math.PI / 2);
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.x = (pos.x > 0 ? -0.05 : 0.05);
        wheelGroup.add(rotor);

        // 6. BMW M-Sport Blue Brake Caliper
        const caliperGeo = new THREE.BoxGeometry(0.06, r * 0.36, r * 0.24);
        const caliper = new THREE.Mesh(caliperGeo, blueCaliperMat);
        caliper.position.set(pos.x > 0 ? -0.05 : 0.05, r * 0.38, 0);
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

    // Ensure all vehicle types have interactive brake lights meshes
    let brakeLights = chassis.userData.brakeLights;
    if (!brakeLights || brakeLights.length === 0) {
      const bGeo = new THREE.BoxGeometry(0.18, 0.08, 0.04);
      const bLeft = new THREE.Mesh(bGeo, brakeLightMaterial.clone());
      const bRight = new THREE.Mesh(bGeo, brakeLightMaterial.clone());
      const rearZ = -config.dimensions.length * 0.48;
      bLeft.position.set(-headX, headY, rearZ);
      bRight.position.set(headX, headY, rearZ);
      chassis.add(bLeft);
      chassis.add(bRight);
      brakeLights = [bLeft, bRight];
      chassis.userData.brakeLights = brakeLights;
    }

    // Ensure all vehicle types have interactive turn indicator meshes
    let indicators = chassis.userData.indicators;
    if (!indicators || indicators.length === 0) {
      const indGeo = new THREE.BoxGeometry(0.08, 0.04, 0.04);
      const indL = new THREE.Mesh(indGeo, indicatorMaterial.clone());
      const indR = new THREE.Mesh(indGeo, indicatorMaterial.clone());
      indL.position.set(-headX, headY - 0.1, headZ + 0.02);
      indR.position.set(headX, headY - 0.1, headZ + 0.02);
      chassis.add(indL);
      chassis.add(indR);
      indicators = [indL, indR];
      chassis.userData.indicators = indicators;
    }

    group.userData = {
      chassis,
      wheels,
      headlights: [headlightLeft, headlightRight],
      lightBeams: [beamLeft, beamRight],
      interiorLight: domeLight,
      rearBrakeLight,
      brakeLights,
      indicators,
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
  // 1. AUTHENTIC BMW 5 SERIES / i5 / M5 SPORT LUXURY SEDAN
  // ═════════════════════════════════════════════════════════════════════════
  static buildSedanBody(chassis, config, bodyMat, accentMat, glassMat, darkMat, carbonMat, chromeMat, lightMat, brakeMat, indicatorMat, leatherMat, customUpgrades) {
    const { length, width, height } = config.dimensions;

    const bmwEmblemTex = TextureGenerator.createBmwEmblemTexture();
    const licensePlateTex = TextureGenerator.createLicensePlateTexture('M DC 4628 E');
    const leftKidneyTex = TextureGenerator.createBmwKidneyTexture(false);
    const rightKidneyTex = TextureGenerator.createBmwKidneyTexture(true);

    // ── 1. Main BMW Monocoque Body Shell & Floorpan ──
    const lowerGeo = new THREE.BoxGeometry(width * 0.98, height * 0.34, length * 0.98);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.y = height * 0.28;
    lowerMesh.castShadow = true;
    chassis.add(lowerMesh);

    // M Sport Gloss Black Lower Rocker Panel Side Skirts (Left & Right)
    [-width * 0.495, width * 0.495].forEach(sx => {
      const skirtGeo = new THREE.BoxGeometry(0.06, 0.08, length * 0.72);
      const skirt = new THREE.Mesh(skirtGeo, accentMat);
      skirt.position.set(sx, height * 0.14, 0);
      chassis.add(skirt);
    });

    // ── 2. Iconic BMW Twin Kidney Grilles with M Badge ──
    const kidneyW = width * 0.25;
    const kidneyH = height * 0.22;
    const kidneyZ = length * 0.505;

    // Left Kidney Grille
    const leftKidneyGeo = new THREE.PlaneGeometry(kidneyW, kidneyH);
    const leftKidneyMat = new THREE.MeshBasicMaterial({ map: leftKidneyTex, side: THREE.DoubleSide });
    const leftKidney = new THREE.Mesh(leftKidneyGeo, leftKidneyMat);
    leftKidney.position.set(-kidneyW * 0.54, height * 0.38, kidneyZ);
    chassis.add(leftKidney);

    // Right Kidney Grille (with ///M Badge)
    const rightKidneyGeo = new THREE.PlaneGeometry(kidneyW, kidneyH);
    const rightKidneyMat = new THREE.MeshBasicMaterial({ map: rightKidneyTex, side: THREE.DoubleSide });
    const rightKidney = new THREE.Mesh(rightKidneyGeo, rightKidneyMat);
    rightKidney.position.set(kidneyW * 0.54, height * 0.38, kidneyZ);
    chassis.add(rightKidney);

    // Gloss Black & Chrome Kidney Surrounding Outer Bezel
    const kidneyBezelGeo = new THREE.BoxGeometry(kidneyW * 2.22, kidneyH * 1.08, 0.04);
    const kidneyBezel = new THREE.Mesh(kidneyBezelGeo, accentMat);
    kidneyBezel.position.set(0, height * 0.38, kidneyZ - 0.02);
    chassis.add(kidneyBezel);

    // ── 3. BMW Roundel Emblem on Hood & Rear Trunk ──
    const emblemGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16);
    emblemGeo.rotateX(Math.PI / 2);
    const emblemMat = new THREE.MeshBasicMaterial({ map: bmwEmblemTex });

    // Front Hood BMW Badge
    const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
    frontEmblem.position.set(0, height * 0.525, length * 0.44);
    frontEmblem.rotation.x = -0.22;
    chassis.add(frontEmblem);

    // Rear Trunk BMW Badge
    const rearEmblem = new THREE.Mesh(emblemGeo, emblemMat);
    rearEmblem.position.set(0, height * 0.54, -length * 0.495);
    chassis.add(rearEmblem);

    // ── 4. Sculpted BMW Hood (Power Dome with 4 Dynamic Crease Lines) ──
    const hoodGeo = new THREE.BoxGeometry(width * 0.92, height * 0.12, length * 0.38);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
    hoodMesh.position.set(0, height * 0.46, length * 0.26);
    hoodMesh.castShadow = true;
    chassis.add(hoodMesh);

    // BMW Power Dome Creases radiating from kidneys to A-pillars
    [-width * 0.16, width * 0.16].forEach(cx => {
      const creaseGeo = new THREE.BoxGeometry(0.03, 0.025, length * 0.36);
      const crease = new THREE.Mesh(creaseGeo, bodyMat);
      crease.position.set(cx, height * 0.528, length * 0.25);
      crease.rotation.x = -0.06;
      chassis.add(crease);
    });

    // ── 5. M Sport Front Apron & European License Plate ──
    // Gloss Black Lower Center Trapezoidal Air Intake
    const lowerIntakeGeo = new THREE.BoxGeometry(width * 0.60, height * 0.16, 0.08);
    const lowerIntake = new THREE.Mesh(lowerIntakeGeo, accentMat);
    lowerIntake.position.set(0, height * 0.18, length * 0.495);
    chassis.add(lowerIntake);

    // European License Plate (M DC 4628 E)
    const plateGeo = new THREE.PlaneGeometry(0.48, 0.11);
    const plateMat = new THREE.MeshBasicMaterial({ map: licensePlateTex, side: THREE.DoubleSide });
    const licensePlate = new THREE.Mesh(plateGeo, plateMat);
    licensePlate.position.set(0, height * 0.22, length * 0.536);
    chassis.add(licensePlate);

    // Left & Right M Sport Triangular Air Curtains
    [-width * 0.38, width * 0.38].forEach(vx => {
      const ventGeo = new THREE.BoxGeometry(width * 0.14, height * 0.20, 0.06);
      const vent = new THREE.Mesh(ventGeo, accentMat);
      vent.position.set(vx, height * 0.24, length * 0.485);
      chassis.add(vent);
    });

    // ── 6. BMW Laser Light Angel-Eye Headlights (Double LED DRL Slash Bars) ──
    const headBulbGeo = new THREE.BoxGeometry(width * 0.22, height * 0.10, 0.08);
    const headL = new THREE.Mesh(headBulbGeo, lightMat);
    const headR = new THREE.Mesh(headBulbGeo, lightMat);
    headL.position.set(-width * 0.34, height * 0.39, length * 0.485);
    headR.position.set(width * 0.34, height * 0.39, length * 0.485);
    chassis.add(headL);
    chassis.add(headR);

    // Blue Laser Light Accents inside Headlights
    const laserMat = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0066ff, emissiveIntensity: 3.5 });
    [-width * 0.34, width * 0.34].forEach(lx => {
      const laserAcc = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), laserMat);
      laserAcc.position.set(lx, height * 0.41, length * 0.495);
      chassis.add(laserAcc);
    });

    // Amber Corner Turn Indicators
    const indGeo = new THREE.BoxGeometry(width * 0.06, height * 0.06, 0.06);
    const indFL = new THREE.Mesh(indGeo, indicatorMat);
    const indFR = new THREE.Mesh(indGeo, indicatorMat);
    indFL.position.set(-width * 0.46, height * 0.39, length * 0.46);
    indFR.position.set(width * 0.46, height * 0.39, length * 0.46);
    chassis.add(indFL);
    chassis.add(indFR);

    // ── 7. Hollow Cockpit Roof, Windshield & Hofmeister Kink Window Trim ──
    // Gloss Black M Shadowline Thin Roof Slab
    const roofGeo = new THREE.BoxGeometry(width * 0.84, 0.04, length * 0.44);
    const roofMesh = new THREE.Mesh(roofGeo, (config.id === 'police') ? accentMat : carbonMat);
    roofMesh.position.set(0, height * 0.94, -length * 0.06);
    roofMesh.castShadow = true;
    chassis.add(roofMesh);

    // A-Pillars
    [-width * 0.41, width * 0.41].forEach(ax => {
      const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.045, height * 0.45, 0.055), bodyMat);
      aPillar.position.set(ax, height * 0.68, length * 0.08);
      aPillar.rotation.x = -0.42;
      chassis.add(aPillar);
    });

    // C-Pillars with BMW Hofmeister Kink
    [-width * 0.41, width * 0.41].forEach(cx => {
      const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, height * 0.45, 0.06), bodyMat);
      cPillar.position.set(cx, height * 0.68, -length * 0.22);
      cPillar.rotation.x = 0.42;
      chassis.add(cPillar);
    });

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, height * 0.44, 0.02), glassMat);
    windshield.position.set(0, height * 0.70, length * 0.12);
    windshield.rotation.x = -0.40;
    chassis.add(windshield);

    // Rear Windshield
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.80, height * 0.40, 0.02), glassMat);
    rearGlass.position.set(0, height * 0.70, -length * 0.24);
    rearGlass.rotation.x = 0.40;
    chassis.add(rearGlass);

    // Side Windows with Shadowline Gloss Black Trim
    [-width * 0.43, width * 0.43].forEach(wx => {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, height * 0.36, length * 0.36), glassMat);
      sideGlass.position.set(wx, height * 0.70, -length * 0.06);
      chassis.add(sideGlass);

      // BMW M Aerodynamic Winged Double-Stalk Side Mirrors
      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.075, 0.16), (config.id === 'police') ? accentMat : carbonMat);
      mirrorHousing.position.set(wx > 0 ? wx + 0.10 : wx - 0.10, height * 0.61, length * 0.15);
      chassis.add(mirrorHousing);

      const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.14), chromeMat);
      mirrorGlass.position.set(wx > 0 ? wx + 0.095 : wx - 0.095, height * 0.61, length * 0.15);
      mirrorGlass.rotation.y = wx > 0 ? -Math.PI / 2 : Math.PI / 2;
      chassis.add(mirrorGlass);

      // Flush Aerodynamic Door Handles
      [-length * 0.02, -length * 0.18].forEach(dz => {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.09), accentMat);
        handle.position.set(wx > 0 ? wx + 0.01 : wx - 0.01, height * 0.48, dz);
        chassis.add(handle);
      });
    });

    // ── 8. Rear End: BMW L-Shape Horizontal Slim Taillights & M Diffuser ──
    const brakeBulbGeo = new THREE.BoxGeometry(width * 0.36, height * 0.08, 0.06);
    const brakeL = new THREE.Mesh(brakeBulbGeo, brakeMat);
    const brakeR = new THREE.Mesh(brakeBulbGeo, brakeMat);
    brakeL.position.set(-width * 0.28, height * 0.49, -length * 0.495);
    brakeR.position.set(width * 0.28, height * 0.49, -length * 0.495);
    chassis.add(brakeL);
    chassis.add(brakeR);

    // Integrated Trunk Lip Spoiler (M Carbon Ducktail)
    const trunkLip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, 0.03, 0.08), carbonMat);
    trunkLip.position.set(0, height * 0.56, -length * 0.49);
    chassis.add(trunkLip);

    // Rear European License Plate
    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, height * 0.36, -length * 0.505);
    rearPlate.rotation.y = Math.PI;
    chassis.add(rearPlate);

    // Gloss Black M Rear Diffuser with Quad Exhausts
    const diffuserGeo = new THREE.BoxGeometry(width * 0.88, height * 0.16, length * 0.12);
    const diffuser = new THREE.Mesh(diffuserGeo, accentMat);
    diffuser.position.set(0, height * 0.18, -length * 0.48);
    chassis.add(diffuser);

    // Quad Chrome/Titanium Exhaust Tips
    [-0.30, -0.20, 0.20, 0.30].forEach(ex => {
      const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16);
      exhaustGeo.rotateX(Math.PI / 2);
      const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.95, roughness: 0.15 });
      const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat);
      exhaustMesh.position.set(ex * width, height * 0.18, -length * 0.52);
      chassis.add(exhaustMesh);
    });

    chassis.userData.brakeLights = [brakeL, brakeR];
    chassis.userData.indicators = [indFL, indFR];

    // ── Optional M Performance Carbon Wing ──
    const spoilerLevel = customUpgrades.spoiler || 'none';
    if (spoilerLevel !== 'none') {
      const wingW = width * 0.88;
      const wingH = spoilerLevel === 'carbon_wing' ? 0.28 : 0.14;
      
      [-width * 0.24, width * 0.24].forEach(sx => {
        const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.035, wingH, 0.12), carbonMat);
        stanchion.position.set(sx, height * 0.54 + wingH * 0.5, -length * 0.44);
        chassis.add(stanchion);
      });

      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.035, 0.22), carbonMat);
      wingBlade.position.set(0, height * 0.54 + wingH, -length * 0.44);
      wingBlade.rotation.x = -0.06;
      wingBlade.castShadow = true;
      chassis.add(wingBlade);
    }

    // ── Special Edition: Police Cruiser Siren & Push Bumper ──
    if (config.id === 'police') {
      const pushBarGeo = new THREE.BoxGeometry(width * 0.65, height * 0.35, 0.08);
      const pushBar = new THREE.Mesh(pushBarGeo, darkMat);
      pushBar.position.set(0, height * 0.30, length * 0.53);
      chassis.add(pushBar);

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

    // ── Add Full BMW Cockpit Interior ──
    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. FORD MUSTANG GT3 / 1969 BOSS 302 V8 MUSCLE RACE CAR
  // ═════════════════════════════════════════════════════════════════════════
  static buildMustangBody(chassis, config, bodyMat, accentMat, glassMat, darkMat, carbonMat, chromeMat, lightMat, brakeMat, indicatorMat, leatherMat, customUpgrades) {
    const { length, width, height } = config.dimensions;

    // ── 1. Widebody Muscle Tub & Flared GT3 Fenders ──
    const lowerGeo = new THREE.BoxGeometry(width * 0.98, height * 0.36, length * 0.98);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.y = height * 0.28;
    lowerMesh.castShadow = true;
    chassis.add(lowerMesh);

    // Flared GT3 Widebody Wheel Arches (Front & Rear)
    [-width * 0.495, width * 0.495].forEach(fx => {
      const archF = new THREE.Mesh(new THREE.BoxGeometry(0.08, height * 0.26, length * 0.28), bodyMat);
      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.08, height * 0.26, length * 0.30), bodyMat);
      archF.position.set(fx, height * 0.30, length * 0.28);
      archR.position.set(fx, height * 0.30, -length * 0.26);
      chassis.add(archF);
      chassis.add(archR);
    });

    // Front Carbon GT3 Aerodynamic Splitter & Dive Planes (Canards)
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.04, length * 0.18), carbonMat);
    splitter.position.set(0, height * 0.10, length * 0.49);
    splitter.castShadow = true;
    chassis.add(splitter);

    // Dual Aero Canards / Dive Planes
    [-width * 0.48, width * 0.48].forEach(cx => {
      const canard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.16), carbonMat);
      canard.position.set(cx, height * 0.26, length * 0.48);
      canard.rotation.z = cx > 0 ? 0.3 : -0.3;
      chassis.add(canard);
    });

    // ── 2. Iconic Mustang Wide Hexagonal Grille & Galloping Pony Badge ──
    const grille = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, height * 0.28, 0.08), darkMat);
    grille.position.set(0, height * 0.34, length * 0.505);
    chassis.add(grille);

    // Chrome Galloping Pony Emblem in center of Grille
    const ponyBadge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.04), chromeMat);
    ponyBadge.position.set(0, height * 0.34, length * 0.54);
    chassis.add(ponyBadge);

    // ── 3. Power Bulge Hood with Dual Black Heat Extractor Louvers ──
    const hoodGeo = new THREE.BoxGeometry(width * 0.92, height * 0.14, length * 0.42);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
    hoodMesh.position.set(0, height * 0.47, length * 0.26);
    hoodMesh.castShadow = true;
    chassis.add(hoodMesh);

    // Dual Black Racing Stripes along Hood
    [-width * 0.10, width * 0.10].forEach(sx => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.08, 0.015, length * 0.42), accentMat);
      stripe.position.set(sx, height * 0.545, length * 0.26);
      chassis.add(stripe);
    });

    // Dual Hood Air Extraction Louvers
    [-width * 0.24, width * 0.24].forEach(vx => {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(width * 0.14, 0.025, length * 0.14), carbonMat);
      vent.position.set(vx, height * 0.545, length * 0.22);
      chassis.add(vent);
    });

    // ── 4. Iconic Tri-Bar LED Headlights (|||   |||) ──
    [-width * 0.36, width * 0.36].forEach(hx => {
      // Main Headlight Housing
      const housing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, height * 0.12, 0.08), darkMat);
      housing.position.set(hx, height * 0.39, length * 0.485);
      chassis.add(housing);

      // 3 Vertical Tri-Bar LED Daytime Running Light Slats
      for (let b = -1; b <= 1; b++) {
        const triBar = new THREE.Mesh(new THREE.BoxGeometry(0.022, height * 0.08, 0.04), lightMat);
        triBar.position.set(hx + b * 0.045, height * 0.39, length * 0.525);
        chassis.add(triBar);
      }
    });

    // Amber Corner Turn Indicators
    const indGeo = new THREE.BoxGeometry(width * 0.06, height * 0.06, 0.06);
    const indFL = new THREE.Mesh(indGeo, indicatorMat);
    const indFR = new THREE.Mesh(indGeo, indicatorMat);
    indFL.position.set(-width * 0.47, height * 0.39, length * 0.46);
    indFR.position.set(width * 0.47, height * 0.39, length * 0.46);
    chassis.add(indFL);
    chassis.add(indFR);

    // ── 5. Fastback Coupe Roof, Windshield & Boss 302 Louvers ──
    const roofGeo = new THREE.BoxGeometry(width * 0.82, 0.04, length * 0.42);
    const roofMesh = new THREE.Mesh(roofGeo, carbonMat);
    roofMesh.position.set(0, height * 0.94, -length * 0.06);
    roofMesh.castShadow = true;
    chassis.add(roofMesh);

    // Dual Racing Stripes along Roof
    [-width * 0.10, width * 0.10].forEach(sx => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.08, 0.015, length * 0.42), accentMat);
      stripe.position.set(sx, height * 0.965, -length * 0.06);
      chassis.add(stripe);
    });

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.80, height * 0.44, 0.02), glassMat);
    windshield.position.set(0, height * 0.70, length * 0.12);
    windshield.rotation.x = -0.42;
    chassis.add(windshield);

    // Fastback Rear Window
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, height * 0.45, 0.02), glassMat);
    rearGlass.position.set(0, height * 0.68, -length * 0.24);
    rearGlass.rotation.x = 0.48;
    chassis.add(rearGlass);

    // Side Windows
    [-width * 0.42, width * 0.42].forEach(wx => {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, height * 0.34, length * 0.34), glassMat);
      sideGlass.position.set(wx, height * 0.70, -length * 0.06);
      chassis.add(sideGlass);

      // Carbon Racing Mirrors
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.14), carbonMat);
      mirror.position.set(wx > 0 ? wx + 0.08 : wx - 0.08, height * 0.60, length * 0.14);
      chassis.add(mirror);
    });

    // ── 6. Tri-Bar Vertical LED Taillights (|||   |||) ──
    const brakeLightsArr = [];
    [-width * 0.32, width * 0.32].forEach(tx => {
      const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.22, height * 0.18, 0.06), darkMat);
      tailHousing.position.set(tx, height * 0.48, -length * 0.495);
      chassis.add(tailHousing);

      // 3 Vertical Red LED Bars per side
      for (let t = -1; t <= 1; t++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, height * 0.14, 0.04), brakeMat);
        bar.position.set(tx + t * 0.05, height * 0.48, -length * 0.525);
        chassis.add(bar);
        brakeLightsArr.push(bar);
      }
    });

    chassis.userData.brakeLights = brakeLightsArr;
    chassis.userData.indicators = [indFL, indFR];

    // ── 7. Massive GT3 Carbon Swan-Neck Rear Wing ──
    const wingW = width * 0.96;
    const wingH = 0.38;
    [-width * 0.26, width * 0.26].forEach(sx => {
      const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.04, wingH, 0.16), carbonMat);
      stanchion.position.set(sx, height * 0.52 + wingH * 0.5, -length * 0.44);
      stanchion.rotation.x = 0.12;
      chassis.add(stanchion);
    });

    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.04, 0.28), carbonMat);
    wingBlade.position.set(0, height * 0.52 + wingH, -length * 0.44);
    wingBlade.rotation.x = -0.10;
    wingBlade.castShadow = true;
    chassis.add(wingBlade);

    // Wing Endplates
    [-wingW * 0.5, wingW * 0.5].forEach(wx => {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.20, 0.32), carbonMat);
      endplate.position.set(wx, height * 0.52 + wingH, -length * 0.44);
      chassis.add(endplate);
    });

    // ── 8. Carbon Rear Diffuser & Quad Titanium Exhaust Tips ──
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(width * 0.90, height * 0.18, length * 0.14), carbonMat);
    diffuser.position.set(0, height * 0.16, -length * 0.48);
    chassis.add(diffuser);

    [-0.32, -0.22, 0.22, 0.32].forEach(ex => {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16), chromeMat);
      exhaust.rotateX(Math.PI / 2);
      exhaust.position.set(ex * width, height * 0.18, -length * 0.54);
      chassis.add(exhaust);
    });

    // Add Cockpit Interior
    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat, leatherMat);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. HEAVY-DUTY SEMI TRUCK + ARTICULATED CARGO FREIGHT TRAILER
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
