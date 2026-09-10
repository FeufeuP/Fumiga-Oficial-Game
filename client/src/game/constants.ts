export const GAME = {
  width: 1280,
  height: 720,
  grid: 40,
  longPressMs: 300,
  longPressTolerance: 12,
  tacticalScale: 0.1,
  colors: {
    void: 0x56c7d9,
    soil: 0x8f684c,
    soilLight: 0xd79b58,
    edge: 0xffcf4a,
    amber: 0xffb21c,
    amberLight: 0xfff083,
    biomass: 0x65d94b,
    biomassLight: 0xb9f04e,
    queen: 0xdf1962,
    worker: 0xff8b24,
    enemy: 0xf04472,
    cyan: 0x35e0e5,
  },
} as const;

export const RADIAL_ACTIONS = [
  { id: 'dig', label: 'CAVAR', shortLabel: 'CAV', color: GAME.colors.amber },
  { id: 'attack', label: 'ATACAR', shortLabel: 'ATK', color: GAME.colors.enemy },
  { id: 'collect', label: 'COLETAR', shortLabel: 'COL', color: GAME.colors.biomass },
] as const;

export type RadialActionId = (typeof RADIAL_ACTIONS)[number]['id'];

export const SPRITE_ASSETS = {
  queen: { url: '/manus-storage/queen_sheet_015984d6.png', frameWidth: 48, frameHeight: 48 },
  worker: { url: '/manus-storage/worker_sheet_54bc13d9.png', frameWidth: 32, frameHeight: 32 },
  biomass: { url: '/manus-storage/biomass_sheet_7499522d.png', frameWidth: 32, frameHeight: 32 },
  eliteSpy: { url: '/manus-storage/elite_spy_normalized_5db31a72.png', frameWidth: 32, frameHeight: 32 },
  eliteAcidSpitter: { url: '/manus-storage/elite_acid_spitter_normalized_b858bd3b.png', frameWidth: 32, frameHeight: 32 },
  eliteGiant: { url: '/manus-storage/elite_giant_normalized_bee857ed.png', frameWidth: 32, frameHeight: 32 },
  eliteHealer: { url: '/manus-storage/elite_healer_normalized_205a082c.png', frameWidth: 32, frameHeight: 32 },
} as const;
