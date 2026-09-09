import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const services = this.registry.get('fumigaServices');
    services.gameManager.setMode('preload');
    this.scene.start('PreloadScene');
  }
}
