import * as THREE from 'three';

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
      color: 0x112233,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.6
    });

    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 0.95 });
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.8 });
    const brakeLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 0.8 });

    // Chassis Base Group
    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    group.add(chassis);

    // Build specific body depending on type
    switch (config.id) {
      case 'car':
      case 'taxi':
      case 'police':
        VehicleBuilder.buildSedanBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial, customUpgrades);
        break;
      case 'bus':
        VehicleBuilder.buildBusBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial);
        break;
      case 'bike':
        VehicleBuilder.buildBikeBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial);
        break;
      case 'truck':
        VehicleBuilder.buildTruckBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial);
        break;
      case 'suv':
        VehicleBuilder.buildSuvBody(chassis, config, bodyMaterial, glassMaterial, darkMaterial, chromeMaterial, lightMaterial, brakeLightMaterial);
        break;
    }

    // Add Wheels with custom Rim Size (15"-20")
    const rimSizeInches = customUpgrades.rimSize || 17;
    const rimScale = rimSizeInches / 17; // Scale factor relative to stock 17"
    
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
    if (customUpgrades.underglow && customUpgrades.underglow !== 'none') {
      const underColor = customUpgrades.underglowHex || 0x00f0ff;
      const glowGeo = new THREE.PlaneGeometry(config.dimensions.width * 1.2, config.dimensions.length * 1.1);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: underColor,
        transparent: true,
        opacity: 0.6
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(0, 0.05, 0);
      chassis.add(glowMesh);
    }

    // Add Headlights (Spotlights)
    const headlightLeft = new THREE.SpotLight(0xffffff, 3.0, 40, Math.PI / 6, 0.4, 1);
    const headlightRight = new THREE.SpotLight(0xffffff, 3.0, 40, Math.PI / 6, 0.4, 1);
    
    const headZ = config.dimensions.length * 0.5;
    const headX = config.dimensions.width * 0.35;
    const headY = config.dimensions.height * 0.4;

    headlightLeft.position.set(-headX, headY, headZ);
    headlightRight.position.set(headX, headY, headZ);

    const targetLeft = new THREE.Object3D();
    const targetRight = new THREE.Object3D();
    targetLeft.position.set(-headX, headY - 0.2, headZ + 20);
    targetRight.position.set(headX, headY - 0.2, headZ + 20);

    chassis.add(targetLeft);
    chassis.add(targetRight);
    headlightLeft.target = targetLeft;
    headlightRight.target = targetRight;

    chassis.add(headlightLeft);
    chassis.add(headlightRight);

    group.userData = {
      chassis,
      wheels,
      headlights: [headlightLeft, headlightRight],
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

  static buildSedanBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat, customUpgrades) {
    const { length, width, height } = config.dimensions;

    // Body
    const lowerGeo = new THREE.BoxGeometry(width, height * 0.45, length);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.y = height * 0.45;
    lowerMesh.castShadow = true;
    chassis.add(lowerMesh);

    // Roof
    const cabinGeo = new THREE.BoxGeometry(width * 0.9, height * 0.5, length * 0.55);
    const cabinMesh = new THREE.Mesh(cabinGeo, bodyMat);
    cabinMesh.position.set(0, height * 0.85, -length * 0.05);
    chassis.add(cabinMesh);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(width * 0.86, height * 0.45, length * 0.25);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, height * 0.85, length * 0.15);
    windshield.rotation.x = -0.35;
    chassis.add(windshield);

    // Windshield Wiper Mesh
    const wiperGeo = new THREE.BoxGeometry(width * 0.6, 0.04, 0.04);
    const wiperMesh = new THREE.Mesh(wiperGeo, darkMat);
    wiperMesh.name = 'wiperMesh';
    wiperMesh.position.set(0, height * 0.7, length * 0.22);
    chassis.add(wiperMesh);

    // Modular 3D Spoiler Attachment
    if (customUpgrades.spoiler && customUpgrades.spoiler !== 'none') {
      const spHeight = customUpgrades.spoiler === 'carbon_wing' ? 0.35 : 0.18;
      const spGeo = new THREE.BoxGeometry(width * 0.95, 0.06, 0.3);
      const spMat = customUpgrades.spoiler === 'carbon_wing' ? darkMat : bodyMat;
      const spMesh = new THREE.Mesh(spGeo, spMat);
      spMesh.position.set(0, height * 0.7 + spHeight, -length * 0.45);
      chassis.add(spMesh);
    }

    // Cockpit & Driver Hands
    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat);
  }

  static buildBusBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat) {
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

  static buildTruckBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat) {
    const { length, width, height } = config.dimensions;
    const cabGeo = new THREE.BoxGeometry(width, height * 0.7, length * 0.4);
    const cabMesh = new THREE.Mesh(cabGeo, bodyMat);
    cabMesh.position.set(0, height * 0.5, length * 0.3);
    chassis.add(cabMesh);

    VehicleBuilder.addCockpitInterior(chassis, config, darkMat, chromeMat);
  }

  static buildSuvBody(chassis, config, bodyMat, glassMat, darkMat, chromeMat, lightMat, brakeMat) {
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

    // Dashboard
    const dashGeo = new THREE.BoxGeometry(config.dimensions.width * 0.85, 0.25, 0.45);
    const dashMesh = new THREE.Mesh(dashGeo, darkMat);
    dashMesh.position.set(0, fpv.y - 0.1, fpv.z + 0.35);
    chassis.add(dashMesh);

    // Interactive Steering Wheel Mesh
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'steeringWheelMesh';
    wheelGroup.position.set(fpv.x, fpv.y - 0.08, fpv.z + 0.3);

    const ringGeo = new THREE.TorusGeometry(0.18, 0.025, 8, 24);
    const ringMesh = new THREE.Mesh(ringGeo, darkMat);
    wheelGroup.add(ringMesh);

    // Driver Hands Mesh (Spheres holding steering wheel)
    const handMat = new THREE.MeshStandardMaterial({ color: 0xc58c5c });
    const handLeft = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), handMat);
    const handRight = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), handMat);
    handLeft.position.set(-0.16, 0, 0);
    handRight.position.set(0.16, 0, 0);
    wheelGroup.add(handLeft);
    wheelGroup.add(handRight);

    chassis.add(wheelGroup);
  }
}
