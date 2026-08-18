import * as THREE from 'three';

export class AINavigation {
  constructor(scene) {
    this.scene = scene;
    this.routeLineMesh = null;
    this.activeTarget = null;
    this.turnInstruction = 'Proceed along open world highway.';
  }

  setDestination(targetPos, label = 'Waypoint') {
    this.activeTarget = targetPos;
    this.turnInstruction = `Route active: Proceeding to ${label}.`;
    this.drawRouteLine(targetPos);
  }

  clearDestination() {
    this.activeTarget = null;
    if (this.routeLineMesh) {
      this.scene.remove(this.routeLineMesh);
      this.routeLineMesh = null;
    }
  }

  drawRouteLine(targetPos) {
    if (this.routeLineMesh) {
      this.scene.remove(this.routeLineMesh);
    }

    const points = [];
    points.push(new THREE.Vector3(0, 0.4, 0));
    points.push(new THREE.Vector3(targetPos.x * 0.5, 0.4, targetPos.z * 0.5));
    points.push(new THREE.Vector3(targetPos.x, 0.4, targetPos.z));

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 4 });

    this.routeLineMesh = new THREE.Line(geo, mat);
    this.scene.add(this.routeLineMesh);
  }

  update(playerPosition) {
    if (!this.activeTarget || !playerPosition) return;

    const dist = Math.round(playerPosition.distanceTo(new THREE.Vector3(this.activeTarget.x, playerPosition.y, this.activeTarget.z)));
    
    if (dist < 20) {
      this.turnInstruction = '🎯 Arrived at Destination!';
      setTimeout(() => this.clearDestination(), 3000);
    } else {
      this.turnInstruction = `GPS Navigation: ${dist}m to destination.`;
    }
  }
}
