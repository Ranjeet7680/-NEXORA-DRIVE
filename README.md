# 🏎️ NEXORA DRIVE — First-Person Open-World Driving Simulator

![NEXORA DRIVE](/public/assets/loading/loading_car.png)

**NEXORA DRIVE** is a next-generation 3D WebGL First-Person Open-World Driving Simulator built with Three.js, Web Audio API, Web Speech API, and Vite. Experience an ultra-immersive first-person cockpit driving experience across 5 connected biomes with dynamic weather, intelligent AI traffic, voice-enabled AI copilot, procedural 7-station radio player, and an advanced 3D modular vehicle customization studio.

---

## 🌟 Key Features

### 🚗 1. 7 Vehicle Classes & Realistic Physics
- **Vehicle Fleet**: Apex GT Sport (Car), Metro City Express (Bus), HyperBlade 1000RR (Motorcycle), IronTitan Heavy Cargo (Semi Truck), Metropolitan Taxi (Taxi), TerraTrack 4x4 (SUV), Interceptor Pursuit Unit (Police vehicle with siren & lightbar).
- **Physics Engine**: Raycast wheel suspension, weight transfer, body roll/pitch during cornering and acceleration, 6-speed automatic/manual transmission, and auto-stuck respawn helper.
- **Surface Friction Dynamics**: Dynamic grip changes across Asphalt (1.0), Dirt (0.75), River Basin (0.85), and Ice Hills (0.25 for icy drifting!).

### 🌆 2. 5 Connected Open-World Biomes
1. **Metropolis City**: High-rise skyscrapers, neon billboards, streetlights, traffic signals, animated Metro trains, and pedestrians.
2. **Pine Forest**: Dense trees, dirt tracks, wooden bridges, fog, mist.
3. **Alpine Mountains**: High elevation peaks, hairpin bends, mountain tunnels, cliff viewpoints.
4. **River & Coast**: Dynamic water shader surface, sandy beach, waterfront highway, wooden river bridge.
5. **Ice Hills & Glaciers**: Snow heightmap, icy highways, frozen lake, snow pine trees, blizzard weather.

### 🤖 3. AI Copilot & Voice Command System
- **Voice Recognition**: Press mic button or type text commands (*"Take me to ice hills"*, *"Take me to mountains"*, *"Turn on headlights"*, *"Play night drive music"*, *"Make it rain"*, *"How fast am I going?"*).
- **Speech Synthesis**: Vocal response output via Web Speech Synthesis + floating HUD speech bubble.

### 🎵 4. 7-Station In-Car Radio Synthesizer
- 🌆 **NEXORA FM** (80s Synthwave)
- ⚡ **City Beats** (Cyber Electro)
- 🎸 **Road Trip Radio** (Pop / Rock Chords)
- 🏔️ **Mountain FM** (Acoustic Ambient)
- 🌙 **Night Drive** (Deep Chillwave)
- ☕ **Chill Drive** (Lo-Fi Beats)
- 🏁 **Racing Radio** (High Energy Drum & Bass)

### 🏎️ 5. Advanced 3D Vehicle Customization Studio
- **Modular 3D Parts**: Interchangeable GT spoilers, custom rim sizing (15", 16", 17", 18", 19", 20"), underglow neon RGB colors (Cyan, Pink, Lime, Amber, Blue, Red).
- **PBR Paint Studio**: Finish presets (Gloss, Metallic Chrome, Matte Stealth, Carbon Fiber Weave) + RGB Color Picker.
- **Stance Height Sliders**: Suspension ride height adjustment (-5cm stance drop to +10cm lift).
- **AI Mechanic**: One-click tuning prompts (*"Build for Snow"*, *"Sporty GT Setup"*).

### ⚙️ 6. Comprehensive 20-Category Settings System
- 🎮 Controls, 🚗 Driving, 📱 Gyroscope, 🎥 Camera, 🎨 Graphics, 🔊 Audio, 🎵 Music, 🤖 AI & Voice, 🗺️ Navigation, 🌦️ Weather, 🚦 Traffic, 🚘 Vehicle, 🌍 World, 📳 Haptics, 🌐 Language, ♿ Accessibility, 🔔 Notifications, 💾 Gameplay & Save, 🔒 Privacy, ℹ️ About.
- **Real-time Engine Binding**: Adjust resolution scale, FPS targets (30/60/120/Unlimited), FOV, audio channels, and Gyroscope calibration.

---

## 🎮 Controls & Keybindings

| Input | Mobile Control | Desktop Keyboard |
| :--- | :--- | :--- |
| **Accelerate** | Touch GAS pedal | `W` or `Up Arrow` |
| **Brake / Reverse** | Touch BRAKE pedal | `S` or `Down Arrow` |
| **Steer Left / Right** | 360° Steering Wheel / Gyroscope / Buttons | `A` / `D` or `Left` / `Right Arrow` |
| **Handbrake** | Touch P pedal | `Spacebar` |
| **Camera View Cycle** | Touch Camera button | `C` key |
| **Horn** | Touch Horn button | `H` key |
| **Map Overlay** | Touch Map button | `M` key |
| **Unstuck Respawn** | Touch Unstuck button | `R` key |

---

## 🛠️ Installation & Setup

```bash
# 1. Clone Repository
git clone https://github.com/Ranjeet7680/-NEXORA-DRIVE.git
cd -NEXORA-DRIVE

# 2. Install Dependencies
npm install

# 3. Start Local Development Server
npm run dev

# 4. Build Production Distribution Bundle
npm run build
```

Open `http://localhost:3000` in your web browser!

---

## 📐 Technology Stack

- **3D Graphics**: Three.js (WebGL Renderer, PCFSoftShadowMap, ACESFilmicToneMapping)
- **Audio Synthesizer**: Web Audio API (Oscillators, BiquadFilters, GainNodes)
- **Voice AI**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Build Tool**: Vite
- **Language**: JavaScript (ESNext Modules), HTML5, CSS3

---

## 📄 License

This project is licensed under the MIT License.
