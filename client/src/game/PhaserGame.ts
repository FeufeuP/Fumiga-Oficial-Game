import Phaser from 'phaser';
import { EventBus } from './EventBus';
import { GAME } from './constants';
import { BetaGameScene } from './BetaGameScene';

export type GameHandle = {
  eventBus: EventBus;
  game: Phaser.Game;
  dispose: () => void;
};

export function createPhaserGame(parent: HTMLElement): GameHandle {
  const eventBus = new EventBus();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME.width,
    height: GAME.height,
    backgroundColor: `#${GAME.colors.void.toString(16).padStart(6, '0')}`,
    pixelArt: true,
    antialias: false,
    render: { roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new BetaGameScene(eventBus)],
  });

  let disposed = false;
  return {
    eventBus,
    game,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      eventBus.clear();
      game.destroy(true);
    },
  };
}
