import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SaveSystem } from '../src/engine/SaveSystem.js';
import { SettingsManager } from '../src/engine/SettingsManager.js';

describe('Save System & Settings Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('SaveSystem returns correct default schema with credits and vehicles', () => {
    const data = SaveSystem.getDefaultData();
    assert.strictEqual(data.credits, 5000);
    assert.strictEqual(data.selectedVehicle, 'car');
    assert.ok(Array.isArray(data.unlockedVehicles));
    assert.ok(data.unlockedVehicles.includes('car'));
    assert.ok(data.upgrades.car);
    assert.strictEqual(data.settings.weather, 'sunny');
    assert.ok(Array.isArray(data.completedMissions));
  });

  test('SaveSystem persists and restores data via localStorage', () => {
    const defaultData = SaveSystem.load();
    assert.strictEqual(defaultData.credits, 5000);

    // Modify data and save
    defaultData.credits = 15000;
    defaultData.unlockedVehicles.push('mustang');
    defaultData.completedMissions.push('airport_sprint');
    SaveSystem.save(defaultData);

    // Load fresh
    const loadedData = SaveSystem.load();
    assert.strictEqual(loadedData.credits, 15000);
    assert.ok(loadedData.unlockedVehicles.includes('mustang'));
    assert.ok(loadedData.completedMissions.includes('airport_sprint'));
  });

  test('SettingsManager initializes with defaults and manages categories', () => {
    const sm = new SettingsManager(null);
    const defaults = sm.settings;

    assert.ok(defaults.controls);
    assert.strictEqual(defaults.controls.steeringMode, 'wheel');
    assert.ok(defaults.driving);
    assert.strictEqual(defaults.driving.abs, true);
    assert.ok(defaults.graphics);
    assert.strictEqual(defaults.graphics.shadows, true);
    assert.ok(defaults.audio);
    assert.strictEqual(defaults.audio.masterVolume, 0.8);
    assert.ok(defaults.camera);
    assert.strictEqual(defaults.camera.fov, 65);
    assert.ok(defaults.aiCopilot);
    assert.strictEqual(defaults.aiCopilot.enabled, true);
  });

  test('SettingsManager deepMerge updates nested properties without overwriting sibling keys', () => {
    const sm = new SettingsManager(null);
    const updated = sm.deepMerge(SettingsManager.getDefaults(), {
      graphics: { shadows: false },
      audio: { masterVolume: 0.5 }
    });

    assert.strictEqual(updated.graphics.shadows, false);
    assert.strictEqual(updated.graphics.particles, 'high');
    assert.strictEqual(updated.audio.masterVolume, 0.5);
    assert.strictEqual(updated.audio.engineVolume, 0.8);
  });

  test('SettingsManager resets categories and saves correctly', () => {
    const sm = new SettingsManager(null);
    sm.settings.audio.masterVolume = 0.1;
    sm.settings.graphics.shadows = false;
    sm.saveSettings();

    // Verify persisted
    const saved = JSON.parse(localStorage.getItem('nexora_drive_settings_v1'));
    assert.strictEqual(saved.audio.masterVolume, 0.1);
    assert.strictEqual(saved.graphics.shadows, false);

    // Reset audio category
    sm.resetCategory('audio');
    assert.strictEqual(sm.settings.audio.masterVolume, 0.8);
    assert.strictEqual(sm.settings.graphics.shadows, false);

    // Reset all
    sm.resetAll();
    assert.strictEqual(sm.settings.graphics.shadows, true);
  });

  test('SettingsManager auto-optimizes mobile settings', () => {
    const sm = new SettingsManager(null);
    sm.autoOptimizeMobile();
    assert.ok(['low', 'high'].includes(sm.settings.graphics.preset));
    assert.ok([30, 60].includes(sm.settings.graphics.fpsTarget));
  });
});
