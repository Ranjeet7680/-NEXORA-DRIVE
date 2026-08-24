// Map Selection Modal UI for NEXORA DRIVE

export class MapSelectorUI {
  constructor(container, onSelectMap) {
    this.container = container;
    this.onSelectMap = onSelectMap;
    this.element = null;

    this.initUI();
  }

  initUI() {
    this.element = document.createElement('div');
    this.element.className = 'map-selector-overlay hidden';
    this.element.innerHTML = `
      <div class="map-selector-modal">
        <div class="map-selector-header">
          <h2>🏁 SELECT DESTINATION / TRACK</h2>
          <button class="close-selector-btn" id="btnCloseMapSelector">✖</button>
        </div>

        <div class="map-cards-grid">
          <!-- Card 1: Metropolis 3.2KM Open World -->
          <div class="track-card" data-map="metropolis">
            <div class="track-badge">EXPANSIVE WORLD</div>
            <div class="track-icon">🌆</div>
            <h3>METROPOLIS 3.2KM OPEN WORLD</h3>
            <p>Freeroam across 5 diverse biomes: Downtown Skyscrapers, Alpine Mountain Peaks, Pine Forest, Coastal Highway, and Glacier Ice Pass with bustling AI traffic.</p>
            <div class="track-specs">
              <span>📏 3.2 km × 3.2 km</span>
              <span>🚗 32 AI Traffic Bots</span>
              <span>🛣️ 4-Lane Highway Loop</span>
            </div>
            <button class="select-track-btn">DRIVE FREEROAM</button>
          </div>

          <!-- Card 2: Indianapolis Motor Speedway -->
          <div class="track-card race-theme" data-map="indianapolis">
            <div class="track-badge race-badge">HISTORIC RACETRACK</div>
            <div class="track-icon">🏁</div>
            <h3>INDIANAPOLIS MOTOR SPEEDWAY</h3>
            <p>The legendary 2.5-Mile Oval / The Brickyard. Race at 230+ MPH across the Yard of Bricks, Pagoda Control Tower, Pit Lane, and high-banked turns against AI rivals!</p>
            <div class="track-specs">
              <span>🏎️ 2.5-Mile Oval</span>
              <span>⏱️ Real-Time Lap Timing</span>
              <span>🏁 AI Competitor Racers</span>
            </div>
            <button class="select-track-btn race-action-btn">RACE AT THE BRICKYARD</button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this._injectStyles();
    this.bindEvents();
  }

  bindEvents() {
    this.element.querySelector('#btnCloseMapSelector').addEventListener('click', () => this.hide());

    this.element.querySelectorAll('.track-card').forEach(card => {
      card.querySelector('.select-track-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const mapId = card.getAttribute('data-map');
        if (this.onSelectMap) {
          this.onSelectMap(mapId);
        }
        this.hide();
      });

      card.addEventListener('click', () => {
        const mapId = card.getAttribute('data-map');
        if (this.onSelectMap) {
          this.onSelectMap(mapId);
        }
        this.hide();
      });
    });
  }

  show() {
    if (this.element) {
      this.element.classList.remove('hidden');
    }
  }

  hide() {
    if (this.element) {
      this.element.classList.add('hidden');
    }
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .map-selector-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(10, 15, 25, 0.88);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease;
      }
      .map-selector-overlay.hidden {
        display: none;
      }
      .map-selector-modal {
        background: linear-gradient(145deg, #182030, #0f1624);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
        border-radius: 16px;
        width: 90%;
        max-width: 860px;
        padding: 28px;
        color: #fff;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }
      .map-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 16px;
        margin-bottom: 24px;
      }
      .map-selector-header h2 {
        font-size: 22px;
        letter-spacing: 1px;
        margin: 0;
        color: #f1f5f9;
      }
      .close-selector-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        font-size: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        transition: 0.2s;
      }
      .close-selector-btn:hover {
        background: #ef4444;
      }
      .map-cards-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      @media (max-width: 720px) {
        .map-cards-grid {
          grid-template-columns: 1fr;
        }
      }
      .track-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 22px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        position: relative;
      }
      .track-card:hover {
        transform: translateY(-6px);
        border-color: #3b82f6;
        box-shadow: 0 15px 35px rgba(59, 130, 246, 0.25);
      }
      .track-card.race-theme:hover {
        border-color: #eab308;
        box-shadow: 0 15px 35px rgba(234, 179, 8, 0.25);
      }
      .track-badge {
        position: absolute;
        top: 14px;
        right: 14px;
        font-size: 10px;
        font-weight: bold;
        background: #2563eb;
        padding: 4px 10px;
        border-radius: 20px;
        letter-spacing: 0.5px;
      }
      .track-badge.race-badge {
        background: linear-gradient(135deg, #eab308, #ca8a04);
        color: #000;
      }
      .track-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .track-card h3 {
        font-size: 18px;
        margin: 0 0 10px 0;
        color: #fff;
      }
      .track-card p {
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.5;
        flex-grow: 1;
        margin-bottom: 16px;
      }
      .track-specs {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: #cbd5e1;
        background: rgba(15, 23, 42, 0.6);
        padding: 10px 14px;
        border-radius: 8px;
        margin-bottom: 18px;
      }
      .select-track-btn {
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 13px;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: 0.2s;
      }
      .select-track-btn:hover {
        background: #1d4ed8;
      }
      .race-action-btn {
        background: linear-gradient(135deg, #eab308, #ca8a04);
        color: #000;
      }
      .race-action-btn:hover {
        background: linear-gradient(135deg, #facc15, #eab308);
      }
    `;
    document.head.appendChild(style);
  }
}
