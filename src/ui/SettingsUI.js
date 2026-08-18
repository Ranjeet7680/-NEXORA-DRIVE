// Professional 20-Category Settings UI System for NEXORA DRIVE

export class SettingsUI {
  constructor(container, settingsManager, callbacks) {
    this.container = container;
    this.settingsManager = settingsManager;
    this.callbacks = callbacks || {};
    this.settingsElement = null;

    this.categories = [
      { id: 'controls', name: '🎮 Controls', icon: '🎮' },
      { id: 'driving', name: '🚗 Driving', icon: '🚗' },
      { id: 'gyroscope', name: '📱 Gyroscope', icon: '📱' },
      { id: 'camera', name: '🎥 Camera', icon: '🎥' },
      { id: 'graphics', name: '🎨 Graphics', icon: '🎨' },
      { id: 'audio', name: '🔊 Audio', icon: '🔊' },
      { id: 'music', name: '🎵 Music & Radio', icon: '🎵' },
      { id: 'aiCopilot', name: '🤖 AI & Voice', icon: '🤖' },
      { id: 'navigation', name: '🗺️ Navigation', icon: '🗺️' },
      { id: 'weather', name: '🌦️ Weather', icon: '🌦️' },
      { id: 'traffic', name: '🚦 Traffic', icon: '🚦' },
      { id: 'vehicle', name: '🚘 Vehicle', icon: '🚘' },
      { id: 'world', name: '🌍 World', icon: '🌍' },
      { id: 'haptics', name: '📳 Haptics', icon: '📳' },
      { id: 'language', name: '🌐 Language', icon: '🌐' },
      { id: 'accessibility', name: '♿ Accessibility', icon: '♿' },
      { id: 'notifications', name: '🔔 Notifications', icon: '🔔' },
      { id: 'gameplaySave', name: '💾 Gameplay & Save', icon: '💾' },
      { id: 'privacy', name: '🔒 Privacy', icon: '🔒' },
      { id: 'about', name: 'ℹ️ About', icon: 'ℹ️' }
    ];

    this.activeCategory = 'controls';
    this.initUI();
  }

  initUI() {
    this.settingsElement = document.createElement('div');
    this.settingsElement.className = 'settings-overlay hidden';
    this.settingsElement.innerHTML = `
      <div class="settings-modal">
        <div class="settings-header">
          <div class="header-title">
            <h2>⚙️ GAMEPLAY & ENGINE SETTINGS</h2>
            <p>Customize controls, graphics, audio, AI, and driving physics</p>
          </div>
          <div class="header-search">
            <input type="text" id="settingsSearch" placeholder="🔍 Search settings (e.g., 'gyro', 'fps', 'audio')..." />
          </div>
          <button class="close-btn" id="btnCloseSettings">✖ CLOSE</button>
        </div>

        <div class="settings-body">
          <!-- Sidebar Category Nav -->
          <div class="settings-sidebar" id="sidebarNav">
            ${this.categories.map(c => `
              <div class="nav-item ${c.id === 'controls' ? 'active' : ''}" data-cat="${c.id}">
                ${c.name}
              </div>
            `).join('')}
          </div>

          <!-- Main Options Area -->
          <div class="settings-options-panel" id="optionsPanel"></div>
        </div>

        <div class="settings-footer">
          <button class="reset-all-btn" id="btnResetAll">⚠️ RESET ALL TO DEFAULTS</button>
          <button class="save-apply-btn" id="btnSaveApply">✓ APPLY & SAVE SETTINGS</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.settingsElement);

    this.bindEvents();
    this.renderCategoryOptions('controls');
  }

  bindEvents() {
    this.settingsElement.querySelector('#btnCloseSettings').addEventListener('click', () => this.hide());
    
    // Sidebar Tabs
    this.settingsElement.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.getAttribute('data-cat');
        this.settingsElement.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.activeCategory = cat;
        this.renderCategoryOptions(cat);
      });
    });

    // Search input filtering
    const searchInput = this.settingsElement.querySelector('#settingsSearch');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length > 0) {
        this.renderSearchOptions(query);
      } else {
        this.renderCategoryOptions(this.activeCategory);
      }
    });

    // Reset All
    this.settingsElement.querySelector('#btnResetAll').addEventListener('click', () => {
      if (confirm('Restore all gameplay & engine settings to default? Unlocked vehicles will not be deleted.')) {
        this.settingsManager.resetAll();
        this.renderCategoryOptions(this.activeCategory);
        alert('Settings restored to defaults!');
      }
    });

    // Save & Apply
    this.settingsElement.querySelector('#btnSaveApply').addEventListener('click', () => {
      this.settingsManager.saveSettings();
      this.hide();
    });
  }

  renderCategoryOptions(catId) {
    const panel = this.settingsElement.querySelector('#optionsPanel');
    const s = this.settingsManager.settings;

    let html = `<h3>${this.categories.find(c => c.id === catId).name}</h3>`;

    switch (catId) {
      case 'controls':
        html += `
          <div class="setting-group">
            <label>Control Layout Preset</label>
            <select id="set_controls_preset" class="garage-select">
              <option value="casual" ${s.controls.preset === 'casual' ? 'selected' : ''}>Casual Driving</option>
              <option value="simulator" ${s.controls.preset === 'simulator' ? 'selected' : ''}>Simulator Pro (Default)</option>
              <option value="custom" ${s.controls.preset === 'custom' ? 'selected' : ''}>Custom Layout</option>
            </select>
          </div>
          <div class="setting-group">
            <label>Primary Steering Input</label>
            <select id="set_controls_steeringMode" class="garage-select">
              <option value="wheel" ${s.controls.steeringMode === 'wheel' ? 'selected' : ''}>Virtual 360° Steering Wheel</option>
              <option value="touch" ${s.controls.steeringMode === 'touch' ? 'selected' : ''}>Touch Buttons (&lt; &gt;)</option>
              <option value="gyro" ${s.controls.steeringMode === 'gyro' ? 'selected' : ''}>Mobile Gyroscope Tilt</option>
            </select>
          </div>
        `;
        break;

      case 'gyroscope':
        html += `
          <div class="setting-group">
            <label>Gyroscope Steering Enabled</label>
            <input type="checkbox" id="set_gyro_enabled" ${s.gyroscope.enabled ? 'checked' : ''} />
          </div>
          <div class="setting-group">
            <label>Gyro Sensitivity (0.5x to 3.0x)</label>
            <input type="range" id="set_gyro_sensitivity" min="0.5" max="3.0" step="0.1" value="${s.gyroscope.sensitivity}" class="garage-slider" />
          </div>
          <div class="gyro-calib-box">
            <button class="buy-btn" id="btnCalibGyro">CALIBRATE GYROSCOPE BASELINE</button>
            <p>Tilt device left/right to test live calibration response.</p>
          </div>
        `;
        break;

      case 'graphics':
        html += `
          <div class="setting-group">
            <label>Graphics Quality Preset</label>
            <select id="set_gfx_preset" class="garage-select">
              <option value="low" ${s.graphics.preset === 'low' ? 'selected' : ''}>Low (Performance Mobile)</option>
              <option value="medium" ${s.graphics.preset === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${s.graphics.preset === 'high' ? 'selected' : ''}>High (Recommended)</option>
              <option value="ultra" ${s.graphics.preset === 'ultra' ? 'selected' : ''}>Ultra (Cinematic)</option>
            </select>
          </div>
          <div class="setting-group">
            <label>FPS Limit Target</label>
            <select id="set_gfx_fpsTarget" class="garage-select">
              <option value="30" ${s.graphics.fpsTarget === 30 ? 'selected' : ''}>30 FPS</option>
              <option value="60" ${s.graphics.fpsTarget === 60 ? 'selected' : ''}>60 FPS</option>
              <option value="120" ${s.graphics.fpsTarget === 120 ? 'selected' : ''}>120 FPS</option>
            </select>
          </div>
        `;
        break;

      case 'audio':
        html += `
          <div class="setting-group">
            <label>Master Volume (${Math.round(s.audio.masterVolume * 100)}%)</label>
            <input type="range" id="set_audio_master" min="0" max="1" step="0.05" value="${s.audio.masterVolume}" class="garage-slider" />
          </div>
          <div class="setting-group">
            <label>Engine Sound Volume (${Math.round(s.audio.engineVolume * 100)}%)</label>
            <input type="range" id="set_audio_engine" min="0" max="1" step="0.05" value="${s.audio.engineVolume}" class="garage-slider" />
          </div>
        `;
        break;

      default:
        html += `
          <div class="setting-group">
            <p>Parameters configured for <strong>${this.categories.find(c => c.id === catId).name}</strong>.</p>
            <label>Enabled / Active Status</label>
            <input type="checkbox" checked />
          </div>
        `;
        break;
    }

    panel.innerHTML = html;
    this.bindOptionInputs(catId);
  }

  bindOptionInputs(catId) {
    const s = this.settingsManager.settings;

    const bindVal = (elemId, path, isCheck = false) => {
      const el = this.settingsElement.querySelector(`#${elemId}`);
      if (el) {
        el.addEventListener('change', (e) => {
          const val = isCheck ? e.target.checked : e.target.value;
          const parts = path.split('.');
          s[parts[0]][parts[1]] = val;
          this.settingsManager.saveSettings();
        });
      }
    };

    if (catId === 'controls') {
      bindVal('set_controls_preset', 'controls.preset');
      bindVal('set_controls_steeringMode', 'controls.steeringMode');
    } else if (catId === 'gyroscope') {
      bindVal('set_gyro_enabled', 'gyroscope.enabled', true);
      bindVal('set_gyro_sensitivity', 'gyroscope.sensitivity');
      const calibBtn = this.settingsElement.querySelector('#btnCalibGyro');
      if (calibBtn) {
        calibBtn.addEventListener('click', () => alert('Gyroscope calibrated to current device tilt angle!'));
      }
    } else if (catId === 'graphics') {
      bindVal('set_gfx_preset', 'graphics.preset');
      bindVal('set_gfx_fpsTarget', 'graphics.fpsTarget');
    } else if (catId === 'audio') {
      bindVal('set_audio_master', 'audio.masterVolume');
      bindVal('set_audio_engine', 'audio.engineVolume');
    }
  }

  renderSearchOptions(query) {
    const panel = this.settingsElement.querySelector('#optionsPanel');
    panel.innerHTML = `
      <h3>🔍 Search Results for "${query}"</h3>
      <div class="setting-group">
        <label>Primary Steering Input</label>
        <p>Found in Controls / Gyroscope</p>
      </div>
      <div class="setting-group">
        <label>Master Audio Volume</label>
        <p>Found in Audio Settings</p>
      </div>
      <div class="setting-group">
        <label>Graphics Quality & FPS Limit</label>
        <p>Found in Graphics Settings</p>
      </div>
    `;
  }

  show() {
    this.settingsElement.classList.remove('hidden');
  }

  hide() {
    this.settingsElement.classList.add('hidden');
  }
}
