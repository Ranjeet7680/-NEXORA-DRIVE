import * as THREE from 'three';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class VehicleBuilder {
  static createVehicleMesh(config, customUpgrades = {}) {
    const group = new THREE.Group();
    group.name = `vehicle_${config.id}`;

    const colorHex = customUpgrades.color || (config.id === 'taxi' ? 0xffbb00 : (config.id === 'police' ? 0x111122 : 0x0066cc));
    
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
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.8,
      transmission: 0.8,
      side: THREE.DoubleSide
    });

    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 0.95 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 2.0 });
    const brakeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 1.5 });
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

    // Add Wheels with custom Rim Size (15"-20")
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

    // Modular Underglow Neon Lights
    let underglowMesh = null;
    if (customUpgrades.underglow && customUpgrades.underglow !== 'none') {
      const underColor = customUpgrades.underglowHex || 0x00f0ff;
      const glowGeo = new THREE.PlaneGeometry(config.dimensions.width * 1.2, config.dimensions.length * 1.1);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: underColor,
        transparent: true,
        opacity: 0.6
      });
      underglowMesh = new THREE.Mesh(glowGeo, glowMat);
      underglowMesh.position.set(0, 0.05, 0);
      chassis.add(underglowMesh);
    }

    // ── Functional Real Dual Headlights (Spotlights) ──
    const headZ = config.dimensions.length * 0.5;
    const headX = config.dimensions.width * 0.35;
    const headY = config.dimensions.height * 0.42;

    const headlightLeft = new THREE.SpotLight(0xfffaed, 5.0, 90, Math.PI / 5, 0.3, 1.2);
    const headlightRight = new THREE.SpotLight(0xfffaed, 5.0, 90, Math.PI / 5, 0.3, 1.2);
    headlightLeft.castShadow = true;
    headlightRight.castShadow = true;
    headlightLeft.shadow.mapSize.width = 512;
    headlightLeft.shadow.mapSize.height = 512;
    headlightRight.shadow.mapSize.width = 512;
    headlightRight.shadow.mapSize.height = 512;

    headlightLeft.position.set(-headX, headY, headZ);
    headlightRight.position.set(headX, headY, headZ);

    const targetLeft = new THREE.Object3D();
    const targetRight = new THREE.Object3D();
    targetLeft.position.set(-headX, headY - 0.5, headZ + 40);
    targetRight.position.set(headX, headY - 0.5, headZ + 40);

    chassis.add(targetLeft);
    chassis.add(targetRight);
    headlightLeft.target = targetLeft;
    headlightRight.target = targetRight;

    chassis.add(headlightLeft);
    chassis.add(headlightRight);

    // ── Volumetric Light Beams (Forward Cones) ──
    const beamGeo = new THREE.ConeGeometry(4.5, 35, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 17.5);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beamLeft = new THREE.Mesh(beamGeo, beamMat);
    const beamRight = new THREE.Mesh(beamGeo, beamMat);
    beamLeft.position.set(-headX, headY, headZ);
    beamRight.position.set(headX, headY, headZ);
    chassis.add(beamLeft);
    chassis.add(beamRight);

    // ── Cockpit Interior Dome Ambient Light ──
    const fpv = config.cameraOffsets.fpv;
    const interiorLight = new THREE.PointLight(0x00f0ff, 1.2, 4.0);
    interiorLight.position.set(0, fpv.y + 0.2, fpv.z);
    chassis.add(interiorLight);

    group.userData = {
      chassis,
      wheels,
      headlights: [headlightLeft, headlightRight],
      lightBeams: [beamLeft, beamRight],
      interiorLight,
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

    // Roof & Pillars
    const cabinGeo = new THREE.BoxGeometry(width * 0.88, height * 0.45, length * 0.5);
    const cabinMesh = new THREE.Mesh(cabinGeo, bodyMat);
    cabinMesh.position.set(0, height * 0.75, -length * 0.08);
    chassis.add(cabinMesh);

    // Windshield Glass
    const windshieldGeo = new THREE.BoxGeometry(width * 0.85, height * 0.4, 0.05);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, height * 0.75, length * 0.17);
    windshield.rotation.x = -0.35;
    chassis.add(windshield);

    // Windshield Wiper Mesh
    const wiperGeo = new THREE.BoxGeometry(width * 0.5, 0.03, 0.03);
    const wiperMesh = new THREE.Mesh(wiperGeo, darkMat);
    wiperMesh.name = 'wiperMesh';
    wiperMesh.position.set(0, height * 0.62, length * 0.22);
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

    // Cockpit & Driver Hands
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

    // Cockpit Main Dashboard Box
    const dashGeo = new THREE.BoxGeometry(config.dimensions.width * 0.88, 0.28, 0.5);
    const dashMesh = new THREE.Mesh(dashGeo, darkMat);
    dashMesh.position.set(0, fpv.y - 0.28, fpv.z + 0.42);
    chassis.add(dashMesh);

    // ── High-Tech Dashboard Cluster Display Panel (Canvas Textured) ──
    const dashTex = TextureGenerator.createDashboardTexture();
    const clusterGeo = new THREE.PlaneGeometry(config.dimensions.width * 0.75, 0.24);
    const clusterMat = new THREE.MeshBasicMaterial({ map: dashTex, transparent: true });
    const clusterMesh = new THREE.Mesh(clusterGeo, clusterMat);
    clusterMesh.position.set(0, fpv.y - 0.24, fpv.z + 0.25);
    clusterMesh.rotation.x = -0.15;
    chassis.add(clusterMesh);

    // ── AC Vents (Chrome grill slats) ──
    const ventGeo = new THREE.BoxGeometry(0.16, 0.06, 0.02);
    const ventL = new THREE.Mesh(ventGeo, chromeMat);
    const ventR = new THREE.Mesh(ventGeo, chromeMat);
    ventL.position.set(-config.dimensions.width * 0.25, fpv.y - 0.22, fpv.z + 0.26);
    ventR.position.set(config.dimensions.width * 0.25, fpv.y - 0.22, fpv.z + 0.26);
    chassis.add(ventL);
    chassis.add(ventR);

    // ── Hazard & Engine Start Buttons on Dashboard ──
    const startGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
    startGeo.rotateX(Math.PI / 2);
    const startMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
    const startBtn = new THREE.Mesh(startGeo, startMat);
    startBtn.position.set(0.12, fpv.y - 0.26, fpv.z + 0.25);
    chassis.add(startBtn);

    // ── Interactive Steering Wheel Mesh ──
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'steeringWheelMesh';
    wheelGroup.position.set(fpv.x, fpv.y - 0.22, fpv.z + 0.32);

    const ringGeo = new THREE.TorusGeometry(0.19, 0.028, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.4, metalness: 0.2 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    wheelGroup.add(ringMesh);

    // Center Hub with Cyber Crest
    const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    wheelGroup.add(hubMesh);

    // Spokes
    const spokeGeo = new THREE.BoxGeometry(0.32, 0.03, 0.02);
    const spokeMesh = new THREE.Mesh(spokeGeo, darkMat);
    wheelGroup.add(spokeMesh);

    // ── Driver Hands Mesh (Spheres holding steering wheel) ──
    const handMat = new THREE.MeshStandardMaterial({ color: 0xc58c5c, roughness: 0.7 });
    const handLeft = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), handMat);
    const handRight = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), handMat);
    handLeft.position.set(-0.17, 0, 0);
    handRight.position.set(0.17, 0, 0);
    wheelGroup.add(handLeft);
    wheelGroup.add(handRight);

    chassis.add(wheelGroup);
  }
}
