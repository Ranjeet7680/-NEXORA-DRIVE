import * as THREE from 'three';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4488cc); // Vivid blue sky background

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3500);
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9; // Slightly reduced to avoid overexposure

    this.container.appendChild(this.renderer.domElement);

    // Hemispheric sky/ground bounce — warm sky top, deep green ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xaaccff, 0x335522, 0.8);
    this.scene.add(this.hemiLight);

    // Soft ambient fill (lower so shadows remain visible and contrast is good)
    this.ambientLight = new THREE.AmbientLight(0xfff8f0, 0.3);
    this.scene.add(this.ambientLight);

    // Primary sunlight — stronger, angled for good shadow definition
    this.sunLight = new THREE.DirectionalLight(0xfff8e8, 1.5);
    this.sunLight.position.set(300, 500, 180);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 1800;
    const d = 600;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Cool sky-fill from opposite side (blue bounce from sky)
    this.fillLight = new THREE.DirectionalLight(0x6699cc, 0.4);
    this.fillLight.position.set(-250, 200, -200);
    this.scene.add(this.fillLight);

    // Linear fog — starts at 600m so entire road, city, and world near player is crystal clear
    this.scene.fog = new THREE.Fog(0x8bb8e8, 600, 2800);

    // Cloud system
    this.clouds = [];
    this._createClouds();

    // Sky dome gradient
    this._createGradientSky();

    // ── Glowing Sun Disc & Corona ──
    this._createSunDisc();

    // ── Animated Flying Birds in Sky ──
    this.birds = [];
    this._createFlyingBirds();

    // Window Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());
  }


  _createSunDisc() {
    const sunGroup = new THREE.Group();
    
    const discGeo = new THREE.CircleGeometry(35, 32);
    const discMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    sunGroup.add(discMesh);

    const haloGeo = new THREE.CircleGeometry(90, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea88,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    sunGroup.add(haloMesh);

    sunGroup.position.set(350, 450, 250);
    sunGroup.lookAt(0, 0, 0);
    this.scene.add(sunGroup);
    this.sunDisc = sunGroup;
  }

  _createFlyingBirds() {
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) {
      const birdGroup = new THREE.Group();
      
      const wingGeo = new THREE.PlaneGeometry(2.5, 0.9);
      const wingL = new THREE.Mesh(wingGeo, birdMat);
      const wingR = new THREE.Mesh(wingGeo, birdMat);
      wingL.position.x = -1.25;
      wingR.position.x = 1.25;
      wingL.rotation.z = 0.25;
      wingR.rotation.z = -0.25;

      birdGroup.add(wingL);
      birdGroup.add(wingR);

      const bx = -400 + Math.random() * 800;
      const bz = -400 + Math.random() * 800;
      const by = 90 + Math.random() * 100;
      birdGroup.position.set(bx, by, bz);
      birdGroup.userData = {
        speed: 12 + Math.random() * 10,
        wingTime: Math.random() * Math.PI * 2,
        wingL,
        wingR,
        dir: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize()
      };
      this.scene.add(birdGroup);
      this.birds.push(birdGroup);
    }
  }

  _createGradientSky() {
    const skyGeo = new THREE.SphereGeometry(2800, 32, 16);
    const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
    const pos = skyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const norm = (y + 2800) / 5600;  // 0 at bottom, 1 at top
      // Deep royal blue at zenith → clear cerulean mid-sky → bright horizon
      const zenith   = new THREE.Color(0x0d3a7a);  // Deep royal blue
      const midSky   = new THREE.Color(0x1a6fc4);  // Clear blue sky
      const horizon  = new THREE.Color(0x88c8f0);  // Bright horizon blue-white
      let c;
      if (norm > 0.62) {
        c = zenith.clone().lerp(midSky, (1.0 - norm) / 0.38);
      } else if (norm > 0.45) {
        c = midSky.clone().lerp(horizon, (0.62 - norm) / 0.17);
      } else {
        c = horizon.clone();
      }
      skyColors[i * 3] = c.r;
      skyColors[i * 3 + 1] = c.g;
      skyColors[i * 3 + 2] = c.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
    const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  _createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85,
    });

    const cloudPositions = [
      { x: -400, y: 280, z: -600 },
      { x: 300,  y: 320, z: -800 },
      { x: 700,  y: 260, z: -300 },
      { x: -700, y: 300, z: 400 },
      { x: 200,  y: 350, z: 700 },
      { x: -300, y: 270, z: 200 },
      { x: 600,  y: 290, z: 500 },
      { x: -800, y: 310, z: -200 },
      { x: 100,  y: 340, z: -500 },
      { x: -500, y: 260, z: 600 },
      { x: 800,  y: 330, z: -600 },
      { x: -100, y: 285, z: -800 },
    ];

    cloudPositions.forEach((cp) => {
      const group = new THREE.Group();
      const numSpheres = 4 + Math.floor(Math.random() * 4);
      for (let s = 0; s < numSpheres; s++) {
        const r = 25 + Math.random() * 35;
        const geo = new THREE.SphereGeometry(r, 8, 6);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.position.set(
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 60
        );
        mesh.scale.set(1.8, 0.7 + Math.random() * 0.4, 1.0);
        group.add(mesh);
      }
      group.position.set(cp.x, cp.y, cp.z);
      group.userData.speed = 0.5 + Math.random() * 1.5;
      group.userData.initialX = cp.x;
      this.scene.add(group);
      this.clouds.push(group);
    });
  }

  updateSkyForTime(timeOfDay) {
    let skyColor, fogColor, sunColor;

    if (timeOfDay < 5) {
      // Night 0-5
      skyColor = new THREE.Color(0x030a18);
      fogColor = new THREE.Color(0x050c1e);
      sunColor = new THREE.Color(0x1a3488);
      this.hemiLight.intensity = 0.18;
      this.ambientLight.intensity = 0.12;
      this.sunLight.intensity = 0.25;
    } else if (timeOfDay < 7) {
      // Dawn 5-7
      const t = (timeOfDay - 5) / 2;
      skyColor = new THREE.Color(0x030a18).lerp(new THREE.Color(0xff6622), t);
      fogColor = new THREE.Color(0x050c1e).lerp(new THREE.Color(0xff9944), t);
      sunColor = new THREE.Color(0xff5500);
      this.hemiLight.intensity = 0.4;
      this.ambientLight.intensity = 0.22;
      this.sunLight.intensity = 0.85;
    } else if (timeOfDay < 17) {
      // Day 7-17 (Vivid blue sky, strong directional sun, sharp shadows)
      skyColor = new THREE.Color(0x4488cc);
      fogColor = new THREE.Color(0x8bb8e8);
      sunColor = new THREE.Color(0xfff8e8);
      this.hemiLight.intensity = 0.8;
      this.ambientLight.intensity = 0.3;
      this.sunLight.intensity = 1.5;
    } else if (timeOfDay < 19) {
      // Sunset 17-19
      const t = (timeOfDay - 17) / 2;
      skyColor = new THREE.Color(0x4488cc).lerp(new THREE.Color(0xff3300), t);
      fogColor = new THREE.Color(0x8bb8e8).lerp(new THREE.Color(0xff6633), t);
      sunColor = new THREE.Color(0xff6600);
      this.hemiLight.intensity = 0.45;
      this.ambientLight.intensity = 0.22;
      this.sunLight.intensity = 0.85;
    } else {
      // Night 19-24
      const t = Math.min(1, (timeOfDay - 19) / 3);
      skyColor = new THREE.Color(0xff3300).lerp(new THREE.Color(0x030a18), t);
      fogColor = new THREE.Color(0xff6633).lerp(new THREE.Color(0x050c1e), t);
      sunColor = new THREE.Color(0x1a3488);
      this.hemiLight.intensity = 0.18;
      this.ambientLight.intensity = 0.12;
      this.sunLight.intensity = 0.25;
    }

    this.scene.background.lerp(skyColor, 0.02);
    if (this.scene.fog) {
      this.scene.fog.color.lerp(fogColor, 0.02);
    }
    this.sunLight.color.lerp(sunColor, 0.02);
    this.hemiLight.color.lerp(skyColor, 0.02);
  }

  updateClouds(deltaTime) {
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * deltaTime;
      if (cloud.position.x > 1200) {
        cloud.position.x = -1200;
      }
    });

    if (this.birds) {
      this.birds.forEach(bird => {
        const ud = bird.userData;
        ud.wingTime += deltaTime * 8;
        
        const flap = Math.sin(ud.wingTime) * 0.45;
        ud.wingL.rotation.z = 0.25 + flap;
        ud.wingR.rotation.z = -0.25 - flap;

        bird.position.addScaledVector(ud.dir, ud.speed * deltaTime);

        if (bird.position.x > 600) bird.position.x = -600;
        if (bird.position.x < -600) bird.position.x = 600;
        if (bird.position.z > 600) bird.position.z = -600;
        if (bird.position.z < -600) bird.position.z = 600;
      });
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
