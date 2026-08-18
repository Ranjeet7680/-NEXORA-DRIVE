// AI Copilot & Radio Player HUD Overlay Widget for NEXORA DRIVE

export class CopilotHUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.widgetElement = null;

    this.initUI();
  }

  initUI() {
    this.widgetElement = document.createElement('div');
    this.widgetElement.className = 'copilot-hud-widget';
    this.widgetElement.innerHTML = `
      <!-- Floating AI Copilot Avatar & Mic Button -->
      <div class="copilot-avatar-box">
        <button class="copilot-mic-btn" id="btnCopilotMic" title="Talk to AI Copilot">
          🤖 <span class="mic-pulse"></span>
        </button>
        <div class="copilot-bubble hidden" id="copilotBubble">
          <span class="copilot-text" id="copilotText">AI Copilot ready. Say a command!</span>
        </div>
      </div>

      <!-- Quick Command Prompt Bar -->
      <div class="copilot-prompt-bar">
        <input type="text" id="copilotInput" placeholder="Ask Copilot (e.g., 'Take me to ice hills', 'Play music')..." />
        <button id="btnSendPrompt">SEND</button>
      </div>

      <!-- In-Car Radio Player Bar -->
      <div class="radio-player-bar">
        <button class="radio-btn" id="btnRadioPrev">⏮️</button>
        <button class="radio-btn play-btn" id="btnRadioPlay">▶️ PLAY</button>
        <button class="radio-btn" id="btnRadioNext">⏭️</button>
        <div class="radio-station-info">
          <span class="station-name" id="radioStationName">NEXORA FM (98.5 FM)</span>
          <span class="station-genre" id="radioGenre">80s Synthwave</span>
        </div>
      </div>

      <!-- Safety Alert Guidance Banner -->
      <div class="safety-banner hidden" id="safetyBanner">
        ⚠️ SAFETY ALERT: Forward Collision Hazard!
      </div>
    `;

    this.container.appendChild(this.widgetElement);
    this.bindEvents();
  }

  bindEvents() {
    const micBtn = this.widgetElement.querySelector('#btnCopilotMic');
    const input = this.widgetElement.querySelector('#copilotInput');
    const sendBtn = this.widgetElement.querySelector('#btnSendPrompt');

    micBtn.addEventListener('click', () => {
      this.callbacks.onToggleMic && this.callbacks.onToggleMic();
    });

    const handleSend = () => {
      const val = input.value.trim();
      if (val) {
        this.callbacks.onSendTextCommand && this.callbacks.onSendTextCommand(val);
        input.value = '';
      }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // Radio controls
    this.widgetElement.querySelector('#btnRadioPlay').addEventListener('click', () => {
      this.callbacks.onToggleRadio && this.callbacks.onToggleRadio();
    });
    this.widgetElement.querySelector('#btnRadioNext').addEventListener('click', () => {
      this.callbacks.onNextRadio && this.callbacks.onNextRadio();
    });
    this.widgetElement.querySelector('#btnRadioPrev').addEventListener('click', () => {
      this.callbacks.onNextRadio && this.callbacks.onNextRadio();
    });
  }

  showBubbleResponse(text) {
    const bubble = this.widgetElement.querySelector('#copilotBubble');
    const textSpan = this.widgetElement.querySelector('#copilotText');
    textSpan.innerText = text;
    bubble.classList.remove('hidden');

    setTimeout(() => {
      bubble.classList.add('hidden');
    }, 6000);
  }

  updateRadio(station, isPlaying) {
    this.widgetElement.querySelector('#radioStationName').innerText = `${station.name} (${station.frequency})`;
    this.widgetElement.querySelector('#radioGenre').innerText = station.genre;
    this.widgetElement.querySelector('#btnRadioPlay').innerText = isPlaying ? '⏸️ PAUSE' : '▶️ PLAY';
  }

  updateSafetyAlerts(alerts) {
    const banner = this.widgetElement.querySelector('#safetyBanner');
    if (alerts && alerts.length > 0) {
      banner.innerText = alerts[0];
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }
}
