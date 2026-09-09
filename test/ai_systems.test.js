import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { AISafetySystem } from '../src/engine/AISafetySystem.js';
import { AINavigation } from '../src/engine/AINavigation.js';
import { AICopilot } from '../src/engine/AICopilot.js';

describe('AI Systems (Safety Coach, GPS Navigation & Copilot)', () => {
  describe('AISafetySystem', () => {
    let safety;

    beforeEach(() => {
      safety = new AISafetySystem();
    });

    test('Initial driving score is 100 with zero alerts', () => {
      assert.strictEqual(safety.drivingScore, 100);
      assert.strictEqual(safety.alerts.length, 0);
    });

    test('Triggers forward collision alert when approaching traffic vehicle closely at speed', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const trafficVehicle = {
        mesh: { position: new THREE.Vector3(0, 0, 10) } // 10m ahead (< 18m threshold)
      };

      safety.update(60, playerPos, [trafficVehicle], { id: 'pochinki' }, false);
      assert.ok(safety.alerts.some(a => a.includes('Forward Collision Hazard')));
    });

    test('Triggers speed warning when exceeding city limit (120 km/h)', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      safety.update(135, playerPos, [], { id: 'city' }, false);
      assert.ok(safety.alerts.some(a => a.includes('SPEED WARNING')));
      assert.strictEqual(safety.speedingCount, 1);
    });

    test('Triggers mountain caution warning at speed in mountains/stalber', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      safety.update(95, playerPos, [], { id: 'stalber' }, false);
      assert.ok(safety.alerts.some(a => a.includes('MOUNTAIN WARNING')));
    });

    test('Generates telemetry driving feedback according to driving score', () => {
      assert.ok(safety.getDrivingFeedback().includes('Excellent'));

      // Accumulate penalties
      safety.hardBrakeCount = 30;
      safety.speedingCount = 20;
      safety.update(50, new THREE.Vector3(), [], { id: 'pochinki' }, false);
      assert.ok(safety.drivingScore < 100);
    });
  });

  describe('AINavigation', () => {
    let nav;
    let scene;

    beforeEach(() => {
      scene = new THREE.Scene();
      nav = new AINavigation(scene);
    });

    test('Setting destination creates route line and instruction', () => {
      const target = { x: 500, z: 800 };
      nav.setDestination(target, 'Military Base');

      assert.ok(nav.activeTarget);
      assert.strictEqual(nav.activeTarget.x, 500);
      assert.ok(nav.turnInstruction.includes('Military Base'));
      assert.ok(nav.routeLineMesh);
    });

    test('Update calculates distance to destination', () => {
      nav.setDestination({ x: 100, z: 0 }, 'Target');
      nav.update(new THREE.Vector3(0, 0, 0));

      assert.ok(nav.turnInstruction.includes('100m to destination'));
    });

    test('Detects arrival when within 20m of waypoint', () => {
      nav.setDestination({ x: 15, z: 0 }, 'Target');
      nav.update(new THREE.Vector3(0, 0, 0)); // 15m away (< 20m)

      assert.ok(nav.turnInstruction.includes('Arrived at Destination'));
    });

    test('Clears destination and removes route line from scene', () => {
      nav.setDestination({ x: 200, z: 200 }, 'Target');
      assert.ok(nav.routeLineMesh);

      nav.clearDestination();
      assert.strictEqual(nav.activeTarget, null);
      assert.strictEqual(nav.routeLineMesh, null);
    });
  });

  describe('AICopilot Natural Language Processing', () => {
    let copilot;
    let mockGame;

    beforeEach(() => {
      mockGame = {
        mapUI: { callbacks: { onFastTravel: () => {} }, show: () => {} },
        missionsUI: { show: () => {} },
        currentVehicleMesh: {
          userData: {
            headlights: [{ visible: false }, { visible: false }]
          }
        },
        physicsEngine: {
          speedKmh: 85,
          respawn: () => {}
        },
        cameraManager: {
          nextCameraMode: () => ({ id: 'fpv', name: '1st Person Driver' })
        },
        aiMusicPlayer: {
          isPlaying: false,
          playStation: () => {},
          togglePlay() { this.isPlaying = !this.isPlaying; }
        },
        weatherManager: {
          setWeather: () => {}
        }
      };

      copilot = new AICopilot(mockGame);
    });

    test('Processes headlight voice commands', () => {
      const res = copilot.processCommand('turn on the headlights please');
      assert.ok(res.includes('Headlights turned ON'));
      assert.strictEqual(mockGame.currentVehicleMesh.userData.headlights[0].visible, true);
    });

    test('Processes camera view switch command', () => {
      const res = copilot.processCommand('change camera view');
      assert.ok(res.includes('1st Person Driver'));
    });

    test('Processes vehicle speed inquiry command', () => {
      const res = copilot.processCommand('how fast am I going?');
      assert.ok(res.includes('85 kilometers per hour'));
    });

    test('Processes weather change commands', () => {
      const rainRes = copilot.processCommand('make it rain');
      assert.ok(rainRes.includes('Rainy'));

      const sunRes = copilot.processCommand('make it sunny');
      assert.ok(sunRes.includes('Clear Sunny Sky'));
    });

    test('Processes music radio command', () => {
      const res = copilot.processCommand('play some music');
      assert.ok(res.includes('In-car audio radio started'));
      assert.strictEqual(mockGame.aiMusicPlayer.isPlaying, true);
    });
  });
});
