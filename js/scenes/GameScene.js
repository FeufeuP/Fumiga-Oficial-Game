import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const services = this.registry.get('fumigaServices');
    services.gameManager.setMode('game');
    this.cameras.main.setBackgroundColor('#0f0a07');
    this.drawFoundationMap();
    this.createQueenPlaceholder();
    this.add.text(24, 500, 'STAGE 0  |  grid + cenas + estado', { fontFamily: 'monospace', fontSize: '12px', color: '#8f7c61' });
  }

  drawFoundationMap() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x24150e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.logicalWidth, GAME_CONFIG.logicalHeight);
    graphics.lineStyle(1, 0x5c3823, 0.55);
    for (let x = 0; x <= GAME_CONFIG.logicalWidth; x += GAME_CONFIG.gridCellSize) graphics.lineBetween(x, 80, x, GAME_CONFIG.logicalHeight - 30);
    for (let y = 80; y <= GAME_CONFIG.logicalHeight - 30; y += GAME_CONFIG.gridCellSize) graphics.lineBetween(0, y, GAME_CONFIG.logicalWidth, y);
    graphics.fillStyle(0x3a2115, 1);
    graphics.fillRoundedRect(320, 192, 320, 160, 8);
    graphics.lineStyle(3, 0xc78635, 1);
    graphics.strokeRoundedRect(320, 192, 320, 160, 8);
    this.add.text(480, 370, 'CÂMARA INICIAL', { fontFamily: 'monospace', fontSize: '14px', color: '#d8c99a' }).setOrigin(.5);
  }

  createQueenPlaceholder() {
    const queen = this.add.container(480, 272);
    const body = this.add.circle(0, 0, 28, 0xc78635);
    const head = this.add.circle(-22, -4, 14, 0xf0c765);
    const eye = this.add.rectangle(-27, -8, 3, 3, 0x120b08);
    queen.add([body, head, eye]);
    this.add.text(480, 315, 'RAINHA / placeholder', { fontFamily: 'monospace', fontSize: '11px', color: '#f0c765' }).setOrigin(.5);
  }
}
