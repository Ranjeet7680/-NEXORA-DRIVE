// Real MP3 & Radio Station Audio Player for NEXORA DRIVE

import { RADIO_STATIONS } from '../config.js';

export class AIMusicPlayer {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.currentStationIndex = 0;
    this.isPlaying = false;
    this.volume = 0.6;

    this.audioElement = new Audio();
    this.audioElement.loop = true;

    this.loopTimer = null;
    this.musicGain = null;
  }

  getCurrentStation() {
    return RADIO_STATIONS[this.currentStationIndex];
  }

  playStation(stationId) {
    const idx = RADIO_STATIONS.findIndex(s => s.id === stationId);
    if (idx !== -1) {
      this.currentStationIndex = idx;
    }
    this.startTrack();
  }

  nextStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % RADIO_STATIONS.length;
    if (this.isPlaying) {
      this.startTrack();
    }
    return this.getCurrentStation();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startTrack();
    } else {
      this.stopTrack();
    }
    return this.isPlaying;
  }

  startTrack() {
    this.stopTrack();
    this.isPlaying = true;
    const station = this.getCurrentStation();

    if (station && station.url) {
      this.audioElement.src = station.url;
      this.audioElement.volume = this.volume;
      this.audioElement.play().catch(err => {
        console.warn('Audio playback error, falling back to synth:', err);
        this.startSynthLoop();
      });
    } else {
      this.startSynthLoop();
    }
  }

  stopTrack() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSynthLoop();
    this.isPlaying = false;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
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

    let chordSeq = [220, 261, 329, 392];
    let noteIdx = 0;
    this.loopTimer = setInterval(() => {
      if (!this.isPlaying || !ctx) return;

      const freq = chordSeq[noteIdx % chordSeq.length];
      noteIdx++;

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
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
  }
}
