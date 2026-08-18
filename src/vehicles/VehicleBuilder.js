import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class VehicleBuilder {
  static createVehicleMesh(config, customUpgrades = {}) {
    const group = new THREE.Group();
    group.name = `vehicle_${config.id}`;

    const colorHex = customUpgrades.color || (config.id === 'taxi' ? 0xffbb00 : (config.id === 'police' ? 0x111122 : 0xcc2200)); // Default sporty red like reference
    
    // PBR Material Finish Selection
    const finish = customUpgrades.finish || 'gloss';
    let roughness = 0.25;
    let metalness = 0.7;
    if (finish === 'matte') { roughness = 0.85; metalness = 0.1; }
    else if (finish === 'metallic') { roughness = 0.15; metalness = 0.95; }
    else if (finish === 'carbon') { roughness = 0.4; metalness = 0.8; }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: roughness,
      metalness: metalness
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
      metalness: 0.9,
      transmission: 0.85,
      side: THREE.DoubleSide
    });

    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.7 });
    const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.1, metalness: 0.95 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 2.5 });
    const brakeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 2.0 });
    const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.0 });

    // Chassis Base Group
    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    group.add(chassis);

    // Build specific body depending on type
    switch (config.id) {
      case 'car':
      case 'taxi':
      case 'police':
        VehicleBuilder.buildSedanBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial, customUpgrades);
        break;
      case 'bus':
        VehicleBuilder.buildBusBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial);
        break;
      case 'bike':
        VehicleBuilder.buildBikeBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial);
        break;
      case 'truck':
        VehicleBuilder.buildTruckBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial);
        break;
      case 'suv':
        VehicleBuilder.buildSuvBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, indicatorMaterial);
        break;
    }

    // Add Wheels
    const rimSizeInches = customUpgrades.rimSize || 17;
    const rimScale = rimSizeInches / 17;
    
    const wheels = [];
    const wheelPositions = VehicleBuilder.getWheelPositions(config);

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      const r = config.wheelRadius * rimScale;
      const w = config.id === 'bike' ? 0.12 : (config.id === 'truck' ? 0.35 : 0.25);
      
      const tireGeo = new THREE.CylinderGeometry(r, r, w, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, darkMaterial);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Rim
      const rimGeo = new THREE.CylinderGeometry(r * 0.65, r * 0.65, w + 0.01, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, chromeMaterial);
      wheelGroup.add(rimMesh);

      group.add(wheelGroup);
      wheels.push(wheelGroup);
    });

    // ── 1. Real-Time Neon Underglow Kit (Always Active with Glow on Asphalt) ──
    const underColor = customUpgrades.underglowHex || 0x00f0ff;
    const glowGeo = new THREE.PlaneGeometry(config.dimensions.width * 1.3, config.dimensions.length * 1.15);
    glowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: underColor,
      transparent: true,
      opacity: 0.75,
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

    // ── 2. Functional High-Power Dual Headlights (Spotlights) ──
    const headZ = config.dimensions.length * 0.5;
    const headX = config.dimensions.width * 0.35;
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

    // Front Headlight Lens Flare Bulbs (Super bright white-yellow glow)
    const haloGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const haloL = new THREE.Mesh(haloGeo, haloMat);
    const haloR = new THREE.Mesh(haloGeo, haloMat);
    haloL.position.set(-headX, headY, headZ + 0.05);
    haloR.position.set(headX, headY, headZ + 0.05);
    chassis.add(haloL);
    chassis.add(haloR);

    // ── 3. Volumetric Forward Light Beams (Subtle & Off by default in daytime) ──
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

    // ── 4. Cockpit Interior Lighting (Dome light + Dashboard backlights) ──
    const fpv = config.cameraOffsets.fpv;
    const domeLight = new THREE.PointLight(0xfffaee, 1.2, 3.5);
    domeLight.position.set(0, fpv.y + 0.22, fpv.z);
    chassis.add(domeLight);

    const dashBacklight = new THREE.PointLight(0x00f0ff, 1.5, 2.5);
    dashBacklight.position.set(fpv.x, fpv.y - 0.1, fpv.z + 0.25);
    chassis.add(dashBacklight);

    // ── 5. Rear Taillight & Brake PointLight ──
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
      return [{ x: 0, y: r, z: halfL }, { x: 0, y: r, z: -halfL }];
    }

    if (config.id === 'bus' || config.id === 'truck') {
      return [
        { x: -halfW, y: r, z: halfL }, { x: halfW, y: r, z: halfL },
        { x: -halfW, y: r, z: -halfL }, { x: halfW, y: r, z: -halfL },
        { x: -halfW, y: r, z: -halfL * 1.5 }, { x: halfW, y: r, z: -halfL * 1.5 }
      ];
    }

    return [
      { x: -halfW, y: r, z: halfL }, { x: halfW, y: r, z: halfL },
      { x: -halfW, y: r, z: -halfL }, { x: halfW, y: r, z: -halfL }
    ];
  }

  static buildSedanBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat, customUpgrades) {
    const { length, width, height } = config.dimensions;

    // Body Lower Chassis
    const lowerGeo = new THREE.BoxGeometry(width, height * 0.4, length);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.y = height * 0.35;
    lowerMesh.castShadow = true;
    chassis.add(lowerMesh);

    // Hood Bonnet (Sleek red front)
    const hoodGeo = new THREE.BoxGeometry(width * 0.94, height * 0.12, length * 0.4);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
    hoodMesh.position.set(0, height * 0.52, length * 0.28);
    chassis.add(hoodMesh);

    // Hollow Roof Slab & A/B/C Pillars (Open interior for FPV Driver View)
    const roofGeo = new THREE.BoxGeometry(width * 0.86, 0.04, length * 0.42);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMat);
    roofMesh.position.set(0, height * 0.94, -length * 0.06);
    roofMesh.castShadow = true;
    chassis.add(roofMesh);

    // Rear Windshield Glass
    const rearGlassGeo = new THREE.BoxGeometry(width * 0.82, height * 0.38, 0.03);
    const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
    rearGlass.position.set(0, height * 0.72, -length * 0.28);
    rearGlass.rotation.x = 0.38;
    chassis.add(rearGlass);

    // Front Windshield Glass (Clear view for driver)
    const windshieldGeo = new THREE.BoxGeometry(width * 0.85, height * 0.44, 0.02);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, height * 0.72, length * 0.16);
    windshield.rotation.x = -0.38;
    chassis.add(windshield);

    // Windshield Wiper Mesh
    const wiperGeo = new THREE.BoxGeometry(width * 0.5, 0.03, 0.03);
    const wiperMesh = new THREE.Mesh(wiperGeo, darkMat);
    wiperMesh.name = 'wiperMesh';
    wiperMesh.position.set(0, height * 0.58, length * 0.22);
    chassis.add(wiperMesh);

    // Headlights Mesh Bulbs (Front)
    const headBulbGeo = new THREE.BoxGeometry(width * 0.22, height * 0.15, 0.1);
    const headL = new THREE.Mesh(headBulbGeo, lightMat);
    const headR = new THREE.Mesh(headBulbGeo, lightMat);
    headL.position.set(-width * 0.32, height * 0.35, length * 0.5);
    headR.position.set(width * 0.32, height * 0.35, length * 0.5);
    chassis.add(headL);
    chassis.add(headR);

    // Turn Indicators Bulbs (Front corners)
    const indGeo = new THREE.BoxGeometry(width * 0.1, height * 0.1, 0.1);
    const indFL = new THREE.Mesh(indGeo, indicatorMat);
    const indFR = new THREE.Mesh(indGeo, indicatorMat);
    indFL.position.set(-width * 0.46, height * 0.35, length * 0.48);
    indFR.position.set(width * 0.46, height * 0.35, length * 0.48);
    chassis.add(indFL);
    chassis.add(indFR);

    // Brake Lights Mesh Bulbs (Rear)
    const brakeL = new THREE.Mesh(headBulbGeo, brakeMat);
    const brakeR = new THREE.Mesh(headBulbGeo, brakeMat);
    brakeL.position.set(-width * 0.32, height * 0.4, -length * 0.5);
    brakeR.position.set(width * 0.32, height * 0.4, -length * 0.5);
    chassis.add(brakeL);
    chassis.add(brakeR);

    chassis.userData.brakeLights = [brakeL, brakeR];
    chassis.userData.indicators = [indFL, indFR];

    // Modular 3D Spoiler Attachment
    if (customUpgrades.spoiler && customUpgrades.spoiler !== 'none') {
      const spHeight = customUpgrades.spoiler === 'carbon_wing' ? 0.3 : 0.15;
      const spGeo = new THREE.BoxGeometry(width * 0.9, 0.05, 0.25);
      const spMat = customUpgrades.spoiler === 'carbon_wing' ? darkMat : bodyMat;
      const spMesh = new THREE.Mesh(spGeo, spMat);
      spMesh.position.set(0, height * 0.65 + spHeight, -length * 0.45);
      chassis.add(spMesh);
    }

    // Cockpit & Driver Hands & Tablet
    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat);
  }

  static buildBusBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat) {
    const { length, width, height } = config.dimensions;
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.85, length);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = height * 0.5;
    chassis.add(bodyMesh);

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat);
  }

  static buildBikeBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat) {
    const { length, width, height } = config.dimensions;
    const tankGeo = new THREE.BoxGeometry(width, height * 0.4, length * 0.5);
    const tankMesh = new THREE.Mesh(tankGeo, bodyMat);
    tankMesh.position.set(0, height * 0.65, 0);
    chassis.add(tankMesh);
  }

  static buildTruckBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat) {
    const { length, width, height } = config.dimensions;
    const cabGeo = new THREE.BoxGeometry(width, height * 0.7, length * 0.4);
    const cabMesh = new THREE.Mesh(cabGeo, bodyMat);
    cabMesh.position.set(0, height * 0.5, length * 0.3);
    chassis.add(cabMesh);

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat);
  }

  static buildSuvBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, indicatorMat) {
    const { length, width, height } = config.dimensions;
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.65, length);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = height * 0.55;
    chassis.add(bodyMesh);

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat);
  }

  static addCockpitInterior(chassis, config, darkMat, chromeMat) {
    if (config.id === 'bike') return;

    const fpv = config.cameraOffsets.fpv;
    const w = config.dimensions.width;

    // ── 1. Cockpit Dashboard Table ──
    const dashGeo = new THREE.BoxGeometry(w * 0.95, 0.32, 0.6);
    const dashMesh = new THREE.Mesh(dashGeo, darkMat);
    dashMesh.position.set(0, fpv.y - 0.28, fpv.z + 0.55);
    chassis.add(dashMesh);

    // ── 2. Realistic Dual Analog/Digital Sport Gauge Cluster (Directly in front of driver) ──
    const dashTex = TextureGenerator.createDashboardTexture();
    const clusterGeo = new THREE.PlaneGeometry(0.72, 0.28);
    const clusterMat = new THREE.MeshBasicMaterial({ map: dashTex, transparent: true });
    const clusterMesh = new THREE.Mesh(clusterGeo, clusterMat);
    clusterMesh.position.set(fpv.x, fpv.y - 0.12, fpv.z + 0.40);
    clusterMesh.rotation.x = -0.12;
    chassis.add(clusterMesh);

    // ── 3. Infotainment Touchscreen Tablet on Right Dashboard (Matching Image 1) ──
    const infoTex = TextureGenerator.createInfotainmentTexture();
    const infoGeo = new THREE.BoxGeometry(0.42, 0.30, 0.03);
    const infoMat = new THREE.MeshBasicMaterial({ map: infoTex });
    const infoMesh = new THREE.Mesh(infoGeo, infoMat);
    infoMesh.position.set(0.38, fpv.y - 0.10, fpv.z + 0.46);
    infoMesh.rotation.y = -0.22; // Angled toward driver
    infoMesh.rotation.x = -0.08;
    chassis.add(infoMesh);

    // ── 4. Rear-View Mirror at Top Center Windshield (Matching Image 1) ──
    const mirrorFrameGeo = new THREE.BoxGeometry(0.36, 0.11, 0.03);
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, darkMat);
    mirrorFrame.position.set(0, fpv.y + 0.24, fpv.z + 0.35);
    mirrorFrame.rotation.x = 0.15;
    
    // Mirror glass reflective face
    const mirrorGlassGeo = new THREE.PlaneGeometry(0.34, 0.09);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x99ccff, roughness: 0.1, metalness: 0.95 });
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeo, mirrorGlassMat);
    mirrorGlass.position.set(0, 0, -0.016);
    mirrorGlass.rotation.y = Math.PI;
    mirrorFrame.add(mirrorGlass);
    chassis.add(mirrorFrame);

    // ── 5. Circular Chrome AC Vents (Left and Right of Dashboard) ──
    const ventGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16);
    ventGeo.rotateX(Math.PI / 2);
    const ventL = new THREE.Mesh(ventGeo, chromeMat);
    const ventR = new THREE.Mesh(ventGeo, chromeMat);
    ventL.position.set(-w * 0.42, fpv.y - 0.18, fpv.z + 0.42);
    ventR.position.set(w * 0.42, fpv.y - 0.18, fpv.z + 0.42);
    chassis.add(ventL);
    chassis.add(ventR);

    // ── 6. Interactive Realistic Steering Wheel Mesh ──
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'steeringWheelMesh';
    wheelGroup.position.set(fpv.x, fpv.y - 0.18, fpv.z + 0.30);

    const ringGeo = new THREE.TorusGeometry(0.19, 0.026, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.35, metalness: 0.2 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    wheelGroup.add(ringMesh);

    // Center Hub & Cyber Silver Crest
    const hubGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    wheelGroup.add(hubMesh);

    // 3 Silver Steering Wheel Spokes (T-spoke like reference image)
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const spokeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.015), spokeMat);
    const spokeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.015), spokeMat);
    const spokeB = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.015), spokeMat);
    spokeL.position.set(-0.09, 0, 0);
    spokeR.position.set(0.09, 0, 0);
    spokeB.position.set(0, -0.09, 0);
    wheelGroup.add(spokeL);
    wheelGroup.add(spokeR);
    wheelGroup.add(spokeB);

    // ── 7. Detailed Driver Arms & Hands Holding Steering Wheel (Matching Image 1) ──
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdb9e6f, roughness: 0.6 });
    
    // Left hand & forearm
    const armLGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 12);
    armLGeo.rotateX(Math.PI / 3);
    const armL = new THREE.Mesh(armLGeo, skinMat);
    armL.position.set(-0.24, -0.15, -0.08);

    const handLGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const handL = new THREE.Mesh(handLGeo, skinMat);
    handL.position.set(-0.16, 0, 0);
    wheelGroup.add(handL);
    chassis.add(armL);

    // Right hand & forearm
    const armRGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 12);
    armRGeo.rotateX(Math.PI / 3);
    const armR = new THREE.Mesh(armRGeo, skinMat);
    armR.position.set(0.24, -0.15, -0.08);

    const handRGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const handR = new THREE.Mesh(handRGeo, skinMat);
    handR.position.set(0.16, 0, 0);
    wheelGroup.add(handR);
    chassis.add(armR);

    chassis.add(wheelGroup);
  }
}
