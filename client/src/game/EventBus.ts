export type GameEventMap = {
  'hud:state': GameHudState;
  'beta:hud': import('./beta/BetaData').BetaHudState;
  'command': { type: 'new-run' | 'open-mutation' | 'choose-mutation' | 'build-pantry' | 'save-meta' | 'toggle-layer' | 'spawn-elite'; cardId?: string };
  'mutation:opened': { cards: import('./beta/BetaData').BetaCard[] };
  'mutation:closed': { cardId: string };
  'run:ended': import('./beta/BetaData').RunSummary;
  'tactical:opened': { x: number; y: number };
  'tactical:closed': { action: string | null };
  'pheromone:placed': { action: string; x: number; y: number };
  'ai:telemetry': { status: string; focus: string; active: number };
};

export type GameHudState = {
  biomass: number;
  queenHp: number;
  queenMaxHp: number;
  workers: number;
  mode: 'active' | 'tactical';
  selectedAction: string | null;
  lastAction: string;
  timeScale: number;
};

type Handler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<keyof GameEventMap, Set<Handler<never>>>();

  on<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>) {
    const entries = this.listeners.get(event) ?? new Set<Handler<never>>();
    entries.add(handler as Handler<never>);
    this.listeners.set(event, entries);
    return () => entries.delete(handler as Handler<never>);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]) {
    this.listeners.get(event)?.forEach((handler) => handler(payload as never));
  }

  clear() {
    this.listeners.clear();
  }
}
