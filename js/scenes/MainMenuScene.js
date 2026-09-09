import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#1b100b');
    this.add.text(480, 170, 'FUMIGA PROJECT', { fontFamily: 'monospace', fontSize: '34px', color: '#fff1c7' }).setOrigin(.5);
    this.add.text(480, 222, 'colony roguelite / vertical slice foundation', { fontFamily: 'monospace', fontSize: '14px', color: '#d8c99a' }).setOrigin(.5);
    const start = this.add.text(480, 330, '[ INICIAR RUN ]', { fontFamily: 'monospace', fontSize: '20px', color: '#120b08', backgroundColor: '#f0c765', padding: { x: 18, y: 12 } }).setOrigin(.5).setInteractive({ useHandCursor: true });
    start.on('pointerdown', () => {
      this.registry.get('fumigaServices').gameManager.startRun();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}
