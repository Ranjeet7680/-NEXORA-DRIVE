// Central Settings State Manager & Live Engine Parameter Binder for NEXORA DRIVE

const SETTINGS_KEY = 'nexora_drive_settings_v1';

export class SettingsManager {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.settings = SettingsManager.getDefaults();
    this.loadSettings();
  }

  static getDefaults() {
    return {
      controls: {
        preset: 'simulator', // casual, simulator, custom
        steeringMode: 'wheel', // wheel, touch, gyro
        buttonOpacity: 0.8,
        buttonSize: 1.0,
        layoutSwap: false
      },
      driving: {
        transmission: 'auto', // auto, manual
        tractionControl: true,
        abs: true,
        stabilityControl: true,
        cruiseControl: false,
        difficulty: 'simulator'
      },
      gyroscope: {
        enabled: false,
        sensitivity: 1.0,
        deadzone: 0.05,
        smoothing: 0.8,
        invert: false,
        baseline: 0
      },
      camera: {
        fov: 65,
        sensitivity: 1.0,
        cameraShake: true,
        speedFov: true,
        fpvOffsetZ: 0.1
      },
      graphics: {
        preset: 'high', // low, medium, high, ultra, custom
        resolutionScale: 1.0,
        fpsTarget: 60, // 30, 45, 60, 90, 120, unlimited
        shadows: true,
        particles: 'high',
        motionBlur: true,
        bloom: true
      },
      audio: {
        masterVolume: 0.8,
        engineVolume: 0.8,
        weatherVolume: 0.7,
        trafficVolume: 0.6,
        radioVolume: 0.7,
        voiceVolume: 0.9,
        sfxVolume: 0.8
      },
      aiCopilot: {
        enabled: true,
        voiceCommands: true,
        drivingCoach: true,
        aiNavigation: true,
        safetyAlerts: true,
        speechSpeed: 1.0
      },
      navigation: {
        gpsEnabled: true,
        voiceGuidance: true,
        routeType: 'shortest', // shortest, scenic, offroad
        show3dLine: true
      },
      weather: {
        dynamicCycle: true,
        preset: 'sunny',
        timeSpeed: 1.0,
        rainIntensity: 1.0
      },
      traffic: {
        density: 'normal', // low, normal, high, extreme
        aggression: 'normal',
        pedestrians: true,
        emergencyVehicles: true
      },
      vehicle: {
        damageSimulation: true,
        fuelConsumption: true,
        driverHands: true,
        wipersAuto: true
      },
      world: {
        populationDensity: 1.0,
        landmarkDetail: 'high',
        streamingDistance: 1500
      },
      haptics: {
        enabled: true,
        intensity: 'medium'
      },
      language: {
        textLanguage: 'en', // en, hi, hinglish, es, fr, de
        voiceLanguage: 'en'
      },
      accessibility: {
        uiScale: 1.0,
        highContrast: false,
        reducedMotion: false,
        subtitles: true
      },
      notifications: {
        missions: true,
        fuelAlerts: true,
        achievements: true
      },
      gameplaySave: {
        autoSave: true,
        saveFrequencyMinutes: 5
      },
      privacy: {
        micPermission: true,
        analytics: false
      },
      about: {
        version: '1.0.0 Pro Master Build'
      }
    };
  }

  loadSettings() {
    try {
      const item = localStorage.getItem(SETTINGS_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        this.settings = this.deepMerge(SettingsManager.getDefaults(), parsed);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
      this.settings = SettingsManager.getDefaults();
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.applySettingsToEngine();
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  resetCategory(categoryKey) {
    const defaults = SettingsManager.getDefaults();
    if (defaults[categoryKey]) {
      this.settings[categoryKey] = { ...defaults[categoryKey] };
      this.saveSettings();
    }
  }

  resetAll() {
    this.settings = SettingsManager.getDefaults();
    this.saveSettings();
  }

  applySettingsToEngine() {
    if (!this.game) return;

    // 1. Audio Volumes
    const a = this.settings.audio;
    if (this.game.audioEngine) {
      this.game.audioEngine.setMuted(a.masterVolume === 0);
    }

    // 2. Camera FOV
    const c = this.settings.camera;
    if (this.game.sceneManager && this.game.sceneManager.camera) {
      this.game.sceneManager.camera.fov = c.fov;
      this.game.sceneManager.camera.updateProjectionMatrix();
    }

    // 3. Gyroscope
    const g = this.settings.gyroscope;
    if (this.game.steeringWheelUI) {
      this.game.steeringWheelUI.gyroSensitivity = g.sensitivity;
      this.game.steeringWheelUI.toggleGyro(g.enabled);
    }

    // 4. Graphics Pixel Ratio
    const gfx = this.settings.graphics;
    if (this.game.sceneManager && this.game.sceneManager.renderer) {
      const scale = gfx.preset === 'low' ? 0.75 : (gfx.preset === 'ultra' ? 1.5 : 1.0);
      this.game.sceneManager.renderer.setPixelRatio(Math.min(window.devicePixelRatio, scale));
      this.game.sceneManager.renderer.shadowMap.enabled = gfx.shadows;
    }

    // 5. Weather Override
    const w = this.settings.weather;
    if (this.game.weatherManager && !w.dynamicCycle) {
      this.game.weatherManager.setWeather(w.preset);
    }
  }

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }
}
