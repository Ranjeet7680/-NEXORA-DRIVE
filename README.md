# 🏎️ NEXORA DRIVE — First-Person Open-World Driving Simulator

![NEXORA DRIVE](/public/assets/loading/loading_car.png)

**NEXORA DRIVE** is a high-performance 3D WebGL First-Person Open-World Driving Simulator built with Three.js, Web Audio API, Web Speech API, and Vite. Explore 5 connected biomes across a 2400x2400 world map featuring wide asphalt highways, dynamic weather, intelligent traffic, an AI voice copilot, a 10-track custom MP3 radio player, an interactive real-time mini-map canvas, and an advanced 3D modular vehicle customization studio.

---

## 🌟 Features & Upgrades

### 🗺️ 1. Interactive Real-Time Mini-Map Canvas
- **Live World Map**: Renders an interactive 2D mini-map in the bottom-left corner with real-time player position tracking.
- **Biomes & Roads**: Renders terrain regions (City, Forest, Mountains, River, Ice Hills) and the outer ring highway circuit directly from engine data.
- **Heading Direction**: Rotates player arrow indicator according to vehicle heading angle `vehicleRotation.y`.
- **GPS Target Markers**: Shows active mission targets (`#ff0055`), Garage hub (`#00f0ff`), and city landmarks.

### 🎵 2. 10 Custom MP3 In-Car Radio Tracks
Includes 10 custom MP3 music tracks integrated directly into the in-car entertainment system:
- 🎧 **Ranjeet Kumar** (`98.5 FM`)
- 🔥 **थारी जिंदगी म्हारी मौज (Remix)** (`102.1 FM`)
- 🎵 **थारी जिंदगी म्हारी मौज** (`94.3 FM`)
- 🎺 **Aryan Bhai Ki Shaadi** (`88.7 FM`)
- 🌙 **Dhanbad Dreams (Vibe)** (`105.9 FM`)
- 🏙️ **Dhanbad Dreams** (`91.1 FM`)
- 🔊 **Ranjeet Ka Vibe (Dubstep)** (`107.7 FM`)
- ⚡ **Ranjeet Ka Vibe** (`99.9 FM`)
- 🎤 **Ranjeet Kumar (Extended)** (`104.5 FM`)
- 🎉 **Aryan Bhai Ki Shaadi (Celebration)** (`96.3 FM`)

### 🚗 3. 7 Vehicle Classes & Raycast Physics
- **Vehicles**: Apex GT Sport (Car), Metro City Express (Bus), HyperBlade 1000RR (Motorcycle), IronTitan Heavy Cargo (Semi Truck), Metropolitan Taxi (Taxi), TerraTrack 4x4 (SUV), Interceptor Pursuit Unit (Police car).
- **Physics**: Speed-sensitive steering, weight transfer body roll & pitch, reverse gear (`gear = 'R'`), surface grip dynamics across Asphalt (1.0), Dirt (0.75), River (0.85), and Ice (0.25).

### 🌆 4. 5 Connected Open-World Biomes
1. **Metropolis City**: High-rise skyscrapers, streetlamps, traffic signals, animated Metro trains.
2. **Pine Forest**: Dense trees, dirt tracks, wooden bridges, fog.
3. **Alpine Mountains**: Hairpin bends, mountain tunnels, cliff viewpoints.
4. **River & Coast**: Dynamic water shader, sandy beach, wooden river bridge.
5. **Ice Hills & Glaciers**: Snow mountain peaks, 3D glacier ice formations, slippery ice highway, falling snow particles.

### 📱 5. Mobile Touch & Performance Optimization
- **Responsive Controls**: Left/Right steer buttons, 360° virtual steering wheel, Gyroscope tilt, GAS, BRAKE/REVERSE, and PARK (Handbrake).
- **Auto Optimize**: Detects device GPU/CPU memory & cores to set Low/Medium/High/Ultra graphics presets.
- **Battery Saver Mode**: 30 FPS target option for mobile thermal management.
- **Haptic Vibration**: Tactile touch feedback on pedal interactions.

### ⚙️ 6. 20-Category Settings System
- Real-time parameter binding for audio channels, camera FOV, graphics resolution, Gyroscope baseline calibration, weather overrides, and driving assists (ABS, TCS, ESP).

---

## 🎮 Controls & Keybindings

| Function | Mobile Input | Desktop Keyboard |
| :--- | :--- | :--- |
| **Accelerate** | Touch GAS pedal | `W` or `Up Arrow` |
| **Brake / Reverse** | Touch BRAKE pedal | `S` or `Down Arrow` |
| **Steer Left** | Left Button / Steering Wheel | `A` or `Left Arrow` |
| **Steer Right** | Right Button / Steering Wheel | `D` or `Right Arrow` |
| **Handbrake** | Touch P pedal | `Spacebar` |
| **Camera View** | Touch Camera button | `C` key |
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

# 4. Build Production Bundle
npm run build
```

Open `http://localhost:3000` in your web browser!

---

## ☁️ Vercel Deployment

This repository is pre-configured for Vercel deployment:
- **Build Command**: `vite build`
- **Output Directory**: `dist`

---

## 📄 License

This project is licensed under the MIT License.
