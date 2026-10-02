import { DEFAULT_META, META_TREE, type MetaNode, type MetaProgression, type PersonalRecord, type RunSnapshot, type RunSummary } from './BetaData';

const META_KEY = 'fumiga-beta-meta-v1';
const REWARD_KEY = 'fumiga-beta-rewards-v1';
const RECORDS_KEY = 'fumiga-beta-records-v1';

export const SAVE_SCHEMA = 'fumiga-beta-save';
export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_GAME_VERSION = 'BETA 0.1';

/** Formato estável do arquivo .json exportado pela aba TESTE. */
export type ExportedSave = {
  schema: typeof SAVE_SCHEMA;
  schemaVersion: number;
  gameVersion: string;
  exportedAt: string;
  meta: MetaProgression;
  records: PersonalRecord[];
};

export type SaveImportResult = { ok: boolean; meta: MetaProgression; reason?: string };

const finiteNumber = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const nonNegativeInt = (value: unknown, fallback = 0): number => Math.max(0, Math.round(finiteNumber(value, fallback)));
const stringArray = (value: unknown, fallback: string[]): string[] => (Array.isArray(value) ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string'))) : [...fallback]);

/** Normaliza um bloco `meta` vindo de arquivo: nada não-numérico ou negativo sobrevive. */
export function sanitizeMeta(input: unknown): MetaProgression | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<MetaProgression>;
  const skillTree: Record<string, number> = {};
  if (raw.skillTree && typeof raw.skillTree === 'object') {
    for (const [key, value] of Object.entries(raw.skillTree)) skillTree[key] = Math.max(0, Math.round(finiteNumber(value, 0)));
  }
  const statistics = (raw.statistics ?? {}) as Partial<MetaProgression['statistics']>;
  return {
    schemaVersion: nonNegativeInt(raw.schemaVersion, DEFAULT_META.schemaVersion),
    profileId: typeof raw.profileId === 'string' && raw.profileId.trim().length > 0 ? raw.profileId : DEFAULT_META.profileId,
    royalJelly: nonNegativeInt(raw.royalJelly),
    skillTree: { ...DEFAULT_META.skillTree, ...skillTree },
    unlockedClasses: stringArray(raw.unlockedClasses, DEFAULT_META.unlockedClasses),
    unlockedRooms: stringArray(raw.unlockedRooms, DEFAULT_META.unlockedRooms),
    discoveredBiomes: stringArray(raw.discoveredBiomes, DEFAULT_META.discoveredBiomes),
    statistics: {
      runs: nonNegativeInt(statistics.runs),
      victories: nonNegativeInt(statistics.victories),
      queenDeaths: nonNegativeInt(statistics.queenDeaths),
      biomassCollected: nonNegativeInt(statistics.biomassCollected),
    },
  } as MetaProgression;
}

/** Mantém apenas registros válidos, ordenados por pontuação, no máximo 5. */
export function sanitizeRecords(input: unknown): PersonalRecord[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      score: nonNegativeInt(entry.score),
      wave: nonNegativeInt(entry.wave),
      duration: nonNegativeInt(entry.duration),
      enemiesDefeated: nonNegativeInt(entry.enemiesDefeated),
      runId: typeof entry.runId === 'string' ? entry.runId : '',
      achievedAt: nonNegativeInt(entry.achievedAt),
    }))
    .filter((record) => record.runId.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export class SaveManager {
  async loadMeta(): Promise<MetaProgression> {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return structuredClone(DEFAULT_META);
      const parsed = JSON.parse(raw) as Partial<MetaProgression>;
      return { ...structuredClone(DEFAULT_META), ...parsed, skillTree: { ...DEFAULT_META.skillTree, ...(parsed.skillTree ?? {}) }, statistics: { ...DEFAULT_META.statistics, ...(parsed.statistics ?? {}) } };
    } catch { return structuredClone(DEFAULT_META); }
  }

  async saveMeta(meta: MetaProgression) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  loadRecords(): PersonalRecord[] {
    try {
      return sanitizeRecords(JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '[]'));
    } catch { return []; }
  }

  /** Monta o objeto exportado. `exportedAt` é a única parte não determinística. */
  async buildSave(): Promise<ExportedSave> {
    return {
      schema: SAVE_SCHEMA,
      schemaVersion: SAVE_SCHEMA_VERSION,
      gameVersion: SAVE_GAME_VERSION,
      exportedAt: new Date().toISOString(),
      meta: sanitizeMeta(await this.loadMeta()) as MetaProgression,
      records: this.loadRecords(),
    };
  }

  async exportSave(): Promise<string> {
    return JSON.stringify(await this.buildSave(), null, 2);
  }

  async importSave(raw: string): Promise<SaveImportResult> {
    const meta = await this.loadMeta();
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return { ok: false, meta, reason: 'Arquivo inválido: o conteúdo não é JSON.' }; }
    if (!parsed || typeof parsed !== 'object') return { ok: false, meta, reason: 'Save malformado: objeto esperado.' };
    const save = parsed as Partial<ExportedSave>;
    if (save.schema !== SAVE_SCHEMA) return { ok: false, meta, reason: `Schema desconhecido: ${String(save.schema ?? 'ausente')}.` };
    const version = finiteNumber(save.schemaVersion, -1);
    if (version < 1) return { ok: false, meta, reason: 'Save sem schemaVersion válido.' };
    if (version > SAVE_SCHEMA_VERSION) return { ok: false, meta, reason: `Save de schemaVersion ${version} é mais novo que o suportado (${SAVE_SCHEMA_VERSION}).` };
    const nextMeta = sanitizeMeta(save.meta);
    if (!nextMeta) return { ok: false, meta, reason: 'Save sem bloco meta utilizável.' };
    const records = sanitizeRecords(save.records);
    await this.saveMeta(nextMeta);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    return { ok: true, meta: nextMeta };
  }

  async settleRun(run: RunSnapshot, result: 'gameover' | 'victory') {
    const meta = await this.loadMeta();
    const rewardKey = `reward:${run.runId}:run:${result}`;
    const rewards = JSON.parse(localStorage.getItem(REWARD_KEY) ?? '{}') as Record<string, boolean>;
    if (!rewards[rewardKey]) {
      rewards[rewardKey] = true;
      meta.royalJelly += run.royalJellyEarned;
      meta.statistics.runs += 1;
      meta.statistics[result === 'victory' ? 'victories' : 'queenDeaths'] += 1;
      await this.saveMeta(meta);
      localStorage.setItem(REWARD_KEY, JSON.stringify(rewards));
    }
    return meta;
  }

  async purchaseNode(nodeId: string): Promise<{ ok: boolean; meta: MetaProgression; reason?: string }> {
    const meta = await this.loadMeta();
    const node = META_TREE.find((entry) => entry.id === nodeId) as MetaNode | undefined;
    if (!node) return { ok: false, meta, reason: 'Nó não encontrado.' };
    if ((meta.skillTree[node.id] ?? 0) >= node.maxLevel) return { ok: false, meta, reason: 'Este nó já está no nível máximo.' };
    if (node.requires.some((requirement) => (meta.skillTree[requirement] ?? 0) < 1)) return { ok: false, meta, reason: 'Pré-requisito ainda bloqueado.' };
    if (meta.royalJelly < node.cost) return { ok: false, meta, reason: `Geleia Real insuficiente. Necessário: ${node.cost}.` };
    const next = { ...meta, royalJelly: meta.royalJelly - node.cost, skillTree: { ...meta.skillTree, [node.id]: 1 } };
    if (node.stat === 'unlockSpy') next.unlockedClasses = Array.from(new Set([...next.unlockedClasses, 'spy' as never]));
    if (node.stat === 'unlockAcidSpitter') next.unlockedClasses = Array.from(new Set([...next.unlockedClasses, 'acid_spitter' as never]));
    if (node.stat === 'unlockGiant') next.unlockedClasses = Array.from(new Set([...next.unlockedClasses, 'giant' as never]));
    if (node.stat === 'unlockHealer') next.unlockedClasses = Array.from(new Set([...next.unlockedClasses, 'healer' as never]));
    if (node.stat === 'unlockDeepExcavation') next.unlockedRooms = Array.from(new Set([...next.unlockedRooms, 'deep_excavation']));
    if (node.stat === 'unlockFungusChamber') next.unlockedRooms = Array.from(new Set([...next.unlockedRooms, 'fungus_chamber']));
    if (node.stat === 'startingSoldiers') next.unlockedRooms = Array.from(new Set([...next.unlockedRooms, 'defense_chamber']));
    await this.saveMeta(next);
    return { ok: true, meta: next };
  }

  recordScore(summary: Omit<RunSummary, 'score' | 'isPersonalBest' | 'rank' | 'personalRecords'>): RunSummary {
    const score = Math.max(0, (summary.result === 'victory' ? 10000 : 0) + summary.wave * 500 + summary.enemiesDefeated * 100 + summary.elitesDefeated * 250 + summary.bossDefeated * 5000 + summary.damageDealt + summary.biomassReward * 10 + summary.royalJellyReward * 500 + Math.round(summary.queenHp / summary.queenMaxHp * 1000) - summary.damageTaken * 20 - summary.duration * 3);
    const previousBest = this.loadRecords()[0]?.score ?? 0;
    let records = this.loadRecords();
    if (summary.result === 'victory') records = sanitizeRecords([...records, { score, wave: summary.wave, duration: summary.duration, enemiesDefeated: summary.enemiesDefeated, runId: summary.runId, achievedAt: Date.now() }]);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    const recordIndex = records.findIndex((record) => record.runId === summary.runId);
    const rank = summary.result === 'victory' ? (recordIndex >= 0 ? recordIndex + 1 : records.length + 1) : 0;
    return { ...summary, score, isPersonalBest: summary.result === 'victory' && score > previousBest, rank, personalRecords: records };
  }

  async reset() {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(REWARD_KEY);
    localStorage.removeItem(RECORDS_KEY);
    return structuredClone(DEFAULT_META);
  }
}
