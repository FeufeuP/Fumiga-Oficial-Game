import Phaser from 'phaser';
import './styles-loader.js';
import { EventBus } from './core/EventBus.js';
import { GameManager } from './core/GameManager.js';
import { GAME_CONFIG } from './core/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

const eventBus = new EventBus();
const gameManager = new GameManager({ eventBus });
const services = { eventBus, gameManager };

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_CONFIG.logicalWidth,
  height: GAME_CONFIG.logicalHeight,
  backgroundColor: GAME_CONFIG.backgroundColor,
  pixelArt: GAME_CONFIG.pixelArt,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: { roundPixels: true },
  callbacks: {
    preBoot: gameInstance => gameInstance.registry.set('fumigaServices', services)
  },
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
window.fumiga = { game, services };
