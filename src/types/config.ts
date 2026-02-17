/** Game configuration that can be modified at runtime */
export interface GameConfig {
  ball: {
    speed: number;       // pixels per second (default: 300)
    radius: number;      // pixels (default: 8)
    maxSpeed: number;    // cap (default: 600)
  };
  paddle: {
    width: number;       // pixels (default: 120)
    height: number;      // pixels (default: 16)
    speed: number;       // pixels per second (default: 500)
  };
  gameplay: {
    lives: number;       // starting lives (default: 3)
    pointsPerBrick: number; // base score per brick (default: 10)
    comboMultiplier: number; // multiplier per consecutive hit (default: 0.1)
    comboTimeout: number;    // ms before combo resets (default: 2000)
  };
  visual: {
    backgroundColor: string;
    particlesEnabled: boolean;
    screenShake: boolean;
  };
}

/** Partial config for patching - this is what the LLM generates */
export interface ConfigPatch {
  ball?: Partial<GameConfig['ball']>;
  paddle?: Partial<GameConfig['paddle']>;
  gameplay?: Partial<GameConfig['gameplay']>;
  visual?: Partial<GameConfig['visual']>;
}

/** Validation ranges for config values */
export const CONFIG_RANGES: Record<string, Record<string, { min: number; max: number }>> = {
  ball: {
    speed: { min: 100, max: 800 },
    radius: { min: 4, max: 20 },
    maxSpeed: { min: 200, max: 1000 },
  },
  paddle: {
    width: { min: 40, max: 300 },
    height: { min: 8, max: 32 },
    speed: { min: 200, max: 1000 },
  },
  gameplay: {
    lives: { min: 1, max: 10 },
    pointsPerBrick: { min: 1, max: 100 },
    comboMultiplier: { min: 0, max: 1 },
    comboTimeout: { min: 500, max: 10000 },
  },
};

/** Default game config */
export const DEFAULT_CONFIG: GameConfig = {
  ball: {
    speed: 300,
    radius: 8,
    maxSpeed: 600,
  },
  paddle: {
    width: 120,
    height: 16,
    speed: 500,
  },
  gameplay: {
    lives: 3,
    pointsPerBrick: 10,
    comboMultiplier: 0.1,
    comboTimeout: 2000,
  },
  visual: {
    backgroundColor: '#0a0a1a',
    particlesEnabled: true,
    screenShake: true,
  },
};

/** Apply a config patch with validation */
export function applyConfigPatch(current: GameConfig, patch: ConfigPatch): GameConfig {
  const result = structuredClone(current);

  for (const [section, values] of Object.entries(patch)) {
    if (!values || !(section in result)) continue;
    const sectionConfig = result[section as keyof GameConfig];
    const ranges = CONFIG_RANGES[section];

    for (const [key, value] of Object.entries(values)) {
      if (key in sectionConfig) {
        if (typeof value === 'number' && ranges?.[key]) {
          const { min, max } = ranges[key];
          (sectionConfig as Record<string, unknown>)[key] = Math.max(min, Math.min(max, value));
        } else {
          (sectionConfig as Record<string, unknown>)[key] = value;
        }
      }
    }
  }

  return result;
}
