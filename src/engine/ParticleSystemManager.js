import * as THREE from 'three';

export class ParticleSystemManager {
  constructor(scene) {
    this.scene = scene;
    
    this.exhaustParticles = null;
    this.dustParticles = null;

    this.initEmitters();
  }

  initEmitters() {
    // Exhaust Smoke Emitter
    const exhaustCount = 80;
    const exhaustGeo = new THREE.BufferGeometry();
    const exhaustPos = new Float32Array(exhaustCount * 3);

    exhaustGeo.setAttribute('position', new THREE.BufferAttribute(exhaustPos, 3));
    const exhaustMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.4,
      transparent: true,
      opacity: 0.4
    });

    this.exhaustParticles = new THREE.Points(exhaustGeo, exhaustMat);
    this.scene.add(this.exhaustParticles);

    // Dust / Water / Snow Ground Spray Emitter
    const dustCount = 120;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd2b48c,
      size: 0.6,
      transparent: true,
      opacity: 0.5
    });

    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);
  }

  update(deltaTime, playerPos, speedKmh, biome, isAccelerating) {
    if (!playerPos) return;

    // 1. Exhaust Smoke Update
    if (this.exhaustParticles) {
      const pos = this.exhaustParticles.geometry.attributes.position;
      if (isAccelerating && speedKmh > 5) {
        for (let i = 0; i < pos.count * 3; i += 3) {
          if (Math.random() > 0.7) {
            pos.array[i] = playerPos.x + (Math.random() - 0.5) * 0.5;
            pos.array[i + 1] = playerPos.y + 0.3;
            pos.array[i + 2] = playerPos.z + (Math.random() - 0.5) * 0.5;
          } else {
            pos.array[i + 1] += deltaTime * 1.5;
          }
        }
        pos.needsUpdate = true;
      }
    }

    // 2. Ground Particle Spray Update (Dust in Forest/Dirt, Water in River, Snow in Ice)
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position;
      
      // Color shift depending on surface
      if (biome.id === 'ice') this.dustParticles.material.color.setHex(0xffffff);
      else if (biome.id === 'river') this.dustParticles.material.color.setHex(0x00f0ff);
      else this.dustParticles.material.color.setHex(0xd2b48c);

      if (speedKmh > 25) {
        for (let i = 0; i < pos.count * 3; i += 3) {
          pos.array[i] = playerPos.x + (Math.random() - 0.5) * 1.8;
          pos.array[i + 1] = playerPos.y + Math.random() * 0.4;
          pos.array[i + 2] = playerPos.z + (Math.random() - 0.5) * 1.8;
        }
        pos.needsUpdate = true;
      }
    }
  }
}
