// Web Audio API Sound Engine for NEXORA DRIVE Driving Simulator

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    
    // Engine sound nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    
    // Tire screech nodes
    this.screechNode = null;
    this.screechGain = null;
    
    // Siren nodes
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTimer = null;

    // Ambient nodes
    this.rainGain = null;
    this.windGain = null;
    
    this.isInitialized = false;
    this.currentBasePitch = 1.0;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSound();
      this.setupScreechSound();
      this.setupWeatherSounds();
      
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEngineSound() {
    if (!this.ctx) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // Primary engine rumble (Sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    // Secondary sub harmonic (Triangle)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(30, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  setupScreechSound() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.screechGain);
    this.screechGain.connect(this.masterGain);

    whiteNoise.start();
  }

  setupWeatherSounds() {
    if (!this.ctx) return;

    // Rain noise
    const rainBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = rainBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = rainBuffer;
    rainSrc.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainSrc.start();
  }

  setVehicleAudioProfile(pitchMultiplier = 1.0) {
    this.currentBasePitch = pitchMultiplier;
  }

  updateEngine(rpm, speedKmh, maxSpeed, isAccelerating) {
    if (!this.ctx || !this.engineOsc1 || this.isMuted) return;

    const targetVol = isAccelerating ? 0.35 : 0.18;
    this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);

    // Dynamic pitch formula based on RPM and vehicle profile
    const normalizedRpm = Math.max(1000, Math.min(7500, rpm));
    const baseFreq = (normalizedRpm / 100) * 1.2 * this.currentBasePitch;

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.05);
    
    // Filter opens up as RPM increases
    const filterFreq = 300 + (normalizedRpm / 7500) * 1800;
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);
  }

  stopEngine() {
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.1);
    }
  }

  setScreech(intensity) { // 0.0 to 1.0
    if (!this.ctx || !this.screechGain || this.isMuted) return;
    const vol = Math.min(0.4, Math.max(0.0, intensity * 0.4));
    this.screechGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  playGearShift() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playHorn() {
    if (!this.ctx || this.isMuted) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(370, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(435, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.4);
    osc2.stop(this.ctx.currentTime + 0.4);
  }

  togglePoliceSiren(active) {
    if (!this.ctx) return;
    if (active) {
      if (this.sirenOsc) return; // already active
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.setValueAtTime(600, this.ctx.currentTime);

      this.sirenGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();

      let high = false;
      this.sirenTimer = setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        high = !high;
        this.sirenOsc.frequency.setTargetAtTime(high ? 950 : 550, this.ctx.currentTime, 0.25);
      }, 400);
    } else {
      if (this.sirenTimer) clearInterval(this.sirenTimer);
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
    }
  }

  playCollisionSound(impactForce = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const vol = Math.min(0.6, 0.2 + impactForce * 0.4);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  updateWeatherAudio(weatherPreset) {
    if (!this.ctx || !this.rainGain) return;
    const rainVol = (weatherPreset.rain || weatherPreset.snow) ? 0.2 : 0.0;
    this.rainGain.gain.setTargetAtTime(rainVol, this.ctx.currentTime, 0.5);
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }
}
