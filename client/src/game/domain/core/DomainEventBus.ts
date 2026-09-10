import type { Intent, Task, Vec2 } from './Contracts';

export type DomainEventMap = {
  GRID_CHANGED: { version: number; changed: Vec2[] };
  TASK_CREATED: { task: Task };
  TASK_RESERVED: { taskId: string; entityId: string };
  TASK_COMPLETED: { taskId: string; entityId: string };
  TASK_FAILED: { taskId: string; entityId: string; reason: string };
  PHEROMONE_CREATED: { id: string; type: string; position: Vec2; radius: number; ttlMs: number };
  PHEROMONE_EXPIRED: { id: string };
  THREAT_DETECTED: { sourceId: string; targetId: string; distance: number };
  ROUTE_READY: { entityId: string; route: Vec2[]; gridVersion: number };
  ROUTE_FAILED: { entityId: string; reason: string; gridVersion: number };
  ANT_STUCK: { entityId: string; position: Vec2 };
  QUEEN_THREATENED: { sourceId: string; distance: number };
  ENTITY_DIED: { entityId: string; killerId?: string };
  INTENT_ISSUED: { intent: Intent };
  RUN_STATUS_CHANGED: { status: string };
};

type Handler<T> = (payload: T) => void;

export class DomainEventBus {
  private listeners = new Map<keyof DomainEventMap, Set<Handler<never>>>();

  on<K extends keyof DomainEventMap>(event: K, handler: Handler<DomainEventMap[K]>): () => void {
    const handlers = this.listeners.get(event) ?? new Set<Handler<never>>();
    handlers.add(handler as Handler<never>);
    this.listeners.set(event, handlers);
    return () => handlers.delete(handler as Handler<never>);
  }

  emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K]): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload as never));
  }

  clear(): void { this.listeners.clear(); }
}
