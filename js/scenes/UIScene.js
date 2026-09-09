import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const services = this.registry.get('fumigaServices');
    this.eventBus = services.eventBus;
    this.gameManager = services.gameManager;
    const root = document.getElementById('ui-root');
    root.innerHTML = '';
    const hud = document.createElement('div');
    hud.className = 'foundation-hud';
    hud.innerHTML = `<div class="foundation-badge">FUMIGA / RUN 01</div><div class="foundation-status">BIOMASSA <strong>100</strong><br>RAINHA <strong>100/100</strong><br><button class="foundation-button" type="button">ESTADO DA RUN</button></div>`;
    root.appendChild(hud);
    hud.querySelector('button').addEventListener('click', () => {
      const state = this.gameManager.getSnapshot();
      hud.querySelector('.foundation-status').firstChild.textContent = `MODO ${state.mode.toUpperCase()} · `;
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownUi());
  }

  shutdownUi() {
    const root = document.getElementById('ui-root');
    if (root) root.innerHTML = '';
  }
}
