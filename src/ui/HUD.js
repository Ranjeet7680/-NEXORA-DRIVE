// In-Game Cyberpunk HUD with Interactive Real-Time Mini-Map for NEXORA DRIVE

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

      <!-- Bottom Left: Interactive Mini-Map GPS -->
      <div class="hud-minimap-container">
        <canvas id="minimapCanvas" width="160" height="160"></canvas>
        <div class="minimap-label">MINI MAP RADAR</div>
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

    const rpmPct = Math.min(100, Math.max(0, (rpm / 7500) * 100));
    this.hudElement.querySelector('#rpmFill').style.width = `${rpmPct}%`;

    // Render Real-Time Mini-Map Canvas
    this.renderMiniMap(playerPos, playerRotation, targetPos);
  }

  renderMiniMap(playerPos, playerRotation, targetPos) {
    if (!this.miniMapCtx || !playerPos) return;

    const ctx = this.miniMapCtx;
    const w = this.miniMapCanvas.width;
    const h = this.miniMapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.15; // Map scale

    ctx.clearRect(0, 0, w, h);

    // Circular Clip Mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // Dark Map Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    // Render World Terrain Biomes (relative to player position)
    const renderX = (wx) => cx + (wx - playerPos.x) * scale;
    const renderZ = (wz) => cy + (wz - playerPos.z) * scale;

    // Biome Region Shading
    ctx.fillStyle = 'rgba(52, 94, 50, 0.3)'; // Forest
    ctx.fillRect(renderX(-1200), renderZ(-1200), 1200 * scale, 1200 * scale);

    ctx.fillStyle = 'rgba(238, 246, 255, 0.3)'; // Ice
    ctx.fillRect(renderX(0), renderZ(0), 1200 * scale, 1200 * scale);

    ctx.fillStyle = 'rgba(0, 119, 190, 0.4)'; // River water
    ctx.fillRect(renderX(-1200), renderZ(0), 1200 * scale, 1200 * scale);

    ctx.fillStyle = 'rgba(110, 102, 94, 0.3)'; // Mountains
    ctx.fillRect(renderX(0), renderZ(-1200), 1200 * scale, 1200 * scale);

    // Draw Ring Highway (Radius 565)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 10 * scale;
    ctx.beginPath();
    ctx.arc(renderX(0), renderZ(0), 565 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffcc00'; // Yellow center line
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(renderX(0), renderZ(0), 565 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Draw City Grid Roads
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6 * scale;
    for (let rx = -300; rx <= 300; rx += 150) {
      ctx.beginPath();
      ctx.moveTo(renderX(rx), renderZ(-300));
      ctx.lineTo(renderX(rx), renderZ(300));
      ctx.stroke();
    }
    for (let rz = -300; rz <= 300; rz += 150) {
      ctx.beginPath();
      ctx.moveTo(renderX(-300), renderZ(rz));
      ctx.lineTo(renderX(300), renderZ(rz));
      ctx.stroke();
    }

    // Draw Target GPS Marker
    if (targetPos) {
      const tx = renderX(targetPos.x);
      const tz = renderZ(targetPos.z);

      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(tx, tz, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw Garage Marker (Center Hub)
    const gx = renderX(0);
    const gz = renderZ(0);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(gx, gz, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Outer Map Ring Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Player Vehicle Directional Arrow in Center (Rotated to vehicle heading)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerRotation.y);

    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(7, 7);
    ctx.lineTo(0, 3);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#050b14';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}
