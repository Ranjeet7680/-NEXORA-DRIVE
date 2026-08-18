import * as THREE from 'three';
import { WEATHER_PRESETS } from '../config.js';

export class WeatherManager {
  constructor(scene, sceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;

    this.timeOfDay = 14.0;           // 14 = 2:00 PM
    this.dayDurationSeconds = 360;   // 6 minutes per full day cycle
    this.currentPreset = WEATHER_PRESETS[0]; // Sunny default

    this.rainParticles = null;
    this.snowParticles = null;
    this.lightningTimer = 0;

    // Stars visible at night
    this.starField = null;

    this.createWeatherParticles();
    this._createStarField();
  }

  _createStarField() {
    const starCount = 800;
    const starGeo   = new THREE.BufferGeometry();
    const starPos   = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI * 0.5; // Upper hemisphere only
      const r     = 2800;
      starPos[i]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.cos(phi);
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, transparent: true, opacity: 0 });
    this.starField = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starField);
  }

  createWeatherParticles() {
    // Rain Particles — streaky lines
    const rainCount = 2000;
    const rainGeo   = new THREE.BufferGeometry();
    const rainPos   = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i]     = (Math.random() - 0.5) * 120;
      rainPos[i + 1] = Math.random() * 60;
      rainPos[i + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x99bbdd, size: 0.3, transparent: true, opacity: 0.65 });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // Snow Particles
    const snowCount = 1500;
    const snowGeo   = new THREE.BufferGeometry();
    const snowPos   = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPos[i]     = (Math.random() - 0.5) * 140;
      snowPos[i + 1] = Math.random() * 50;
      snowPos[i + 2] = (Math.random() - 0.5) * 140;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, transparent: true, opacity: 0.85 });
    this.snowParticles = new THREE.Points(snowGeo, snowMat);
    this.snowParticles.visible = false;
    this.scene.add(this.snowParticles);
  }

  setWeather(presetId) {
    const preset = WEATHER_PRESETS.find(p => p.id === presetId) || WEATHER_PRESETS[0];
    this.currentPreset = preset;
    this.scene.fog.density = preset.fogDensity;
    this.rainParticles.visible = preset.rain;
    this.snowParticles.visible = preset.snow;
  }

  update(deltaTime, playerPosition) {
    // 1. Advance Day/Night Clock
    this.timeOfDay = (this.timeOfDay + (deltaTime / this.dayDurationSeconds) * 24) % 24;

    const t = this.timeOfDay;
    const isNight   = t < 5.5 || t > 19.5;
    const isDusk    = !isNight && (t > 17.5 || t < 7.0);

    // 2. Sun position arc
    const sunAngle = ((t - 6) / 24) * Math.PI * 2;
    const sunX = Math.cos(sunAngle) * 600;
    const sunY = Math.sin(sunAngle) * 600;
    this.sceneManager.sunLight.position.set(sunX, Math.max(sunY, -100), 200);

    // Sun intensity by time
    let targetIntensity = 0.05;
    if (!isNight) {
      if (isDusk) targetIntensity = 0.8;
      else targetIntensity = this.currentPreset.sunIntensity;
    }
    this.sceneManager.sunLight.intensity = THREE.MathUtils.lerp(
      this.sceneManager.sunLight.intensity, targetIntensity, deltaTime * 1.5
    );

    // Hemisphere light colour by time
    const hemiTop   = isNight ? new THREE.Color(0x030d1e) : (isDusk ? new THREE.Color(0xff9944) : new THREE.Color(0x87ceeb));
    const hemiBot   = isNight ? new THREE.Color(0x010408) : new THREE.Color(0x4a3520);
    this.sceneManager.hemiLight.color.lerp(hemiTop, deltaTime * 1.2);
    this.sceneManager.hemiLight.groundColor.lerp(hemiBot, deltaTime * 1.2);

    // Ambient light intensity by time
    const ambTarget = isNight ? 0.12 : (isDusk ? 0.55 : 0.9);
    this.sceneManager.ambientLight.intensity = THREE.MathUtils.lerp(
      this.sceneManager.ambientLight.intensity, ambTarget, deltaTime * 1.5
    );

    // 3. Sky gradient + fog colour via SceneManager
    if (this.sceneManager.updateSkyForTime) {
      this.sceneManager.updateSkyForTime(t);
    }

    // 4. Fog density by weather + biome
    const baseDensity = this.currentPreset.fogDensity || 0.00022;
    const nightBoost  = isNight ? 0.00008 : 0;
    this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, baseDensity + nightBoost, deltaTime);

    // 5. Stars visible at night
    if (this.starField) {
      const starOpacity = isNight ? 0.9 : 0.0;
      this.starField.material.opacity = THREE.MathUtils.lerp(this.starField.material.opacity, starOpacity, deltaTime * 0.8);
    }

    // 6. Update cloud drift
    if (this.sceneManager.updateClouds) {
      this.sceneManager.updateClouds(deltaTime);
    }

    // 7. Weather particles follow player
    if (playerPosition) {
      if (this.rainParticles.visible) {
        this.rainParticles.position.copy(playerPosition);
        const pos = this.rainParticles.geometry.attributes.position;
        for (let i = 1; i < pos.count * 3; i += 3) {
          pos.array[i] -= deltaTime * 45;
          if (pos.array[i] < 0) pos.array[i] = 60;
        }
        pos.needsUpdate = true;
      }
      if (this.snowParticles.visible) {
        this.snowParticles.position.copy(playerPosition);
        const pos = this.snowParticles.geometry.attributes.position;
        const t = Date.now() * 0.0015;
        for (let i = 1; i < pos.count * 3; i += 3) {
          pos.array[i] -= deltaTime * 10;
          pos.array[i - 1] += Math.sin(t + i) * 0.06;
          if (pos.array[i] < 0) pos.array[i] = 50;
        }
        pos.needsUpdate = true;
      }
    }

    // 8. Lightning flashes during storm
    if (this.currentPreset.id === 'storm') {
      this.lightningTimer -= deltaTime;
      if (this.lightningTimer <= 0) {
        this.sceneManager.ambientLight.intensity = 3.5;
        setTimeout(() => { this.sceneManager.ambientLight.intensity = ambTarget; }, 90);
        this.lightningTimer = 3 + Math.random() * 7;
      }
    }
  }
}
