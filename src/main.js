import * as THREE from 'three';
import { SceneManager } from './engine/SceneManager.js';
import { TerrainManager } from './engine/TerrainManager.js';
import { PhysicsEngine } from './engine/PhysicsEngine.js';
import { CameraManager } from './engine/CameraManager.js';
import { TrafficManager } from './engine/TrafficManager.js';
import { WeatherManager } from './engine/WeatherManager.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { SaveSystem } from './engine/SaveSystem.js';

import { SettingsManager } from './engine/SettingsManager.js';
import { AICopilot } from './engine/AICopilot.js';
import { AIMusicPlayer } from './engine/AIMusicPlayer.js';
import { AINavigation } from './engine/AINavigation.js';
import { AISafetySystem } from './engine/AISafetySystem.js';
import { ParticleSystemManager } from './engine/ParticleSystemManager.js';

import { VehicleBuilder } from './vehicles/VehicleBuilder.js';
import { VEHICLE_CONFIGS } from './config.js';

import { LoadingScreen } from './ui/LoadingScreen.js';
import { SteeringWheelUI } from './ui/SteeringWheelUI.js';
import { HUD } from './ui/HUD.js';
import { CopilotHUD } from './ui/CopilotHUD.js';
import { GarageUI } from './ui/GarageUI.js';
import { MapUI } from './ui/MapUI.js';
import { MissionsUI } from './ui/MissionsUI.js';
import { SettingsUI } from './ui/SettingsUI.js';

class Game {
  constructor() {
    this.appContainer = document.getElementById('app');
    
    this.saveData = SaveSystem.load();
    this.audioEngine = new AudioEngine();

    this.sceneManager = new SceneManager(this.appContainer);
    this.terrainManager = new TerrainManager(this.sceneManager.scene);
    this.physicsEngine = new PhysicsEngine(this.terrainManager);
    this.cameraManager = new CameraManager(this.sceneManager.camera);
    this.trafficManager = new TrafficManager(this.sceneManager.scene, this.terrainManager);
    this.weatherManager = new WeatherManager(this.sceneManager.scene, this.sceneManager);

    // AI, Settings & Advanced Engines
    this.settingsManager = new SettingsManager(this);
    this.aiCopilot = new AICopilot(this);
    this.aiMusicPlayer = new AIMusicPlayer(this.audioEngine);
    this.aiNavigation = new AINavigation(this.sceneManager.scene);
    this.aiSafetySystem = new AISafetySystem();
    this.particleManager = new ParticleSystemManager(this.sceneManager.scene);

    this.currentVehicleMesh = null;
    this.activeMission = null;
    this.isPaused = false;
    this.lastTime = performance.now();

    // Desktop Key State
    this.keys = { forward: false, backward: false, left: false, right: false, handbrake: false };

    this.init();
  }

  init() {
    // 1. Show Cinematic AI Loading Screen
    const currentConfig = VEHICLE_CONFIGS[this.saveData.selectedVehicle];
    const loadingScreen = new LoadingScreen(this.appContainer, () => {
      this.startDrivingMode();
    });

    loadingScreen.show(currentConfig.loadingImage);

    // 2. Generate 5 Open-World Biomes
    this.terrainManager.generateWorld();

    // 3. Spawn Initial Selected Vehicle
    this.spawnVehicle(this.saveData.selectedVehicle);

    // 4. Initialize AI Traffic & Pedestrians
    this.trafficManager.init();

    // 5. Initialize UI Overlays
    this.initUI();

    // 6. Bind Keyboard Controls
    this.bindKeyboard();

    // 7. Apply Settings to Engine
    this.settingsManager.applySettingsToEngine();

    // 8. Start Main Render & Physics Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  spawnVehicle(vehicleId) {
    if (this.currentVehicleMesh) {
      this.sceneManager.scene.remove(this.currentVehicleMesh);
    }

    const config = VEHICLE_CONFIGS[vehicleId];
    const upgrades = this.saveData.upgrades[vehicleId] || { engine: 0, brakes: 0, tires: 0, suspension: 0, color: null };
    
    this.currentVehicleMesh = VehicleBuilder.createVehicleMesh(config, upgrades);
    this.currentVehicleMesh.position.set(0, 1, 0);
    this.sceneManager.scene.add(this.currentVehicleMesh);

    this.physicsEngine.setVehicle(this.currentVehicleMesh, config, upgrades);
    this.cameraManager.setVehicle(this.currentVehicleMesh, config);
    this.audioEngine.setVehicleAudioProfile(config.engineSoundPitch);

    this.saveData.selectedVehicle = vehicleId;
    SaveSystem.save(this.saveData);
  }

  initUI() {
    // Virtual 360 Steering Wheel UI
    this.steeringWheelUI = new SteeringWheelUI(this.appContainer, (steerVal) => {
      this.physicsEngine.inputSteer = steerVal;
    });

    // In-Game Cyber HUD
    this.hud = new HUD(this.appContainer, {
      onOpenGarage: () => this.garageUI.show(),
      onOpenMap: () => this.mapUI.show(),
      onOpenMissions: () => this.missionsUI.show(),
      onOpenSettings: () => this.settingsUI.show(),
      onTogglePause: () => { this.isPaused = !this.isPaused; },
      onNextCamera: () => {
        const mode = this.cameraManager.nextCameraMode();
        return mode.name;
      },
      onToggleHeadlights: () => {
        const lights = this.currentVehicleMesh.userData.headlights;
        if (lights) {
          const newState = !lights[0].visible;
          lights.forEach(l => l.visible = newState);
        }
      },
      onPlayHorn: () => this.audioEngine.playHorn(),
      onRespawn: () => this.physicsEngine.respawn(),
      onGasPress: (pressed) => { this.physicsEngine.inputThrottle = pressed ? 1 : 0; },
      onBrakePress: (pressed) => { this.physicsEngine.inputThrottle = pressed ? -1 : 0; },
      onHandbrakePress: (pressed) => { this.physicsEngine.inputHandbrake = pressed; }
    });

    // Settings UI
    this.settingsUI = new SettingsUI(this.appContainer, this.settingsManager);

    // Copilot & Radio HUD Widget
    this.copilotHUD = new CopilotHUD(this.appContainer, {
      onToggleMic: () => {
        const isListening = this.aiCopilot.toggleListening();
        this.copilotHUD.showBubbleResponse(isListening ? '🎤 Voice Listening...' : 'Mic Off');
      },
      onSendTextCommand: (textCmd) => {
        const response = this.aiCopilot.processCommand(textCmd);
        this.copilotHUD.showBubbleResponse(response);
      },
      onToggleRadio: () => {
        const isPlaying = this.aiMusicPlayer.togglePlay();
        this.copilotHUD.updateRadio(this.aiMusicPlayer.getCurrentStation(), isPlaying);
      },
      onNextRadio: () => {
        const station = this.aiMusicPlayer.nextStation();
        this.copilotHUD.updateRadio(station, this.aiMusicPlayer.isPlaying);
      }
    });

    // Garage UI
    this.garageUI = new GarageUI(this.appContainer, this.saveData, {
      onSelectVehicle: (vId) => this.spawnVehicle(vId),
      onUnlockVehicle: (vId) => {
        const cfg = VEHICLE_CONFIGS[vId];
        if (this.saveData.credits >= cfg.price) {
          this.saveData.credits -= cfg.price;
          this.saveData.unlockedVehicles.push(vId);
          this.spawnVehicle(vId);
          SaveSystem.save(this.saveData);
        }
      },
      onChangeColor: (colorHex) => {
        const vId = this.saveData.selectedVehicle;
        if (!this.saveData.upgrades[vId]) this.saveData.upgrades[vId] = {};
        this.saveData.upgrades[vId].color = colorHex;
        this.spawnVehicle(vId);
        SaveSystem.save(this.saveData);
      },
      onUpdateCustomization: () => {
        this.spawnVehicle(this.saveData.selectedVehicle);
      },
      onBuyUpgrade: (type, price) => {
        const vId = this.saveData.selectedVehicle;
        if (this.saveData.credits >= price) {
          this.saveData.credits -= price;
          if (!this.saveData.upgrades[vId]) this.saveData.upgrades[vId] = { engine: 0, brakes: 0, tires: 0, suspension: 0 };
          this.saveData.upgrades[vId][type] = (this.saveData.upgrades[vId][type] || 0) + 1;
          this.spawnVehicle(vId);
          SaveSystem.save(this.saveData);
        }
      },
      onStartDriving: () => this.audioEngine.resume()
    });

    // Map UI
    this.mapUI = new MapUI(this.appContainer, {
      onFastTravel: (x, z) => {
        this.physicsEngine.position.set(x, 2, z);
        this.physicsEngine.velocity.set(0, 0, 0);
      }
    });

    // Missions UI
    this.missionsUI = new MissionsUI(this.appContainer, this.saveData, {
      onStartMission: (mission) => {
        this.activeMission = mission;
        this.aiNavigation.setDestination(mission.targetPos, mission.title);
        if (mission.vehicleRequired && this.saveData.unlockedVehicles.includes(mission.vehicleRequired)) {
          this.spawnVehicle(mission.vehicleRequired);
        }
      }
    });
  }

  startDrivingMode() {
    this.audioEngine.init();
    this.audioEngine.resume();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.audioEngine.resume();
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':
          this.physicsEngine.inputThrottle = 1;
          break;
        case 'KeyS': case 'ArrowDown':
          this.physicsEngine.inputThrottle = -1;
          break;
        case 'KeyA': case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD': case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.physicsEngine.inputHandbrake = true;
          break;
        case 'KeyC':
          this.cameraManager.nextCameraMode();
          break;
        case 'KeyH':
          this.audioEngine.playHorn();
          break;
        case 'KeyR':
          this.physicsEngine.respawn();
          break;
        case 'KeyM':
          this.mapUI.show();
          break;
      }
      this.updateKeyboardSteer();
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': case 'KeyS': case 'ArrowDown':
          this.physicsEngine.inputThrottle = 0;
          break;
        case 'KeyA': case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD': case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.physicsEngine.inputHandbrake = false;
          break;
      }
      this.updateKeyboardSteer();
    });
  }

  updateKeyboardSteer() {
    let steer = 0;
    if (this.keys.left) steer -= 1;
    if (this.keys.right) steer += 1;
    if (steer !== 0) {
      this.steeringWheelUI.setAngle(steer * 180);
    }
  }

  gameLoop(time) {
    requestAnimationFrame((t) => this.gameLoop(t));

    const deltaTime = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (this.isPaused) return;

    // 1. Physics Engine Step
    this.physicsEngine.update(deltaTime);

    // 2. Camera Manager Step
    this.cameraManager.update(deltaTime);

    // 3. AI Traffic Step
    this.trafficManager.update(deltaTime, this.physicsEngine.position);

    // 4. Weather & Day-Night Step
    this.weatherManager.update(deltaTime, this.physicsEngine.position);

    // 5. Particle Systems Step
    this.particleManager.update(
      deltaTime,
      this.physicsEngine.position,
      this.physicsEngine.speedKmh,
      this.physicsEngine.currentBiome,
      Math.abs(this.physicsEngine.inputThrottle) > 0
    );

    // 6. AI Safety & Guidance Step
    this.aiSafetySystem.update(
      this.physicsEngine.speedKmh,
      this.physicsEngine.position,
      this.trafficManager.trafficVehicles,
      this.physicsEngine.currentBiome,
      this.physicsEngine.inputThrottle < 0
    );
    this.copilotHUD.updateSafetyAlerts(this.aiSafetySystem.alerts);

    // 7. AI GPS Navigation Step
    this.aiNavigation.update(this.physicsEngine.position);

    // 8. Audio Synthesizer Update
    this.audioEngine.updateEngine(
      this.physicsEngine.rpm,
      this.physicsEngine.speedKmh,
      this.physicsEngine.vehicleConfig.topSpeed,
      Math.abs(this.physicsEngine.inputThrottle) > 0
    );
    this.audioEngine.setScreech(this.physicsEngine.isDrifting ? 1.0 : 0.0);

    // 9. UI Steering Wheel Spring Return
    this.steeringWheelUI.update(deltaTime);

    // 10. Update HUD Overlay
    const hours = Math.floor(this.weatherManager.timeOfDay);
    const mins = Math.floor((this.weatherManager.timeOfDay % 1) * 60);
    const timeStr = `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}`;

    this.hud.update(
      this.physicsEngine.speedKmh,
      this.physicsEngine.rpm,
      this.physicsEngine.gear,
      this.physicsEngine.currentBiome,
      timeStr,
      this.weatherManager.currentPreset,
      this.saveData.credits,
      this.cameraManager.getCurrentMode().name,
      this.activeMission ? this.activeMission.targetPos : null,
      this.physicsEngine.position,
      this.physicsEngine.rotation,
      this.aiNavigation.turnInstruction
    );

    // 11. Render 3D Scene
    this.sceneManager.render();
  }
}

// Launch Game on Load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
