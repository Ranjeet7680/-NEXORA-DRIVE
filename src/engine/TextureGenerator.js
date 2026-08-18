import * as THREE from 'three';

export class TextureGenerator {
  // 1. Asphalt Road Texture with noise & grain
  static createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e2026';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 2));
    }
    ctx.putImageData(imgData, 0, 0);

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

  // 2. High-Tech Glass, Glowing Neon & Office Skyscraper Facades
  static createBuildingFacadeTexture(style = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const styles = [
      { bg: '#0f172a', glass: '#38bdf8', frame: '#0284c7', litProb: 0.75, neon: '#00f0ff' }, // Electric Cyan Glass
      { bg: '#090d16', glass: '#facc15', frame: '#b45309', litProb: 0.65, neon: '#f59e0b' }, // Warm Golden Office
      { bg: '#18181b', glass: '#ec4899', frame: '#831843', litProb: 0.70, neon: '#f43f5e' }, // Cyber Magenta
      { bg: '#0f172a', glass: '#34d399', frame: '#065f46', litProb: 0.60, neon: '#10b981' }  // Emerald Tech
    ];
    const s = styles[style % styles.length];

    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, 512, 512);

    // Vertical glowing architectural light strip along edges
    ctx.fillStyle = s.neon;
    ctx.fillRect(0, 0, 8, 512);
    ctx.fillRect(504, 0, 8, 512);

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
          // Vivid luminous window gradient with warm/cool interior
          const grad = ctx.createLinearGradient(x, y, x, y + winH);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, s.glass);
          grad.addColorStop(1, s.frame);
          ctx.fillStyle = grad;
        } else {
          // Reflected dark glass
          ctx.fillStyle = '#060911';
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

  // 4. Authentic Realistic Gauge Cluster Texture (Matching Reference Image)
  static createDashboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep matte black curved instrument binnacle
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 1024, 512);

    const drawSportDial = (cx, cy, r, label, numbers, maxAngle, needleValAngle) => {
      // Outer silver bevel
      const grad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r);
      grad.addColorStop(0, '#0a0e17');
      grad.addColorStop(0.85, '#1e293b');
      grad.addColorStop(1, '#64748b');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Inner Red Sport Arc
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.85, 0.75 * Math.PI, maxAngle);
      ctx.stroke();

      // White tick marks & numbers
      for (let i = 0; i < numbers.length; i++) {
        const a = 0.75 * Math.PI + (i / (numbers.length - 1)) * (1.5 * Math.PI);
        const x1 = cx + Math.cos(a) * (r * 0.72);
        const y1 = cy + Math.sin(a) * (r * 0.72);
        const x2 = cx + Math.cos(a) * (r * 0.84);
        const y2 = cy + Math.sin(a) * (r * 0.84);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Numbers
        const numX = cx + Math.cos(a) * (r * 0.58);
        const numY = cy + Math.sin(a) * (r * 0.58);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numbers[i], numX, numY);
      }

      // Red Luminous Needle
      const needleAngle = needleValAngle || (0.75 * Math.PI + 0.6);
      const nx = cx + Math.cos(needleAngle) * (r * 0.78);
      const ny = cy + Math.sin(needleAngle) * (r * 0.78);

      ctx.strokeStyle = '#ff1100';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Needle hub
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px "Orbitron", sans-serif';
      ctx.fillText(label, cx, cy + 50);
    };

    // ── Left Dial: Tachometer (0-8 x1000rpm) ──
    drawSportDial(240, 270, 160, 'x1000rpm', ['0', '1', '2', '3', '4', '5', '6', '7', '8'], 2.25 * Math.PI, 0.75 * Math.PI + 0.9);

    // ── Right Dial: Speedometer (0-220 km/h) ──
    drawSportDial(784, 270, 160, 'km/h', ['0', '20', '40', '60', '80', '100', '140', '180', '220'], 2.25 * Math.PI, 0.75 * Math.PI + 1.1);

    // ── Center LCD Display Cluster (Trip, ODO, Gear, Warning Symbols) ──
    const drawCenterDisplay = (cx, cy) => {
      ctx.fillStyle = '#0a101f';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 130, cy - 130, 260, 260, 12);
      ctx.fill();
      ctx.stroke();

      // Green Indicator Arrows (Left & Right)
      ctx.fillStyle = '#00ff44';
      ctx.shadowColor = '#00ff44';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy - 90);
      ctx.lineTo(cx - 60, cy - 110);
      ctx.lineTo(cx - 60, cy - 70);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 90, cy - 90);
      ctx.lineTo(cx + 60, cy - 110);
      ctx.lineTo(cx + 60, cy - 70);
      ctx.fill();
      ctx.shadowBlur = 0;

      // STOP Indicator
      ctx.fillStyle = '#ff0033';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('• STOP •', cx, cy - 95);

      // Digital Speed / Trip
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px Orbitron, sans-serif';
      ctx.fillText('89', cx, cy - 40);
      ctx.font = '14px Orbitron, sans-serif';
      ctx.fillText('KM/H  •  GEAR 4', cx, cy - 10);

      // Odometer readout
      ctx.fillStyle = '#f8fafc';
      ctx.font = '18px monospace';
      ctx.fillText('ODO 088888 km', cx, cy + 25);

      // Status Icons (Battery, Oil, Engine, Check)
      ctx.fillStyle = '#ffaa00';
      ctx.font = '22px sans-serif';
      ctx.fillText('⚠️   🔋   🛢️   ⚙️', cx, cy + 68);

      // Fuel & Temp bars
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(cx - 100, cy + 95, 80, 8);
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(cx + 20, cy + 95, 80, 8);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('FUEL E [■■■■] F', cx - 60, cy + 115);
      ctx.fillText('TEMP C [■■■■] H', cx + 60, cy + 115);
    };

    drawCenterDisplay(512, 270);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 5. Center Console Infotainment Touchscreen Tablet Texture
  static createInfotainmentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#4338ca');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 20, 472, 472);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText('16:30  •  NEXORA OS 4.0  •  5G LTE', 40, 55);

    const apps = [
      { name: 'Navigation', icon: '🗺️', color: '#0284c7' },
      { name: 'Radio Music', icon: '🎵', color: '#7c3aed' },
      { name: 'Audio System', icon: '🔊', color: '#d97706' },
      { name: 'Car Info', icon: '🚘', color: '#059669' },
      { name: 'Settings', icon: '⚙️', color: '#475569' },
      { name: 'Copilot AI', icon: '🤖', color: '#db2777' },
      { name: 'Phone Sync', icon: '📱', color: '#2563eb' },
      { name: 'Climate A/C', icon: '❄️', color: '#0891b2' },
    ];

    const cols = 4;
    const startX = 50;
    const startY = 90;
    const gapX = 110;
    const gapY = 110;

    apps.forEach((app, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      ctx.fillStyle = app.color;
      ctx.beginPath();
      ctx.roundRect(x, y, 75, 75, 16);
      ctx.fill();

      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(app.icon, x + 37, y + 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px "Exo 2", sans-serif';
      ctx.fillText(app.name, x + 37, y + 94);
    });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(40, 370, 432, 90, 16);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NOW PLAYING: Ranjeet Kumar 98.5 FM', 60, 405);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('⏮️   ▶️ PLAY   ⏭️   🔊 85%   [EQ: BASS BOOST]', 60, 435);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
