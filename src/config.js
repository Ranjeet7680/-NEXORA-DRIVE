// Configuration for NEXORA DRIVE - Open World Driving Simulator

export const BIOMES = {
  CITY: { id: 'city', name: 'Metropolis City', color: 0x445566, fogColor: 0x8899aa, friction: 1.0, icon: '🌆' },
  FOREST: { id: 'forest', name: 'Pine Forest', color: 0x2e4e2e, fogColor: 0x5a7a5a, friction: 0.75, icon: '🌲' },
  MOUNTAINS: { id: 'mountains', name: 'Alpine Mountains', color: 0x666655, fogColor: 0x9999aa, friction: 0.9, icon: '🏔️' },
  RIVER: { id: 'river', name: 'River & Coast', color: 0x3b6e8c, fogColor: 0x7fa3bc, friction: 0.85, icon: '🌊' },
  ICE: { id: 'ice', name: 'Ice Hills & Glaciers', color: 0xddeeff, fogColor: 0xcce0ff, friction: 0.25, icon: '❄️' }
};

export const RADIO_STATIONS = [
  { id: 'ranjeet_kumar', name: 'Ranjeet Kumar', genre: 'Desi Vibe', frequency: '98.5 FM', icon: '🎧', url: '/audio/Ranjeet_Kumar.mp3' },
  { id: 'thari_jindagi_1', name: 'थारी जिंदगी म्हारी मौज (Remix)', genre: 'Haryanvi Hits', frequency: '102.1 FM', icon: '🔥', url: '/audio/Thari_Jindagi_Mhari_Mauj_1.mp3' },
  { id: 'thari_jindagi', name: 'थारी जिंदगी म्हारी मौज', genre: 'Haryanvi Hits', frequency: '94.3 FM', icon: '🎵', url: '/audio/Thari_Jindagi_Mhari_Mauj.mp3' },
  { id: 'aryan_bhai_shaadi', name: 'Aryan Bhai Ki Shaadi', genre: 'Wedding Beats', frequency: '88.7 FM', icon: '🎺', url: '/audio/Aryan_Bhai_Ki_Shaadi.mp3' },
  { id: 'dhanbad_dreams_1', name: 'Dhanbad Dreams (Vibe)', genre: 'Desi Hip Hop', frequency: '105.9 FM', icon: '🌙', url: '/audio/Dhanbad_Dreams_1.mp3' },
  { id: 'dhanbad_dreams', name: 'Dhanbad Dreams', genre: 'Desi Hip Hop', frequency: '91.1 FM', icon: '🏙️', url: '/audio/Dhanbad_Dreams.mp3' },
  { id: 'ranjeet_vibe_1', name: 'Ranjeet Ka Vibe (Dubstep)', genre: 'Bass Boosted', frequency: '107.7 FM', icon: '🔊', url: '/audio/Ranjeet_Ka_Vibe_1.mp3' },
  { id: 'ranjeet_vibe', name: 'Ranjeet Ka Vibe', genre: 'Desi Beats', frequency: '99.9 FM', icon: '⚡', url: '/audio/Ranjeet_Ka_Vibe.mp3' },
  { id: 'ranjeet_kumar_1', name: 'Ranjeet Kumar (Extended)', genre: 'Desi Vibe', frequency: '104.5 FM', icon: '🎤', url: '/audio/Ranjeet_Kumar_1.mp3' },
  { id: 'aryan_shaadi_1', name: 'Aryan Bhai Ki Shaadi (Celebration)', genre: 'Party Beats', frequency: '96.3 FM', icon: '🎉', url: '/audio/Aryan_Bhai_Ki_Shaadi_1.mp3' }
];

export const VEHICLE_CONFIGS = {
  car: {
    id: 'car',
    name: 'Apex GT Sport',
    type: 'Car',
    icon: '🚗',
    price: 0,
    mass: 1400,
    topSpeed: 210,
    acceleration: 45,
    braking: 70,
    steeringSpeed: 4.5,
    suspensionStiffness: 25,
    suspensionDamping: 4,
    cameraOffsets: {
      fpv: { x: -0.32, y: 0.98, z: -0.05 },
      dash: { x: 0.0, y: 1.05, z: 0.4 },
      wheel: { x: -0.32, y: 0.95, z: 0.22 },
      hood: { x: 0.0, y: 0.85, z: 1.8 },
      chase: { distance: 5.5, height: 2.2 },
      cinematic: { distance: 10.0, height: 3.5 }
    },
    dimensions: { length: 4.4, width: 1.9, height: 1.35 },
    wheelRadius: 0.35,
    engineSoundPitch: 1.0,
    loadingImage: '/assets/loading/loading_car.png'
  },
  bus: {
    id: 'bus',
    name: 'Metro City Express Bus',
    type: 'Bus',
    icon: '🚌',
    price: 15000,
    mass: 9000,
    topSpeed: 120,
    acceleration: 30,
    braking: 85,
    steeringSpeed: 2.8,
    suspensionStiffness: 40,
    suspensionDamping: 6,
    cameraOffsets: {
      fpv: { x: -0.7, y: 2.2, z: 2.8 },
      dash: { x: 0.0, y: 2.1, z: 3.2 },
      wheel: { x: -0.7, y: 2.05, z: 3.0 },
      hood: { x: 0.0, y: 1.8, z: 4.8 },
      chase: { distance: 12.0, height: 4.2 },
      cinematic: { distance: 17.0, height: 6.0 }
    },
    dimensions: { length: 10.5, width: 2.6, height: 3.2 },
    wheelRadius: 0.55,
    engineSoundPitch: 0.6,
    loadingImage: '/assets/loading/loading_car.png'
  },
  bike: {
    id: 'bike',
    name: 'HyperBlade 1000RR',
    type: 'Motorcycle',
    icon: '🏍️',
    price: 12000,
    mass: 210,
    topSpeed: 260,
    acceleration: 65,
    braking: 90,
    steeringSpeed: 6.0,
    suspensionStiffness: 18,
    suspensionDamping: 3,
    cameraOffsets: {
      fpv: { x: 0.0, y: 1.35, z: -0.1 },
      dash: { x: 0.0, y: 1.2, z: 0.2 },
      wheel: { x: 0.0, y: 1.15, z: 0.1 },
      hood: { x: 0.0, y: 0.9, z: 0.8 },
      chase: { distance: 4.5, height: 2.0 },
      cinematic: { distance: 8.5, height: 3.0 }
    },
    dimensions: { length: 2.1, width: 0.8, height: 1.2 },
    wheelRadius: 0.32,
    engineSoundPitch: 1.6,
    loadingImage: '/assets/loading/loading_car.png'
  },
  truck: {
    id: 'truck',
    name: 'IronTitan Heavy Cargo Semi',
    type: 'Truck',
    icon: '🚚',
    price: 25000,
    mass: 12000,
    topSpeed: 110,
    acceleration: 35,
    braking: 95,
    steeringSpeed: 2.5,
    suspensionStiffness: 45,
    suspensionDamping: 7,
    cameraOffsets: {
      fpv: { x: -0.85, y: 2.7, z: 1.5 },
      dash: { x: 0.0, y: 2.6, z: 1.9 },
      wheel: { x: -0.85, y: 2.55, z: 1.8 },
      hood: { x: 0.0, y: 2.2, z: 3.2 },
      chase: { distance: 14.0, height: 4.8 },
      cinematic: { distance: 19.0, height: 7.0 }
    },
    dimensions: { length: 8.5, width: 2.7, height: 3.6 },
    wheelRadius: 0.6,
    engineSoundPitch: 0.5,
    loadingImage: '/assets/loading/loading_car.png'
  },
  taxi: {
    id: 'taxi',
    name: 'Metropolitan Taxi Cruiser',
    type: 'Taxi',
    icon: '🚕',
    price: 8000,
    mass: 1550,
    topSpeed: 195,
    acceleration: 48,
    braking: 75,
    steeringSpeed: 4.2,
    suspensionStiffness: 24,
    suspensionDamping: 4,
    cameraOffsets: {
      fpv: { x: -0.35, y: 1.25, z: -0.1 },
      dash: { x: 0.0, y: 1.15, z: 0.3 },
      wheel: { x: -0.35, y: 1.15, z: 0.25 },
      hood: { x: 0.0, y: 1.0, z: 1.8 },
      chase: { distance: 6.0, height: 2.4 },
      cinematic: { distance: 11.0, height: 3.8 }
    },
    dimensions: { length: 4.6, width: 1.9, height: 1.45 },
    wheelRadius: 0.36,
    engineSoundPitch: 0.95,
    loadingImage: '/assets/loading/loading_car.png'
  },
  suv: {
    id: 'suv',
    name: 'TerraTrack 4x4 Offroader',
    type: 'SUV/4x4',
    icon: '🚙',
    price: 18000,
    mass: 2300,
    topSpeed: 180,
    acceleration: 52,
    braking: 80,
    steeringSpeed: 3.8,
    suspensionStiffness: 30,
    suspensionDamping: 5,
    cameraOffsets: {
      fpv: { x: -0.45, y: 1.65, z: 0.0 },
      dash: { x: 0.0, y: 1.55, z: 0.4 },
      wheel: { x: -0.45, y: 1.55, z: 0.3 },
      hood: { x: 0.0, y: 1.3, z: 2.0 },
      chase: { distance: 6.8, height: 2.8 },
      cinematic: { distance: 12.0, height: 4.2 }
    },
    dimensions: { length: 4.8, width: 2.1, height: 1.85 },
    wheelRadius: 0.42,
    engineSoundPitch: 0.85,
    loadingImage: '/assets/loading/loading_suv.png'
  },
  police: {
    id: 'police',
    name: 'Interceptor Pursuit Unit',
    type: 'Police',
    icon: '🚓',
    price: 22000,
    mass: 1650,
    topSpeed: 230,
    acceleration: 58,
    braking: 85,
    steeringSpeed: 4.8,
    suspensionStiffness: 28,
    suspensionDamping: 4.5,
    cameraOffsets: {
      fpv: { x: -0.38, y: 1.25, z: -0.1 },
      dash: { x: 0.0, y: 1.15, z: 0.3 },
      wheel: { x: -0.38, y: 1.15, z: 0.25 },
      hood: { x: 0.0, y: 1.0, z: 1.8 },
      chase: { distance: 6.0, height: 2.4 },
      cinematic: { distance: 11.0, height: 3.8 }
    },
    dimensions: { length: 4.7, width: 1.95, height: 1.42 },
    wheelRadius: 0.38,
    engineSoundPitch: 1.1,
    hasSiren: true,
    loadingImage: '/assets/loading/loading_car.png'
  }
};

export const MODULAR_PARTS = {
  spoilers: [
    { id: 'none', name: 'Stock (No Spoiler)', price: 0 },
    { id: 'ducktail', name: 'Ducktail Lip Spoiler', price: 400 },
    { id: 'sport_wing', name: 'Sport GT Wing', price: 950 },
    { id: 'carbon_wing', name: 'Carbon Fiber Super Wing', price: 1800 }
  ],
  rimSizes: [15, 16, 17, 18, 19, 20],
  paintFinishes: [
    { id: 'gloss', name: 'Gloss Finish', roughness: 0.25, metalness: 0.6 },
    { id: 'metallic', name: 'Metallic Chrome', roughness: 0.15, metalness: 0.9 },
    { id: 'matte', name: 'Matte Stealth', roughness: 0.85, metalness: 0.1 },
    { id: 'carbon', name: 'Carbon Fiber Weave', roughness: 0.4, metalness: 0.8, isCarbon: true }
  ],
  underglowColors: [
    { id: 'none', name: 'Off', color: null },
    { id: 'cyan', name: 'Neon Cyan', color: 0x00f0ff },
    { id: 'magenta', name: 'Neon Pink', color: 0xff00aa },
    { id: 'lime', name: 'Neon Lime', color: 0x00ff44 },
    { id: 'amber', name: 'Neon Gold', color: 0xffaa00 },
    { id: 'blue', name: 'Deep Blue', color: 0x0044ff },
    { id: 'red', name: 'Crimson Red', color: 0xff0022 }
  ]
};

export const MISSIONS = [
  {
    id: 'taxi_1',
    title: 'Downtown Taxi Fare',
    type: 'taxi',
    vehicleRequired: 'taxi',
    reward: 1200,
    timeLimit: 90,
    startPos: { x: -300, z: -300 },
    targetPos: { x: 100, z: 200 },
    description: 'Pick up VIP passenger at Metro Station and deliver to City Financial Center safely!'
  },
  {
    id: 'bus_1',
    title: 'City Transit Line 5',
    type: 'bus',
    vehicleRequired: 'bus',
    reward: 2000,
    timeLimit: 150,
    targetPos: { x: 300, z: 300 },
    description: 'Complete the bus route picking up citizens across City and Forest stops!'
  },
  {
    id: 'cargo_1',
    title: 'Heavy Lumber Freight',
    type: 'delivery',
    vehicleRequired: 'truck',
    reward: 3500,
    timeLimit: 180,
    startPos: { x: 200, z: -400 },
    targetPos: { x: 500, z: 500 },
    description: 'Transport heavy cargo through winding Forest & Mountain roads without damaging payload!'
  },
  {
    id: 'police_1',
    title: 'Highway Speed Enforcement',
    type: 'chase',
    vehicleRequired: 'police',
    reward: 2800,
    timeLimit: 120,
    targetPos: { x: 0, z: 565 },
    description: 'Intercept and apprehend the illegal street racer on the biomes ring highway!'
  },
  {
    id: 'race_1',
    title: 'Alpine Summit Time Trial',
    type: 'race',
    reward: 3000,
    timeLimit: 100,
    targetPos: { x: 850, z: 650 },
    description: 'Race through hairpin mountain bends against the clock to set the summit record!'
  },
  {
    id: 'ice_1',
    title: 'Glacier Drift Challenge',
    type: 'snow',
    reward: 4000,
    timeLimit: 110,
    targetPos: { x: 800, z: -500 },
    description: 'Master treacherous icy slopes and frozen lake roads in extreme winter conditions!'
  }
];

export const CAMERA_MODES = [
  { id: 'fpv', name: '1st Person Driver', icon: '💺' },
  { id: 'dash', name: 'Dashboard', icon: '🎛️' },
  { id: 'wheel', name: 'Steering Wheel', icon: '🎡' },
  { id: 'hood', name: 'Front Hood', icon: '🚘' },
  { id: 'chase', name: '3rd Person Chase', icon: '🎥' },
  { id: 'cinematic', name: 'Wide Orbit', icon: '🚁' }
];

export const WEATHER_PRESETS = [
  { id: 'sunny', name: 'Sunny', icon: '☀️', sunIntensity: 1.3, fogDensity: 0.0003, rain: false, snow: false },
  { id: 'rain', name: 'Rainy', icon: '🌧️', sunIntensity: 0.5, fogDensity: 0.002, rain: true, snow: false },
  { id: 'storm', name: 'Thunderstorm', icon: '⛈️', sunIntensity: 0.2, fogDensity: 0.004, rain: true, snow: false },
  { id: 'fog', name: 'Heavy Fog', icon: '🌫️', sunIntensity: 0.4, fogDensity: 0.008, rain: false, snow: false },
  { id: 'snow', name: 'Snowstorm', icon: '❄️', sunIntensity: 0.6, fogDensity: 0.005, rain: false, snow: true }
];
