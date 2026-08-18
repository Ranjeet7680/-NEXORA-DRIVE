import * as THREE from 'three';
import { WEATHER_PRESETS } from '../config.js';

export class WeatherManager {
  constructor(scene, sceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    
    this.timeOfDay = 14.0; // 0 to 24 hours (14 = 2:00 PM)
    this.dayDurationSeconds = 300; // 5 minutes for full 24h cycle
    this.currentPreset = WEATHER_PRESETS[0]; // Sunny default

    this.rainParticles = null;
    this.snowParticles = null;
    this.lightningTimer = 0;

    this.createWeatherParticles();
  }

  createWeatherParticles() {
    // Rain Particles
    const rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 100;
      rainPositions[i + 1] = Math.random() * 50;
      rainPositions[i + 2] = (Math.random() - 0.5) * 100;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xaaccee,
      size: 0.25,
      transparent: true,
      opacity: 0.6
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // Snow Particles
    const snowCount = 1200;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPositions[i] = (Math.random() - 0.5) * 120;
      snowPositions[i + 1] = Math.random() * 40;
      snowPositions[i + 2] = (Math.random() - 0.5) * 120;
    }

    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.8
    });

    this.snowParticles = new THREE.Points(snowGeo, snowMat);
    this.snowParticles.visible = false;
    this.scene.add(this.snowParticles);
  }

  setWeather(presetId) {
    const preset = WEATHER_PRESETS.find(p => p.id === presetId) || WEATHER_PRESETS[0];
    this.currentPreset = preset;

    this.sceneManager.scene.fog.density = preset.fogDensity;
    this.rainParticles.visible = preset.rain;
    this.snowParticles.visible = preset.snow;
  }

  update(deltaTime, playerPosition) {
    // 1. Advance Day/Night Clock
    this.timeOfDay = (this.timeOfDay + (deltaTime / this.dayDurationSeconds) * 24) % 24;

    // Sun angle calculation (0 = midnight, 12 = noon)
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunX = Math.cos(sunAngle) * 500;
    const sunY = Math.sin(sunAngle) * 500;

    this.sceneManager.sunLight.position.set(sunX, sunY, 150);

    const isNight = this.timeOfDay < 6 || this.timeOfDay > 18;
    const targetSunIntensity = isNight ? 0.05 : this.currentPreset.sunIntensity;
    this.sceneManager.sunLight.intensity = THREE.MathUtils.lerp(this.sceneManager.sunLight.intensity, targetSunIntensity, deltaTime * 2);

    // Sky Background color shift
    const skyColor = isNight ? new THREE.Color(0x050b14) : new THREE.Color(0x75a3d1);
    this.sceneManager.scene.background.lerp(skyColor, deltaTime * 2);

    // 2. Weather Particles follow Player position
    if (playerPosition) {
      if (this.rainParticles.visible) {
        this.rainParticles.position.copy(playerPosition);
        const pos = this.rainParticles.geometry.attributes.position;
        for (let i = 1; i < pos.count * 3; i += 3) {
          pos.array[i] -= deltaTime * 40;
          if (pos.array[i] < 0) pos.array[i] = 50;
        }
        pos.needsUpdate = true;
      }

      if (this.snowParticles.visible) {
        this.snowParticles.position.copy(playerPosition);
        const pos = this.snowParticles.geometry.attributes.position;
        for (let i = 1; i < pos.count * 3; i += 3) {
          pos.array[i] -= deltaTime * 12;
          pos.array[i - 1] += Math.sin(Date.now() * 0.002 + i) * 0.05;
          if (pos.array[i] < 0) pos.array[i] = 40;
        }
        pos.needsUpdate = true;
      }
    }

    // 3. Lightning Flashes during Storm
    if (this.currentPreset.id === 'storm') {
      this.lightningTimer -= deltaTime;
      if (this.lightningTimer <= 0) {
        this.sceneManager.ambientLight.intensity = 2.5; // Flash!
        setTimeout(() => {
          this.sceneManager.ambientLight.intensity = 0.3;
        }, 80);
        this.lightningTimer = 4 + Math.random() * 8;
      }
    }
  }
}
