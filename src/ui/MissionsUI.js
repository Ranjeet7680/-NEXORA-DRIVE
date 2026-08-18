// Career Mode Missions Launcher UI for NEXORA DRIVE

import { MISSIONS } from '../config.js';

export class MissionsUI {
  constructor(container, saveData, callbacks) {
    this.container = container;
    this.saveData = saveData;
    this.callbacks = callbacks || {};
    this.missionsElement = null;

    this.initUI();
  }

  initUI() {
    this.missionsElement = document.createElement('div');
    this.missionsElement.className = 'missions-overlay hidden';
    this.missionsElement.innerHTML = `
      <div class="missions-container">
        <div class="missions-header">
          <h2>📋 CAREER MISSIONS & CHALLENGES</h2>
          <button class="close-btn" id="btnCloseMissions">✖ CLOSE</button>
        </div>

        <div class="missions-grid" id="missionsGrid"></div>
      </div>
    `;

    this.container.appendChild(this.missionsElement);

    this.missionsElement.querySelector('#btnCloseMissions').addEventListener('click', () => this.hide());
    this.renderMissions();
  }

  renderMissions() {
    const grid = this.missionsElement.querySelector('#missionsGrid');
    grid.innerHTML = '';

    MISSIONS.forEach(m => {
      const isCompleted = this.saveData.completedMissions.includes(m.id);

      const card = document.createElement('div');
      card.className = `mission-card ${isCompleted ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="m-header">
          <span class="m-type-tag">${m.type.toUpperCase()}</span>
          <span class="m-reward">💰 $${m.reward}</span>
        </div>
        <h3>${m.title}</h3>
        <p>${m.description}</p>
        <div class="m-footer">
          <span>⏱️ ${m.timeLimit}s</span>
          <button class="start-mission-btn" data-id="${m.id}">
            ${isCompleted ? '✓ REPLAY MISSION' : 'START MISSION'}
          </button>
        </div>
      `;

      card.querySelector('.start-mission-btn').addEventListener('click', () => {
        this.hide();
        if (this.callbacks.onStartMission) {
          this.callbacks.onStartMission(m);
        }
      });

      grid.appendChild(card);
    });
  }

  show() {
    this.renderMissions();
    this.missionsElement.classList.remove('hidden');
  }

  hide() {
    this.missionsElement.classList.add('hidden');
  }
}
