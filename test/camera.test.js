import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { CameraManager } from '../src/engine/CameraManager.js';
import { VEHICLE_CONFIGS } from '../src/config.js';

describe('Camera Manager', () => {
  let camera;
  let camManager;
  let vehicleMesh;
  let vehicleConfig;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
    camManager = new CameraManager(camera);
    vehicleConfig = VEHICLE_CONFIGS.car;

    vehicleMesh = new THREE.Group();
    vehicleMesh.position.set(0, 6.45, 0);
    vehicleMesh.rotation.set(0, 0, 0);
    camManager.setVehicle(vehicleMesh, vehicleConfig);
  });

  test('Initial camera mode is 3rd Person Chase', () => {
    const mode = camManager.getCurrentMode();
    assert.strictEqual(mode.id, 'chase');
    assert.strictEqual(mode.name, '3rd Person Chase');
  });

  test('nextCameraMode cycles through all 6 camera modes in order', () => {
    const expectedOrder = ['fpv', 'dash', 'wheel', 'hood', 'cinematic', 'chase'];
    expectedOrder.forEach(expectedId => {
      const mode = camManager.nextCameraMode();
      assert.strictEqual(mode.id, expectedId);
    });
  });

  test('setCameraMode switches directly to desired mode by ID', () => {
    camManager.setCameraMode('fpv');
    assert.strictEqual(camManager.getCurrentMode().id, 'fpv');

    camManager.setCameraMode('cinematic');
    assert.strictEqual(camManager.getCurrentMode().id, 'cinematic');

    camManager.setCameraMode('chase');
    assert.strictEqual(camManager.getCurrentMode().id, 'chase');
  });

  test('Camera update maintains upright orientation without inverted roll angle', () => {
    camManager.setCameraMode('chase');
    camManager.update(0.016, { speedKmh: 40 });

    // Ensure camera is positioned at correct distance from car
    const distToCar = camera.position.distanceTo(vehicleMesh.position);
    assert.ok(distToCar >= vehicleConfig.cameraOffsets.chase.distance, 'Camera distance should match chase offset');
    assert.ok(camera.position.y > vehicleMesh.position.y, 'Chase camera should be elevated above car');

    // Verify camera UP vector has positive Y (Never inverted or upside down)
    const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    assert.ok(worldUp.y > 0.5, `Camera up vector Y must be strongly positive (got ${worldUp.y})`);
  });

  test('120-degree cone follows vehicle rear within max ±60 degrees', () => {
    camManager.setCameraMode('chase');
    camManager.update(0.016, { speedKmh: 60 });

    // Rotate car 90 degrees
    vehicleMesh.rotation.y = Math.PI / 2;
    camManager.update(0.016, { speedKmh: 60 });

    const maxConeRad = (60 * Math.PI) / 180 + 0.05; // 60 degrees + epsilon
    const idealCamYaw = vehicleMesh.rotation.y + Math.PI;
    let angleDiff = idealCamYaw - camManager.camYaw;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    assert.ok(
      Math.abs(angleDiff) <= maxConeRad,
      `Camera yaw difference (${Math.abs(angleDiff).toFixed(2)} rad) must not exceed 60° (${maxConeRad.toFixed(2)} rad)`
    );
  });

  test('FPV Cockpit camera translates with vehicle position and rotation', () => {
    camManager.setCameraMode('fpv');
    camManager.update(0.016, { speedKmh: 0 });

    const fpvOffset = vehicleConfig.cameraOffsets.fpv;
    const expectedX = vehicleMesh.position.x + fpvOffset.x;
    const expectedY = vehicleMesh.position.y + fpvOffset.y;

    assert.ok(Math.abs(camera.position.x - expectedX) < 0.1);
    assert.ok(Math.abs(camera.position.y - expectedY) < 0.1);
  });

  test('Speed and nitro scale target FOV dynamically', () => {
    camManager.setCameraMode('chase');
    camManager.update(0.016, { speedKmh: 200, nitroActive: true });
    assert.ok(camManager.targetFov > 60, 'FOV should expand at high speed with nitro boost');
  });
});
