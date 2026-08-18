// Save System for NEXORA DRIVE

const SAVE_KEY = 'nexora_drive_save_v1';

export class SaveSystem {
  static getDefaultData() {
    return {
      credits: 5000,
      selectedVehicle: 'car',
      unlockedVehicles: ['car'],
      upgrades: {
        car: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0x0066ff },
        bus: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0xcc2222 },
        bike: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0x00cc44 },
        truck: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0x333333 },
        taxi: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0xffcc00 },
        suv: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0x995522 },
        police: { engine: 0, brakes: 0, tires: 0, suspension: 0, color: 0x111122 }
      },
      settings: {
        gyroEnabled: false,
        gyroSensitivity: 1.0,
        touchWheelSensitivity: 1.0,
        soundVolume: 0.8,
        timeOfDay: 14, // 2:00 PM default
        weather: 'sunny'
      },
      completedMissions: []
    };
  }

  static load() {
    try {
      const item = localStorage.getItem(SAVE_KEY);
      if (!item) return SaveSystem.getDefaultData();
      const parsed = JSON.parse(item);
      return { ...SaveSystem.getDefaultData(), ...parsed };
    } catch (e) {
      console.warn('Failed to load save data from localStorage:', e);
      return SaveSystem.getDefaultData();
    }
  }

  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }
}
