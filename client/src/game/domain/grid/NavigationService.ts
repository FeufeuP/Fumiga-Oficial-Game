import type { Vec2 } from '../core/Contracts';
import { DomainEventBus } from '../core/DomainEventBus';
import { GridMap } from './GridMap';

export class NavigationService {
  constructor(private readonly grid: GridMap, private readonly events: DomainEventBus) {}

  findPath(entityId: string, start: Vec2, goal: Vec2): Vec2[] | null {
    const startKey = `${start.x},${start.y}`;
    const goalKey = `${goal.x},${goal.y}`;
    const open = new Set([startKey]);
    const cameFrom = new Map<string, string>();
    const g = new Map([[startKey, 0]]);
    const f = new Map([[startKey, this.heuristic(start, goal)]]);
    const parse = (key: string): Vec2 => { const [x, y] = key.split(',').map(Number); return { x, y }; };
    const neighbors = (tile: Vec2): Vec2[] => [{ x: tile.x + 1, y: tile.y }, { x: tile.x - 1, y: tile.y }, { x: tile.x, y: tile.y + 1 }, { x: tile.x, y: tile.y - 1 }].filter((p) => this.grid.isWalkable(p.x, p.y));

    while (open.size) {
      const currentKey = Array.from(open).sort((a, b) => (f.get(a) ?? Infinity) - (f.get(b) ?? Infinity))[0];
      const current = parse(currentKey);
      if (currentKey === goalKey) {
        const route: Vec2[] = [current];
        let cursor = currentKey;
        while (cameFrom.has(cursor)) { cursor = cameFrom.get(cursor)!; route.unshift(parse(cursor)); }
        this.events.emit('ROUTE_READY', { entityId, route, gridVersion: this.grid.version });
        return route;
      }
      open.delete(currentKey);
      for (const next of neighbors(current)) {
        const nextKey = `${next.x},${next.y}`;
        const candidate = (g.get(currentKey) ?? Infinity) + 1;
        if (candidate < (g.get(nextKey) ?? Infinity)) {
          cameFrom.set(nextKey, currentKey);
          g.set(nextKey, candidate);
          f.set(nextKey, candidate + this.heuristic(next, goal));
          open.add(nextKey);
        }
      }
    }
    this.events.emit('ROUTE_FAILED', { entityId, reason: 'no_path', gridVersion: this.grid.version });
    return null;
  }

  private heuristic(a: Vec2, b: Vec2): number { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
}
