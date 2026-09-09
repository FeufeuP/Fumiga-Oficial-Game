export class EventBus {
  #listeners = new Map();

  on(eventName, handler, owner = null) {
    if (typeof handler !== 'function') throw new TypeError(`Listener inválido: ${eventName}`);
    if (!this.#listeners.has(eventName)) this.#listeners.set(eventName, new Set());
    const entry = { handler, owner, once: false };
    this.#listeners.get(eventName).add(entry);
    return () => this.#listeners.get(eventName)?.delete(entry);
  }

  once(eventName, handler, owner = null) {
    if (typeof handler !== 'function') throw new TypeError(`Listener inválido: ${eventName}`);
    if (!this.#listeners.has(eventName)) this.#listeners.set(eventName, new Set());
    const entry = { handler, owner, once: true };
    this.#listeners.get(eventName).add(entry);
    return () => this.#listeners.get(eventName)?.delete(entry);
  }

  emit(eventName, payload = {}) {
    const entries = [...(this.#listeners.get(eventName) ?? [])];
    for (const entry of entries) {
      if (!this.#listeners.get(eventName)?.has(entry)) continue;
      entry.handler(payload, eventName);
      if (entry.once) this.#listeners.get(eventName)?.delete(entry);
    }
  }

  clearOwner(owner) {
    for (const entries of this.#listeners.values()) {
      for (const entry of entries) if (entry.owner === owner) entries.delete(entry);
    }
  }

  clearAll() { this.#listeners.clear(); }
}
