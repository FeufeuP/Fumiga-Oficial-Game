import { RUN_DEFAULTS } from './constants.js';

export class GameManager {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
    this.state = this.createInitialState();
  }

  createInitialState() {
    return {
      mode: 'boot',
      run: { ...RUN_DEFAULTS },
      foundation: { stage: 'stage-0-foundation', ready: false }
    };
  }

  setMode(mode) {
    this.state = { ...this.state, mode };
    this.eventBus.emit('RUN_MODE_CHANGED', { mode });
  }

  startRun() {
    this.state = { ...this.createInitialState(), mode: 'game', foundation: { stage: 'stage-0-foundation', ready: true } };
    this.eventBus.emit('RUN_STARTED', { run: this.getSnapshot().run });
  }

  getSnapshot() {
    return structuredClone(this.state);
  }
}
