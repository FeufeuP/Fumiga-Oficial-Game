import type { EnemyKind } from './EnemyBrain';

export type WavePerformance = {
  queenHpRatio: number;
  soldiers: number;
  biomass: number;
};

export type WavePlan = {
  number: number;
  threatBudget: number;
  composition: Array<{ kind: EnemyKind; elite: boolean; boss?: boolean }>;
  interval: number;
};

const COST: Record<EnemyKind, number> = { centipede: 2, spider: 2, wasp: 3, beetle: 4 };

/** Escala a pressão sem usar aleatoriedade, mantendo runs reproduzíveis pelo seed. */
export class WaveDirector {
  private wave = 1;
  private nextWaveAt = 16;

  reset() {
    this.wave = 1;
    this.nextWaveAt = 16;
  }

  shouldSpawn(runTime: number, activeEnemies: number) {
    const livingCap = Math.min(12, 5 + this.wave * 2);
    const bossWave = (this.wave + 1) % 10 === 0;
    return runTime >= this.nextWaveAt && (activeEnemies < livingCap || bossWave);
  }

  next(runTime: number, performance: WavePerformance): WavePlan {
    this.wave += 1;
    const pressureBonus = performance.queenHpRatio > .75 && performance.biomass > 120 ? 1 : 0;
    const recoveryRelief = performance.queenHpRatio < .45 ? -1 : 0;
    const threatBudget = Math.max(4, 3 + this.wave + pressureBonus + recoveryRelief);
    const composition: Array<{ kind: EnemyKind; elite: boolean; boss?: boolean }> = [];
    let remaining = threatBudget;
    const order: EnemyKind[] = performance.soldiers >= 2 ? ['wasp', 'beetle', 'spider', 'centipede'] : ['centipede', 'spider', 'wasp', 'beetle'];
    if (this.wave % 10 === 0) {
      composition.push({ kind: 'beetle', elite: true, boss: true });
      remaining = Math.max(0, remaining - 8);
    }
    while (remaining >= 2) {
      const kind = order[(composition.length + this.wave) % order.length];
      const eliteWave = this.wave >= 3 && this.wave % 3 === 0 && composition.length === 0;
      const cost = COST[kind] * (eliteWave ? 2 : 1);
      if (cost <= remaining) { composition.push({ kind, elite: eliteWave }); remaining -= cost; }
      else if (remaining >= 2) { composition.push({ kind: 'centipede', elite: false }); remaining -= COST.centipede; }
    }
    this.nextWaveAt = runTime + Math.max(8, 15 - Math.min(6, this.wave * .6));
    return { number: this.wave, threatBudget, composition, interval: this.nextWaveAt - runTime };
  }

  get currentWave() { return this.wave; }
  get nextAt() { return this.nextWaveAt; }
}
