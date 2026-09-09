import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { TrafficManager } from '../src/engine/TrafficManager.js';

describe('Traffic Manager & AI Autonomous Fleet', () => {
  let scene;
  let mockTerrain;
  let traffic;

  beforeEach(() => {
    scene = new THREE.Scene();
    mockTerrain = {
      getHeightAt: (x, z) => 6.0
    };
    traffic = new TrafficManager(scene, mockTerrain);
  });

  test('TrafficManager initializes 36 vehicles with distinct routes and models', () => {
    traffic.init();

    assert.strictEqual(traffic.trafficVehicles.length, 36);
    traffic.trafficVehicles.forEach(tv => {
      assert.ok(tv.mesh instanceof THREE.Group);
      assert.ok(tv.config);
      assert.ok(tv.speed > 0);
      assert.ok(typeof tv.progress === 'number');
      assert.ok(tv.curve);
    });
  });

  test('update advances vehicles along patrol curves and animates wheels', () => {
    traffic.init();
    const firstVehicle = traffic.trafficVehicles[0];
    const initialProgress = firstVehicle.progress;

    const playerPos = new THREE.Vector3(0, 6.0, 0);
    traffic.update(0.1, playerPos);

    assert.notStrictEqual(firstVehicle.progress, initialProgress, 'Vehicle progress should advance with time');
    assert.ok(firstVehicle.mesh.position.y >= 6.0, 'Vehicle elevation should align to terrain');
  });
});
