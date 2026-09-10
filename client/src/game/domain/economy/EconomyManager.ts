import type { RunState } from '../core/Contracts';

export const RESOURCE_COSTS = Object.freeze({
  worker: 10,
  collector: 15,
  scout: 20,
  soldier: 25,
  guardian: 30,
  acid_spitter: 40,
  giant: 150,
  spy: 100,
  nursery: 50,
  pantry: 40,
  defense_chamber: 60,
  false_tunnel: 30,
  fungus_chamber: 100,
});

export class EconomyManager {
  constructor(private readonly run: RunState) {}

  canAfford(cost: number): boolean { return cost >= 0 && this.run.biomass >= cost; }

  spend(cost: number, reason: string): boolean {
    if (!this.canAfford(cost)) return false;
    this.run.biomass -= cost;
    return true;
  }

  earn(amount: number, reason: string): number {
    if (amount <= 0) return 0;
    const before = this.run.biomass;
    this.run.biomass = Math.min(this.run.biomassCapacity, this.run.biomass + amount);
    return this.run.biomass - before;
  }

  increaseCapacity(amount: number): void { this.run.biomassCapacity = Math.max(this.run.biomassCapacity, this.run.biomassCapacity + amount); }
}
