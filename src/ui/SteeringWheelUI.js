// Interactive Virtual 360° Steering Wheel & Mobile Gyroscope Controller

export class SteeringWheelUI {
  constructor(container, onSteerChange) {
    this.container = container;
    this.onSteerChange = onSteerChange;

    this.wheelElement = null;
    this.currentAngle = 0; // -540° to +540°
    this.maxAngle = 540;
    this.isDragging = false;
    this.startTouchAngle = 0;

    this.gyroEnabled = false;
    this.gyroSensitivity = 1.0;
    this.gyroBaseline = 0;

    this.initUI();
    this.initGyroscope();
  }

  initUI() {
    this.wheelElement = document.createElement('div');
    this.wheelElement.className = 'virtual-steering-wheel';
    this.wheelElement.innerHTML = `
      <div class="wheel-ring">
        <div class="wheel-hub">
          <span>NEXORA</span>
        </div>
        <div class="wheel-spoke spoke-left"></div>
        <div class="wheel-spoke spoke-right"></div>
        <div class="wheel-spoke spoke-bottom"></div>
      </div>
    `;

    this.container.appendChild(this.wheelElement);

    // Touch & Mouse Drag Handlers
    const ring = this.wheelElement.querySelector('.wheel-ring');

    const getCenterAngle = (clientX, clientY) => {
      const rect = ring.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    };

    const startDrag = (clientX, clientY) => {
      this.isDragging = true;
      this.startTouchAngle = getCenterAngle(clientX, clientY) - this.currentAngle;
    };

    const moveDrag = (clientX, clientY) => {
      if (!this.isDragging || this.gyroEnabled) return;
      const angle = getCenterAngle(clientX, clientY) - this.startTouchAngle;
      this.setAngle(angle);
    };

    const endDrag = () => {
      this.isDragging = false;
    };

    ring.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    ring.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchend', endDrag);
  }

  initGyroscope() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (!this.gyroEnabled) return;

        // Gamma = tilt left/right (-90 to +90)
        let tilt = e.gamma || 0;
        tilt = Math.max(-45, Math.min(45, tilt - this.gyroBaseline));

        const normalizedSteer = (tilt / 45) * this.gyroSensitivity;
        this.setAngle(normalizedSteer * 180);
      });
    }
  }

  setAngle(angleDeg) {
    this.currentAngle = Math.max(-this.maxAngle, Math.min(this.maxAngle, angleDeg));
    const ring = this.wheelElement.querySelector('.wheel-ring');
    if (ring) {
      ring.style.transform = `rotate(${this.currentAngle}deg)`;
    }

    const normalizedValue = this.currentAngle / 180; // -1 to +1 normalized steer
    if (this.onSteerChange) {
      this.onSteerChange(Math.max(-1.0, Math.min(1.0, normalizedValue)));
    }
  }

  update(deltaTime) {
    // Return to Center Spring Force when user releases touch
    if (!this.isDragging && !this.gyroEnabled && Math.abs(this.currentAngle) > 0.1) {
      const returnSpeed = 360 * deltaTime * 3.5;
      if (this.currentAngle > 0) {
        this.setAngle(Math.max(0, this.currentAngle - returnSpeed));
      } else {
        this.setAngle(Math.min(0, this.currentAngle + returnSpeed));
      }
    }
  }

  toggleGyro(enabled) {
    this.gyroEnabled = enabled;
  }
}
