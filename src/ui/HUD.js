// In-Game Cyber HUD Matching Reference Simulator Layout for NEXORA DRIVE

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
      <!-- Top Left: Pause Button & Navigation Menu (Matching Reference Image) -->
      <div class="hud-top-left">
        <button class="pause-square-btn" id="btnPause" title="Pause Game">⏸</button>
        <div class="nav-pills-row">
          <button class="hud-pill-btn" id="btnGarage">🏁 Garage</button>
          <button class="hud-pill-btn" id="btnMap">🗺️ Map</button>
          <button class="hud-pill-btn" id="btnMissions">📋 Missions</button>
          <button class="hud-pill-btn" id="btnSettings">⚙️ Settings</button>
        </div>
      </div>

      <!-- Top Center: Clean GPS Turn Instruction Banner -->
      <div class="hud-gps-banner" id="gpsBanner">
        🧭 <span id="gpsText">Follow open world highway ahead</span>
      </div>

      <!-- Top Right: Digital Cluster Readout (Matching Reference Image 1) -->
      <div class="hud-top-right-cluster">
        <div class="digital-stat-row speed-row">
          <span class="digital-val" id="topSpeedNum">0</span>
          <span class="digital-unit">KMH</span>
        </div>
        <div class="digital-stat-row time-row">
          <span class="stat-icon">⏱️</span>
          <span class="digital-val-sm" id="hudTime">14:00</span>
        </div>
        <div class="digital-stat-row credits-row">
          <span class="stat-icon">💳</span>
          <span class="digital-val-sm" id="hudCredits">$5,000</span>
        </div>
      </div>

      <!-- Bottom Left: Steering Wheel & Mini-Map Radar -->
      <div class="hud-bottom-left">
        <div class="hud-minimap-container">
          <canvas id="minimapCanvas" width="130" height="130"></canvas>
          <div class="minimap-label">RADAR</div>
        </div>
      </div>

      <!-- Bottom Center: Car Lighting & View Toolbar -->
      <div class="hud-bottom-center-toolbar">
        <button class="toolbar-btn" id="btnIndicatorL" title="Left Signal">◀</button>
        <button class="toolbar-btn" id="btnHeadlights">💡 <span id="headlightStateTxt">ON</span></button>
        <button class="toolbar-btn" id="btnHazard" title="Hazard Flasher">⚠️</button>
        <button class="toolbar-btn" id="btnIndicatorR" title="Right Signal">▶</button>
        <button class="toolbar-btn" id="btnCamSwitch">📷 <span id="camName">FPV</span></button>
        <button class="toolbar-btn" id="btnHorn">📣</button>
        <button class="toolbar-btn" id="btnRespawn">🔄</button>
      </div>

      <!-- Bottom Right: Authentic Metal-Grip Accelerator & Brake Pedals (Matching Image 1) -->
      <div class="hud-bottom-right-pedals">
        <div class="pedal-top-row">
          <button class="pedal-aux-btn handbrake-btn" id="pedalHandbrake">P</button>
          <button class="pedal-aux-btn nitro-btn" id="pedalNitro">⚡NOS</button>
        </div>
        <div class="pedal-main-row">
          <button class="sim-pedal brake-sim-pedal" id="pedalBrake">
            <div class="pedal-grip-dots">••••<br>••••<br>••••</div>
            <div class="pedal-label">BRAKE<br>REV</div>
          </button>
          <button class="sim-pedal gas-sim-pedal" id="pedalGas">
            <div class="pedal-grip-dots">••••<br>••••<br>••••<br>••••</div>
            <div class="pedal-label">GAS</div>
          </button>
        </div>
      </div>

      <!-- Drift Score Popup -->
      <div class="drift-score-hud" id="driftScoreHud" style="display:none;">
        <div class="drift-label">🔥 DRIFT</div>
        <div class="drift-score" id="driftScoreNum">0</div>
        <div class="drift-combo" id="driftComboNum">x0</div>
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
    bindBtn('btnHazard', 'onToggleHazard');
    bindBtn('btnIndicatorL', 'onToggleIndicatorL');
    bindBtn('btnIndicatorR', 'onToggleIndicatorR');
    bindBtn('btnHorn', 'onPlayHorn');
    bindBtn('btnRespawn', 'onRespawn');

    // Touch Pedals
    const gasBtn       = this.hudElement.querySelector('#pedalGas');
    const brakeBtn     = this.hudElement.querySelector('#pedalBrake');
    const handbrakeBtn = this.hudElement.querySelector('#pedalHandbrake');
    const nitroBtn     = this.hudElement.querySelector('#pedalNitro');

    if (gasBtn) {
      gasBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onGasPress && this.callbacks.onGasPress(true); });
      gasBtn.addEventListener('touchend',   (e) => { e.preventDefault(); this.callbacks.onGasPress && this.callbacks.onGasPress(false); });
      gasBtn.addEventListener('mousedown',  () => this.callbacks.onGasPress && this.callbacks.onGasPress(true));
      gasBtn.addEventListener('mouseup',    () => this.callbacks.onGasPress && this.callbacks.onGasPress(false));
    }

    if (brakeBtn) {
      brakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onBrakePress && this.callbacks.onBrakePress(true); });
      brakeBtn.addEventListener('touchend',   (e) => { e.preventDefault(); this.callbacks.onBrakePress && this.callbacks.onBrakePress(false); });
      brakeBtn.addEventListener('mousedown',  () => this.callbacks.onBrakePress && this.callbacks.onBrakePress(true));
      brakeBtn.addEventListener('mouseup',    () => this.callbacks.onBrakePress && this.callbacks.onBrakePress(false));
    }

    if (handbrakeBtn) {
      handbrakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onHandbrakePress && this.callbacks.onHandbrakePress(true); });
      handbrakeBtn.addEventListener('touchend',   (e) => { e.preventDefault(); this.callbacks.onHandbrakePress && this.callbacks.onHandbrakePress(false); });
      handbrakeBtn.addEventListener('mousedown',  () => this.callbacks.onHandbrakePress && this.callbacks.onHandbrakePress(true));
      handbrakeBtn.addEventListener('mouseup',    () => this.callbacks.onHandbrakePress && this.callbacks.onHandbrakePress(false));
    }

    if (nitroBtn) {
      nitroBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.callbacks.onNitroPress && this.callbacks.onNitroPress(true); });
      nitroBtn.addEventListener('touchend',   (e) => { e.preventDefault(); this.callbacks.onNitroPress && this.callbacks.onNitroPress(false); });
      nitroBtn.addEventListener('mousedown',  () => this.callbacks.onNitroPress && this.callbacks.onNitroPress(true));
      nitroBtn.addEventListener('mouseup',    () => this.callbacks.onNitroPress && this.callbacks.onNitroPress(false));
    }
  }

  update(speed, rpm, gear, biome, timeStr, weather, credits, cameraName, targetPos, playerPos, playerRotation, turnInstruction, gameplayData) {
    // 1. Digital Cluster Readout (Top-Right)
    const topSpeed = this.hudElement.querySelector('#topSpeedNum');
    if (topSpeed) topSpeed.innerText = Math.floor(speed);

    const hudTime = this.hudElement.querySelector('#hudTime');
    if (hudTime) hudTime.innerText = timeStr;

    const hudCredits = this.hudElement.querySelector('#hudCredits');
    if (hudCredits) hudCredits.innerText = `$${credits.toLocaleString()}`;

    const camName = this.hudElement.querySelector('#camName');
    if (camName) camName.innerText = cameraName;

    if (turnInstruction) {
      const gpsText = this.hudElement.querySelector('#gpsText');
      if (gpsText) gpsText.innerText = turnInstruction;
    }

    // 2. Lighting & Active states
    if (gameplayData) {
      const headTxt = this.hudElement.querySelector('#headlightStateTxt');
      const headBtn = this.hudElement.querySelector('#btnHeadlights');
      if (headTxt && headBtn) {
        headTxt.innerText = gameplayData.headlightState.toUpperCase();
        headBtn.style.borderColor = gameplayData.headlightState !== 'off' ? '#00f0ff' : 'rgba(255,255,255,0.2)';
        headBtn.style.boxShadow = gameplayData.headlightState === 'high' ? '0 0 12px #00f0ff' : 'none';
      }

      const hazBtn = this.hudElement.querySelector('#btnHazard');
      if (hazBtn) {
        hazBtn.style.background = (gameplayData.indicatorState === 'hazard' && gameplayData.indicatorBlinkOn) ? '#ff0055' : 'rgba(15, 23, 42, 0.85)';
      }

      const indL = this.hudElement.querySelector('#btnIndicatorL');
      const indR = this.hudElement.querySelector('#btnIndicatorR');
      if (indL) {
        indL.style.background = ((gameplayData.indicatorState === 'left' || gameplayData.indicatorState === 'hazard') && gameplayData.indicatorBlinkOn) ? '#ffaa00' : 'rgba(15, 23, 42, 0.85)';
      }
      if (indR) {
        indR.style.background = ((gameplayData.indicatorState === 'right' || gameplayData.indicatorState === 'hazard') && gameplayData.indicatorBlinkOn) ? '#ffaa00' : 'rgba(15, 23, 42, 0.85)';
      }

      // Drift Score display
      const driftHud = this.hudElement.querySelector('#driftScoreHud');
      if (driftHud) {
        if (gameplayData.driftScore > 0) {
          driftHud.style.display = 'flex';
          this.hudElement.querySelector('#driftScoreNum').innerText = gameplayData.driftScore.toLocaleString();
          this.hudElement.querySelector('#driftComboNum').innerText = `x${gameplayData.driftCombo}`;
        } else {
          driftHud.style.display = 'none';
        }
      }
    }

    // 3. Render Mini-Map Canvas
    this.renderMiniMap(playerPos, playerRotation, targetPos);
  }

  renderMiniMap(playerPos, playerRotation, targetPos) {
    if (!this.miniMapCtx || !playerPos) return;

    const ctx = this.miniMapCtx;
    const w = this.miniMapCanvas.width;
    const h = this.miniMapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.14;

    ctx.clearRect(0, 0, w, h);

    // Circular Clip Mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // Dark Map Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    const renderX = (wx) => cx + (wx - playerPos.x) * scale;
    const renderZ = (wz) => cy + (wz - playerPos.z) * scale;

    // Biome Region Shading
    ctx.fillStyle = 'rgba(52, 94, 50, 0.3)';
    ctx.fillRect(renderX(-1200), renderZ(-1200), 1200 * scale, 1200 * scale);
    ctx.fillStyle = 'rgba(238, 246, 255, 0.3)';
    ctx.fillRect(renderX(0), renderZ(0), 1200 * scale, 1200 * scale);
    ctx.fillStyle = 'rgba(0, 119, 190, 0.4)';
    ctx.fillRect(renderX(-1200), renderZ(0), 1200 * scale, 1200 * scale);
    ctx.fillStyle = 'rgba(110, 102, 94, 0.3)';
    ctx.fillRect(renderX(0), renderZ(-1200), 1200 * scale, 1200 * scale);

    // Draw Ring Highway (Radius 565)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 10 * scale;
    ctx.beginPath();
    ctx.arc(renderX(0), renderZ(0), 565 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffcc00';
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

    // Draw Target Marker
    if (targetPos) {
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(renderX(targetPos.x), renderZ(targetPos.z), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Outer Map Ring Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Player Vehicle Directional Arrow in Center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerRotation.y);

    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
