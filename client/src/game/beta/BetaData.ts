export type AntRole = 'worker' | 'collector' | 'soldier' | 'spy' | 'acid_spitter' | 'giant' | 'healer';
export type EliteAntKind = 'spy' | 'acid_spitter' | 'giant' | 'healer';
export type PheromoneType = 'dig' | 'collect' | 'attack';
export type RunStatus = 'active' | 'mutation' | 'gameover' | 'victory';
export type AntIntent = 'defend' | 'collect' | 'dig' | 'return' | 'follow' | 'idle';

export type BetaCard = {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  lineage: string;
  description: string;
  effect: string;
};

export type BetaHudState = {
  layer: 'surface' | 'underground';
  layerLabel: string;
  surfaceResources: number;
  surfaceThreats: number;
  biomass: number;
  biomassCapacity: number;
  specialBiomass: number;
  royalJelly: number;
  queenHp: number;
  queenMaxHp: number;
  workers: number;
  collectors: number;
  soldiers: number;
  enemies: number;
  rooms: number;
  excavated: number;
  mode: 'active' | 'tactical' | 'mutation' | 'gameover';
  selectedAction: string | null;
  lastAction: string;
  timeScale: number;
  runTime: number;
  seed: number;
  wave?: number;
  nextWaveIn?: number;
  eliteCooldowns?: Array<{ id: string; name: string; ability: string; remaining: number; max: number }>;
  eliteAlert?: { name: string; ability: string; seconds: number };
  bossHud?: { name: string; hp: number; maxHp: number; ability: string };
  activeEffects?: Array<{ label: string; remaining: number; color: 'venom' | 'web' | 'impact' | 'sting' }>;
  aiStatus?: string;
  aiFocus?: AntIntent;
  unlockedEliteClasses?: Array<{ id: EliteAntKind; name: string; cost: number }>;
};

export type RunSummary = {
  result: 'gameover' | 'victory';
  runId: string;
  duration: number;
  wave: number;
  enemiesDefeated: number;
  elitesDefeated: number;
  bossDefeated: number;
  damageDealt: number;
  damageTaken: number;
  biomassReward: number;
  royalJellyReward: number;
  mutations: number;
  queenHp: number;
  queenMaxHp: number;
  summary: string;
  score: number;
  isPersonalBest: boolean;
  rank: number;
  personalRecords: PersonalRecord[];
};

export type PersonalRecord = {
  score: number;
  wave: number;
  duration: number;
  enemiesDefeated: number;
  runId: string;
  achievedAt: number;
};

export type MetaNode = { id: string; branch: 'attributes' | 'infrastructure' | 'elite'; name: string; description: string; cost: number; requires: string[]; effect: string; stat: string; value: number; maxLevel: 1 };

export const META_TREE: MetaNode[] = [
  { id: 'queen_carapace_1', branch: 'attributes', name: 'Carapaça Fortalecida I', description: '+10 HP máximo da Rainha.', cost: 5, requires: [], effect: 'queenMaxHp +10', stat: 'queenMaxHp', value: 10, maxLevel: 1 },
  { id: 'queen_carapace_2', branch: 'attributes', name: 'Carapaça Fortalecida II', description: '+15 HP máximo da Rainha.', cost: 10, requires: ['queen_carapace_1'], effect: 'queenMaxHp +15', stat: 'queenMaxHp', value: 15, maxLevel: 1 },
  { id: 'queen_carapace_3', branch: 'attributes', name: 'Carapaça Fortalecida III', description: '+20 HP máximo da Rainha.', cost: 20, requires: ['queen_carapace_2'], effect: 'queenMaxHp +20', stat: 'queenMaxHp', value: 20, maxLevel: 1 },
  { id: 'swift_legs_1', branch: 'attributes', name: 'Pernas Adaptadas I', description: '+8% velocidade de navegação do enxame.', cost: 6, requires: [], effect: 'movementSpeed +8%', stat: 'movementSpeed', value: 0.08, maxLevel: 1 },
  { id: 'genetic_luck_1', branch: 'attributes', name: 'Sorte Genética', description: 'Começa cada run com +1 Biomassa Especial.', cost: 12, requires: ['queen_carapace_1'], effect: 'specialBiomass +1', stat: 'specialBiomass', value: 1, maxLevel: 1 },
  { id: 'pantry_1', branch: 'infrastructure', name: 'Despensa Expandida I', description: '+30 capacidade inicial de Biomassa.', cost: 8, requires: [], effect: 'biomassCapacity +30', stat: 'biomassCapacity', value: 30, maxLevel: 1 },
  { id: 'pantry_2', branch: 'infrastructure', name: 'Despensa Expandida II', description: '+50 capacidade inicial de Biomassa.', cost: 15, requires: ['pantry_1'], effect: 'biomassCapacity +50', stat: 'biomassCapacity', value: 50, maxLevel: 1 },
  { id: 'royal_reserve', branch: 'infrastructure', name: 'Reserva Real', description: '+20 Biomassa no início de cada run.', cost: 10, requires: ['pantry_1'], effect: 'startingBiomass +20', stat: 'startingBiomass', value: 20, maxLevel: 1 },
  { id: 'nursery_protocol', branch: 'infrastructure', name: 'Protocolo de Incubação', description: 'Começa com uma Operária adicional.', cost: 14, requires: ['pantry_2'], effect: 'startingWorkers +1', stat: 'startingWorkers', value: 1, maxLevel: 1 },
  { id: 'elite_spy', branch: 'elite', name: 'Casta Espiã', description: 'Desbloqueia a classe de elite Espiã.', cost: 18, requires: ['swift_legs_1'], effect: 'unlock:spy', stat: 'unlockSpy', value: 1, maxLevel: 1 },
  { id: 'elite_acid', branch: 'elite', name: 'Casta Cuspidora', description: 'Desbloqueia a classe de elite Cuspidora de Ácido.', cost: 22, requires: ['elite_spy'], effect: 'unlock:acid_spitter', stat: 'unlockAcidSpitter', value: 1, maxLevel: 1 },
  { id: 'elite_giant', branch: 'elite', name: 'Casta Gigante', description: 'Desbloqueia a classe de elite Gigante.', cost: 24, requires: ['queen_carapace_2'], effect: 'unlock:giant', stat: 'unlockGiant', value: 1, maxLevel: 1 },
  { id: 'elite_healer', branch: 'elite', name: 'Casta Curandeira', description: 'Desbloqueia a classe de elite Curandeira.', cost: 26, requires: ['genetic_luck_1'], effect: 'unlock:healer', stat: 'unlockHealer', value: 1, maxLevel: 1 },
  { id: 'heavy_excavator', branch: 'elite', name: 'Escavadeira Pesada', description: 'Desbloqueia a sala Escavação Profunda.', cost: 20, requires: ['pantry_2'], effect: 'unlock:deep_excavation', stat: 'unlockDeepExcavation', value: 1, maxLevel: 1 },
  { id: 'fungus_chamber', branch: 'infrastructure', name: 'Câmara de Fungos', description: 'Desbloqueia a sala avançada Câmara de Fungos.', cost: 24, requires: ['nursery_protocol'], effect: 'unlock:fungus_chamber', stat: 'unlockFungusChamber', value: 1, maxLevel: 1 },
  { id: 'colony_command', branch: 'elite', name: 'Comando da Colônia', description: '+1 Soldado inicial e acesso à Câmara de Defesa.', cost: 28, requires: ['elite_acid', 'heavy_excavator'], effect: 'startingSoldiers +1 · unlock:defense', stat: 'startingSoldiers', value: 1, maxLevel: 1 },
];

export const ELITE_ANT_PROFILES: Record<EliteAntKind, { name: string; cost: number; color: number; ability: string; description: string }> = {
  spy: { name: 'Espiã', cost: 35, color: 0x8a00b8, ability: 'INFILTRAÇÃO', description: 'Rápida e furtiva; aplica veneno a distância.' },
  acid_spitter: { name: 'Cuspidora de Ácido', cost: 45, color: 0x55ff00, ability: 'JATO ÁCIDO', description: 'Ataca inimigos com dano ácido e reduz suas defesas.' },
  giant: { name: 'Gigante', cost: 50, color: 0xff3333, ability: 'IMPACTO TITÂNICO', description: 'Lenta, resistente e especialista em dano físico.' },
  healer: { name: 'Curandeira', cost: 55, color: 0x74d6ff, ability: 'FEROMÔNIO REGENERATIVO', description: 'Recupera a vida da Rainha periodicamente.' },
};

export type RunSnapshot = {
  runId: string;
  seed: number;
  status: RunStatus;
  biomass: number;
  biomassCapacity: number;
  specialBiomass: number;
  queenHp: number;
  acquiredCards: string[];
  rooms: string[];
  excavated: number;
  royalJellyEarned: number;
  startedAt: number;
};

export const BETA_CARDS: BetaCard[] = [
  { id: 'sharp_mandibles', name: 'Mandíbulas Serrilhadas', rarity: 'common', lineage: 'venom', description: '+20% dano base das formigas.', effect: 'damage: +20%' },
  { id: 'light_legs', name: 'Pernas Leves', rarity: 'common', lineage: 'mobility', description: '+18% velocidade de movimento.', effect: 'speed: +18%' },
  { id: 'rigid_carapace', name: 'Carapaça Rígida', rarity: 'uncommon', lineage: 'carapace', description: '+25% armadura da colônia.', effect: 'armor: +25%' },
  { id: 'poison_gland', name: 'Glândula Venenosa', rarity: 'rare', lineage: 'venom', description: 'Ataques aplicam veneno por 3 segundos.', effect: 'poison: enabled' },
  { id: 'acid_spit', name: 'Cuspe Ácido', rarity: 'rare', lineage: 'acid', description: 'Soldados corroem armadura dos inimigos.', effect: 'corrode: enabled' },
  { id: 'hive_mind', name: 'Mente Coletiva', rarity: 'epic', lineage: 'swarm', description: 'Feromônios têm +35% de raio.', effect: 'pheromoneRadius: +35%' },
];

export const DEFAULT_META = {
  schemaVersion: 1,
  profileId: 'local_profile',
  royalJelly: 0,
  skillTree: { hp_buff: 0, speed_buff: 0, biomass_capacity: 0 } as Record<string, number>,
  unlockedClasses: ['worker', 'collector', 'soldier'],
  unlockedRooms: ['central_chamber', 'nursery', 'pantry', 'defense_chamber'],
  discoveredBiomes: ['wet_forest'],
  statistics: { runs: 0, victories: 0, queenDeaths: 0, biomassCollected: 0 },
};

export type MetaProgression = typeof DEFAULT_META;
