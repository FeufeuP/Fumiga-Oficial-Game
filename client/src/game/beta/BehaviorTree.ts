export type NodeStatus = 'success' | 'failure' | 'running';

export type BehaviorContext = {
  role: 'worker' | 'collector' | 'soldier' | 'spy' | 'acid_spitter' | 'giant' | 'healer';
  hasPheromone: (type: 'dig' | 'collect' | 'attack') => boolean;
  hasEnemy: boolean;
  carrying: boolean;
  hasPath: boolean;
  setIntent: (intent: string) => void;
};

export interface BehaviorNode {
  tick(context: BehaviorContext): NodeStatus;
}

export class ActionNode implements BehaviorNode {
  constructor(private readonly action: (context: BehaviorContext) => NodeStatus) {}
  tick(context: BehaviorContext) { return this.action(context); }
}

export class ConditionNode implements BehaviorNode {
  constructor(private readonly condition: (context: BehaviorContext) => boolean) {}
  tick(context: BehaviorContext) { return this.condition(context) ? 'success' : 'failure'; }
}

export class SequenceNode implements BehaviorNode {
  constructor(private readonly children: BehaviorNode[]) {}
  tick(context: BehaviorContext): NodeStatus {
    for (const child of this.children) {
      const result = child.tick(context);
      if (result !== 'success') return result;
    }
    return 'success';
  }
}

export class SelectorNode implements BehaviorNode {
  constructor(private readonly children: BehaviorNode[]) {}
  tick(context: BehaviorContext): NodeStatus {
    for (const child of this.children) {
      const result = child.tick(context);
      if (result !== 'failure') return result;
    }
    return 'failure';
  }
}
