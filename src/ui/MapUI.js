// Full World Map Overlay for NEXORA DRIVE
// Canvas-based interactive map with biomes, roads, pins, player position

export class MapUI {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.mapElement = null;
    this.canvas = null;
    this.ctx = null;
    this.playerPos = { x: 0, z: 0 };
    this.playerRot = 0;

    // World size for map projection
    this.WORLD_SIZE = 2400;

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
            <span>NEXORA OPEN-WORLD MAP</span>
          </div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#1a5e10"></span>Forest</span>
            <span class="legend-item"><span class="legend-dot" style="background:#5a5248"></span>Mountains</span>
            <span class="legend-item"><span class="legend-dot" style="background:#e8c87a"></span>Beach</span>
            <span class="legend-item"><span class="legend-dot" style="background:#b0d8ee"></span>Ice Hills</span>
            <span class="legend-item"><span class="legend-dot" style="background:#2e7a1a"></span>City</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ffcc00"></span>Ring Highway</span>
          </div>
          <button class="close-map-btn" id="btnCloseMap">✖ CLOSE</button>
        </div>

        <div class="map-body">
          <div class="map-canvas-wrap">
            <canvas id="fullMapCanvas" width="700" height="700"></canvas>
            <div class="map-compass">N</div>
          </div>
          <div class="map-sidebar">
            <div class="map-sidebar-title">📍 LOCATIONS</div>
            <div class="map-pin-list" id="mapPinList">
              <div class="map-pin-item" data-x="0" data-z="0">
                <span class="pin-icon">🏎️</span>
                <div class="pin-info"><div class="pin-name">GARAGE HUB</div><div class="pin-sub">City Center</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="-450" data-z="-450">
                <span class="pin-icon">🚚</span>
                <div class="pin-info"><div class="pin-name">FREIGHT DEPOT</div><div class="pin-sub">Pine Forest NW</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="450" data-z="-450">
                <span class="pin-icon">🏁</span>
                <div class="pin-info"><div class="pin-name">TIME TRIAL SUMMIT</div><div class="pin-sub">Alpine Mountains NE</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="-450" data-z="450">
                <span class="pin-icon">🚕</span>
                <div class="pin-info"><div class="pin-name">TAXI STAND</div><div class="pin-sub">River & Beach SW</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="450" data-z="450">
                <span class="pin-icon">❄️</span>
                <div class="pin-info"><div class="pin-name">GLACIER DRIFT</div><div class="pin-sub">Ice Hills SE</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="0" data-z="-100">
                <span class="pin-icon">⛽</span>
                <div class="pin-info"><div class="pin-name">FUEL STATION</div><div class="pin-sub">City North</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
              <div class="map-pin-item" data-x="565" data-z="0">
                <span class="pin-icon">🏎️</span>
                <div class="pin-info"><div class="pin-name">RACE START</div><div class="pin-sub">East Ring</div></div>
                <button class="fast-travel-btn">GO</button>
              </div>
            </div>

            <div class="map-sidebar-title" style="margin-top:16px;">📊 WORLD INFO</div>
            <div class="map-world-stats">
              <div class="stat-row"><span>🌍 World Size</span><span>2.4 × 2.4 km</span></div>
              <div class="stat-row"><span>🛣️ Ring Road</span><span>~3.5 km</span></div>
              <div class="stat-row"><span>🏙️ City Blocks</span><span>7 × 7 Grid</span></div>
              <div class="stat-row"><span>🌲 Forest Area</span><span>NW Quadrant</span></div>
              <div class="stat-row"><span>🏔️ Mountains</span><span>NE Quadrant</span></div>
              <div class="stat-row"><span>🌊 Beach & River</span><span>SW Quadrant</span></div>
              <div class="stat-row"><span>❄️ Ice Valley</span><span>SE Quadrant</span></div>
            </div>
          </div>
        </div>

        <div class="map-footer">
          <span>💡 Click GO to fast travel • Ring highway radius: 565m • 5 unique biomes</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.mapElement);

    // Add CSS styles
    this._injectStyles();

    this.canvas = this.mapElement.querySelector('#fullMapCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.mapElement.querySelector('#btnCloseMap').addEventListener('click', () => this.hide());

    // Fast travel buttons
    this.mapElement.querySelectorAll('.map-pin-item').forEach(item => {
      const btn = item.querySelector('.fast-travel-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const x = parseFloat(item.getAttribute('data-x'));
          const z = parseFloat(item.getAttribute('data-z'));
          if (this.callbacks.onFastTravel) {
            this.callbacks.onFastTravel(x, z);
            this.hide();
          }
        });
      }
    });

    // Click on canvas to fast travel
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const cy = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      const half = this.WORLD_SIZE / 2;
      const wx = (cx / this.canvas.width) * this.WORLD_SIZE - half;
      const wz = (cy / this.canvas.height) * this.WORLD_SIZE - half;
      if (this.callbacks.onFastTravel) {
        this.callbacks.onFastTravel(wx, wz);
        this.hide();
      }
    });
  }

  drawStaticMap() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const S = this.canvas.width; // 700

    ctx.clearRect(0, 0, S, S);

    // ── 1. Background Ocean / void ──
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, S, S);

    // ── 2. Biome Zones (quadrant-based, matching world layout) ──
    const half = S / 2;

    // NW: Forest (green)
    ctx.fillStyle = '#1a4a10';
    ctx.fillRect(0, 0, half, half);

    // NE: Mountains (rocky grey)
    ctx.fillStyle = '#3d3830';
    ctx.fillRect(half, 0, half, half);

    // SW: River/Beach (sandy blue)
    const swGrad = ctx.createLinearGradient(0, half, half, S);
    swGrad.addColorStop(0, '#1e6a8a');
    swGrad.addColorStop(0.5, '#c8a850');
    swGrad.addColorStop(1, '#d4b870');
    ctx.fillStyle = swGrad;
    ctx.fillRect(0, half, half, half);

    // SE: Ice (light blue-white)
    const seGrad = ctx.createLinearGradient(half, half, S, S);
    seGrad.addColorStop(0, '#a8d8ee');
    seGrad.addColorStop(1, '#daf0ff');
    ctx.fillStyle = seGrad;
    ctx.fillRect(half, half, half, half);

    // ── 3. City Center (cross-roads grey overlay) ──
    const cityR = 200; // radius in map pixels
    const cityGrad = ctx.createRadialGradient(half, half, 0, half, half, cityR);
    cityGrad.addColorStop(0,   '#2a3040');
    cityGrad.addColorStop(0.6, '#22293a');
    cityGrad.addColorStop(1,   'transparent');
    ctx.fillStyle = cityGrad;
    ctx.beginPath();
    ctx.arc(half, half, cityR, 0, Math.PI * 2);
    ctx.fill();

    // ── 4. Biome zone gradient blending (smooth borders) ──
    const blendR = 120;
    [[half, half, '#1d3020', '#22293a']].forEach(([bx, by, c1, c2]) => {
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, blendR);
      g.addColorStop(0, c2);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    });

    // ── 5. Forest tree texture overlay (NW quadrant) ──
    ctx.fillStyle = 'rgba(30, 80, 20, 0.35)';
    for (let i = 0; i < 80; i++) {
      const tx = Math.random() * half;
      const ty = Math.random() * half;
      const tr = 4 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── 6. Mountain peaks (NE) ──
    ctx.fillStyle = 'rgba(180, 160, 140, 0.4)';
    for (let i = 0; i < 12; i++) {
      const mx = half + Math.random() * half;
      const my = Math.random() * half;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 12, my + 22);
      ctx.lineTo(mx + 12, my + 22);
      ctx.closePath();
      ctx.fill();
      // Snow cap
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 5, my + 10);
      ctx.lineTo(mx + 5, my + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(180, 160, 140, 0.4)';
    }

    // ── 7. Ice cracks / glaciers (SE) ──
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
      const ix = half + Math.random() * half;
      const iy = half + Math.random() * half;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix + (Math.random()-0.5)*30, iy + (Math.random()-0.5)*30);
      ctx.stroke();
    }

    // ── 8. Water shimmer (SW) ──
    ctx.strokeStyle = 'rgba(100, 200, 240, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const wy = half + Math.random() * half * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.lineTo(half * 0.6, wy);
      ctx.stroke();
    }

    // ── 9. Ring Highway ──
    const ringR = (565 / (this.WORLD_SIZE / 2)) * half; // scale ring radius to canvas
    // Road fill (dark asphalt band)
    ctx.strokeStyle = '#2d3340';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(half, half, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Road asphalt surface
    ctx.strokeStyle = '#3a3f4a';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(half, half, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Center yellow line
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(half, half, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // White edge lines
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    [ringR - 7, ringR + 7].forEach(r => {
      ctx.beginPath();
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ── 10. City Road Grid ──
    ctx.strokeStyle = '#3a4050';
    ctx.lineWidth = 6;
    const roadScale = S / this.WORLD_SIZE;
    for (let rx = -400; rx <= 400; rx += 120) {
      const px = half + rx * roadScale;
      ctx.beginPath();
      ctx.moveTo(px, half - 400 * roadScale);
      ctx.lineTo(px, half + 400 * roadScale);
      ctx.stroke();
    }
    for (let rz = -400; rz <= 400; rz += 120) {
      const py = half + rz * roadScale;
      ctx.beginPath();
      ctx.moveTo(half - 400 * roadScale, py);
      ctx.lineTo(half + 400 * roadScale, py);
      ctx.stroke();
    }

    // Road center dashes
    ctx.strokeStyle = '#ffcc0055';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    for (let rx = -400; rx <= 400; rx += 120) {
      const px = half + rx * roadScale;
      ctx.beginPath();
      ctx.moveTo(px, half - 400 * roadScale);
      ctx.lineTo(px, half + 400 * roadScale);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── 11. Biome zone labels ──
    this._drawMapLabel(ctx, '🌲 PINE\nFOREST', S * 0.18, S * 0.18, '#66cc44');
    this._drawMapLabel(ctx, '🏔️ ALPINE\nMOUNTAINS', S * 0.78, S * 0.15, '#bbaa99');
    this._drawMapLabel(ctx, '🌊 RIVER &\nBEACH', S * 0.16, S * 0.78, '#44aadd');
    this._drawMapLabel(ctx, '❄️ ICE\nHILLS', S * 0.78, S * 0.78, '#aaddff');
    this._drawMapLabel(ctx, '🌆 METROPOLIS\nCITY', S * 0.5, S * 0.5, '#88aacc');

    // ── 12. Landmark / location pins ──
    const pins = [
      { x:    0, z:    0, icon: '🏎️', label: 'GARAGE', color: '#00f0ff' },
      { x: -450, z: -450, icon: '🚚', label: 'DEPOT',  color: '#ff9900' },
      { x:  450, z: -450, icon: '🏁', label: 'SUMMIT', color: '#ff3355' },
      { x: -450, z:  450, icon: '🚕', label: 'TAXI',   color: '#ffdd00' },
      { x:  450, z:  450, icon: '❄️', label: 'GLACIER',color: '#88ddff' },
      { x:    0, z: -100, icon: '⛽', label: 'FUEL',   color: '#ff6600' },
    ];
    pins.forEach(p => {
      const mp = this.worldToMap(p.x, p.z, S);
      this._drawPin(ctx, mp.x, mp.y, p.icon, p.label, p.color);
    });

    // ── 13. Directional compass rose (corner) ──
    this._drawCompassRose(ctx, S - 52, 52, 30);

    this._drawPlayerDot(ctx, half, half, 0, S);
  }

  _drawMapLabel(ctx, text, x, y, color) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      // Shadow for readability
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(line, x + 1, y + 1 + i * 14);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y + i * 14);
    });
    ctx.restore();
  }

  _drawPin(ctx, x, y, icon, label, color) {
    ctx.save();
    // Glow ring
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Icon (emoji)
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y);

    // Label
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x, y + 15);
    ctx.restore();
  }

  _drawPlayerDot(ctx, mx, my, rotation, S) {
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(rotation);

    // Glow
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15;

    // Player triangle arrow
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(7, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawCompassRose(ctx, x, y, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.translate(x, y);

    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();

    // N S E W
    const dirs = [['N', 0, -1, '#ff4444'], ['S', 0, 1, '#aaa'], ['E', 1, 0, '#aaa'], ['W', -1, 0, '#aaa']];
    dirs.forEach(([label, dx, dy, col]) => {
      ctx.fillStyle = col;
      ctx.font = `bold ${label === 'N' ? 12 : 9}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, dx * (r - 8), dy * (r - 8));
    });

    ctx.restore();
  }

  updatePlayerPosition(pos, rotationY) {
    this.playerPos = pos;
    this.playerRot = rotationY;

    if (!this.mapElement.classList.contains('hidden') && this.ctx) {
      // Redraw map with updated player position
      this.drawStaticMap();
      const S = this.canvas.width;
      const half = S / 2;
      const mp = this.worldToMap(pos.x, pos.z, S);
      this._drawPlayerDot(this.ctx, mp.x, mp.y, rotationY, S);
    }
  }

  _injectStyles() {
    if (document.getElementById('mapui-styles')) return;
    const style = document.createElement('style');
    style.id = 'mapui-styles';
    style.textContent = `
      .map-overlay {
        position: fixed; inset: 0; z-index: 1100;
        background: rgba(4, 10, 25, 0.92);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(12px);
      }
      .map-overlay.hidden { display: none; }
      .map-container {
        width: 92vw; max-width: 1100px;
        background: linear-gradient(135deg, #0d1b2e 0%, #111827 100%);
        border: 1.5px solid rgba(0, 240, 255, 0.3);
        border-radius: 16px;
        box-shadow: 0 0 60px rgba(0, 240, 255, 0.15), inset 0 0 40px rgba(0,0,0,0.4);
        overflow: hidden;
        display: flex; flex-direction: column;
      }
      .map-header {
        display: flex; align-items: center; gap: 16px;
        padding: 14px 20px;
        background: linear-gradient(90deg, rgba(0,240,255,0.08), transparent);
        border-bottom: 1px solid rgba(0,240,255,0.15);
      }
      .map-title {
        display: flex; align-items: center; gap: 8px;
        font-family: 'Courier New', monospace;
        font-size: 16px; font-weight: 800;
        color: #00f0ff;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      .map-icon { font-size: 20px; }
      .map-legend {
        display: flex; gap: 12px; flex-wrap: wrap;
        margin-left: auto;
      }
      .legend-item {
        display: flex; align-items: center; gap: 5px;
        font-size: 11px; color: #aab; font-family: monospace;
      }
      .legend-dot {
        width: 10px; height: 10px; border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.3);
      }
      .close-map-btn {
        background: rgba(255,30,60,0.2);
        border: 1px solid rgba(255,30,60,0.5);
        color: #ff4466; border-radius: 8px;
        padding: 6px 14px; cursor: pointer;
        font-size: 12px; font-family: monospace;
        font-weight: bold; letter-spacing: 1px;
        transition: all 0.2s;
      }
      .close-map-btn:hover { background: rgba(255,30,60,0.4); }
      .map-body {
        display: flex; gap: 0;
        flex: 1; overflow: hidden;
      }
      .map-canvas-wrap {
        position: relative;
        flex: 1; display: flex; align-items: center; justify-content: center;
        padding: 20px;
        background: rgba(0,0,0,0.3);
      }
      #fullMapCanvas {
        border-radius: 12px;
        border: 2px solid rgba(0, 240, 255, 0.25);
        box-shadow: 0 0 30px rgba(0, 240, 255, 0.1);
        cursor: crosshair;
        max-width: 100%; max-height: 60vh;
      }
      .map-compass {
        position: absolute; top: 28px; left: 28px;
        font-size: 13px; font-weight: bold;
        color: #ff4444; font-family: monospace;
        text-shadow: 0 0 8px #ff4444;
      }
      .map-sidebar {
        width: 280px; min-width: 260px;
        background: rgba(0,0,0,0.3);
        border-left: 1px solid rgba(0,240,255,0.1);
        display: flex; flex-direction: column;
        overflow-y: auto;
      }
      .map-sidebar-title {
        padding: 12px 16px 8px;
        font-size: 12px; font-weight: bold;
        color: #00f0ff; font-family: monospace;
        letter-spacing: 2px; border-bottom: 1px solid rgba(0,240,255,0.1);
      }
      .map-pin-list { display: flex; flex-direction: column; }
      .map-pin-item {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        cursor: pointer; transition: background 0.2s;
      }
      .map-pin-item:hover { background: rgba(0, 240, 255, 0.06); }
      .pin-icon { font-size: 20px; flex-shrink: 0; }
      .pin-info { flex: 1; }
      .pin-name { font-size: 12px; font-weight: bold; color: #e0e8ff; font-family: monospace; }
      .pin-sub { font-size: 10px; color: #66778a; font-family: monospace; }
      .fast-travel-btn {
        background: linear-gradient(135deg, #00f0ff22, #0088aa33);
        border: 1px solid #00f0ff55;
        color: #00f0ff; border-radius: 6px;
        padding: 4px 10px; cursor: pointer;
        font-size: 11px; font-family: monospace;
        font-weight: bold; letter-spacing: 1px;
        transition: all 0.2s; flex-shrink: 0;
      }
      .fast-travel-btn:hover {
        background: rgba(0,240,255,0.25);
        box-shadow: 0 0 12px rgba(0,240,255,0.4);
      }
      .map-world-stats { padding: 8px 14px; }
      .stat-row {
        display: flex; justify-content: space-between;
        padding: 5px 0; font-size: 11px; color: #8899aa;
        font-family: monospace;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .stat-row span:last-child { color: #aabbcc; }
      .map-footer {
        padding: 10px 20px;
        text-align: center;
        font-size: 11px; color: #445566;
        font-family: monospace;
        border-top: 1px solid rgba(0,240,255,0.08);
      }
      @media (max-width: 700px) {
        .map-sidebar { display: none; }
        .map-legend { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  show() {
    this.mapElement.classList.remove('hidden');
    // Redraw with current player position
    this.drawStaticMap();
    if (this.playerPos) {
      const S = this.canvas.width;
      const mp = this.worldToMap(this.playerPos.x, this.playerPos.z, S);
      this._drawPlayerDot(this.ctx, mp.x, mp.y, this.playerRot, S);
    }
  }

  hide() {
    this.mapElement.classList.add('hidden');
  }
}
