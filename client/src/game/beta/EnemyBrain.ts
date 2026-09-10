export type EnemyKind = 'centipede' | 'beetle' | 'spider' | 'wasp';
export type EnemyIntent = 'hunt-queen' | 'patrol' | 'ambush' | 'rush-collector' | 'idle';
export type DamageType = 'physical' | 'acid' | 'venom';

export type EnemyBrainInput = {
  kind: EnemyKind;
  hasAttackPheromone: boolean;
  queenDistance: number;
  nearestCollectorDistance: number;
  hasPath: boolean;
};

/**
 * Decide a intenção de alto nível do inimigo. A navegação continua no Grid/A*,
 * enquanto este cérebro escolhe o alvo e o padrão de movimento.
 */
export class EnemyBrain {
  private currentIntent: EnemyIntent = 'idle';

  think(input: EnemyBrainInput): EnemyIntent {
    const { kind, hasAttackPheromone, queenDistance, nearestCollectorDistance, hasPath } = input;

    if (kind === 'centipede') this.currentIntent = 'hunt-queen';
    else if (kind === 'beetle') this.currentIntent = queenDistance < 210 ? 'hunt-queen' : 'patrol';
    else if (kind === 'spider') this.currentIntent = hasAttackPheromone || queenDistance < 260 ? 'ambush' : 'idle';
    else if (kind === 'wasp') this.currentIntent = nearestCollectorDistance < 420 ? 'rush-collector' : 'hunt-queen';
    else this.currentIntent = hasPath ? 'patrol' : 'idle';

    return this.currentIntent;
  }

  get intent() {
    return this.currentIntent;
  }
}

export const ENEMY_PROFILES: Record<EnemyKind, {
  name: string;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  specialCooldown: number;
  specialName: string;
  resistances: Record<DamageType, number>;
  tint: number;
}> = {
  centipede: { name: 'CENTOPEIA', maxHp: 55, speed: 0.025, damage: 8, attackCooldown: 2.5, specialCooldown: 6, specialName: 'MORDIDA VENENOSA', resistances: { physical: .9, acid: 1.2, venom: .45 }, tint: 0xf04472 },
  beetle: { name: 'BESOURO GUARDIÃO', maxHp: 95, speed: 0.012, damage: 12, attackCooldown: 3.4, specialCooldown: 7, specialName: 'IMPACTO DE CARAPAÇA', resistances: { physical: .55, acid: 1.35, venom: .8 }, tint: 0xb86b2d },
  spider: { name: 'ARANHA DE EMBOSCADA', maxHp: 42, speed: 0.019, damage: 10, attackCooldown: 2.8, specialCooldown: 5.5, specialName: 'TEIA IMOBILIZANTE', resistances: { physical: .75, acid: .65, venom: .35 }, tint: 0x8a00b8 },
  wasp: { name: 'VESPA PREDADORA', maxHp: 34, speed: 0.035, damage: 6, attackCooldown: 1.8, specialCooldown: 4.5, specialName: 'FERRÃO PARALISANTE', resistances: { physical: 1.15, acid: .8, venom: .5 }, tint: 0xffb800 },
};
