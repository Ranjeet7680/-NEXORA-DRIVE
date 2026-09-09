// Full 8KM World Map Overlay for NEXORA DRIVE - Erangel Island
// Interactive canvas-based map with mainland, Sosnovka island, suspension bridges, towns, pins, player position

export class MapUI {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.mapElement = null;
    this.canvas = null;
    this.ctx = null;
    this.playerPos = { x: -400, z: 500 };
    this.playerRot = 0;

    // 8.0 KM World Scale
    this.WORLD_SIZE = 8000;

    this.initUI();
    this.drawStaticMap();
  }

  worldToMap(wx, wz, canvasSize) {
    const half = this.WORLD_SIZE / 2;
    const px = ((wx + half) / this.WORLD_SIZE) * canvasSize;
    const py = ((wz + half) / this.WORLD_SIZE) * canvasSize;
    return { x: px, y: py };
  }

  initUI() {
    this.mapElement = document.createElement('div');
    this.mapElement.className = 'map-overlay hidden';
    this.mapElement.innerHTML = `
      <div class="map-container">
        <div class="map-header">
          <div class="map-title">
            <span class="map-icon">🗺️</span>
            <span>ERANGEL 8KM BATTLEGROUND ISLAND MAP</span>
          </div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#2e7a1a"></span>Pochinki</span>
            <span class="legend-item"><span class="legend-dot" style="background:#3b4252"></span>Military Base</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ffaa00"></span>Suspension Bridges</span>
            <span class="legend-item"><span class="legend-dot" style="background:#1a5e10"></span>Pine Forests</span>
            <span class="legend-item"><span class="legend-dot" style="background:#625d56"></span>Stalber Peak</span>
            <span class="legend-item"><span class="legend-dot" style="background:#0066aa"></span>Sea Channels</span>
          </div>
          <button class="close-map-btn" id="btnCloseMap">✖ CLOSE</button>
        </div>

        <div class="map-body">
          <div class="map-canvas-wrap">
            <canvas id="fullMapCanvas" width="720" height="720"></canvas>
            <div class="map-compass">N</div>
          </div>
          <div class="map-sidebar">
            <div class="map-sidebar-title">📍 FAST TRAVEL LOCATIONS</div>
            <div class="map-pin-list" id="mapPinList">
              <div class="map-pin-item" data-x="-400" data-z="500">
                <span class="pin-icon">⛪</span>
                <div class="pin-info"><div class="pin-name">POCHINKI</div><div class="pin-sub">Central Farmland Town</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="0" data-z="2400">
                <span class="pin-icon">🎖️</span>
                <div class="pin-info"><div class="pin-name">MILITARY BASE</div><div class="pin-sub">Sosnovka Radar & Runway</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="-800" data-z="1500">
                <span class="pin-icon">🌉</span>
                <div class="pin-info"><div class="pin-name">WEST BRIDGE</div><div class="pin-sub">Sea Suspension Crossing</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="1500" data-z="1500">
                <span class="pin-icon">🌉</span>
                <div class="pin-info"><div class="pin-name">EAST BRIDGE</div><div class="pin-sub">Mylta Sea Suspension Bridge</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="-2400" data-z="-1400">
                <span class="pin-icon">🚢</span>
                <div class="pin-info"><div class="pin-name">GEORGOPOL</div><div class="pin-sub">Container Port & Bridges</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="3200" data-z="800">
                <span class="pin-icon">⚡</span>
                <div class="pin-info"><div class="pin-name">MYLTA POWER</div><div class="pin-sub">Nuclear Cooling Towers</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="1800" data-z="-1400">
                <span class="pin-icon">🏙️</span>
                <div class="pin-info"><div class="pin-name">YASNAYA POLYANA</div><div class="pin-sub">Northeast Metropolis</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="2300" data-z="-2600">
                <span class="pin-icon">🏔️</span>
                <div class="pin-info"><div class="pin-name">STALBER PEAK</div><div class="pin-sub">High Summit Mountain Ruins</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="400" data-z="-400">
                <span class="pin-icon">🏫</span>
                <div class="pin-info"><div class="pin-name">SCHOOL & ROZHOK</div><div class="pin-sub">Central Hill Compounds</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="-2000" data-z="400">
                <span class="pin-icon">🌾</span>
                <div class="pin-info"><div class="pin-name">GATKA</div><div class="pin-sub">Wheat Fields & Windmills</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
            </div>

            <div class="map-sidebar-title" style="margin-top:16px;">📊 WORLD STATS</div>
            <div class="map-world-stats">
              <div class="stat-row"><span>🌍 World Size</span><span>8.0 × 8.0 km (64 km²)</span></div>
              <div class="stat-row"><span>🌉 Sea Bridges</span><span>2 Suspension Bridges</span></div>
              <div class="stat-row"><span>🛣️ Road Network</span><span>Over 45 km of Roads</span></div>
              <div class="stat-row"><span>🌲 Vegetation</span><span>Over 1,200 3D Trees</span></div>
              <div class="stat-row"><span>🚗 AI Traffic</span><span>36 Active Vehicles</span></div>
            </div>
          </div>
        </div>

        <div class="map-footer">
          <span>💡 Click any GO button to instant fast-travel • 8km x 8km Seamless Battleground Island</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.mapElement);
    this._injectStyles();

    this.canvas = this.mapElement.querySelector('#fullMapCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.bindEvents();
  }

  bindEvents() {
    this.mapElement.querySelector('#btnCloseMap').addEventListener('click', () => this.hide());

    this.mapElement.querySelectorAll('.fast-travel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.map-pin-item');
        const x = parseFloat(item.getAttribute('data-x'));
        const z = parseFloat(item.getAttribute('data-z'));
        if (this.callbacks.onFastTravel) {
          this.callbacks.onFastTravel(x, z);
        }
        this.hide();
      });
    });
  }

  drawStaticMap() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const S = this.canvas.width;

    ctx.clearRect(0, 0, S, S);

    // 1. Deep Ocean
    ctx.fillStyle = '#081c30';
    ctx.fillRect(0, 0, S, S);

    // Grid coordinates helper
    const toMap = (x, z) => this.worldToMap(x, z, S);

    // 2. Mainland Island Polygon
    ctx.fillStyle = '#2d6824'; // Erangel green
    ctx.beginPath();
    const mainlandCorners = [
      [-3400, -3400], [-1000, -3600], [1000, -3600], [3200, -3200],
      [3600, -2000], [3500, 0], [3300, 1000], [1800, 1100],
      [1200, 1100], [500, 1100], [-600, 1100], [-1200, 1100],
      [-2800, 900], [-3500, 200], [-3500, -2000], [-3400, -3400]
    ];
    mainlandCorners.forEach((pt, idx) => {
      const m = toMap(pt[0], pt[1]);
      if (idx === 0) ctx.moveTo(m.x, m.y);
      else ctx.lineTo(m.x, m.y);
    });
    ctx.closePath();
    ctx.fill();

    // 3. Southern Sosnovka Island Polygon
    ctx.fillStyle = '#285820';
    ctx.beginPath();
    const sosnovkaCorners = [
      [-1600, 1900], [0, 1850], [1800, 1900], [2200, 2800],
      [1800, 3600], [0, 3700], [-1600, 3600], [-2000, 2800]
    ];
    sosnovkaCorners.forEach((pt, idx) => {
      const m = toMap(pt[0], pt[1]);
      if (idx === 0) ctx.moveTo(m.x, m.y);
      else ctx.lineTo(m.x, m.y);
    });
    ctx.closePath();
    ctx.fill();

    // 4. Stalber Mountain Highlands
    const stalberCenter = toMap(2300, -2600);
    const mountainGrad = ctx.createRadialGradient(stalberCenter.x, stalberCenter.y, 10, stalberCenter.x, stalberCenter.y, 80);
    mountainGrad.addColorStop(0, '#787068');
    mountainGrad.addColorStop(0.7, '#504c45');
    mountainGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mountainGrad;
    ctx.beginPath();
    ctx.arc(stalberCenter.x, stalberCenter.y, 80, 0, Math.PI * 2);
    ctx.fill();

    // 5. Farmlands (Pochinki & Gatka)
    const pochinkiCenter = toMap(-800, 500);
    const farmGrad = ctx.createRadialGradient(pochinkiCenter.x, pochinkiCenter.y, 20, pochinkiCenter.x, pochinkiCenter.y, 120);
    farmGrad.addColorStop(0, '#9da34a');
    farmGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = farmGrad;
    ctx.beginPath();
    ctx.arc(pochinkiCenter.x, pochinkiCenter.y, 120, 0, Math.PI * 2);
    ctx.fill();

    // 6. Roads (Highways)
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 3.5;

    const drawRoad = (pts) => {
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const m = toMap(p[0], p[1]);
        if (idx === 0) ctx.moveTo(m.x, m.y);
        else ctx.lineTo(m.x, m.y);
      });
      ctx.stroke();
    };

    // Coastal Highway
    drawRoad([
      [-3200, -3200], [0, -3500], [2800, -3200], [3400, -1200],
      [3200, 800], [1500, 1100], [-800, 1100], [-2800, 800],
      [-3400, -1200], [-3200, -3200]
    ]);

    // Cross-Island Highway
    drawRoad([[-2400, -1400], [400, -400], [-400, 500], [-800, 1100]]);
    drawRoad([[-400, 500], [1500, 1100]]);
    drawRoad([[-2000, 400], [-400, 500], [1400, 600], [3200, 800]]);
    drawRoad([[400, -400], [1800, -1400], [3400, -1200]]);

    // Sosnovka Highways
    drawRoad([[-800, 1900], [0, 2300], [1500, 1900]]);
    drawRoad([[0, 2300], [1600, 3200], [-1200, 3400], [-800, 1900]]);

    // 7. Suspension Bridges Across Sea Channel (Bold Yellow/Orange Deck Lines)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    // West Bridge
    const wb1 = toMap(-800, 1100);
    const wb2 = toMap(-800, 1900);
    ctx.beginPath();
    ctx.moveTo(wb1.x, wb1.y); ctx.lineTo(wb2.x, wb2.y);
    ctx.stroke();

    // East Bridge
    const eb1 = toMap(1500, 1100);
    const eb2 = toMap(1500, 1900);
    ctx.beginPath();
    ctx.moveTo(eb1.x, eb1.y); ctx.lineTo(eb2.x, eb2.y);
    ctx.stroke();

    // 8. Town Labels on Map
    const towns = [
      { name: 'POCHINKI', x: -400, z: 500, color: '#facc15' },
      { name: 'SOSNOVKA MILITARY', x: 0, z: 2400, color: '#f87171' },
      { name: 'GEORGOPOL', x: -2400, z: -1400, color: '#60a5fa' },
      { name: 'YASNAYA POLYANA', x: 1800, z: -1400, color: '#facc15' },
      { name: 'MYLTA POWER', x: 3200, z: 800, color: '#fb923c' },
      { name: 'STALBER', x: 2300, z: -2600, color: '#e2e8f0' },
      { name: 'SCHOOL & ROZHOK', x: 400, z: -400, color: '#34d399' },
      { name: 'GATKA', x: -2000, z: 400, color: '#a3e635' },
      { name: 'SEVERNY', x: 0, z: -3500, color: '#93c5fd' },
      { name: 'PRIMORSK', x: -2800, z: 800, color: '#93c5fd' },
      { name: 'NOVOREPNOYE', x: 1600, z: 3200, color: '#60a5fa' },
      { name: 'WEST BRIDGE', x: -800, z: 1500, color: '#fbbf24' },
      { name: 'EAST BRIDGE', x: 1500, z: 1500, color: '#fbbf24' }
    ];

    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    towns.forEach(t => {
      const m = toMap(t.x, t.z);
      // Text shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(t.name, m.x + 1, m.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.name, m.x, m.y);

      // Icon Dot
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y - 12, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Save Static Base Image
    this.staticImageData = ctx.getImageData(0, 0, S, S);
  }

  updatePlayerPosition(pos, rotY) {
    if (!this.ctx || !this.staticImageData) return;
    const ctx = this.ctx;
    const S = this.canvas.width;

    ctx.putImageData(this.staticImageData, 0, 0);

    const m = this.worldToMap(pos.x, pos.z, S);

    // Draw Player Arrow
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(rotY);

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00f0ff';

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 7);
    ctx.lineTo(0, 3);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  show() {
    this.mapElement.classList.remove('hidden');
    this.drawStaticMap();
  }

  hide() {
    this.mapElement.classList.add('hidden');
  }

  _injectStyles() {
    if (document.getElementById('map-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'map-ui-styles';
    style.textContent = `
      .map-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 15, 26, 0.94);
        backdrop-filter: blur(12px);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .map-container {
        width: 1080px;
        max-width: 96vw;
        max-height: 94vh;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      }
      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: #1e293b;
      }
      .map-title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .map-legend {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: #cbd5e1;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .close-map-btn {
        background: #ef4444;
        color: #ffffff;
        border: none;
        padding: 6px 14px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
      }
      .map-body {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .map-canvas-wrap {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #08111e;
        padding: 10px;
      }
      #fullMapCanvas {
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        max-width: 100%;
        max-height: 100%;
      }
      .map-compass {
        position: absolute;
        top: 24px;
        right: 24px;
        font-size: 18px;
        font-weight: 900;
        color: #ef4444;
        background: rgba(15, 23, 42, 0.8);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ef4444;
      }
      .map-sidebar {
        width: 320px;
        background: #111827;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        padding: 16px;
        overflow-y: auto;
      }
      .map-sidebar-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: #94a3b8;
        margin-bottom: 10px;
      }
      .map-pin-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .map-pin-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #1e293b;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .pin-info {
        flex: 1;
        margin-left: 8px;
      }
      .pin-name {
        font-size: 12px;
        font-weight: 700;
        color: #f1f5f9;
      }
      .pin-sub {
        font-size: 10px;
        color: #94a3b8;
      }
      .fast-travel-btn {
        background: #0ea5e9;
        color: #ffffff;
        border: none;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
      }
      .map-world-stats {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 11px;
        color: #cbd5e1;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 4px;
      }
      .map-footer {
        padding: 10px 20px;
        background: #1e293b;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 11px;
        color: #94a3b8;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }
}
