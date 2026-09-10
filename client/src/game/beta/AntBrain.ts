import { ActionNode, BehaviorContext, BehaviorNode, ConditionNode, SelectorNode, SequenceNode } from './BehaviorTree';

export type AntIntent = 'defend' | 'collect' | 'dig' | 'return' | 'follow' | 'idle';

export class AntBrain {
  private readonly tree: BehaviorNode;
  private lastIntent: AntIntent = 'idle';

  constructor(private readonly role: BehaviorContext['role']) {
    const attack = new SequenceNode([
      new ConditionNode((ctx) => ['soldier', 'spy', 'acid_spitter', 'giant'].includes(ctx.role) && ctx.hasEnemy && ctx.hasPheromone('attack')),
      new ActionNode((ctx) => { ctx.setIntent('defend'); return 'success'; }),
    ]);
    const collect = new SequenceNode([
      new ConditionNode((ctx) => ctx.role === 'collector' && ctx.hasPheromone('collect')),
      new ActionNode((ctx) => { ctx.setIntent(ctx.carrying ? 'return' : 'collect'); return 'success'; }),
    ]);
    const dig = new SequenceNode([
      new ConditionNode((ctx) => ctx.role === 'worker' && ctx.hasPheromone('dig')),
      new ActionNode((ctx) => { ctx.setIntent('dig'); return 'success'; }),
    ]);
    const recover = new SequenceNode([
      new ConditionNode((ctx) => ctx.carrying),
      new ActionNode((ctx) => { ctx.setIntent('return'); return 'success'; }),
    ]);
    const patrol = new SequenceNode([
      new ConditionNode((ctx) => ctx.hasPath),
      new ActionNode((ctx) => { ctx.setIntent('follow'); return 'success'; }),
    ]);
    const idle = new ActionNode((ctx) => { ctx.setIntent('idle'); return 'success'; });
    this.tree = new SelectorNode([attack, collect, dig, recover, patrol, idle]);
  }

  think(input: Omit<BehaviorContext, 'role' | 'setIntent'>): AntIntent {
    let intent: AntIntent = 'idle';
    this.tree.tick({ ...input, role: this.role, setIntent: (next) => { intent = next as AntIntent; } });
    this.lastIntent = intent;
    return intent;
  }

  get currentIntent() { return this.lastIntent; }
}
