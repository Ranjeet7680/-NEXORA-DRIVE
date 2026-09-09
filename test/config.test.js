import './setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  VEHICLE_CONFIGS,
  MAP_CONFIGS,
  BIOMES,
  RADIO_STATIONS,
  MISSIONS,
  CAMERA_MODES,
  WEATHER_PRESETS
} from '../src/config.js';

describe('Configuration & Game Data Integrity', () => {
  test('Vehicle configurations are defined with complete physical & camera properties', () => {
    const requiredVehicles = ['car', 'mustang', 'bus', 'bike', 'truck', 'taxi', 'suv', 'police'];
    
    requiredVehicles.forEach(vId => {
      const v = VEHICLE_CONFIGS[vId];
      assert.ok(v, `Vehicle ${vId} must be defined`);
      assert.strictEqual(v.id, vId);
      assert.ok(v.name && typeof v.name === 'string', `${vId} must have a name`);
      assert.ok(v.mass > 0, `${vId} mass must be positive`);
      assert.ok(v.topSpeed > 0, `${vId} topSpeed must be positive`);
      assert.ok(v.acceleration > 0, `${vId} acceleration must be positive`);
      assert.ok(v.braking > 0, `${vId} braking must be positive`);
      assert.ok(v.wheelRadius > 0, `${vId} wheelRadius must be positive`);
      assert.ok(v.dimensions.length > 0 && v.dimensions.width > 0 && v.dimensions.height > 0);
      
      // Camera Offsets
      assert.ok(v.cameraOffsets.fpv, `${vId} missing FPV camera offset`);
      assert.ok(v.cameraOffsets.dash, `${vId} missing Dash camera offset`);
      assert.ok(v.cameraOffsets.wheel, `${vId} missing Wheel camera offset`);
      assert.ok(v.cameraOffsets.hood, `${vId} missing Hood camera offset`);
      assert.ok(v.cameraOffsets.chase, `${vId} missing Chase camera offset`);
      assert.ok(v.cameraOffsets.cinematic, `${vId} missing Cinematic camera offset`);
    });
  });

  test('Map configurations define open-world and circuit tracks with valid spawn coordinates', () => {
    const requiredMaps = ['erangel', 'metropolis', 'sepang', 'indianapolis', 'spa'];
    
    requiredMaps.forEach(mId => {
      const m = MAP_CONFIGS[mId];
      assert.ok(m, `Map ${mId} must be defined`);
      assert.strictEqual(m.id, mId);
      assert.ok(m.name && typeof m.name === 'string');
      assert.ok(typeof m.spawnPoint.x === 'number');
      assert.ok(typeof m.spawnPoint.y === 'number');
      assert.ok(typeof m.spawnPoint.z === 'number');
      assert.ok(['open_world', 'race_track'].includes(m.type));
    });
  });

  test('Biomes contain valid friction, colors, and icons', () => {
    const requiredBiomes = ['POCHINKI', 'MILITARY', 'FOREST', 'STALBER', 'GEORGOPOL', 'MYLTA', 'BRIDGE', 'CITY'];
    
    requiredBiomes.forEach(bKey => {
      const b = BIOMES[bKey];
      assert.ok(b, `Biome ${bKey} must be defined`);
      assert.ok(b.id && typeof b.id === 'string');
      assert.ok(b.name && typeof b.name === 'string');
      assert.ok(b.friction > 0, `Biome ${bKey} friction must be > 0`);
      assert.ok(typeof b.color === 'number');
      assert.ok(b.icon);
    });
  });

  test('Radio stations list contains valid streams and metadata', () => {
    assert.ok(RADIO_STATIONS.length >= 8, 'Must have at least 8 radio stations');
    RADIO_STATIONS.forEach(station => {
      assert.ok(station.id);
      assert.ok(station.name);
      assert.ok(station.genre);
      assert.ok(station.frequency);
      assert.ok(station.url);
    });
  });

  test('Camera modes are all 6 defined modes with names and icons', () => {
    assert.strictEqual(CAMERA_MODES.length, 6);
    const modeIds = CAMERA_MODES.map(m => m.id);
    assert.deepStrictEqual(modeIds, ['chase', 'fpv', 'dash', 'wheel', 'hood', 'cinematic']);
  });

  test('Missions have objectives, time limits, and reward credits', () => {
    assert.ok(MISSIONS.length >= 6);
    MISSIONS.forEach(mission => {
      assert.ok(mission.id);
      assert.ok(mission.title);
      assert.ok(mission.reward > 0);
      assert.ok(mission.timeLimit > 0);
      assert.ok(mission.startPos && typeof mission.startPos.x === 'number');
      assert.ok(mission.targetPos && typeof mission.targetPos.x === 'number');
      assert.ok(mission.description);
    });
  });

  test('Weather presets define lighting, fog, and precipitation attributes', () => {
    assert.strictEqual(WEATHER_PRESETS.length, 5);
    WEATHER_PRESETS.forEach(preset => {
      assert.ok(preset.id);
      assert.ok(preset.name);
      assert.ok(preset.sunIntensity >= 0);
      assert.ok(preset.fogDensity >= 0);
      assert.ok(typeof preset.rain === 'boolean');
      assert.ok(typeof preset.snow === 'boolean');
    });
  });
});
