import { DEFAULT_META_STATE, type MetaProgressionState } from '../core/Contracts';

const KEY = 'fumiga-meta-v1';

export class DomainSaveManager {
  async load(): Promise<MetaProgressionState> {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_META_STATE);
    try {
      const parsed = JSON.parse(raw) as Partial<MetaProgressionState>;
      return { ...structuredClone(DEFAULT_META_STATE), ...parsed, schemaVersion: 1 };
    } catch {
      return structuredClone(DEFAULT_META_STATE);
    }
  }

  async save(meta: MetaProgressionState): Promise<void> {
    const safe: MetaProgressionState = { ...meta, schemaVersion: 1 };
    localStorage.setItem(KEY, JSON.stringify(safe));
  }

  async settleRoyalJelly(runId: string, amount: number, result: 'victory' | 'gameover'): Promise<MetaProgressionState> {
    const rewardKey = `fumiga-reward:${runId}:royal-jelly`;
    const meta = await this.load();
    if (!localStorage.getItem(rewardKey)) {
      if (result === 'victory' && amount > 0) meta.royalJelly += amount;
      meta.statistics.runs += 1;
      if (result === 'victory') meta.statistics.victories += 1;
      else meta.statistics.queenDeaths += 1;
      localStorage.setItem(rewardKey, '1');
      await this.save(meta);
    }
    return meta;
  }
}
