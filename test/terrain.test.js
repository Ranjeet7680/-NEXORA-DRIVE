import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { TerrainManager } from '../src/engine/TerrainManager.js';
import { BIOMES } from '../src/config.js';

describe('Terrain Manager & 8KM World Topography', () => {
  let scene;
  let terrain;

  beforeEach(() => {
    scene = new THREE.Scene();
    terrain = new TerrainManager(scene);
  });

  test('Mainland farmlands and towns maintain baseline elevation >= 6.0m', () => {
    // Pochinki
    const hPochinki = terrain.getHeightAt(-400, 380);
    assert.ok(hPochinki >= 6.0, `Pochinki elevation (${hPochinki}m) must be >= 6.0m`);

    // Rozhok / School
    const hRozhok = terrain.getHeightAt(400, -400);
    assert.ok(hRozhok >= 6.0, `Rozhok elevation (${hRozhok}m) must be >= 6.0m`);

    // General Farmlands
    const hFarm = terrain.getHeightAt(100, 100);
    assert.ok(hFarm >= 6.0, `Farmlands elevation (${hFarm}m) must be >= 6.0m`);
  });

  test('Stalber Mountain peak reaches prominent summit height (> 50m)', () => {
    const hStalber = terrain.getHeightAt(2300, -2600);
    assert.ok(hStalber > 50.0, `Stalber mountain peak (${hStalber.toFixed(1)}m) must be > 50m`);
  });

  test('Sosnovka Airport runway is completely flat at 6.0m for aircraft landings', () => {
    const rStart = terrain.getHeightAt(0, 2300);
    const rMid = terrain.getHeightAt(0, 2800);
    const rEnd = terrain.getHeightAt(0, 3300);

    assert.strictEqual(rStart, 6.0);
    assert.strictEqual(rMid, 6.0);
    assert.strictEqual(rEnd, 6.0);
  });

  test('Suspension bridge decks are elevated at 14.0m with sea channel below', () => {
    // West Suspension Bridge (x: -800, z: 1500)
    const westBridgeH = terrain.getHeightAt(-800, 1500);
    assert.strictEqual(westBridgeH, 14.0, 'West bridge deck must be at 14.0m');

    // East Suspension Bridge (x: 1500, z: 1500)
    const eastBridgeH = terrain.getHeightAt(1500, 1500);
    assert.strictEqual(eastBridgeH, 14.0, 'East bridge deck must be at 14.0m');

    // Water channel between bridges
    const waterChannelH = terrain.getHeightAt(0, 1500);
    assert.strictEqual(waterChannelH, -8.0, 'Sea channel must be below sea level (-8.0m)');
  });

  test('Surrounding outer ocean slopes into deep sea (< 0m)', () => {
    const deepSeaH = terrain.getHeightAt(3900, 3900);
    assert.ok(deepSeaH < 0, `Outer ocean (${deepSeaH}m) must be below 0m`);
  });

  test('getBiomeAt accurately identifies Erangel geographical zones', () => {
    assert.strictEqual(terrain.getBiomeAt(-800, 1500).id, BIOMES.BRIDGE.id);
    assert.strictEqual(terrain.getBiomeAt(0, 2500).id, BIOMES.MILITARY.id);
    assert.strictEqual(terrain.getBiomeAt(2300, -2600).id, BIOMES.STALBER.id);
    assert.strictEqual(terrain.getBiomeAt(-2200, -1200).id, BIOMES.GEORGOPOL.id);
    assert.strictEqual(terrain.getBiomeAt(2200, 500).id, BIOMES.MYLTA.id);
    assert.strictEqual(terrain.getBiomeAt(0, -1500).id, BIOMES.FOREST.id);
    assert.strictEqual(terrain.getBiomeAt(-400, 380).id, BIOMES.POCHINKI.id);
  });

  test('updateWater executes without error and updates water wave time', () => {
    assert.strictEqual(terrain.waterTime, 0);
    terrain.updateWater(0.016);
    assert.ok(terrain.waterTime > 0, 'waterTime should advance with deltaTime');
  });

  test('checkCollision detects obstacle boundaries and computes collision normals', () => {
    // Add a test obstacle collider (cylinder box)
    terrain.colliders.push({
      x: 100,
      z: 100,
      radius: 3.0,
      type: 'building'
    });

    // Test collision when within obstacle radius + vehicle radius
    const hit = terrain.checkCollision(101, 100, 1.5);
    assert.ok(hit, 'Collision should be detected');
    assert.ok(hit.overlap > 0, 'Overlap must be positive');
    assert.ok(typeof hit.normalX === 'number' && typeof hit.normalZ === 'number');

    // Test no collision when far away
    const noHit = terrain.checkCollision(200, 200, 1.5);
    assert.strictEqual(noHit, null);
  });
});
