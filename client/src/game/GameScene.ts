import Phaser from 'phaser';
import { EventBus, type GameHudState } from './EventBus';
import { GAME, RADIAL_ACTIONS, SPRITE_ASSETS, type RadialActionId } from './constants';

class WorkerAnt {
  sprite: Phaser.GameObjects.Container;
  private angle: number;
  private radius: number;
  private speed: number;
  private ant: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, index: number) {
    this.angle = index * (Math.PI * 2 / 6);
    this.radius = 105 + (index % 2) * 35;
    this.speed = 0.16 + index * 0.012;
    this.sprite = scene.add.container(640, 360);
    const shadow = scene.add.ellipse(3, 6, 24, 9, 0x080403, 0.45);
    this.ant = scene.add.sprite(0, -6, 'worker').setScale(1.45).play('worker-idle');
    this.sprite.add([shadow, this.ant]);
    this.sprite.setDepth(400 + index);
  }

  update(delta: number, target: Phaser.Math.Vector2 | null) {
    if (target) {
      const current = new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
      const direction = target.clone().subtract(current).normalize();
      const next = current.clone().add(direction.scale(Math.min(delta * 0.05, current.distance(target))));
      this.sprite.setPosition(next.x, next.y);
      this.sprite.setRotation(Math.atan2(target.y - next.y, target.x - next.x));
      this.ant.play('worker-carry', true);
      return;
    }
    this.angle += delta * 0.001 * this.speed;
    this.sprite.setPosition(640 + Math.cos(this.angle) * this.radius, 360 + Math.sin(this.angle) * this.radius * 0.58);
    this.sprite.setRotation(this.angle + Math.PI / 2);
    this.ant.play('worker-walk', true);
  }
}

export class GameScene extends Phaser.Scene {
  private readonly eventBus: EventBus;
  private workers: WorkerAnt[] = [];
  private biomassNodes: Phaser.GameObjects.Container[] = [];
  private pheromone: { action: RadialActionId; x: number; y: number } | null = null;
  private queen!: Phaser.GameObjects.Container;
  private radial!: Phaser.GameObjects.Container;
  private pressTimer?: Phaser.Time.TimerEvent;
  private pointerStart?: Phaser.Math.Vector2;
  private pointerPosition = new Phaser.Math.Vector2();
  private selectedAction: RadialActionId | null = null;
  private hudState: GameHudState;
  private gridGraphics!: Phaser.GameObjects.Graphics;

  constructor(eventBus: EventBus) {
    super('GameScene');
    this.eventBus = eventBus;
    this.hudState = { biomass: 184, queenHp: 100, queenMaxHp: 100, workers: 6, mode: 'active', selectedAction: null, lastAction: 'A colônia aguarda uma ordem.', timeScale: 1 };
  }

  preload() {
    this.load.spritesheet('queen', SPRITE_ASSETS.queen.url, { frameWidth: SPRITE_ASSETS.queen.frameWidth, frameHeight: SPRITE_ASSETS.queen.frameHeight });
    this.load.spritesheet('worker', SPRITE_ASSETS.worker.url, { frameWidth: SPRITE_ASSETS.worker.frameWidth, frameHeight: SPRITE_ASSETS.worker.frameHeight });
    this.load.spritesheet('biomass', SPRITE_ASSETS.biomass.url, { frameWidth: SPRITE_ASSETS.biomass.frameWidth, frameHeight: SPRITE_ASSETS.biomass.frameHeight });
  }

  create() {
    this.createAnimations();
    this.createBackdrop();
    this.createQueen();
    this.createWorkers();
    this.createBiomass();
    this.bindTacticalInput();
    this.emitHud();
  }

  update(_time: number, delta: number) {
    const target = this.pheromone ? new Phaser.Math.Vector2(this.pheromone.x, this.pheromone.y) : null;
    this.workers.forEach((worker) => worker.update(delta, target));
    if (this.radial && this.radial.active) this.updateRadialSelection(this.pointerPosition.x, this.pointerPosition.y);
  }

  private createAnimations() {
    this.anims.create({ key: 'queen-idle', frames: this.anims.generateFrameNumbers('queen', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'queen-hurt', frames: this.anims.generateFrameNumbers('queen', { start: 16, end: 23 }), frameRate: 9, repeat: 0 });
    this.anims.create({ key: 'worker-idle', frames: this.anims.generateFrameNumbers('worker', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'worker-walk', frames: this.anims.generateFrameNumbers('worker', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'worker-carry', frames: this.anims.generateFrameNumbers('worker', { start: 16, end: 23 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'biomass-idle', frames: this.anims.generateFrameNumbers('biomass', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'biomass-collected', frames: this.anims.generateFrameNumbers('biomass', { start: 8, end: 15 }), frameRate: 12, repeat: 0 });
  }

  private createBackdrop() {
    this.cameras.main.setBackgroundColor(GAME.colors.void);
    const bg = this.add.graphics();
    bg.fillStyle(GAME.colors.soil, 1);
    bg.fillRect(0, 0, GAME.width, GAME.height);
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, GAME.colors.edge, 0.18);
    for (let x = 0; x <= GAME.width; x += GAME.grid) this.gridGraphics.lineBetween(x, 72, x, GAME.height - 24);
    for (let y = 72; y <= GAME.height - 24; y += GAME.grid) this.gridGraphics.lineBetween(0, y, GAME.width, y);
    const chamber = this.add.graphics();
    chamber.fillStyle(GAME.colors.soilLight, 1);
    chamber.fillRoundedRect(330, 165, 620, 390, 40);
    chamber.lineStyle(4, GAME.colors.edge, 0.8);
    chamber.strokeRoundedRect(330, 165, 620, 390, 40);
    chamber.lineStyle(2, GAME.colors.amber, 0.18);
    chamber.strokeRoundedRect(350, 185, 580, 350, 32);
    this.add.text(44, 90, 'NINHO 01  /  CÂMARA DE ORIGEM', { fontFamily: 'FumigaHUD', fontSize: '14px', color: '#d8c99a' });
    this.add.text(44, 114, 'observação da colônia · bioma subterrâneo', { fontFamily: 'FumigaHUD', fontSize: '11px', color: '#8f7c61' });
  }

  private createQueen() {
    this.queen = this.add.container(640, 360).setDepth(500);
    const shadow = this.add.ellipse(4, 15, 170, 44, 0x080403, 0.48);
    const queenSprite = this.add.sprite(0, -8, 'queen').setScale(2.55).play('queen-idle');
    const crown = this.add.triangle(-73, -75, -17, 0, 0, 34, -34, 34, GAME.colors.amberLight);
    this.queen.add([shadow, queenSprite, crown]);
    this.add.text(640, 430, 'RAINHA', { fontFamily: 'FumigaHUD', fontSize: '13px', color: '#f0c765' }).setOrigin(.5).setDepth(600);
  }

  private createWorkers() {
    this.workers = Array.from({ length: 6 }, (_, index) => new WorkerAnt(this, index));
  }

  private createBiomass() {
    const positions = [[430, 245], [825, 255], [900, 445], [390, 460]];
    positions.forEach(([x, y], index) => {
      const node = this.add.container(x, y).setDepth(250);
      const shadow = this.add.ellipse(0, 10, 58, 18, 0x080403, 0.45);
      const cluster = this.add.sprite(0, -4, 'biomass').setScale(1.65).play('biomass-idle');
      node.add([shadow, cluster]);
      node.setScale(index % 2 ? 0.8 : 1);
      this.biomassNodes.push(node);
    });
  }

  private bindTacticalInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
      this.pointerPosition.set(pointer.x, pointer.y);
      this.pressTimer?.remove(false);
      this.pressTimer = this.time.delayedCall(GAME.longPressMs, () => this.openTacticalPause(pointer.x, pointer.y));
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.pointerPosition.set(pointer.x, pointer.y);
      if (this.pointerStart && Phaser.Math.Distance.Between(pointer.x, pointer.y, this.pointerStart.x, this.pointerStart.y) > GAME.longPressTolerance) {
        this.pressTimer?.remove(false);
        this.pressTimer = undefined;
      }
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.pressTimer?.remove(false);
      this.pressTimer = undefined;
      if (this.radial?.active) this.closeTacticalPause(pointer.x, pointer.y);
      this.pointerStart = undefined;
    });
  }

  private openTacticalPause(x: number, y: number) {
    if (this.radial?.active) return;
    this.time.timeScale = GAME.tacticalScale;
    this.hudState = { ...this.hudState, mode: 'tactical', timeScale: GAME.tacticalScale, selectedAction: null, lastAction: 'Pausa tática: arraste para escolher uma ordem.' };
    this.createRadial(x, y);
    this.eventBus.emit('tactical:opened', { x, y });
    this.emitHud();
  }

  private createRadial(x: number, y: number) {
    this.radial = this.add.container(x, y).setDepth(1200);
    const plate = this.add.circle(0, 0, 76, 0x120b08, 0.96).setStrokeStyle(3, GAME.colors.amber, 0.85);
    const ring = this.add.circle(0, 0, 48, GAME.colors.soilLight, 1).setStrokeStyle(2, GAME.colors.edge, 1);
    this.radial.add([plate, ring]);
    RADIAL_ACTIONS.forEach((action, index) => {
      const angle = -Math.PI / 2 + index * (Math.PI * 2 / 3);
      const label = this.add.text(Math.cos(angle) * 105, Math.sin(angle) * 105, action.shortLabel, { fontFamily: 'FumigaHUD', fontSize: '13px', color: '#fff1c7', backgroundColor: '#2a180f', padding: { x: 8, y: 6 } }).setOrigin(.5);
      const ray = this.add.line(0, 0, 0, 0, Math.cos(angle) * 42, Math.sin(angle) * 42, action.color, 0.7).setLineWidth(4);
      this.radial.add([ray, label]);
    });
    this.add.text(x, y - 112, 'PAUSA TÁTICA', { fontFamily: 'FumigaHUD', fontSize: '12px', color: '#f0c765', backgroundColor: '#120b08', padding: { x: 7, y: 5 } }).setOrigin(.5).setDepth(1210);
  }

  private updateRadialSelection(pointerX: number, pointerY: number) {
    const angle = Phaser.Math.Angle.Normalize(Phaser.Math.Angle.Between(this.radial.x, this.radial.y, pointerX, pointerY) + Math.PI / 2);
    const index = Math.floor((angle + Math.PI / 6) / (Math.PI * 2 / 3)) % 3;
    const action = RADIAL_ACTIONS[(index + 3) % 3];
    this.selectedAction = action.id;
    this.hudState = { ...this.hudState, selectedAction: action.label };
    this.emitHud();
  }

  private closeTacticalPause(x: number, y: number) {
    const action = this.selectedAction;
    this.time.timeScale = 1;
    this.radial.destroy(true);
    this.radial = undefined as unknown as Phaser.GameObjects.Container;
    this.pheromone = action ? { action, x, y } : null;
    this.hudState = { ...this.hudState, mode: 'active', timeScale: 1, selectedAction: null, lastAction: action ? `Feromônio ${action.toUpperCase()} aplicado à colônia.` : 'Ordem cancelada.' };
    if (action) {
      this.drawPheromone(x, y, action);
      this.eventBus.emit('pheromone:placed', { action, x, y });
    }
    this.eventBus.emit('tactical:closed', { action });
    this.emitHud();
  }

  private drawPheromone(x: number, y: number, action: RadialActionId) {
    const config = RADIAL_ACTIONS.find((item) => item.id === action)!;
    const marker = this.add.container(x, y).setDepth(180);
    marker.add(this.add.circle(0, 0, 36, config.color, 0.16).setStrokeStyle(2, config.color, 0.82));
    marker.add(this.add.circle(0, 0, 7, config.color, 0.9));
    marker.add(this.add.text(0, 50, `FEROMÔNIO ${config.label}`, { fontFamily: 'FumigaHUD', fontSize: '10px', color: '#fff1c7', backgroundColor: '#120b08', padding: { x: 5, y: 3 } }).setOrigin(.5));
    this.tweens.add({ targets: marker, scale: 1.15, alpha: 0.65, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private emitHud() {
    this.eventBus.emit('hud:state', this.hudState);
  }
}
