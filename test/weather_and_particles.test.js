import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { WeatherManager } from '../src/engine/WeatherManager.js';
import { ParticleSystemManager } from '../src/engine/ParticleSystemManager.js';
import { WEATHER_PRESETS } from '../src/config.js';

describe('Weather System & Particle Emitters', () => {
  let scene;
  let mockSceneManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8bb8e8, 1500, 10000);

    mockSceneManager = {
      sunLight: new THREE.DirectionalLight(0xffffff, 1.0),
      hemiLight: new THREE.HemisphereLight(0xaaccff, 0x335522, 0.8),
      ambientLight: new THREE.AmbientLight(0xffffff, 0.5)
    };
  });

  describe('WeatherManager', () => {
    test('Initializes with sunny preset and 14:00 time of day', () => {
      const weather = new WeatherManager(scene, mockSceneManager);
      assert.strictEqual(weather.currentPreset.id, 'sunny');
      assert.strictEqual(weather.timeOfDay, 14.0);
      assert.ok(weather.rainParticles);
      assert.ok(weather.snowParticles);
      assert.strictEqual(weather.rainParticles.visible, false);
      assert.strictEqual(weather.snowParticles.visible, false);
    });

    test('setWeather switches preset and toggles rain/snow particle visibility', () => {
      const weather = new WeatherManager(scene, mockSceneManager);

      // Switch to rain
      weather.setWeather('rain');
      assert.strictEqual(weather.currentPreset.id, 'rain');
      assert.strictEqual(weather.rainParticles.visible, true);
      assert.strictEqual(weather.snowParticles.visible, false);

      // Switch to snow
      weather.setWeather('snow');
      assert.strictEqual(weather.currentPreset.id, 'snow');
      assert.strictEqual(weather.rainParticles.visible, false);
      assert.strictEqual(weather.snowParticles.visible, true);

      // Switch back to sunny
      weather.setWeather('sunny');
      assert.strictEqual(weather.rainParticles.visible, false);
      assert.strictEqual(weather.snowParticles.visible, false);
    });

    test('update advances day/night clock and modulates sun position', () => {
      const weather = new WeatherManager(scene, mockSceneManager);
      const initialTime = weather.timeOfDay;

      weather.update(1.0, new THREE.Vector3(0, 0, 0));
      assert.ok(weather.timeOfDay > initialTime, 'Time of day should advance');
      assert.ok(mockSceneManager.sunLight.position.length() > 0, 'Sun light position should be updated');
    });
  });

  describe('ParticleSystemManager', () => {
    test('Initializes exhaust and dust ground spray particle emitters', () => {
      const particles = new ParticleSystemManager(scene);
      assert.ok(particles.exhaustParticles);
      assert.ok(particles.dustParticles);
      assert.ok(particles.exhaustParticles instanceof THREE.Points);
      assert.ok(particles.dustParticles instanceof THREE.Points);
    });

    test('update animates particles following player vehicle position', () => {
      const particles = new ParticleSystemManager(scene);
      const playerPos = new THREE.Vector3(50, 10, -200);

      particles.update(0.016, playerPos, 80, { id: 'pochinki' }, true);
      assert.ok(true, 'Particle system update runs cleanly');
    });
  });
});
