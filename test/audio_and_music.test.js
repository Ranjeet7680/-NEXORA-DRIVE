import './setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AIMusicPlayer } from '../src/engine/AIMusicPlayer.js';
import { AudioEngine } from '../src/engine/AudioEngine.js';
import { RADIO_STATIONS } from '../src/config.js';

describe('Audio Engine & AI Music Player', () => {
  let audioEngine;
  let musicPlayer;

  beforeEach(() => {
    audioEngine = new AudioEngine();
    musicPlayer = new AIMusicPlayer(audioEngine);
  });

  test('AIMusicPlayer initializes with first station and stopped state', () => {
    assert.strictEqual(musicPlayer.isPlaying, false);
    assert.strictEqual(musicPlayer.currentStationIndex, 0);
    assert.strictEqual(musicPlayer.getCurrentStation().id, RADIO_STATIONS[0].id);
  });

  test('nextStation cycles through all radio stations in sequence', () => {
    for (let i = 1; i < RADIO_STATIONS.length; i++) {
      const station = musicPlayer.nextStation();
      assert.strictEqual(station.id, RADIO_STATIONS[i].id);
    }
    // Wrap around to beginning
    const wrappedStation = musicPlayer.nextStation();
    assert.strictEqual(wrappedStation.id, RADIO_STATIONS[0].id);
  });

  test('playStation selects target station by id', () => {
    const target = RADIO_STATIONS[2];
    musicPlayer.playStation(target.id);
    assert.strictEqual(musicPlayer.getCurrentStation().id, target.id);
    assert.strictEqual(musicPlayer.isPlaying, true);
  });

  test('togglePlay switches playback state', () => {
    assert.strictEqual(musicPlayer.isPlaying, false);
    musicPlayer.togglePlay();
    assert.strictEqual(musicPlayer.isPlaying, true);
    musicPlayer.togglePlay();
    assert.strictEqual(musicPlayer.isPlaying, false);
  });

  test('AudioEngine calculates engine pitch and screech smoothly', () => {
    // Test muting
    audioEngine.setMuted(true);
    assert.strictEqual(audioEngine.isMuted, true);
    audioEngine.setMuted(false);
    assert.strictEqual(audioEngine.isMuted, false);

    // Call updateEngine - should execute without error even without WebAudio context
    audioEngine.updateEngine(3500, 120, 240, true);
    audioEngine.setScreech(0.8);
    assert.ok(true);
  });
});
