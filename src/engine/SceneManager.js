import * as THREE from 'three';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 4000);
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.appendChild(this.renderer.domElement);

    // Hemispheric Lighting (Sky blue top, Ground brown bottom)
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a3520, 1.4);
    this.scene.add(this.hemiLight);

    // Ambient Fill Light
    this.ambientLight = new THREE.AmbientLight(0xfff4e0, 0.9);
    this.scene.add(this.ambientLight);

    // Sunlight Directional Light with large shadow map
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.sunLight.position.set(250, 400, 200);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 2000;

    const d = 500;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Secondary fill light from opposite side (softer shadows)
    this.fillLight = new THREE.DirectionalLight(0x8cb4cc, 0.4);
    this.fillLight.position.set(-200, 150, -300);
    this.scene.add(this.fillLight);

    // Dynamic Fog
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.00022);

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
    
    // Core brilliant sun disc
    const discGeo = new THREE.CircleGeometry(45, 32);
    const discMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    sunGroup.add(discMesh);

    // Outer soft sun halo flare
    const haloGeo = new THREE.CircleGeometry(120, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea88,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    sunGroup.add(haloMesh);

    sunGroup.position.set(400, 500, 350);
    sunGroup.lookAt(0, 0, 0);
    this.scene.add(sunGroup);
    this.sunDisc = sunGroup;
  }

  _createFlyingBirds() {
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) {
      const birdGroup = new THREE.Group();
      
      // Left & Right Wings (V-shape bird)
      const wingGeo = new THREE.PlaneGeometry(3, 1.2);
      const wingL = new THREE.Mesh(wingGeo, birdMat);
      const wingR = new THREE.Mesh(wingGeo, birdMat);
      wingL.position.x = -1.5;
      wingR.position.x = 1.5;
      wingL.rotation.z = 0.25;
      wingR.rotation.z = -0.25;

      birdGroup.add(wingL);
      birdGroup.add(wingR);

      const bx = -400 + Math.random() * 800;
      const bz = -400 + Math.random() * 800;
      const by = 80 + Math.random() * 120;
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
    // Layered sky: outer dark, inner bright horizon
    const skyGeo = new THREE.SphereGeometry(3000, 32, 16);
    const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
    const pos = skyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const norm = (y + 3000) / 6000; // 0 at bottom, 1 at top
      const top = new THREE.Color(0x1a6fc4);    // Deep sky blue
      const mid = new THREE.Color(0x87ceeb);    // Sky blue
      const horizon = new THREE.Color(0xd4e8f8); // Near white horizon
      let c;
      if (norm > 0.55) {
        c = top.clone().lerp(mid, (1.0 - norm) / 0.45);
      } else {
        c = mid.clone().lerp(horizon, (0.55 - norm) / 0.55);
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
      roughness: 1.0,
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

    cloudPositions.forEach((cp, idx) => {
      const group = new THREE.Group();
      const numSpheres = 4 + Math.floor(Math.random() * 5);
      for (let s = 0; s < numSpheres; s++) {
        const r = 25 + Math.random() * 40;
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
    // Interpolate sky & fog colours through the day
    let skyColor, fogColor, sunColor;

    if (timeOfDay < 5) {
      // Night 0-5
      skyColor = new THREE.Color(0x040c1c);
      fogColor = new THREE.Color(0x060f22);
      sunColor = new THREE.Color(0x2244aa);
    } else if (timeOfDay < 7) {
      // Dawn 5-7
      const t = (timeOfDay - 5) / 2;
      skyColor = new THREE.Color(0x040c1c).lerp(new THREE.Color(0xff7733), t);
      fogColor = new THREE.Color(0x060f22).lerp(new THREE.Color(0xffaa55), t);
      sunColor = new THREE.Color(0xff6600);
    } else if (timeOfDay < 17) {
      // Day 7-17
      skyColor = new THREE.Color(0x87ceeb);
      fogColor = new THREE.Color(0x87ceeb);
      sunColor = new THREE.Color(0xfffaed);
    } else if (timeOfDay < 19) {
      // Sunset 17-19
      const t = (timeOfDay - 17) / 2;
      skyColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xff4400), t);
      fogColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xff7733), t);
      sunColor = new THREE.Color(0xff6600);
    } else {
      // Night 19-24
      const t = Math.min(1, (timeOfDay - 19) / 3);
      skyColor = new THREE.Color(0xff4400).lerp(new THREE.Color(0x040c1c), t);
      fogColor = new THREE.Color(0xff7733).lerp(new THREE.Color(0x060f22), t);
      sunColor = new THREE.Color(0x2244aa);
    }

    this.scene.background.lerp(skyColor, 0.01);
    this.scene.fog.color.lerp(fogColor, 0.01);
    this.sunLight.color.lerp(sunColor, 0.01);
    this.hemiLight.color.lerp(skyColor, 0.01);
  }

  updateClouds(deltaTime) {
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * deltaTime;
      if (cloud.position.x > 1200) {
        cloud.position.x = -1200;
      }
    });

    // Animate Birds
    if (this.birds) {
      this.birds.forEach(bird => {
        const ud = bird.userData;
        ud.wingTime += deltaTime * 8;
        
        // Wing flapping
        const flap = Math.sin(ud.wingTime) * 0.45;
        ud.wingL.rotation.z = 0.25 + flap;
        ud.wingR.rotation.z = -0.25 - flap;

        // Forward flight
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
