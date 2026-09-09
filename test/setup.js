// test/setup.js - Headless Browser Environment Setup for Node.js Tests

class MockCanvasContext2D {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.shadowColor = 'transparent';
    this.shadowBlur = 0;
  }
  fillRect() {}
  clearRect() {}
  getImageData() {
    return { data: new Uint8ClampedArray(512 * 512 * 4) };
  }
  putImageData() {}
  beginPath() {}
  closePath() {}
  arc() {}
  roundRect() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  clip() {}
  fill() {}
  stroke() {}
  setLineDash() {}
  getLineDash() { return []; }
  moveTo() {}
  lineTo() {}
  rect() {}
  strokeRect() {}
  fillText() {}
  measureText() { return { width: 50 }; }
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
  drawImage() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
}

class MockCanvas {
  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
    this.ctx = new MockCanvasContext2D();
    this.style = {};
  }
  getContext(type) {
    return this.ctx;
  }
  toDataURL() {
    return 'data:image/png;base64,';
  }
  addEventListener() {}
  removeEventListener() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }
}

class MockAudio {
  constructor() {
    this.src = '';
    this.loop = false;
    this.volume = 1.0;
    this.paused = true;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.style = {};
    this.classList = {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toggle(c) { this.classes.has(c) ? this.classes.delete(c) : this.classes.add(c); }
    };
    this.children = [];
    this.innerText = '';
    this.innerHTML = '';
    this.value = '';
    this.id = '';
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    return child;
  }
  querySelector(sel) {
    return new MockElement('div');
  }
  querySelectorAll(sel) {
    return [new MockElement('div')];
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
  getContext(type) {
    return new MockCanvasContext2D();
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 800, height: 600 };
  }
}

// Global browser polyfills
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {},
    speechSynthesis: null,
    AudioContext: null
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement(tag) {
      if (tag === 'canvas') return new MockCanvas();
      return new MockElement(tag);
    },
    getElementById(id) {
      const el = new MockElement('div');
      el.id = id;
      return el;
    },
    querySelector(sel) {
      return new MockElement('div');
    },
    querySelectorAll(sel) {
      return [new MockElement('div')];
    },
    body: new MockElement('body'),
    head: new MockElement('head')
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockLocalStorage();
}

if (typeof globalThis.Audio === 'undefined') {
  globalThis.Audio = MockAudio;
}

export { MockCanvas, MockLocalStorage, MockAudio, MockElement };
