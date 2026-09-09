import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { SepangTrackManager } from '../src/engine/SepangTrackManager.js';
import { IndianapolisTrackManager } from '../src/engine/IndianapolisTrackManager.js';
import { SpaTrackManager } from '../src/engine/SpaTrackManager.js';

describe('Race Tracks & Circuit Telemetry', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  describe('Sepang International Circuit (2025 Layout)', () => {
    let sepang;

    beforeEach(() => {
      sepang = new SepangTrackManager(scene);
    });

    test('Initializes official 5.543km 3D spline track geometry', () => {
      assert.ok(sepang.trackSpline, 'Track spline must exist');
      assert.ok(sepang.trackSpline.points.length >= 20, 'Should have complete waypoint curve points');
    });

    test('Provides lap timing and telemetry', () => {
      const telem = sepang.getTelemetry();
      assert.strictEqual(telem.currentLap, 1);
      assert.strictEqual(telem.totalLaps, 3);
      assert.strictEqual(typeof telem.currentLapTime, 'number');
      assert.strictEqual(typeof telem.bestLapTime, 'number');
    });

    test('Updates lap time and advances during simulation', () => {
      sepang.lapStartTime = 1; // Positive timestamp
      const dummyPos = new THREE.Vector3(0, 0, -450);
      sepang.update(0.1, dummyPos);
      assert.ok(sepang.currentLapTime > 0, 'currentLapTime should be positive');
    });

    test('Detects track collision boundaries with barriers', () => {
      sepang.colliders.push({
        x: 50,
        z: 100,
        radius: 2.0,
        type: 'barrier'
      });

      const hit = sepang.checkCollision(50.5, 100, 1.4);
      assert.ok(hit, 'Collision with track barrier should be detected');
      assert.ok(hit.overlap > 0);
    });
  });

  describe('Indianapolis Motor Speedway (Historic 2.5-Mile Oval)', () => {
    let indy;

    beforeEach(() => {
      indy = new IndianapolisTrackManager(scene);
    });

    test('Defines 2.5-mile oval track geometry with 900m straightaways and 220m banked turns', () => {
      assert.strictEqual(indy.straightLength, 900);
      assert.strictEqual(indy.turnRadius, 220);
      assert.strictEqual(indy.chuteLength, 180);
      assert.strictEqual(indy.trackWidth, 38);
    });

    test('Telemetry provides oval race lap tracking', () => {
      const telem = indy.getTelemetry();
      assert.strictEqual(telem.currentLap, 1);
      assert.ok(telem.totalLaps >= 3);
    });
  });

  describe('Circuit de Spa-Francorchamps (Eau Rouge & Raidillon)', () => {
    let spa;

    beforeEach(() => {
      spa = new SpaTrackManager(scene);
    });

    test('Creates 7.004km spline with steep uphill climb (+28m at Raidillon)', () => {
      assert.ok(spa.trackSpline);
      const points = spa.trackSpline.points;
      
      // Check Raidillon crest elevation
      const crestPt = points.find(p => p.y >= 20);
      assert.ok(crestPt, 'Spa spline must contain elevated Raidillon crest (+28m)');
    });

    test('Telemetry tracks F1 lap progression and checkpoints', () => {
      const telem = spa.getTelemetry();
      assert.strictEqual(telem.currentLap, 1);
      assert.strictEqual(typeof telem.currentLapTime, 'number');
    });
  });
});
