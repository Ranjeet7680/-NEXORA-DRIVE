import * as THREE from 'three';

export class TextureGenerator {
  // 1. Asphalt Road Texture with noise & grain
  static createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base dark tarmac
    ctx.fillStyle = '#1c1e24';
    ctx.fillRect(0, 0, 512, 512);

    // Grain & noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 2));
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle aggregate flecks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  // 2. High-Tech Glass & Concrete Skyscraper Building Facades
  static createBuildingFacadeTexture(style = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const styles = [
      { bg: '#1e293b', glass: '#38bdf8', frame: '#0f172a', litProb: 0.65 }, // Modern Blue Glass
      { bg: '#0f172a', glass: '#facc15', frame: '#1e293b', litProb: 0.55 }, // Warm Office Lights
      { bg: '#334155', glass: '#00f0ff', frame: '#1e293b', litProb: 0.70 }, // Cyberpunk Cyan
      { bg: '#27272a', glass: '#a1a1aa', frame: '#18181b', litProb: 0.40 }  // Dark Granite Tower
    ];
    const s = styles[style % styles.length];

    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, 512, 512);

    const cols = 8;
    const rows = 16;
    const padX = 8;
    const padY = 6;
    const winW = (512 - (cols + 1) * padX) / cols;
    const winH = (512 - (rows + 1) * padY) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX);
        const y = padY + r * (winH + padY);

        const isLit = Math.random() < s.litProb;
        if (isLit) {
          // Glow gradient in window
          const grad = ctx.createLinearGradient(x, y, x, y + winH);
          grad.addColorStop(0, s.glass);
          grad.addColorStop(1, '#ffffff');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#090d16'; // Unlit window
        }

        ctx.fillRect(x, y, winW, winH);

        // Window border frame
        ctx.strokeStyle = s.frame;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, winW, winH);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 3. Sidewalk Paver Tiles Texture
  static createSidewalkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8b9bb4';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#5a687d';
    ctx.lineWidth = 3;

    const tileSize = 32;
    for (let x = 0; x <= 256; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }

  // 4. Car Dashboard Cluster Texture (Speedometer, Tachometer, Fuel, Indicators, Infotainment)
  static createDashboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Cyber cockpit background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 1024, 512);

    // Carbon fiber weave pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let i = -512; i < 1024; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 512, 512);
      ctx.stroke();
    }

    // ── Left Dial: Tachometer (RPM) ──
    const drawDial = (cx, cy, r, label, maxVal, unit, color) => {
      // Outer ring
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0.75 * Math.PI, 2.25 * Math.PI);
      ctx.stroke();

      // Colored active arc
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0.75 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();

      // Tick marks
      for (let a = 0.75 * Math.PI; a <= 2.25 * Math.PI; a += (1.5 * Math.PI) / 10) {
        const x1 = cx + Math.cos(a) * (r - 12);
        const y1 = cy + Math.sin(a) * (r - 12);
        const x2 = cx + Math.cos(a) * (r - 2);
        const y2 = cy + Math.sin(a) * (r - 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy - 10);
      ctx.font = '16px Orbitron, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(unit, cx, cy + 22);
    };

    drawDial(240, 256, 150, 'RPM x1000', '8', 'SPORT ENGINE', '#00f0ff');
    drawDial(784, 256, 150, 'SPEED', '320', 'KM/H', '#00ffcc');

    // ── Center Infotainment Screen ──
    ctx.fillStyle = '#0a101f';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(420, 110, 184, 290, 16);
    ctx.fill();
    ctx.stroke();

    // Infotainment screen UI
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillText('NEXORA GPS', 512, 145);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('HIGHWAY RING A-1', 512, 175);
    ctx.fillText('STATUS: OPTIMAL', 512, 205);

    // Mini Map outline on screen
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(450, 225, 124, 90);
    ctx.strokeStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(512, 270, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(512, 270, 5, 0, Math.PI * 2);
    ctx.fill();

    // Control icons at bottom of screen
    ctx.font = '18px sans-serif';
    ctx.fillText('💡   ⚠️   🎵   ⚡', 512, 365);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
