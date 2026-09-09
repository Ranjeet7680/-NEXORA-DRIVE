import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { HUD } from '../src/ui/HUD.js';
import { SteeringWheelUI } from '../src/ui/SteeringWheelUI.js';
import { MissionsUI } from '../src/ui/MissionsUI.js';
import { SettingsUI } from '../src/ui/SettingsUI.js';
import { SettingsManager } from '../src/engine/SettingsManager.js';
import { SaveSystem } from '../src/engine/SaveSystem.js';

describe('UI & HUD Telemetry System', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  describe('HUD', () => {
    let hud;
    let callbacks;

    beforeEach(() => {
      callbacks = {
        onGasPress: () => {},
        onBrakePress: () => {},
        onHandbrakePress: () => {},
        onNitroPress: () => {},
        onHeadlights: () => {},
        onHazard: () => {},
        onIndicatorL: () => {},
        onIndicatorR: () => {},
        onNextCamera: () => {},
        onHorn: () => {},
        onRespawn: () => {},
        onOpenMap: () => {},
        onOpenGarage: () => {},
        onOpenMissions: () => {},
        onOpenSettings: () => {},
        onTogglePause: () => {}
      };
      hud = new HUD(container, callbacks);
    });

    test('Initializes HUD element inside container', () => {
      assert.ok(hud.hudElement);
      assert.strictEqual(hud.container, container);
    });

    test('update executes smoothly with speed, rpm, gear, and telemetry data', () => {
      hud.update(
        120, // speed
        4500, // rpm
        4, // gear
        { id: 'pochinki', name: 'Pochinki Farmland' }, // biome
        '14:30', // timeStr
        { id: 'sunny', name: 'Sunny' }, // weather
        15000, // credits
        '3rd Person Chase', // cameraName
        null, // targetPos
        { x: 0, y: 6.0, z: 0 }, // playerPos
        { y: 0 }, // playerRotation
        'GPS Navigation: 400m ahead', // turnInstruction
        {
          fuel: 85,
          nitro: 90,
          nitroActive: false,
          driftScore: 1200,
          driftCombo: 3,
          headlightState: 'on',
          indicatorState: 'none',
          indicatorBlinkOn: false,
          damageHealth: 95,
          isRaceTrack: false
        }
      );

      assert.ok(true, 'HUD update executed without throwing errors');
    });
  });

  describe('SteeringWheelUI', () => {
    let wheelUI;

    beforeEach(() => {
      wheelUI = new SteeringWheelUI(container, (val) => {});
    });

    test('Initializes with center steering and supports update loop', () => {
      assert.strictEqual(wheelUI.currentAngle, 0);
      wheelUI.update(0.016);
      assert.ok(true);
    });

    test('toggleGyro enables and disables gyro mode', () => {
      wheelUI.toggleGyro(true);
      assert.strictEqual(wheelUI.gyroEnabled, true);
      wheelUI.toggleGyro(false);
      assert.strictEqual(wheelUI.gyroEnabled, false);
    });
  });

  describe('MissionsUI', () => {
    test('Initializes and toggles visibility', () => {
      const saveData = SaveSystem.getDefaultData();
      const missionsUI = new MissionsUI(container, saveData, {
        onStartMission: (m) => {},
        onClose: () => {}
      });

      assert.ok(missionsUI);
      assert.ok(missionsUI.missionsElement);

      missionsUI.show();
      assert.strictEqual(missionsUI.missionsElement.classList.contains('hidden'), false);

      missionsUI.hide();
      assert.strictEqual(missionsUI.missionsElement.classList.contains('hidden'), true);
    });
  });

  describe('SettingsUI', () => {
    test('Initializes 20-category settings interface and switches active categories', () => {
      const sm = new SettingsManager(null);
      const settingsUI = new SettingsUI(container, sm, {
        onClose: () => {}
      });

      assert.ok(settingsUI);
      assert.strictEqual(settingsUI.categories.length, 20);

      settingsUI.show();
      assert.strictEqual(settingsUI.settingsElement.classList.contains('hidden'), false);

      settingsUI.activeCategory = 'driving';
      settingsUI.renderCategoryOptions('driving');
      assert.strictEqual(settingsUI.activeCategory, 'driving');

      settingsUI.activeCategory = 'graphics';
      settingsUI.renderCategoryOptions('graphics');
      assert.strictEqual(settingsUI.activeCategory, 'graphics');

      settingsUI.hide();
      assert.strictEqual(settingsUI.settingsElement.classList.contains('hidden'), true);
    });
  });
});
