// Loading Screen Module for NEXORA DRIVE

export class LoadingScreen {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.overlay = null;
    this.progressBar = null;
    this.progressText = null;
    this.statusText = null;
    this.vehicleImage = null;

    this.steps = [
      { pct: 15, text: 'Generating City & High-Rise Buildings...' },
      { pct: 35, text: 'Preparing 5 Connected Open-World Biomes...' },
      { pct: 55, text: 'Initializing Vehicle Physics & Suspension Engine...' },
      { pct: 75, text: 'Spawning Intelligent AI Traffic & Pedestrians...' },
      { pct: 90, text: 'Configuring Dynamic Day/Night & Weather Systems...' },
      { pct: 100, text: 'WORLD READY — Click Start to Drive!' }
    ];

    this.currentStepIndex = 0;
  }

  show(loadingImage = '/assets/loading/loading_car.png') {
    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay';
    this.overlay.innerHTML = `
      <div class="loading-bg" style="background-image: url('${loadingImage}');"></div>
      <div class="loading-content">
        <div class="game-logo">
          <h1>NEXORA DRIVE</h1>
          <p>OPEN WORLD DRIVING SIMULATOR</p>
        </div>
        <div class="loading-box">
          <div class="status-message" id="loadStatus">Initializing Driving Engine...</div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="loadFill"></div>
          </div>
          <div class="progress-info">
            <span id="loadPct">0%</span>
            <span class="pulse-icon">⚡ VEHICLE SYSTEMS ONLINE</span>
          </div>
          <button class="start-btn hidden" id="startBtn">WORLD READY — START DRIVING</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.overlay);

    this.progressBar = this.overlay.querySelector('#loadFill');
    this.progressText = this.overlay.querySelector('#loadPct');
    this.statusText = this.overlay.querySelector('#loadStatus');
    const startBtn = this.overlay.querySelector('#startBtn');

    startBtn.addEventListener('click', () => {
      this.hide();
      if (this.onComplete) this.onComplete();
    });

    this.animateLoading();
  }

  animateLoading() {
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 8) + 4;
      if (currentPct > 100) currentPct = 100;

      this.progressBar.style.width = `${currentPct}%`;
      this.progressText.innerText = `${currentPct}%`;

      // Update status message based on steps
      const currentStep = this.steps.find(s => currentPct <= s.pct);
      if (currentStep) {
        this.statusText.innerText = currentStep.text;
      }

      if (currentPct >= 100) {
        clearInterval(interval);
        this.overlay.querySelector('#startBtn').classList.remove('hidden');
      }
    }, 120);
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.add('fade-out');
      setTimeout(() => {
        if (this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
      }, 500);
    }
  }
}
