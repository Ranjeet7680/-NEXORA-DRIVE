// In-Game Cyberpunk HUD for NEXORA DRIVE

export class HUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.hudElement = null;

    this.miniMapCanvas = null;
    this.miniMapCtx = null;

    this.initHUD();
  }

  initHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'game-hud';
    this.hudElement.innerHTML = `
      <!-- Top Bar: Biome, Weather, Clock, Credits -->
      <div class="hud-top-bar">
        <div class="hud-item biome-tag" id="hudBiome"><span class="icon">🌆</span> Metropolis City</div>
        <div class="hud-item weather-tag" id="hudWeather">☀️ Sunny</div>
        <div class="hud-item time-tag" id="hudTime">14:00</div>
        <div class="hud-item credits-tag" id="hudCredits">💳 $5,000</div>
        <button class="hud-btn" id="btnGarage">🏁 Garage</button>
        <button class="hud-btn" id="btnMap">🗺️ Map</button>
        <button class="hud-btn" id="btnMissions">📋 Missions</button>
        <button class="hud-btn" id="btnSettings">⚙️ Settings</button>
        <button class="hud-btn" id="btnPause">⏸️</button>
      </div>

      <!-- Turn-by-Turn GPS Guidance Banner -->
      <div class="hud-gps-banner" id="gpsBanner">
        🧭 <span id="gpsText">GPS Active: Proceed along open highway.</span>
      </div>

      <!-- Bottom Left: Mini-Map GPS -->
      <div class="hud-minimap-container">
        <canvas id="minimapCanvas" width="160" height="160"></canvas>
        <div class="minimap-label">GPS RADAR</div>
      </div>

      <!-- Bottom Center: Camera & Controls Toggles -->
      <div class="hud-center-toggles">
        <button class="ctrl-pill-btn" id="btnCamSwitch">📷 View: <span id="camName">1st Person</span></button>
        <button class="ctrl-pill-btn" id="btnHeadlights">💡 Lights</button>
        <button class="ctrl-pill-btn" id="btnHorn">📣 Horn</button>
        <button class="ctrl-pill-btn" id="btnRespawn">🔄 Unstuck</button>
      </div>

      <!-- Bottom Right: Speedometer Dial & RPM Gauge -->
      <div class="hud-gauge-cluster">
        <div class="rpm-bar-container">
          <div class="rpm-bar-fill" id="rpmFill"></div>
        </div>
        <div class="speedo-dial">
          <div class="speed-number" id="speedNum">0</div>
          <div class="speed-unit">KM/H</div>
          <div class="gear-badge" id="gearNum">1</div>
        </div>
        <div class="v-stats">
          <div class="v-stat-item"><span>FUEL</span><div class="bar"><div class="fill" style="width: 85%;"></div></div></div>
          <div class="v-stat-item"><span>HP</span><div class="bar"><div class="fill health" style="width: 100%;"></div></div></div>
        </div>
      </div>

      <!-- Mobile Touch Pedals -->
      <div class="mobile-touch-pedals">
        <button class="pedal-btn brake-pedal" id="pedalBrake">BRAKE / REV</button>
        <button class="pedal-btn handbrake-pedal" id="pedalHandbrake">P</button>
        <button class="pedal-btn gas-pedal" id="pedalGas">GAS</button>
      </div>
    `;

    this.container.appendChild(this.hudElement);

    this.miniMapCanvas = this.hudElement.querySelector('#minimapCanvas');
    this.miniMapCtx = this.miniMapCanvas.getContext('2d');

    this.bindEvents();
  }

  bindEvents() {
    const bindBtn = (id, callbackName) => {
      const btn = this.hudElement.querySelector(`#${id}`);
      if (btn) btn.addEventListener('click', () => this.callbacks[callbackName] && this.callbacks[callbackName]());
    };

    bindBtn('btnGarage', 'onOpenGarage');
    bindBtn('btnMap', 'onOpenMap');
    bindBtn('btnMissions', 'onOpenMissions');
    bindBtn('btnSettings', 'onOpenSettings');
    bindBtn('btnPause', 'onTogglePause');
    bindBtn('btnCamSwitch', 'onNextCamera');
    bindBtn('btnHeadlights', 'onToggleHeadlights');
    bindBtn('btnHorn', 'onPlayHorn');
    bindBtn('btnRespawn', 'onRespawn');

    // Touch Pedals
    const gasBtn = this.hudElement.querySelector('#pedalGas');
    const brakeBtn = this.hudElement.querySelector('#pedalBrake');
    const handbrakeBtn = this.hudElement.querySelector('#pedalHandbrake');

    if (gasBtn) {
      gasBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onGasPress && this.callbacks.onGasPress(true); });
      gasBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.callbacks.onGasPress && this.callbacks.onGasPress(false); });
      gasBtn.addEventListener('mousedown', () => this.callbacks.onGasPress && this.callbacks.onGasPress(true));
      gasBtn.addEventListener('mouseup', () => this.callbacks.onGasPress && this.callbacks.onGasPress(false));
    }

    if (brakeBtn) {
      brakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onBrakePress && this.callbacks.onBrakePress(true); });
      brakeBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.callbacks.onBrakePress && this.callbacks.onBrakePress(false); });
      brakeBtn.addEventListener('mousedown', () => this.callbacks.onBrakePress && this.callbacks.onBrakePress(true));
      brakeBtn.addEventListener('mouseup', () => this.callbacks.onBrakePress && this.callbacks.onBrakePress(false));
    }

    if (handbrakeBtn) {
      handbrakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onHandbrakePress && this.callbacks.onHandbrakePress(true); });
      handbrakeBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.callbacks.onHandbrakePress && this.callbacks.onHandbrakePress(false); });
    }
  }

  update(speed, rpm, gear, biome, timeStr, weather, credits, cameraName, targetPos, playerPos, playerRotation, turnInstruction) {
    this.hudElement.querySelector('#speedNum').innerText = speed;
    this.hudElement.querySelector('#gearNum').innerText = gear;
    this.hudElement.querySelector('#hudBiome').innerHTML = `<span class="icon">${biome.icon}</span> ${biome.name}`;
    this.hudElement.querySelector('#hudWeather').innerText = `${weather.icon} ${weather.name}`;
    this.hudElement.querySelector('#hudTime').innerText = timeStr;
    this.hudElement.querySelector('#hudCredits').innerText = `💳 $${credits}`;
    this.hudElement.querySelector('#camName').innerText = cameraName;

    if (turnInstruction) {
      this.hudElement.querySelector('#gpsText').innerText = turnInstruction;
    }

    // RPM fill
    const rpmPct = Math.min(100, Math.max(0, (rpm / 7500) * 100));
    this.hudElement.querySelector('#rpmFill').style.width = `${rpmPct}%`;

    // Render Mini-Map Radar
    this.renderMiniMap(playerPos, playerRotation, targetPos);
  }

  renderMiniMap(playerPos, playerRotation, targetPos) {
    if (!this.miniMapCtx || !playerPos) return;

    const ctx = this.miniMapCtx;
    const w = this.miniMapCanvas.width;
    const h = this.miniMapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.12;

    ctx.clearRect(0, 0, w, h);

    // Background Radar Circle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Radar grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, (cx - 2) * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Target GPS Marker
    if (targetPos) {
      const dx = (targetPos.x - playerPos.x) * scale;
      const dz = (targetPos.z - playerPos.z) * scale;
      const tx = cx + dx;
      const ty = cy + dz;

      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Direction Arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerRotation.y);

    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
