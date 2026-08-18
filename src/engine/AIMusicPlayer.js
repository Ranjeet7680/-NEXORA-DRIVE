// In-Car Radio Station Music Player for NEXORA DRIVE

import { RADIO_STATIONS } from '../config.js';

export class AIMusicPlayer {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.currentStationIndex = 0;
    this.isPlaying = false;
    this.volume = 0.5;

    this.musicOsc1 = null;
    this.musicOsc2 = null;
    this.musicGain = null;
    this.loopTimer = null;
  }

  getCurrentStation() {
    return RADIO_STATIONS[this.currentStationIndex];
  }

  playStation(stationId) {
    const idx = RADIO_STATIONS.findIndex(s => s.id === stationId);
    if (idx !== -1) {
      this.currentStationIndex = idx;
    }
    this.startSynthLoop();
  }

  nextStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % RADIO_STATIONS.length;
    if (this.isPlaying) {
      this.startSynthLoop();
    }
    return this.getCurrentStation();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startSynthLoop();
    } else {
      this.stopSynthLoop();
    }
    return this.isPlaying;
  }

  startSynthLoop() {
    this.stopSynthLoop();
    if (!this.audioEngine.ctx) return;
    this.isPlaying = true;

    const ctx = this.audioEngine.ctx;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
    this.musicGain.connect(this.audioEngine.masterGain);

    const station = this.getCurrentStation();

    // Procedural Synth Chord Progression Loop
    let chordSeq = [220, 261, 329, 392]; // A minor
    if (station.id === 'city_beats') chordSeq = [174, 220, 261, 349];
    else if (station.id === 'road_trip') chordSeq = [261, 329, 392, 523];
    else if (station.id === 'night_drive') chordSeq = [146, 174, 220, 293];

    let noteIdx = 0;
    this.loopTimer = setInterval(() => {
      if (!this.isPlaying || !ctx) return;

      const freq = chordSeq[noteIdx % chordSeq.length];
      noteIdx++;

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = station.id === 'chill_drive' ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      noteGain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    }, 450);
  }

  stopSynthLoop() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.musicGain && this.audioEngine.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.audioEngine.ctx.currentTime, 0.1);
    }
    this.isPlaying = false;
  }
}
