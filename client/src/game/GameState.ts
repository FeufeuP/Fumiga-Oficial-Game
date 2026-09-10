import type { GameHudState } from './EventBus';

export const initialHudState: GameHudState = {
  biomass: 184,
  queenHp: 100,
  queenMaxHp: 100,
  workers: 6,
  mode: 'active',
  selectedAction: null,
  lastAction: 'A colônia aguarda uma ordem.',
  timeScale: 1,
};
