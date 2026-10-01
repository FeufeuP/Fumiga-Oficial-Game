import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_META, type PersonalRecord } from '@/game/beta/BetaData';
import { SAVE_SCHEMA, SAVE_SCHEMA_VERSION, SaveManager, sanitizeMeta, sanitizeRecords } from '@/game/beta/SaveManager';

/**
 * Testes de unidade da exportação/importação de save (a base da aba TESTE).
 *
 * Nada aqui usa relógio real, timers ou await de rede: cada caso fixa os dados
 * de entrada, então o resultado é determinístico rodada após rodada.
 */

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  get length(): number { return this.store.size; }
}

const record = (score: number, runId: string): PersonalRecord => ({ score, wave: 3, duration: 120, enemiesDefeated: 7, runId, achievedAt: 1_700_000_000_000 });

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
});

describe('SaveManager.exportSave', () => {
  it('emite um JSON com schema, versão e a progressão atual', async () => {
    const manager = new SaveManager();
    const save = JSON.parse(await manager.exportSave());

    expect(save.schema).toBe(SAVE_SCHEMA);
    expect(save.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(save.gameVersion).toBe('BETA 0.1');
    expect(save.meta.profileId).toBe(DEFAULT_META.profileId);
    expect(save.meta.royalJelly).toBe(0);
    expect(save.records).toEqual([]);
    expect(typeof save.exportedAt).toBe('string');
  });

  it('inclui os recordes salvos no arquivo', async () => {
    const manager = new SaveManager();
    localStorage.setItem('fumiga-beta-records-v1', JSON.stringify([record(1200, 'run-a'), record(3400, 'run-b')]));

    const save = JSON.parse(await manager.exportSave());
    expect(save.records.map((entry: PersonalRecord) => entry.runId)).toEqual(['run-b', 'run-a']);
  });
});

describe('SaveManager.importSave', () => {
  it('restaura a progressão exportada em outra sessão (round-trip)', async () => {
    const origin = new SaveManager();
    await origin.saveMeta({ ...structuredClone(DEFAULT_META), royalJelly: 42, skillTree: { queen_carapace_1: 1 }, statistics: { runs: 5, victories: 2, queenDeaths: 3, biomassCollected: 900 } });
    localStorage.setItem('fumiga-beta-records-v1', JSON.stringify([record(2750, 'run-x')]));
    const file = await origin.exportSave();

    // Nova sessão: armazenamento zerado, como em outra máquina.
    Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
    const target = new SaveManager();
    expect((await target.loadMeta()).royalJelly).toBe(0);

    const result = await target.importSave(file);

    expect(result.ok).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.meta.royalJelly).toBe(42);
    expect(result.meta.skillTree.queen_carapace_1).toBe(1);
    expect(result.meta.statistics).toEqual({ runs: 5, victories: 2, queenDeaths: 3, biomassCollected: 900 });
    expect(target.loadRecords()).toHaveLength(1);
    expect(target.loadRecords()[0].runId).toBe('run-x');
  });

  it('recusa JSON inválido sem tocar no save atual', async () => {
    const manager = new SaveManager();
    await manager.saveMeta({ ...structuredClone(DEFAULT_META), royalJelly: 9 });

    const result = await manager.importSave('{ isso não é json');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('não é JSON');
    expect((await manager.loadMeta()).royalJelly).toBe(9);
  });

  it('recusa arquivo com schema diferente', async () => {
    const manager = new SaveManager();
    const result = await manager.importSave(JSON.stringify({ schema: 'outro-jogo', schemaVersion: 1, meta: DEFAULT_META }));

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Schema desconhecido');
  });

  it('recusa save de schemaVersion mais novo que o suportado', async () => {
    const manager = new SaveManager();
    const result = await manager.importSave(JSON.stringify({ schema: SAVE_SCHEMA, schemaVersion: SAVE_SCHEMA_VERSION + 1, meta: DEFAULT_META }));

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('mais novo');
  });

  it('recusa save sem bloco meta', async () => {
    const manager = new SaveManager();
    const result = await manager.importSave(JSON.stringify({ schema: SAVE_SCHEMA, schemaVersion: SAVE_SCHEMA_VERSION }));

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('meta');
  });
});

describe('sanitizeMeta', () => {
  it('descarta valores negativos, NaN e tipos errados', () => {
    const meta = sanitizeMeta({ royalJelly: -50, profileId: '', skillTree: { node_a: Number.NaN, node_b: 2.7, node_c: 'x' }, statistics: { runs: -3 }, unlockedClasses: ['worker', 'worker', 12], unlockedRooms: null });

    expect(meta).not.toBeNull();
    expect(meta!.royalJelly).toBe(0);
    expect(meta!.profileId).toBe(DEFAULT_META.profileId);
    expect(meta!.skillTree.node_a).toBe(0);
    expect(meta!.skillTree.node_b).toBe(3);
    expect(meta!.skillTree.node_c).toBe(0);
    expect(meta!.statistics.runs).toBe(0);
    expect(meta!.unlockedClasses).toEqual(['worker']);
    expect(meta!.unlockedRooms).toEqual(DEFAULT_META.unlockedRooms);
  });

  it('retorna null para entrada que não é objeto', () => {
    expect(sanitizeMeta(null)).toBeNull();
    expect(sanitizeMeta('save')).toBeNull();
  });
});

describe('sanitizeRecords', () => {
  it('mantém no máximo 5 recordes válidos ordenados por pontuação', () => {
    const records = sanitizeRecords([record(100, 'a'), record(500, 'b'), record(300, 'c'), record(900, 'd'), record(700, 'e'), record(800, 'f'), { score: 1 }]);

    expect(records).toHaveLength(5);
    expect(records.map((entry) => entry.score)).toEqual([900, 800, 700, 500, 300]);
  });

  it('devolve lista vazia para entrada não array', () => {
    expect(sanitizeRecords(undefined)).toEqual([]);
    expect(sanitizeRecords({ score: 10 })).toEqual([]);
  });
});

describe('SaveManager.purchaseNode', () => {
  it('cobra Geleia Real e grava o nó comprado', async () => {
    const manager = new SaveManager();
    await manager.saveMeta({ ...structuredClone(DEFAULT_META), royalJelly: 30 });

    const result = await manager.purchaseNode('queen_carapace_1');

    expect(result.ok).toBe(true);
    expect(result.meta.royalJelly).toBe(25);
    expect(result.meta.skillTree.queen_carapace_1).toBe(1);
  });

  it('recusa compra sem geleia suficiente e sem pré-requisito', async () => {
    const manager = new SaveManager();

    expect((await manager.purchaseNode('queen_carapace_1')).reason).toContain('insuficiente');
    await manager.saveMeta({ ...structuredClone(DEFAULT_META), royalJelly: 99 });
    expect((await manager.purchaseNode('queen_carapace_2')).reason).toContain('Pré-requisito');
  });
});

describe('SaveManager.recordScore', () => {
  it('marca recorde pessoal apenas quando supera o melhor anterior', async () => {
    const manager = new SaveManager();
    const base = { result: 'victory', runId: 'run-1', duration: 100, wave: 2, enemiesDefeated: 5, elitesDefeated: 0, bossDefeated: 0, damageDealt: 300, damageTaken: 20, biomassReward: 40, royalJellyReward: 1, mutations: 1, queenHp: 80, queenMaxHp: 100, summary: 'ok' } as const;

    const first = manager.recordScore(base);
    const second = manager.recordScore({ ...base, runId: 'run-2', enemiesDefeated: 1 });

    expect(first.isPersonalBest).toBe(true);
    expect(second.score).toBeLessThan(first.score);
    expect(second.isPersonalBest).toBe(false);
    expect(second.personalRecords[0].runId).toBe('run-1');
  });
});
