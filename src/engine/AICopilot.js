// AI Copilot & Voice Command System for NEXORA DRIVE

export class AICopilot {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.recognition = null;
    this.isListening = false;
    this.synth = window.speechSynthesis || null;

    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('AI Copilot speech recognition error:', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  toggleListening() {
    if (!this.recognition) {
      this.speak('Voice recognition is not supported in this browser. Please use text input.');
      return false;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      try {
        this.recognition.start();
        this.isListening = true;
        this.speak('Listening for your command...');
      } catch (e) {
        console.warn('Speech start error:', e);
      }
    }
    return this.isListening;
  }

  speak(text) {
    if (this.synth) {
      this.synth.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      this.synth.speak(utterance);
    }
  }

  processCommand(rawText) {
    const text = rawText.toLowerCase().trim();

    // 1. Navigation Commands
    if (text.includes('city') || text.includes('metropolis')) {
      this.game.mapUI.callbacks.onFastTravel(-150, -150);
      const msg = 'Calculating route to Metropolis City. Arrived at City Hub.';
      this.speak(msg);
      return msg;
    }
    if (text.includes('mountain') || text.includes('alpine') || text.includes('hill')) {
      this.game.mapUI.callbacks.onFastTravel(450, -450);
      const msg = 'Route calculated to Alpine Mountains. Estimated distance 14 km.';
      this.speak(msg);
      return msg;
    }
    if (text.includes('ice') || text.includes('snow') || text.includes('glacier')) {
      this.game.mapUI.callbacks.onFastTravel(450, 450);
      const msg = 'Navigating to Ice Hills and Snowy Pass. Traction reduced.';
      this.speak(msg);
      return msg;
    }
    if (text.includes('forest') || text.includes('tree')) {
      this.game.mapUI.callbacks.onFastTravel(-450, -450);
      const msg = 'Route calculated to Pine Forest dirt trails.';
      this.speak(msg);
      return msg;
    }
    if (text.includes('fuel') || text.includes('gas') || text.includes('station')) {
      const msg = 'Nearest Fuel Station found 400 meters ahead in Metropolis City.';
      this.speak(msg);
      return msg;
    }

    // 2. Vehicle Controls
    if (text.includes('light') || text.includes('headlight')) {
      const lights = this.game.currentVehicleMesh.userData.headlights;
      if (lights) {
        const newState = !lights[0].visible;
        lights.forEach(l => l.visible = newState);
        const msg = newState ? 'Headlights turned ON.' : 'Headlights turned OFF.';
        this.speak(msg);
        return msg;
      }
    }
    if (text.includes('speed') || text.includes('fast')) {
      const spd = this.game.physicsEngine.speedKmh;
      const msg = `You are currently traveling at ${spd} kilometers per hour.`;
      this.speak(msg);
      return msg;
    }
    if (text.includes('camera') || text.includes('view') || text.includes('first person')) {
      const mode = this.game.cameraManager.nextCameraMode();
      const msg = `Camera view switched to ${mode.name}.`;
      this.speak(msg);
      return msg;
    }
    if (text.includes('unstuck') || text.includes('respawn') || text.includes('reset')) {
      this.game.physicsEngine.respawn();
      const msg = 'Vehicle respawned safely on upright position.';
      this.speak(msg);
      return msg;
    }

    // 3. Music & Radio Commands
    if (text.includes('music') || text.includes('radio') || text.includes('play')) {
      if (text.includes('night') || text.includes('relax') || text.includes('chill')) {
        this.game.aiMusicPlayer.playStation('night_drive');
        const msg = 'Playing Night Drive Deep Chillwave station.';
        this.speak(msg);
        return msg;
      }
      if (text.includes('energetic') || text.includes('race') || text.includes('fast')) {
        this.game.aiMusicPlayer.playStation('racing_radio');
        const msg = 'Playing Racing Radio High Energy station.';
        this.speak(msg);
        return msg;
      }
      this.game.aiMusicPlayer.togglePlay();
      const msg = this.game.aiMusicPlayer.isPlaying ? 'In-car audio radio started.' : 'In-car audio radio paused.';
      this.speak(msg);
      return msg;
    }

    // 4. Weather Commands
    if (text.includes('rain') || text.includes('storm')) {
      this.game.weatherManager.setWeather('rain');
      const msg = 'Weather changed to Rainy. Windshield wipers activated.';
      this.speak(msg);
      return msg;
    }
    if (text.includes('sun') || text.includes('clear')) {
      this.game.weatherManager.setWeather('sunny');
      const msg = 'Weather changed to Clear Sunny Sky.';
      this.speak(msg);
      return msg;
    }

    // 5. Missions & Map
    if (text.includes('map')) {
      this.game.mapUI.show();
      const msg = 'Opening Open-World Biomes Map overlay.';
      this.speak(msg);
      return msg;
    }
    if (text.includes('mission')) {
      this.game.missionsUI.show();
      const msg = 'Opening Career Mode Missions catalogue.';
      this.speak(msg);
      return msg;
    }

    // Fallback response
    const fallbackMsg = `AI Copilot received: "${rawText}". Command processed.`;
    this.speak(fallbackMsg);
    return fallbackMsg;
  }
}
