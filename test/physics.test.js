import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { PhysicsEngine } from '../src/engine/PhysicsEngine.js';
import { VEHICLE_CONFIGS } from '../src/config.js';

describe('Physics Engine', () => {
  let mockTerrain;
  let mockMesh;
  let carConfig;

  beforeEach(() => {
    mockTerrain = {
      getHeightAt: (x, z) => 6.0,
      getBiomeAt: (x, z) => ({ id: 'pochinki', friction: 1.0 })
    };

    mockMesh = new THREE.Group();
    mockMesh.position.set(0, 0, 0);
    mockMesh.rotation.set(0, 0, 0);
    mockMesh.userData = {
      wheels: [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()],
      headlights: [{ material: { emissiveIntensity: 1.0 } }, { material: { emissiveIntensity: 1.0 } }],
      brakeLights: [{ material: { emissiveIntensity: 1.0 } }, { material: { emissiveIntensity: 1.0 } }],
      indicators: [{ material: { emissiveIntensity: 0.0 } }, { material: { emissiveIntensity: 0.0 } }]
    };

    carConfig = VEHICLE_CONFIGS.car;
  });

  test('PhysicsEngine initializes with default parameters', () => {
    const physics = new PhysicsEngine(mockTerrain);
    assert.strictEqual(physics.speedKmh, 0);
    assert.strictEqual(physics.gear, 1);
    assert.strictEqual(physics.rpm, 1000);
    assert.strictEqual(physics.headlightState, 'on');
    assert.strictEqual(physics.indicatorState, 'none');
    assert.strictEqual(physics.damageHealth, 100);
    assert.strictEqual(physics.isDrifting, false);
    assert.ok(physics.currentBiome);
  });

  test('setVehicle binds vehicle configuration and aligns to terrain height', () => {
    const physics = new PhysicsEngine(mockTerrain);
    physics.setVehicle(mockMesh, carConfig, { rideHeight: 0 });

    const expectedY = 6.0 + carConfig.wheelRadius;
    assert.strictEqual(physics.position.y, expectedY);
    assert.strictEqual(physics.vehicleConfig.id, 'car');
  });

  test('Throttle acceleration increases forward velocity and speedKmh', () => {
    const physics = new PhysicsEngine(mockTerrain);
    physics.setVehicle(mockMesh, carConfig, { engine: 2 });

    physics.inputThrottle = 1.0;
    
    // Simulate 10 frames of 0.016s (~0.16 seconds)
    for (let i = 0; i < 10; i++) {
      physics.update(0.016);
    }

    assert.ok(physics.speedKmh > 0, 'Car should gain speed under throttle');
    assert.ok(physics.velocity.length() > 0, 'Velocity should be non-zero');
  });

  test('Reverse throttle at low speed shifts gear to R', () => {
    const physics = new PhysicsEngine(mockTerrain);
    physics.setVehicle(mockMesh, carConfig, {});

    physics.inputThrottle = -1.0;
    physics.speedKmh = 2;
    physics.update(0.016);

    assert.strictEqual(physics.gear, 'R');
  });

  test('Steering dynamics update steering angle responsive to input', () => {
    const physics = new PhysicsEngine(mockTerrain);
    physics.setVehicle(mockMesh, carConfig, {});

    physics.inputSteer = 1.0; // Steer right
    for (let i = 0; i < 5; i++) {
      physics.update(0.016);
    }

    assert.ok(physics.steeringAngle > 0, 'Steering angle should be positive when steering right');
  });

  test('Handbrake input activates drift flag at speed', () => {
    const physics = new PhysicsEngine(mockTerrain);
    physics.setVehicle(mockMesh, carConfig, {});

    physics.speedKmh = 50;
    physics.inputHandbrake = true;
    physics.update(0.016);

    assert.strictEqual(physics.isDrifting, true);
  });

  test('Lighting and indicator state transitions', () => {
    const physics = new PhysicsEngine(mockTerrain);

    // Headlights toggle: on -> high -> off -> on
    assert.strictEqual(physics.headlightState, 'on');
    assert.strictEqual(physics.toggleHeadlights(), 'high');
    assert.strictEqual(physics.toggleHeadlights(), 'off');
    assert.strictEqual(physics.toggleHeadlights(), 'on');

    // Hazards toggle: none -> hazard -> none
    assert.strictEqual(physics.indicatorState, 'none');
    assert.strictEqual(physics.toggleHazard(), 'hazard');
    assert.strictEqual(physics.toggleHazard(), 'none');

    // Indicators toggle: none -> left -> none
    assert.strictEqual(physics.toggleIndicator('left'), 'left');
    assert.strictEqual(physics.toggleIndicator('left'), 'none');
  });

  test('Respawn resets car position, velocity, and rotation', () => {
    const physics = new PhysicsEngine(mockTerrain);
    physics.position.set(100, 20, 300);
    physics.velocity.set(15, 0, 25);
    physics.speedKmh = 90;

    physics.respawn();

    assert.strictEqual(physics.position.x, 0);
    assert.strictEqual(physics.position.y, 2);
    assert.strictEqual(physics.position.z, 0);
    assert.strictEqual(physics.speedKmh, 0);
    assert.strictEqual(physics.velocity.length(), 0);
  });
});
