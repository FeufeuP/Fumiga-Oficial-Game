export type GridCellState = 0 | 1 | 2 | 3;
export type WorldLayer = 'surface' | 'underground';
export type RunStatus = 'idle' | 'generating' | 'tutorial' | 'active' | 'mutation' | 'migration' | 'boss' | 'victory' | 'gameover' | 'settlement';
export type TaskStatus = 'available' | 'reserved' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
export type AntRole = 'worker' | 'collector' | 'scout' | 'soldier' | 'guardian' | 'acid_spitter' | 'spy' | 'giant' | 'heavy_digger' | 'healer';
export type PheromoneType = 'dig' | 'collect' | 'attack' | 'movement';
export type IntentType = 'REQUEST_DIG' | 'REQUEST_BUILD' | 'REQUEST_ATTACK' | 'REQUEST_COLLECT' | 'REQUEST_FLEE' | 'REQUEST_ESCORT' | 'REQUEST_IDLE';

export type Vec2 = { x: number; y: number };

export type Task = {
  id: string;
  type: 'dig' | 'build' | 'collect' | 'attack' | 'escort' | 'explore';
  status: TaskStatus;
  target: Vec2;
  targetEntityId?: string;
  assignedEntityId?: string;
  createdAt: number;
  updatedAt: number;
};

export type Intent = {
  type: IntentType;
  entityId: string;
  target?: Vec2;
  targetEntityId?: string;
  taskId?: string;
  issuedAt: number;
};

export type EntityState = {
  id: string;
  role: AntRole | 'queen' | 'enemy' | 'resource';
  layer: WorldLayer;
  position: Vec2;
  maxHp: number;
  currentHp: number;
  moveSpeed: number;
  armor: number;
  baseDamage: number;
  faction: 'Player' | 'Enemy' | 'Neutral' | 'Enemy_Faction';
  statusEffects: string[];
  alive: boolean;
};

export type RunState = {
  schemaVersion: 1;
  runId: string;
  seed: number;
  status: RunStatus;
  biomeId: string;
  biomass: number;
  biomassCapacity: number;
  specialBiomass: number;
  queenEntityId: string;
  entities: Record<string, EntityState>;
  tasks: Record<string, Task>;
  acquiredCards: string[];
  rooms: string[];
  gridVersion: number;
  elapsedSeconds: number;
};

export type MetaProgressionState = {
  schemaVersion: 1;
  profileId: string;
  royalJelly: number;
  skillTree: Record<string, number>;
  unlockedClasses: AntRole[];
  unlockedRooms: string[];
  discoveredBiomes: string[];
  statistics: { runs: number; victories: number; queenDeaths: number };
};

export const DEFAULT_RUN: Omit<RunState, 'runId' | 'seed'> = {
  schemaVersion: 1,
  status: 'idle',
  biomeId: 'wet_forest',
  biomass: 100,
  biomassCapacity: 220,
  specialBiomass: 0,
  queenEntityId: 'queen-001',
  entities: {},
  tasks: {},
  acquiredCards: [],
  rooms: ['central_chamber'],
  gridVersion: 0,
  elapsedSeconds: 0,
};

export const DEFAULT_META_STATE: MetaProgressionState = {
  schemaVersion: 1,
  profileId: 'local_profile',
  royalJelly: 0,
  skillTree: {},
  unlockedClasses: ['worker', 'collector', 'soldier'],
  unlockedRooms: ['central_chamber'],
  discoveredBiomes: ['wet_forest'],
  statistics: { runs: 0, victories: 0, queenDeaths: 0 },
};
