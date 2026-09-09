import './setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { VehicleBuilder } from '../src/vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from '../src/config.js';

describe('Vehicle Builder & 3D Vehicle Models', () => {
  const vehicleTypes = ['car', 'mustang', 'bus', 'bike', 'truck', 'taxi', 'suv', 'police'];

  vehicleTypes.forEach(vId => {
    test(`VehicleBuilder constructs 3D mesh for '${vId}' with wheels and lights`, () => {
      const cfg = VEHICLE_CONFIGS[vId];
      const mesh = VehicleBuilder.createVehicleMesh(cfg);

      assert.ok(mesh instanceof THREE.Group, `${vId} mesh should be a THREE.Group`);
      assert.strictEqual(mesh.name, `vehicle_${vId}`);
      assert.ok(mesh.children.length > 0, `${vId} should have children parts`);

      // Verify wheels exist in userData
      const wheels = mesh.userData.wheels;
      assert.ok(Array.isArray(wheels), `${vId} must have userData.wheels array`);
      const minWheels = (vId === 'bike') ? 2 : 4;
      assert.ok(wheels.length >= minWheels, `${vId} must have at least ${minWheels} wheels (got ${wheels.length})`);

      // Verify headlights exist
      const headlights = mesh.userData.headlights;
      assert.ok(Array.isArray(headlights), `${vId} must have userData.headlights array`);
      assert.ok(headlights.length >= 1, `${vId} must have at least 1 headlight`);

      // Verify taillights / brake lights
      const brakeLights = mesh.userData.brakeLights;
      assert.ok(Array.isArray(brakeLights), `${vId} must have userData.brakeLights array`);
      assert.ok(brakeLights.length >= 1, `${vId} must have at least 1 brake light`);
    });
  });

  test('Applies custom color and PBR finishes (metallic, matte, carbon, gloss)', () => {
    const finishes = ['gloss', 'metallic', 'matte', 'carbon'];
    finishes.forEach(finish => {
      const mesh = VehicleBuilder.createVehicleMesh(VEHICLE_CONFIGS.car, {
        color: 0xff0022,
        finish: finish
      });
      assert.ok(mesh, `Mesh should build with ${finish} finish`);
    });
  });
});
