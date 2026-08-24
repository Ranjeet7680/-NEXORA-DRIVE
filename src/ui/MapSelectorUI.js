// Map Selection Modal UI for NEXORA DRIVE - Multi-Map World & Tracks

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
          <h2>🏁 SELECT DESTINATION / RACETRACK</h2>
          <button class="close-selector-btn" id="btnCloseMapSelector">✖</button>
        </div>

        <div class="map-cards-grid">
          <!-- Card 1: Sepang International Circuit (MAIN TRACK) -->
          <div class="track-card sepang-theme" data-map="sepang">
            <div class="track-badge sepang-badge">🇲🇾 MAIN 2025 TRACK</div>
            <div class="track-icon">🏎️</div>
            <h3>SEPANG INTERNATIONAL CIRCUIT</h3>
            <p>Official 2025 F1 & MotoGP Grand Prix Circuit! Double-Sided Hibiscus Grandstand, Pangkor Hairpins, 900m Straights & Sunway Turn 15.</p>
            <div class="track-specs">
              <span>📏 5.543 km Grand Prix Layout</span>
              <span>🌺 Hibiscus Canopy Grandstand</span>
              <span>⏱️ Full Lap & Sector Timing</span>
            </div>
            <button class="select-track-btn sepang-action-btn">RACE AT SEPANG</button>
          </div>

          <!-- Card 2: Metropolis 3.2KM Open World -->
          <div class="track-card" data-map="metropolis">
            <div class="track-badge">OPEN WORLD FREEROAM</div>
            <div class="track-icon">🌆</div>
            <h3>METROPOLIS 3.2KM OPEN WORLD</h3>
            <p>Freeroam across 5 biomes: Downtown Skyscrapers, Alpine Mountains, Pine Forest, Beach Highway, and Glacier Pass with 32 AI traffic bots.</p>
            <div class="track-specs">
              <span>📏 3.2 km × 3.2 km World</span>
              <span>🚗 32 AI Traffic Bots</span>
              <span>🛣️ 4-Lane Highway Circuit</span>
            </div>
            <button class="select-track-btn">DRIVE FREEROAM</button>
          </div>

          <!-- Card 3: Indianapolis Motor Speedway -->
          <div class="track-card race-theme" data-map="indianapolis">
            <div class="track-badge race-badge">2.5M THE BRICKYARD</div>
            <div class="track-icon">🏁</div>
            <h3>INDIANAPOLIS MOTOR SPEEDWAY</h3>
            <p>The legendary 2.5-Mile Oval. Race at 230+ MPH across the Yard of Bricks, Pagoda Control Tower, Pit Lane, and high-banked turns against AI rivals!</p>
            <div class="track-specs">
              <span>🏎️ 2.5-Mile Rectangular Oval</span>
              <span>🧱 The Yard of Bricks</span>
              <span>⏱️ Real-Time Lap Timing</span>
            </div>
            <button class="select-track-btn race-action-btn">RACE THE BRICKYARD</button>
          </div>

          <!-- Card 4: Circuit de Spa-Francorchamps -->
          <div class="track-card spa-theme" data-map="spa">
            <div class="track-badge spa-badge">7.004 KM F1 / GT3</div>
            <div class="track-icon">🌲</div>
            <h3>CIRCUIT DE SPA-FRANCORCHAMPS</h3>
            <p>The Rollercoaster of the Ardennes! Experience Eau Rouge & Raidillon uphill climb (+28m), Kemmel Straight, Pouhon & Blanchimont.</p>
            <div class="track-specs">
              <span>🏔️ +28m Raidillon Elevation</span>
              <span>⏱️ 3 Sector Split Timing</span>
              <span>🏎️ AI GT3 / F1 Competitors</span>
            </div>
            <button class="select-track-btn spa-action-btn">RACE AT SPA</button>
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
        backdrop-filter: blur(14px);
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
        width: 96%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
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
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
      }
      @media (max-width: 1080px) {
        .map-cards-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 640px) {
        .map-cards-grid {
          grid-template-columns: 1fr;
        }
      }
      .track-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px;
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
      .track-card.sepang-theme:hover {
        border-color: #06b6d4;
        box-shadow: 0 15px 35px rgba(6, 182, 212, 0.3);
      }
      .track-card.race-theme:hover {
        border-color: #eab308;
        box-shadow: 0 15px 35px rgba(234, 179, 8, 0.25);
      }
      .track-card.spa-theme:hover {
        border-color: #22c55e;
        box-shadow: 0 15px 35px rgba(34, 197, 94, 0.25);
      }
      .track-badge {
        position: absolute;
        top: 14px;
        right: 14px;
        font-size: 9.5px;
        font-weight: bold;
        background: #2563eb;
        padding: 4px 8px;
        border-radius: 20px;
        letter-spacing: 0.5px;
      }
      .track-badge.sepang-badge {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        color: #fff;
      }
      .track-badge.race-badge {
        background: linear-gradient(135deg, #eab308, #ca8a04);
        color: #000;
      }
      .track-badge.spa-badge {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: #fff;
      }
      .track-icon {
        font-size: 36px;
        margin-bottom: 10px;
      }
      .track-card h3 {
        font-size: 15px;
        margin: 0 0 10px 0;
        color: #fff;
      }
      .track-card p {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.45;
        flex-grow: 1;
        margin-bottom: 16px;
      }
      .track-specs {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 11px;
        color: #cbd5e1;
        background: rgba(15, 23, 42, 0.6);
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .select-track-btn {
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 11px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 12px;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: 0.2s;
      }
      .select-track-btn:hover {
        background: #1d4ed8;
      }
      .sepang-action-btn {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        color: #fff;
      }
      .sepang-action-btn:hover {
        background: linear-gradient(135deg, #22d3ee, #06b6d4);
      }
      .race-action-btn {
        background: linear-gradient(135deg, #eab308, #ca8a04);
        color: #000;
      }
      .race-action-btn:hover {
        background: linear-gradient(135deg, #facc15, #eab308);
      }
      .spa-action-btn {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: #fff;
      }
      .spa-action-btn:hover {
        background: linear-gradient(135deg, #4ade80, #22c55e);
      }
    `;
    document.head.appendChild(style);
  }
}
