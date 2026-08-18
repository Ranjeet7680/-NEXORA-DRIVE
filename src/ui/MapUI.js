// Interactive Fullscreen Map Overlay for NEXORA DRIVE

export class MapUI {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.mapElement = null;

    this.initUI();
  }

  initUI() {
    this.mapElement = document.createElement('div');
    this.mapElement.className = 'map-overlay hidden';
    this.mapElement.innerHTML = `
      <div class="map-container">
        <div class="map-header">
          <h2>🗺️ NEXORA OPEN-WORLD BIOMES MAP</h2>
          <button class="close-map-btn" id="btnCloseMap">✖ CLOSE</button>
        </div>

        <div class="map-viewport">
          <div class="biome-region region-city">
            <span class="label">🌆 METROPOLIS CITY</span>
            <div class="pin garage-pin" data-x="0" data-z="0">🏎️ Garage Hub</div>
          </div>
          <div class="biome-region region-forest">
            <span class="label">🌲 PINE FOREST</span>
            <div class="pin mission-pin" data-x="-400" data-z="-400">🚚 Freight Depot</div>
          </div>
          <div class="biome-region region-mountains">
            <span class="label">🏔️ ALPINE MOUNTAINS</span>
            <div class="pin mission-pin" data-x="450" data-z="-450">🏁 Time Trial</div>
          </div>
          <div class="biome-region region-river">
            <span class="label">🌊 RIVER & COAST</span>
            <div class="pin mission-pin" data-x="-450" data-z="450">🚕 Taxi Stand</div>
          </div>
          <div class="biome-region region-ice">
            <span class="label">❄️ ICE HILLS & GLACIERS</span>
            <div class="pin mission-pin" data-x="450" data-z="450">❄️ Glacier Drift</div>
          </div>

          <!-- Roads Graphic Lines -->
          <svg class="map-svg-roads" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" stroke="#00f0ff" stroke-width="2" fill="none" stroke-dasharray="4" />
            <line x1="50" y1="15" x2="50" y2="85" stroke="#ffffff" stroke-width="1.5" opacity="0.5" />
            <line x1="15" y1="50" x2="85" y2="50" stroke="#ffffff" stroke-width="1.5" opacity="0.5" />
          </svg>
        </div>

        <div class="map-footer">
          <p>💡 Tip: Click any location pin on the map to Fast Travel instantly!</p>
        </div>
      </div>
    `;

    this.container.appendChild(this.mapElement);

    this.mapElement.querySelector('#btnCloseMap').addEventListener('click', () => this.hide());

    // Fast travel click handlers on pins
    this.mapElement.querySelectorAll('.pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const x = parseFloat(pin.getAttribute('data-x'));
        const z = parseFloat(pin.getAttribute('data-z'));
        if (this.callbacks.onFastTravel) {
          this.callbacks.onFastTravel(x, z);
          this.hide();
        }
      });
    });
  }

  show() {
    this.mapElement.classList.remove('hidden');
  }

  hide() {
    this.mapElement.classList.add('hidden');
  }
}
