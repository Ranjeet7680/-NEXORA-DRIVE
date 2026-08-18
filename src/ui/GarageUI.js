// Advanced 3D Garage & Tuning Studio for NEXORA DRIVE

import { VEHICLE_CONFIGS, MODULAR_PARTS } from '../config.js';

export class GarageUI {
  constructor(container, saveData, callbacks) {
    this.container = container;
    this.saveData = saveData;
    this.callbacks = callbacks || {};
    this.garageElement = null;

    this.initUI();
  }

  initUI() {
    this.garageElement = document.createElement('div');
    this.garageElement.className = 'garage-overlay hidden';
    this.garageElement.innerHTML = `
      <div class="garage-header">
        <h2>🏎️ NEXORA ADVANCED 3D TUNING STUDIO</h2>
        <div class="credits-display">CREDITS: <span id="garCredits">$5,000</span></div>
      </div>

      <div class="garage-content">
        <!-- Left: Vehicle Fleet & AI Mechanic -->
        <div class="garage-card vehicle-selector">
          <h3>VEHICLE FLEET</h3>
          <div class="vehicle-list" id="vehicleList"></div>

          <!-- AI Mechanic Prompt Bar -->
          <div class="ai-mechanic-box">
            <h4>🤖 AI MECHANIC ASSISTANT</h4>
            <div class="ai-mech-btns">
              <button class="ai-prompt-btn" data-prompt="snow">❄️ Build for Snow</button>
              <button class="ai-prompt-btn" data-prompt="sporty">🏁 Sporty GT Setup</button>
            </div>
          </div>
        </div>

        <!-- Right: Modular 3D Customization Panel -->
        <div class="garage-card upgrade-panel">
          <h3 id="currentVehName">Apex GT Sport</h3>

          <!-- Modular Parts Section -->
          <div class="upgrade-section">
            <label>Modular 3D Spoiler Style</label>
            <select id="selectSpoiler" class="garage-select">
              ${MODULAR_PARTS.spoilers.map(s => `<option value="${s.id}">${s.name} ($${s.price})</option>`).join('')}
            </select>

            <label>Wheel Rim Size</label>
            <select id="selectRimSize" class="garage-select">
              ${MODULAR_PARTS.rimSizes.map(r => `<option value="${r}">${r}" Custom Rim</option>`).join('')}
            </select>

            <label>Underglow Neon Color</label>
            <select id="selectUnderglow" class="garage-select">
              ${MODULAR_PARTS.underglowColors.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>

          <!-- Stance & Height Sliders -->
          <div class="upgrade-section">
            <label>Suspension Ride Height (-5cm to +10cm)</label>
            <input type="range" id="sliderHeight" min="-5" max="10" value="0" class="garage-slider" />
          </div>

          <!-- PBR Paint Studio -->
          <div class="upgrade-section">
            <label>Paint Material Finish</label>
            <div class="color-picker-grid">
              <div class="color-dot" style="background: #0066ff;" data-color="0x0066ff"></div>
              <div class="color-dot" style="background: #cc2222;" data-color="0xcc2222"></div>
              <div class="color-dot" style="background: #00cc44;" data-color="0x00cc44"></div>
              <div class="color-dot" style="background: #ffcc00;" data-color="0xffcc00"></div>
              <div class="color-dot" style="background: #111111;" data-color="0x111111"></div>
            </div>
            <select id="selectFinish" class="garage-select">
              ${MODULAR_PARTS.paintFinishes.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
            </select>
          </div>

          <!-- Performance Upgrades -->
          <div class="upgrade-section">
            <label>Performance Tuning</label>
            <div class="upgrade-row"><span>🚀 Engine Stage</span><span id="lvlEngine">Lvl 0</span><button class="buy-btn" id="buyEngine">+$1,500</button></div>
            <div class="upgrade-row"><span>🛑 Sport Brakes</span><span id="lvlBrakes">Lvl 0</span><button class="buy-btn" id="buyBrakes">+$1,000</button></div>
            <div class="upgrade-row"><span>🏎️ Performance Tires</span><span id="lvlTires">Lvl 0</span><button class="buy-btn" id="buyTires">+$1,200</button></div>
          </div>

          <div class="garage-actions">
            <button class="drive-btn" id="btnDrive">START DRIVING</button>
            <button class="close-btn" id="btnCloseGarage">CLOSE</button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.garageElement);
    this.renderVehicleList();
    this.bindEvents();
  }

  renderVehicleList() {
    const list = this.garageElement.querySelector('#vehicleList');
    list.innerHTML = '';

    Object.values(VEHICLE_CONFIGS).forEach(v => {
      const isUnlocked = this.saveData.unlockedVehicles.includes(v.id);
      const isSelected = this.saveData.selectedVehicle === v.id;

      const item = document.createElement('div');
      item.className = `vehicle-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
      item.innerHTML = `
        <div class="v-icon">${v.icon}</div>
        <div class="v-info">
          <div class="v-title">${v.name}</div>
          <div class="v-type">${v.type} • ${v.topSpeed} KM/H</div>
        </div>
        ${!isUnlocked ? `<button class="unlock-btn" data-id="${v.id}">Unlock $${v.price}</button>` : ''}
      `;

      item.addEventListener('click', () => {
        if (isUnlocked) {
          this.callbacks.onSelectVehicle && this.callbacks.onSelectVehicle(v.id);
          this.updatePanel();
        }
      });

      const unlockBtn = item.querySelector('.unlock-btn');
      if (unlockBtn) {
        unlockBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.callbacks.onUnlockVehicle && this.callbacks.onUnlockVehicle(v.id);
        });
      }

      list.appendChild(item);
    });
  }

  updatePanel() {
    const vId = this.saveData.selectedVehicle;
    const vConfig = VEHICLE_CONFIGS[vId];
    const upgrades = this.saveData.upgrades[vId] || { engine: 0, brakes: 0, tires: 0, suspension: 0 };

    this.garageElement.querySelector('#currentVehName').innerText = `${vConfig.icon} ${vConfig.name}`;
    this.garageElement.querySelector('#garCredits').innerText = `$${this.saveData.credits.toLocaleString()}`;

    this.garageElement.querySelector('#lvlEngine').innerText = `Lvl ${upgrades.engine}`;
    this.garageElement.querySelector('#lvlBrakes').innerText = `Lvl ${upgrades.brakes}`;
    this.garageElement.querySelector('#lvlTires').innerText = `Lvl ${upgrades.tires}`;

    this.renderVehicleList();
  }

  bindEvents() {
    this.garageElement.querySelector('#btnDrive').addEventListener('click', () => {
      this.hide();
      this.callbacks.onStartDriving && this.callbacks.onStartDriving();
    });

    this.garageElement.querySelector('#btnCloseGarage').addEventListener('click', () => {
      this.hide();
    });

    // Customization select handlers
    const vId = () => this.saveData.selectedVehicle;

    this.garageElement.querySelector('#selectSpoiler').addEventListener('change', (e) => {
      if (!this.saveData.upgrades[vId()]) this.saveData.upgrades[vId()] = {};
      this.saveData.upgrades[vId()].spoiler = e.target.value;
      this.callbacks.onUpdateCustomization && this.callbacks.onUpdateCustomization();
    });

    this.garageElement.querySelector('#selectRimSize').addEventListener('change', (e) => {
      if (!this.saveData.upgrades[vId()]) this.saveData.upgrades[vId()] = {};
      this.saveData.upgrades[vId()].rimSize = parseInt(e.target.value, 10);
      this.callbacks.onUpdateCustomization && this.callbacks.onUpdateCustomization();
    });

    this.garageElement.querySelector('#selectUnderglow').addEventListener('change', (e) => {
      if (!this.saveData.upgrades[vId()]) this.saveData.upgrades[vId()] = {};
      const u = MODULAR_PARTS.underglowColors.find(ug => ug.id === e.target.value);
      this.saveData.upgrades[vId()].underglow = e.target.value;
      this.saveData.upgrades[vId()].underglowHex = u ? u.color : null;
      this.callbacks.onUpdateCustomization && this.callbacks.onUpdateCustomization();
    });

    this.garageElement.querySelector('#sliderHeight').addEventListener('input', (e) => {
      if (!this.saveData.upgrades[vId()]) this.saveData.upgrades[vId()] = {};
      this.saveData.upgrades[vId()].rideHeight = parseFloat(e.target.value);
      this.callbacks.onUpdateCustomization && this.callbacks.onUpdateCustomization();
    });

    this.garageElement.querySelector('#selectFinish').addEventListener('change', (e) => {
      if (!this.saveData.upgrades[vId()]) this.saveData.upgrades[vId()] = {};
      this.saveData.upgrades[vId()].finish = e.target.value;
      this.callbacks.onUpdateCustomization && this.callbacks.onUpdateCustomization();
    });

    // Colors
    this.garageElement.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const color = parseInt(dot.getAttribute('data-color'), 16);
        this.callbacks.onChangeColor && this.callbacks.onChangeColor(color);
      });
    });

    // AI Mechanic Prompting
    this.garageElement.querySelectorAll('.ai-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-prompt');
        if (!this.saveData.upgrades[vId()]) this.saveData.upgrades[vId()] = {};
        if (p === 'snow') {
          this.saveData.upgrades[vId()].rimSize = 16;
          this.saveData.upgrades[vId()].rideHeight = 4;
          this.saveData.upgrades[vId()].spoiler = 'ducktail';
        } else if (p === 'sporty') {
          this.saveData.upgrades[vId()].rimSize = 19;
          this.saveData.upgrades[vId()].rideHeight = -3;
          this.saveData.upgrades[vId()].spoiler = 'carbon_wing';
          this.saveData.upgrades[vId()].underglow = 'cyan';
          this.saveData.upgrades[vId()].underglowHex = 0x00f0ff;
        }
        this.callbacks.onUpdateCustomization && this.callbacks.onUpdateCustomization();
        this.updatePanel();
      });
    });

    // Upgrades
    const bindUpgrade = (btnId, type, price) => {
      this.garageElement.querySelector(`#${btnId}`).addEventListener('click', () => {
        this.callbacks.onBuyUpgrade && this.callbacks.onBuyUpgrade(type, price);
        this.updatePanel();
      });
    };

    bindUpgrade('buyEngine', 'engine', 1500);
    bindUpgrade('buyBrakes', 'brakes', 1000);
    bindUpgrade('buyTires', 'tires', 1200);
  }

  show() {
    this.updatePanel();
    this.garageElement.classList.remove('hidden');
  }

  hide() {
    this.garageElement.classList.add('hidden');
  }
}
