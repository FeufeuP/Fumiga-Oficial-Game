import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#120b08');
    this.add.text(480, 235, 'FUMIGA', { fontFamily: 'monospace', fontSize: '42px', color: '#f0c765' }).setOrigin(.5);
    this.add.text(480, 285, 'fundação técnica / stage 0', { fontFamily: 'monospace', fontSize: '14px', color: '#d8c99a' }).setOrigin(.5);
    this.time.delayedCall(250, () => this.scene.start('MainMenuScene'));
  }
}
