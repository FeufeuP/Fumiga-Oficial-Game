import { DEFAULT_META, META_TREE, type MetaNode, type MetaProgression, type PersonalRecord, type RunSnapshot, type RunSummary } from './BetaData';

const META_KEY = 'fumiga-beta-meta-v1';
const REWARD_KEY = 'fumiga-beta-rewards-v1';
const RECORDS_KEY = 'fumiga-beta-records-v1';

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
    let records: PersonalRecord[] = [];
    try { records = JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '[]') as PersonalRecord[]; } catch { records = []; }
    const previousBest = records[0]?.score ?? 0;
    if (summary.result === 'victory') records = [...records, { score, wave: summary.wave, duration: summary.duration, enemiesDefeated: summary.enemiesDefeated, runId: summary.runId, achievedAt: Date.now() }].sort((a, b) => b.score - a.score).slice(0, 5);
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
