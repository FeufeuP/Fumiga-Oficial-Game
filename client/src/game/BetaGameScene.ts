import Phaser from 'phaser';
import { EventBus } from './EventBus';
import { GAME, RADIAL_ACTIONS, SPRITE_ASSETS, type RadialActionId } from './constants';
import { AStarGrid, type TileState } from './beta/AStarGrid';
import { BETA_CARDS, DEFAULT_META, ELITE_ANT_PROFILES, META_TREE, type AntRole, type BetaCard, type BetaHudState, type EliteAntKind, type MetaProgression, type RunSnapshot, type RunSummary } from './beta/BetaData';
import { SaveManager } from './beta/SaveManager';
import { AntBrain, type AntIntent } from './beta/AntBrain';
import { ENEMY_PROFILES, EnemyBrain, type DamageType, type EnemyIntent, type EnemyKind } from './beta/EnemyBrain';
import { WaveDirector } from './beta/WaveDirector';

type BetaAnt = { id: string; role: AntRole; eliteKind?: EliteAntKind; brain: AntBrain; intent: AntIntent; sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse; badge?: Phaser.GameObjects.Text; tileX: number; tileY: number; path: { x: number; y: number }[]; pathIndex: number; target?: { x: number; y: number }; carrying: boolean; hp: number; lastAbility: number };
type BetaEnemy = { id: string; kind: EnemyKind; elite: boolean; boss: boolean; ability: string; brain: EnemyBrain; intent: EnemyIntent; sprite: Phaser.GameObjects.Container; tileX: number; tileY: number; hp: number; maxHp: number; path: { x: number; y: number }[]; pathIndex: number; lastDecision: number; lastAttack: number; lastSpecial: number; patrolIndex: number };

export class BetaGameScene extends Phaser.Scene {
  private readonly eventBus: EventBus;
  private readonly saveManager = new SaveManager();
  private grid!: AStarGrid;
  private ants: BetaAnt[] = [];
  private queen!: Phaser.GameObjects.Sprite;
  private queenShadow!: Phaser.GameObjects.Ellipse;
  private enemies: BetaEnemy[] = [];
  private pheromone?: { type: RadialActionId; x: number; y: number; marker: Phaser.GameObjects.Container };
  private graphics!: Phaser.GameObjects.Graphics;
  private roomLayer!: Phaser.GameObjects.Graphics;
  private selectedAction: RadialActionId | null = null;
  private radial?: Phaser.GameObjects.Container;
  private pressTimer?: Phaser.Time.TimerEvent;
  private pointerStart?: Phaser.Math.Vector2;
  private pointerPosition = new Phaser.Math.Vector2();
  private hud: BetaHudState;
  private meta: MetaProgression = structuredClone(DEFAULT_META);
  private run: RunSnapshot;
  private mutationCards: BetaCard[] = [];
  private runClock = 0;
  private mutationDiscoveryTriggered = false;
  private runCounter = 1;
  private taskText = 'A colônia aguarda uma ordem.';
  private draggingCamera = false;
  private lastPointer = new Phaser.Math.Vector2();
  private activeLayer: 'surface' | 'underground' = 'surface';
  private surfaceObjects: Phaser.GameObjects.GameObject[] = [];
  private undergroundUiObjects: Phaser.GameObjects.GameObject[] = [];
  private surfaceGraphics!: Phaser.GameObjects.Graphics;
  private lastAiThink = 0;
  private aiFocus: AntIntent = 'idle';
  private queenPoisonUntil = 0;
  private queenPoisonTick = 0;
  private colonySlowUntil = 0;
  private readonly waveDirector = new WaveDirector();
  private enemiesDefeated = 0;
  private elitesDefeated = 0;
  private bossDefeated = 0;
  private damageDealt = 0;
  private damageTaken = 0;
  private biomassReward = 0;
  private royalJellyReward = 0;

  constructor(eventBus: EventBus) {
    super('BetaGameScene');
    this.eventBus = eventBus;
    this.hud = { layer: 'surface', layerLabel: 'SUPERFÍCIE · BOSQUE ÚMIDO', surfaceResources: 6, surfaceThreats: 4, biomass: 100, biomassCapacity: 220, specialBiomass: 1, royalJelly: 0, queenHp: 100, queenMaxHp: 100, workers: 4, collectors: 2, soldiers: 2, enemies: 4, rooms: 1, excavated: 0, mode: 'active', selectedAction: null, lastAction: this.taskText, timeScale: 1, runTime: 0, seed: 731204, wave: 1, nextWaveIn: 16 };
    this.run = { runId: 'beta-run-01', seed: this.hud.seed, status: 'active', biomass: 100, biomassCapacity: 220, specialBiomass: 1, queenHp: 100, acquiredCards: ['sharp_mandibles'], rooms: ['central_chamber'], excavated: 0, royalJellyEarned: 0, startedAt: Date.now() };
  }

  preload() {
    this.load.spritesheet('queen', SPRITE_ASSETS.queen.url, { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('worker', SPRITE_ASSETS.worker.url, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('biomass', SPRITE_ASSETS.biomass.url, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('elite-spy', SPRITE_ASSETS.eliteSpy.url, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('elite-acid-spitter', SPRITE_ASSETS.eliteAcidSpitter.url, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('elite-giant', SPRITE_ASSETS.eliteGiant.url, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('elite-healer', SPRITE_ASSETS.eliteHealer.url, { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.ensureSpriteTextures();
    this.createAnimations();
    this.createWorld();
    this.bindInput();
    this.eventBus.on('command', (command) => this.handleCommand(command));
    this.saveManager.loadMeta().then((meta) => { this.meta = meta; this.startNewRun(); this.emitHud(); });
    this.emitHud();
  }

  update(_time: number, delta: number) {
    if (this.hud.mode === 'gameover' || this.hud.mode === 'mutation') return;
    this.runClock += delta / 1000;
    this.hud.runTime = this.runClock;
    this.updateWaves();
    this.hud.nextWaveIn = Math.max(0, Math.ceil(this.waveDirector.nextAt - this.runClock));
    if (this.queenPoisonUntil > this.runClock && this.runClock - this.queenPoisonTick > 1) {
      this.queenPoisonTick = this.runClock;
      this.damageQueen(3, 'venom', 'VENENO');
    }
    if (this.runClock - this.lastAiThink > 0.45) { this.lastAiThink = this.runClock; this.thinkAnts(); }
    this.ants.forEach((ant) => this.updateAnt(ant, delta));
    this.enemies.forEach((enemy) => this.updateEnemy(enemy, delta));
    if (this.runClock > 9 && this.hud.specialBiomass < 3 && !this.mutationDiscoveryTriggered) {
      this.mutationDiscoveryTriggered = true;
      this.hud.specialBiomass = 3;
      this.run.specialBiomass = 3;
      this.taskText = 'Biomassa Especial descoberta — escolha uma mutação.';
      this.openMutationChoice();
    }
    this.emitHud();
  }

  /**
   * Garante que toda spritesheet usada pela cena exista antes de criar animações.
   * Quando o PNG real não está disponível (preview sem o storage externo, build de
   * APK, CDN fora), gera uma textura procedural com a MESMA grade de frames
   * (8 colunas × 3 linhas: idle 0-7, walk 8-15, carry/ability 16-23), então a
   * colônia continua visível e animada — sem placeholders magenta nem crashes.
   */
  private ensureSpriteTextures() {
    const specs: Array<{ key: string; frameWidth: number; frameHeight: number; color: number; kind: 'queen' | 'ant' | 'biomass' }> = [
      { key: 'queen', frameWidth: SPRITE_ASSETS.queen.frameWidth, frameHeight: SPRITE_ASSETS.queen.frameHeight, color: 0xffcf4a, kind: 'queen' },
      { key: 'worker', frameWidth: SPRITE_ASSETS.worker.frameWidth, frameHeight: SPRITE_ASSETS.worker.frameHeight, color: 0x55ff00, kind: 'ant' },
      { key: 'biomass', frameWidth: SPRITE_ASSETS.biomass.frameWidth, frameHeight: SPRITE_ASSETS.biomass.frameHeight, color: 0x8dff5a, kind: 'biomass' },
      { key: 'elite-spy', frameWidth: SPRITE_ASSETS.eliteSpy.frameWidth, frameHeight: SPRITE_ASSETS.eliteSpy.frameHeight, color: ELITE_ANT_PROFILES.spy.color, kind: 'ant' },
      { key: 'elite-acid-spitter', frameWidth: SPRITE_ASSETS.eliteAcidSpitter.frameWidth, frameHeight: SPRITE_ASSETS.eliteAcidSpitter.frameHeight, color: ELITE_ANT_PROFILES.acid_spitter.color, kind: 'ant' },
      { key: 'elite-giant', frameWidth: SPRITE_ASSETS.eliteGiant.frameWidth, frameHeight: SPRITE_ASSETS.eliteGiant.frameHeight, color: ELITE_ANT_PROFILES.giant.color, kind: 'ant' },
      { key: 'elite-healer', frameWidth: SPRITE_ASSETS.eliteHealer.frameWidth, frameHeight: SPRITE_ASSETS.eliteHealer.frameHeight, color: ELITE_ANT_PROFILES.healer.color, kind: 'ant' },
    ];
    for (const spec of specs) {
      if (this.textures.exists(spec.key)) continue;
      this.makeFallbackSheet(spec.key, spec.frameWidth, spec.frameHeight, spec.color, spec.kind);
    }
  }

  private makeFallbackSheet(key: string, frameWidth: number, frameHeight: number, color: number, kind: 'queen' | 'ant' | 'biomass') {
    const cols = 8;
    const rows = 3;
    const canvas = this.textures.createCanvas(key, frameWidth * cols, frameHeight * rows);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const css = `#${color.toString(16).padStart(6, '0')}`;
    for (let frame = 0; frame < cols * rows; frame += 1) {
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      this.drawFallbackFrame(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, css, kind, row, col);
    }
    for (let frame = 0; frame < cols * rows; frame += 1) {
      canvas.add(frame.toString(), 0, (frame % cols) * frameWidth, Math.floor(frame / cols) * frameHeight, frameWidth, frameHeight);
    }
    canvas.refresh();
  }

  private drawFallbackFrame(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, css: string, kind: 'queen' | 'ant' | 'biomass', row: number, col: number) {
    const cx = ox + w / 2;
    const cy = oy + h / 2;
    const bob = row === 0 ? Math.round(Math.sin((col / 8) * Math.PI * 2) * 2) : 0;
    const leg = row === 1 ? (col % 2 === 0 ? 2 : -2) : 0;
    ctx.save();
    if (kind === 'biomass') {
      const radius = Math.max(3, (w / 2 - 5) * (0.8 + 0.2 * Math.abs(Math.sin(col + 1))));
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = css;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#eaffd0';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
      ctx.restore();
      return;
    }
    const scale = kind === 'queen' ? 1.6 : 1;
    const seg = Math.max(3, Math.round(3 * scale));
    ctx.fillStyle = css;
    ctx.strokeStyle = css;
    ctx.lineWidth = Math.max(1, Math.round(scale));
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - seg, cy + i * 4 * scale + bob);
      ctx.lineTo(cx - seg - 4 * scale, cy + i * 4 * scale + leg + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + seg, cy + i * 4 * scale + bob);
      ctx.lineTo(cx + seg + 4 * scale, cy + i * 4 * scale - leg + bob);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6 * scale + bob, seg + 2, seg + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, seg, seg, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6 * scale + bob, seg, seg - 1, 0, 0, Math.PI * 2);
    ctx.fill();
    if (kind === 'queen') {
      ctx.fillStyle = '#ff5b4d';
      ctx.fillRect(cx - 4, cy - 6 * scale - seg - 3 + bob, 8, 3);
    }
    if (row === 2) {
      ctx.fillStyle = '#ffb800';
      ctx.beginPath();
      ctx.arc(cx, cy - 8 * scale + bob, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private createAnimations() {
    this.anims.create({ key: 'beta-queen-idle', frames: this.anims.generateFrameNumbers('queen', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'beta-worker-idle', frames: this.anims.generateFrameNumbers('worker', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'beta-worker-walk', frames: this.anims.generateFrameNumbers('worker', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'beta-worker-carry', frames: this.anims.generateFrameNumbers('worker', { start: 16, end: 23 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'beta-biomass-idle', frames: this.anims.generateFrameNumbers('biomass', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
    (['spy', 'acid-spitter', 'giant', 'healer'] as const).forEach((kind) => {
      const key = `elite-${kind}`;
      this.anims.create({ key: `${key}-idle`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
      this.anims.create({ key: `${key}-walk`, frames: this.anims.generateFrameNumbers(key, { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: `${key}-ability`, frames: this.anims.generateFrameNumbers(key, { start: 16, end: 23 }), frameRate: 12, repeat: 0 });
    });
  }

  private createWorld() {
    this.cameras.main.setBackgroundColor(GAME.colors.void);
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(GAME.colors.soil, 1).fillRect(0, 0, GAME.width, GAME.height);
    this.graphics = this.add.graphics().setDepth(5);
    this.roomLayer = this.add.graphics().setDepth(7);
    const undergroundTitle = this.add.text(36, 86, 'BETA / BOSQUE ÚMIDO · NINHO 01', { fontFamily: 'FumigaHUD', fontSize: '14px', color: '#d8c99a' }).setDepth(20);
    const undergroundSubtitle = this.add.text(36, 108, 'grid vivo · ordens indiretas · simulação de colônia', { fontFamily: 'FumigaHUD', fontSize: '11px', color: '#8f7c61' }).setDepth(20);
    this.undergroundUiObjects.push(undergroundTitle, undergroundSubtitle);
    this.grid = new AStarGrid(20, 12, 40, 240, 128, () => { this.redrawGrid(); });
    this.grid.seedChamber();
    this.drawStaticCave();
    this.createSurfaceWorld();
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, 0.8, 1.25)));
  }

  private createSurfaceWorld() {
    this.surfaceGraphics = this.add.graphics().setDepth(2);
    this.surfaceGraphics.fillStyle(0x56c7d9, 1).fillRect(0, 0, GAME.width, GAME.height);
    this.surfaceGraphics.fillStyle(0x8bdc73, 1).fillRect(110, 122, 1060, 430);
    this.surfaceGraphics.fillStyle(0x58b957, 1).fillEllipse(670, 355, 980, 360);
    this.surfaceGraphics.fillStyle(0x2f8e65, 1).fillEllipse(670, 355, 780, 290);
    this.surfaceGraphics.lineStyle(12, 0xd79b58, 0.9).strokeLineShape(new Phaser.Geom.Line(160, 475, 1080, 205));
    this.surfaceGraphics.lineStyle(5, 0xffcf4a, 0.7).strokeLineShape(new Phaser.Geom.Line(160, 475, 1080, 205));
    this.surfaceGraphics.fillStyle(0x2a6d61, 0.75).fillEllipse(640, 370, 160, 70);
    this.surfaceGraphics.fillStyle(0xdf1962, 1).fillEllipse(640, 360, 100, 35);
    this.surfaceGraphics.lineStyle(3, GAME.colors.amber, 0.8).strokeEllipse(640, 360, 100, 35);
    const title = this.add.text(36, 86, 'BETA / BOSQUE ÚMIDO · SUPERFÍCIE', { fontFamily: 'FumigaHUD', fontSize: '14px', color: '#d8e3b1' }).setDepth(1020);
    const subtitle = this.add.text(36, 108, 'recursos, trilhas, predadores e entrada para o ninho', { fontFamily: 'FumigaHUD', fontSize: '11px', color: '#91a779' }).setDepth(1020);
    this.surfaceObjects.push(title, subtitle);
    const treePoints = [[190, 210], [330, 180], [480, 235], [830, 195], [1010, 270], [260, 430], [900, 440], [1080, 370]];
    treePoints.forEach(([x, y], index) => {
      const tree = this.add.container(x, y).setDepth(130 + index);
      tree.add(this.add.ellipse(0, 18, 45, 13, 0x2a6d61, .35));
      tree.add(this.add.rectangle(0, 3, 10, 28, 0xc27745));
      tree.add(this.add.circle(-12, -10, 20, index % 2 ? 0x7ed957 : 0x9be15d));
      tree.add(this.add.circle(12, -6, 18, index % 2 ? 0xa5e85e : 0x64c95a));
      this.surfaceObjects.push(tree);
    });
    [[295, 310], [470, 395], [810, 300], [930, 350], [540, 225], [730, 470]].forEach(([x, y], index) => {
      const node = this.add.sprite(x, y, 'biomass').setScale(index % 2 ? 1.0 : 1.25).setDepth(220 + index).play('beta-biomass-idle');
      node.setTint(index % 2 ? 0x9acb63 : 0xb9da76);
      this.surfaceObjects.push(node);
    });
    [[390, 350], [880, 255]].forEach(([x, y], index) => {
      const threat = this.add.container(x, y).setDepth(240 + index);
      threat.add(this.add.ellipse(0, 12, 50, 10, 0x2a6d61, .35));
      for (let segment = 0; segment < 4; segment += 1) threat.add(this.add.circle(-18 + segment * 12, 0, 8, segment % 2 ? 0xf04472 : 0xdf1962));
      threat.add(this.add.text(0, -25, 'PREDADOR', { fontFamily: 'FumigaHUD', fontSize: '8px', color: '#f0b29d', backgroundColor: '#152017', padding: { x: 3, y: 2 } }).setOrigin(.5));
      this.surfaceObjects.push(threat);
    });
    const entranceLabel = this.add.text(640, 410, 'ENTRADA DO FORMIGUEIRO', { fontFamily: 'FumigaHUD', fontSize: '10px', color: '#f0c765', backgroundColor: '#132017', padding: { x: 5, y: 4 } }).setOrigin(.5).setDepth(1020);
    this.surfaceObjects.push(entranceLabel);
  }

  private setLayer(layer: 'surface' | 'underground') {
    this.activeLayer = layer;
    this.surfaceObjects.forEach((object) => (object as unknown as Phaser.GameObjects.Components.Visible).setVisible(layer === 'surface'));
    this.undergroundUiObjects.forEach((object) => (object as unknown as Phaser.GameObjects.Components.Visible).setVisible(layer === 'underground'));
    this.surfaceGraphics.setVisible(layer === 'surface');
    this.children.list.forEach((object) => {
      if (this.surfaceObjects.includes(object) || object === this.surfaceGraphics) return;
      if (object === this.graphics || object === this.roomLayer) { (object as unknown as Phaser.GameObjects.Components.Visible).setVisible(layer === 'underground'); return; }
      const depth = (object as Phaser.GameObjects.GameObject & { depth?: number }).depth ?? 0;
      if (depth >= 100 && depth < 1000) (object as unknown as Phaser.GameObjects.Components.Visible).setVisible(layer === 'underground');
    });
    this.hud = { ...this.hud, layer, layerLabel: layer === 'surface' ? 'SUPERFÍCIE · BOSQUE ÚMIDO' : 'SUBTERRÂNEO · CÂMARA CENTRAL', lastAction: layer === 'surface' ? 'A colônia busca recursos na superfície.' : 'A Rainha aguarda na Câmara Central.' };
    this.emitHud();
  }

  private drawStaticCave() {
    this.graphics.clear();
    this.graphics.lineStyle(1, GAME.colors.edge, 0.22);
    for (let x = 0; x <= this.grid.width; x += 1) this.graphics.lineBetween(this.grid.originX + x * this.grid.cellSize, this.grid.originY, this.grid.originX + x * this.grid.cellSize, this.grid.originY + this.grid.height * this.grid.cellSize);
    for (let y = 0; y <= this.grid.height; y += 1) this.graphics.lineBetween(this.grid.originX, this.grid.originY + y * this.grid.cellSize, this.grid.originX + this.grid.width * this.grid.cellSize, this.grid.originY + y * this.grid.cellSize);
    this.redrawGrid();
  }

  private redrawGrid() {
    if (!this.grid || !this.graphics) return;
    this.graphics.fillStyle(GAME.colors.void, 0.24).fillRect(this.grid.originX, this.grid.originY, this.grid.width * this.grid.cellSize, this.grid.height * this.grid.cellSize);
    for (let y = 0; y < this.grid.height; y += 1) for (let x = 0; x < this.grid.width; x += 1) {
      const tile = this.grid.get(x, y);
      const px = this.grid.originX + x * this.grid.cellSize;
      const py = this.grid.originY + y * this.grid.cellSize;
      if (tile === 0) this.graphics.fillStyle(GAME.colors.soilLight, 0.84).fillRect(px + 2, py + 2, 36, 36);
      if (tile === 1) this.graphics.fillStyle(0x3c281c, 0.7).fillRect(px + 2, py + 2, 36, 36);
      if (tile === 2) { this.graphics.fillStyle(0x593a25, 0.85).fillRoundedRect(px + 2, py + 2, 36, 36, 5); this.graphics.lineStyle(2, GAME.colors.amber, 0.5).strokeRoundedRect(px + 4, py + 4, 32, 32, 4); }
      if (tile === 3) this.graphics.fillStyle(0x100b09, 1).fillRect(px + 2, py + 2, 36, 36);
    }
  }

  private startNewRun() {
    this.runClock = 0;
    this.waveDirector.reset();
    this.queenPoisonUntil = 0;
    this.queenPoisonTick = 0;
    this.colonySlowUntil = 0;
    this.enemiesDefeated = 0;
    this.elitesDefeated = 0;
    this.bossDefeated = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.biomassReward = 0;
    this.royalJellyReward = 0;
    this.mutationDiscoveryTriggered = false;
    this.runCounter += 1;
    this.taskText = 'A Operária recebeu a tarefa: ampliar o ninho.';
    this.ants.forEach((ant) => { ant.sprite.destroy(); ant.shadow.destroy(); ant.badge?.destroy(); });
    this.ants = [];
    this.enemies.forEach((enemy) => enemy.sprite.destroy());
    this.enemies = [];
    this.pheromone?.marker.destroy();
    this.pheromone = undefined;
    this.grid = new AStarGrid(20, 12, 40, 240, 128, (change) => { this.redrawGrid(); if (change.next === 1) { this.hud.excavated += 1; this.run.excavated = this.hud.excavated; } });
    this.grid.seedChamber();
    this.drawStaticCave();
    const queenMaxHp = 100 + this.metaValue('queenMaxHp');
    const biomassCapacity = 220 + this.metaValue('biomassCapacity');
    const startingBiomass = 100 + this.metaValue('startingBiomass');
    const startingSpecial = 1 + this.metaValue('specialBiomass');
    const startingWorkers = 4 + this.metaValue('startingWorkers');
    const startingSoldiers = 2 + this.metaValue('startingSoldiers');
    this.createQueenEntity();
    this.createAnts();
    this.createBiomassNodes();
    this.createEnemies();
    this.hud = { ...this.hud, layer: 'surface', layerLabel: 'SUPERFÍCIE · BOSQUE ÚMIDO', surfaceResources: 6, surfaceThreats: 4, biomass: startingBiomass, biomassCapacity, specialBiomass: startingSpecial, queenHp: queenMaxHp, queenMaxHp, workers: startingWorkers, collectors: 2, soldiers: startingSoldiers, enemies: this.enemies.length, rooms: 1, excavated: 0, mode: 'active', selectedAction: null, timeScale: 1, runTime: 0, wave: 1, nextWaveIn: 16, lastAction: this.taskText };
    this.run = { ...this.run, runId: `beta-run-${this.runCounter.toString().padStart(2, '0')}`, status: 'active', biomass: startingBiomass, biomassCapacity, specialBiomass: startingSpecial, queenHp: queenMaxHp, acquiredCards: ['sharp_mandibles'], rooms: ['central_chamber'], excavated: 0, royalJellyEarned: 0, startedAt: Date.now() };
    this.setLayer('surface');
  }

  private metaValue(stat: string) {
    return META_TREE.filter((node) => node.stat === stat && (this.meta.skillTree[node.id] ?? 0) > 0).reduce((total, node) => total + node.value, 0);
  }

  private eliteSpriteKey(kind: EliteAntKind) {
    return `elite-${kind === 'acid_spitter' ? 'acid-spitter' : kind}`;
  }

  private playAntAnimation(ant: BetaAnt, state: 'idle' | 'walk' | 'ability') {
    ant.sprite.play(ant.eliteKind ? `${this.eliteSpriteKey(ant.eliteKind)}-${state}` : state === 'walk' ? 'beta-worker-walk' : state === 'ability' ? 'beta-worker-carry' : 'beta-worker-idle', true);
    if (state === 'ability') this.time.delayedCall(720, () => { if (ant.sprite.active) this.playAntAnimation(ant, ant.path.length > ant.pathIndex ? 'walk' : 'idle'); });
  }

  private createQueenEntity() {
    const position = this.grid.tileToWorld(10, 6);
    this.queenShadow = this.add.ellipse(position.x + 4, position.y + 19, 155, 34, 0x080403, 0.55).setDepth(300);
    this.queen = this.add.sprite(position.x, position.y - 8, 'queen').setScale(2.25).setDepth(500).play('beta-queen-idle');
    this.add.text(position.x, position.y + 50, 'RAINHA · CÂMARA CENTRAL', { fontFamily: 'FumigaHUD', fontSize: '11px', color: '#f0c765' }).setOrigin(.5).setDepth(600);
  }

  private createAnts() {
    const positions: Array<[number, number, AntRole]> = [[9, 5, 'worker'], [11, 5, 'worker'], [9, 7, 'worker'], [11, 7, 'worker'], [7, 5, 'collector'], [13, 5, 'collector'], [6, 5, 'soldier'], [14, 5, 'soldier']];
    for (let index = 0; index < this.metaValue('startingWorkers'); index += 1) positions.push([7 + index, 8, 'worker']);
    for (let index = 0; index < this.metaValue('startingSoldiers'); index += 1) positions.push([6 + index, 4, 'soldier']);
    positions.forEach(([x, y, role], index) => {
      const p = this.grid.tileToWorld(x, y);
      const shadow = this.add.ellipse(p.x, p.y + 12, 22, 7, 0x080403, 0.5).setDepth(350 + index);
      const sprite = this.add.sprite(p.x, p.y - 5, 'worker').setScale(role === 'soldier' ? 1.55 : 1.35).setDepth(400 + index).play('beta-worker-idle');
      if (role === 'collector') sprite.setTint(0x86bd59);
      if (role === 'soldier') sprite.setTint(0xd65a46);
      this.ants.push({ id: `${role}-${index}`, role, brain: new AntBrain(role), intent: 'idle', sprite, shadow, tileX: x, tileY: y, path: [], pathIndex: 0, carrying: false, hp: 30, lastAbility: -10 });
    });
  }

  private spawnEliteAnt(kind: EliteAntKind) {
    if (this.hud.mode !== 'active') return;
    if (!this.meta.unlockedClasses.includes(kind)) { this.taskText = `${ELITE_ANT_PROFILES[kind].name} ainda não foi desbloqueada na árvore.`; return; }
    const profile = ELITE_ANT_PROFILES[kind];
    if (this.hud.biomass < profile.cost) { this.taskText = `Biomassa insuficiente para ${profile.name} (${profile.cost}).`; return; }
    const index = this.ants.length;
    const tileX = 5 + (index % 5) * 2;
    const tileY = 3 + Math.floor(index / 5) * 2;
    const p = this.grid.tileToWorld(tileX, tileY);
    const shadow = this.add.ellipse(p.x, p.y + 14, kind === 'giant' ? 32 : 24, 8, 0x080403, .5).setDepth(350 + index);
    const scale = kind === 'giant' ? 1.85 : kind === 'spy' ? 1.2 : 1.5;
    const spriteKey = this.eliteSpriteKey(kind);
    const sprite = this.add.sprite(p.x, p.y - 6, spriteKey).setScale(scale).setDepth(400 + index).play(`${spriteKey}-idle`);
    const badge = this.add.text(p.x, p.y - 32, profile.name.toUpperCase(), { fontFamily: 'FumigaHUD', fontSize: '7px', color: '#fff1c7', backgroundColor: '#1a1512', padding: { x: 4, y: 3 } }).setOrigin(.5).setDepth(610);
    this.ants.push({ id: `${kind}-${this.runCounter}-${index}`, role: kind, eliteKind: kind, brain: new AntBrain(kind), intent: 'idle', sprite, shadow, badge, tileX, tileY, path: [], pathIndex: 0, carrying: false, hp: kind === 'giant' ? 75 : 38, lastAbility: -10 });
    this.hud.biomass -= profile.cost;
    this.taskText = `${profile.name} criada: ${profile.ability}. ${profile.description}`;
    this.burstParticles(p.x, p.y, profile.color, 20);
    this.comicReaction(p.x, p.y, `${profile.name.toUpperCase()}!`, profile.color);
    this.emitHud();
  }

  private createBiomassNodes() {
    [[3, 2], [16, 2], [16, 9], [3, 9]].forEach(([x, y], index) => {
      const p = this.grid.tileToWorld(x, y);
      this.add.ellipse(p.x, p.y + 12, 38, 12, 0x080403, 0.5).setDepth(100);
      this.add.sprite(p.x, p.y, 'biomass').setScale(index % 2 ? 1.15 : 1.35).setDepth(150).play('beta-biomass-idle');
    });
  }

  private createEnemies() {
    const formations: Array<[EnemyKind, number, number]> = [
      ['centipede', 18, 5],
      ['beetle', 17, 9],
      ['spider', 3, 2],
      ['wasp', 16, 2],
    ];
    formations.forEach(([kind, tileX, tileY], index) => this.spawnEnemy(kind, tileX, tileY, index, false));
  }

  private spawnEnemy(kind: EnemyKind, tileX: number, tileY: number, index: number, elite = false, boss = false) {
      const profile = ENEMY_PROFILES[kind];
      const p = this.grid.tileToWorld(tileX, tileY);
      const enemy = this.add.container(p.x, p.y).setDepth(420 + index);
      const ability = boss ? 'PULSO DO PÂNTANO' : elite ? ({ centipede: 'NINHADA ÁCIDA', beetle: 'CARAPAÇA REFLETORA', spider: 'TEIA DE DOMÍNIO', wasp: 'ENXAME DE FERRÕES' } as const)[kind] : profile.specialName;
      if (elite) enemy.add(this.add.circle(0, 0, boss ? 48 : 34, GAME.colors.amber, .12).setStrokeStyle(boss ? 5 : 3, GAME.colors.amber, .95));
      enemy.add(this.add.ellipse(0, 14, kind === 'beetle' ? 62 : 54, 13, 0x080403, 0.5));
      if (kind === 'centipede') for (let segment = 0; segment < 5; segment += 1) enemy.add(this.add.circle(-24 + segment * 12, 0, 9 - segment * .5, segment % 2 ? 0x9c3d32 : profile.tint));
      if (kind === 'beetle') { enemy.add(this.add.ellipse(0, 0, 48, 30, profile.tint)); enemy.add(this.add.line(0, 0, -18, -12, 18, -12, 0xf8b45d).setLineWidth(3)); enemy.add(this.add.circle(-12, -3, 4, 0x21140f)); enemy.add(this.add.circle(12, -3, 4, 0x21140f)); }
      if (kind === 'spider') { enemy.add(this.add.circle(0, 0, 16, profile.tint)); for (let leg = 0; leg < 4; leg += 1) { const side = leg % 2 ? 1 : -1; enemy.add(this.add.line(0, 0, side * 9, -10 + leg * 7, side * 30, -16 + leg * 11, profile.tint).setLineWidth(3)); } }
      if (kind === 'wasp') { enemy.add(this.add.ellipse(0, 0, 32, 18, profile.tint)); enemy.add(this.add.ellipse(-8, -13, 20, 12, 0xd7f4e8, .65)); enemy.add(this.add.ellipse(8, -13, 20, 12, 0xd7f4e8, .65)); enemy.add(this.add.circle(13, 0, 4, 0x21140f)); }
      enemy.add(this.add.text(0, -34, boss ? 'CHEFE · MATRIARCA DO BOSQUE' : elite ? `ELITE · ${profile.name}` : profile.name, { fontFamily: 'FumigaHUD', fontSize: boss ? '10px' : '8px', color: elite ? '#ffcf4a' : '#fff1c7', backgroundColor: '#120b08', padding: { x: 4, y: 3 } }).setOrigin(.5));
      enemy.add(this.add.text(0, -48, `FIS ${Math.round(profile.resistances.physical * 100)}% · ÁC ${Math.round(profile.resistances.acid * 100)}% · VEN ${Math.round(profile.resistances.venom * 100)}%`, { fontFamily: 'FumigaHUD', fontSize: '6px', color: '#d8e3b1', backgroundColor: '#120b08', padding: { x: 3, y: 2 } }).setOrigin(.5));
      enemy.add(this.add.text(0, -60, ability, { fontFamily: 'FumigaHUD', fontSize: '6px', color: elite ? '#ffb800' : '#b5a58a', backgroundColor: '#120b08', padding: { x: 3, y: 2 } }).setOrigin(.5));
      enemy.setScale((kind === 'beetle' ? 1.1 : kind === 'wasp' ? .9 : 1) * (boss ? 1.45 : elite ? 1.12 : 1));
      this.tweens.add({ targets: enemy, y: p.y - (kind === 'wasp' ? 9 : 0), duration: kind === 'wasp' ? 520 : 760, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const maxHp = Math.round(profile.maxHp * (boss ? 5 : elite ? 1.8 : 1));
      this.enemies.push({ id: `${kind}-${index}`, kind, elite, boss, ability, brain: new EnemyBrain(), intent: 'idle', sprite: enemy, tileX, tileY, hp: maxHp, maxHp, path: [], pathIndex: 0, lastDecision: 0, lastAttack: 0, lastSpecial: -profile.specialCooldown, patrolIndex: index % 4 });
  }

  private bindInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
      this.pointerPosition.set(pointer.x, pointer.y);
      this.lastPointer.set(pointer.x, pointer.y);
      this.pressTimer?.remove(false);
      this.pressTimer = this.time.delayedCall(300, () => this.openTacticalPause(pointer.x, pointer.y));
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.pointerPosition.set(pointer.x, pointer.y);
      if (this.draggingCamera && !this.radial) { this.cameras.main.scrollX -= pointer.x - this.lastPointer.x; this.cameras.main.scrollY -= pointer.y - this.lastPointer.y; }
      this.lastPointer.set(pointer.x, pointer.y);
      if (this.pointerStart && Phaser.Math.Distance.Between(pointer.x, pointer.y, this.pointerStart.x, this.pointerStart.y) > 12 && !this.radial) { this.pressTimer?.remove(false); this.pressTimer = undefined; this.draggingCamera = true; }
      if (this.radial?.active) this.updateRadialSelection(pointer.x, pointer.y);
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.pressTimer?.remove(false); this.pressTimer = undefined;
      if (this.radial?.active) this.closeTacticalPause(pointer.x, pointer.y);
      this.draggingCamera = false; this.pointerStart = undefined;
    });
  }

  private openTacticalPause(x: number, y: number) {
    if (this.radial?.active || this.hud.mode !== 'active') return;
    this.time.timeScale = 0.1;
    this.hud = { ...this.hud, mode: 'tactical', selectedAction: null, timeScale: 0.1, lastAction: 'Pausa tática: arraste para escolher uma ordem.' };
    this.radial = this.add.container(x, y).setDepth(1200);
    this.radial.add(this.add.circle(0, 0, 74, 0x120b08, .96).setStrokeStyle(3, GAME.colors.amber, .9));
    RADIAL_ACTIONS.forEach((action, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / 3;
      this.radial?.add(this.add.text(Math.cos(angle) * 105, Math.sin(angle) * 105, action.label, { fontFamily: 'FumigaHUD', fontSize: '11px', color: '#fff1c7', backgroundColor: '#2a180f', padding: { x: 7, y: 5 } }).setOrigin(.5));
      this.radial?.add(this.add.line(0, 0, 0, 0, Math.cos(angle) * 42, Math.sin(angle) * 42, action.color, .8).setLineWidth(4));
    });
    this.eventBus.emit('tactical:opened', { x, y });
    this.emitHud();
  }

  private updateRadialSelection(x: number, y: number) {
    if (!this.radial) return;
    const angle = Phaser.Math.Angle.Normalize(Phaser.Math.Angle.Between(this.radial.x, this.radial.y, x, y) + Math.PI / 2);
    const action = RADIAL_ACTIONS[Math.floor((angle + Math.PI / 6) / (Math.PI * 2 / 3)) % 3];
    this.selectedAction = action.id;
    this.hud = { ...this.hud, selectedAction: action.label };
  }

  private closeTacticalPause(x: number, y: number) {
    const action = this.selectedAction;
    this.time.timeScale = 1;
    this.radial?.destroy(true);
    this.radial = undefined;
    this.selectedAction = null;
    this.hud = { ...this.hud, mode: 'active', selectedAction: null, timeScale: 1, lastAction: action ? `Ordem ${action.toUpperCase()} confirmada.` : 'Ordem cancelada.' };
    if (action) this.issueOrder(action, x, y);
    this.eventBus.emit('tactical:closed', { action });
    this.emitHud();
  }

  private issueOrder(action: RadialActionId, x: number, y: number) {
    if (this.activeLayer === 'surface') {
      if (action === 'dig') { this.taskText = 'A escavação começa pela entrada marcada no subsolo.'; this.setLayer('underground'); return; }
      this.placeSurfacePheromone(action, x, y);
      return;
    }
    const target = this.grid.worldToTile(x, y);
    if (action === 'dig') this.issueDig();
    if (action === 'collect') this.placePheromone('collect', target.x, target.y);
    if (action === 'attack') this.placePheromone('attack', target.x, target.y);
  }

  private placeSurfacePheromone(type: RadialActionId, x: number, y: number) {
    this.pheromone?.marker.destroy();
    const color = RADIAL_ACTIONS.find((item) => item.id === type)?.color ?? GAME.colors.amber;
    const marker = this.add.container(x, y).setDepth(950);
    marker.add(this.add.circle(0, 0, 34, color, .18).setStrokeStyle(2, color, .95));
    marker.add(this.add.circle(0, 0, 7, color, .95));
    marker.add(this.add.text(0, 42, `SINAL ${type.toUpperCase()}`, { fontFamily: 'FumigaHUD', fontSize: '9px', color: '#fff1c7', backgroundColor: '#132017', padding: { x: 4, y: 3 } }).setOrigin(.5));
    this.tweens.add({ targets: marker, scale: 1.16, alpha: .65, duration: 850, yoyo: true, repeat: -1 });
    this.pheromone = { type, x, y, marker };
    this.burstParticles(x, y, color, 14);
    this.comicReaction(x, y, type === 'collect' ? 'NHAC!' : 'VAI, ENXAME!', color);
    if (type === 'collect') { this.hud.surfaceResources = Math.max(0, this.hud.surfaceResources - 1); this.hud.biomass = Math.min(this.hud.biomassCapacity, this.hud.biomass + 12); this.taskText = 'Coletoras seguem o feromônio e trazem Biomassa da superfície.'; }
    if (type === 'attack') { this.hud.surfaceThreats = Math.max(0, this.hud.surfaceThreats - 1); this.taskText = 'Soldados formam uma linha defensiva na superfície.'; }
    this.eventBus.emit('pheromone:placed', { action: type, x, y });
  }

  private issueDig() {
    const worker = this.ants.find((ant) => ant.role === 'worker' && !ant.path.length);
    const wall = this.grid.findNearestWall(worker?.tileX ?? 10, worker?.tileY ?? 6);
    if (!worker || !wall) { this.taskText = 'Nenhuma célula escavável próxima.'; return; }
    const approach = this.grid.neighbors(wall.x, wall.y)[0];
    if (!approach) return;
    const path = this.grid.findPath(worker.tileX, worker.tileY, approach[0], approach[1]);
    if (!path) { this.taskText = 'Rota de escavação indisponível.'; return; }
    worker.path = path; worker.pathIndex = 0; worker.target = wall; this.playAntAnimation(worker, 'walk');
    const wallWorld = this.grid.tileToWorld(wall.x, wall.y);
    this.burstParticles(wallWorld.x, wallWorld.y, GAME.colors.amber, 10);
    this.comicReaction(wallWorld.x, wallWorld.y, 'TOC TOC!', GAME.colors.amber);
    this.taskText = `Operária ${worker.id} abriu uma tarefa de escavação.`;
  }

  private placePheromone(type: RadialActionId, x: number, y: number) {
    this.pheromone?.marker.destroy();
    const color = RADIAL_ACTIONS.find((item) => item.id === type)?.color ?? GAME.colors.amber;
    const marker = this.add.container(this.grid.tileToWorld(x, y).x, this.grid.tileToWorld(x, y).y).setDepth(250);
    marker.add(this.add.circle(0, 0, 30, color, .18).setStrokeStyle(2, color, .95));
    marker.add(this.add.circle(0, 0, 6, color, .95));
    marker.add(this.add.text(0, 38, `FEROMÔNIO ${type.toUpperCase()}`, { fontFamily: 'FumigaHUD', fontSize: '9px', color: '#fff1c7', backgroundColor: '#120b08', padding: { x: 4, y: 3 } }).setOrigin(.5));
    this.tweens.add({ targets: marker, scale: 1.16, alpha: .65, duration: 850, yoyo: true, repeat: -1 });
    this.pheromone = { type, x, y, marker };
    const worldTarget = this.grid.tileToWorld(x, y);
    this.burstParticles(worldTarget.x, worldTarget.y, color, 14);
    this.comicReaction(worldTarget.x, worldTarget.y, type === 'collect' ? 'NHAC!' : 'GRR!', color);
    if (type === 'collect') this.ants.filter((ant) => ant.role === 'collector').forEach((ant) => this.setAntPath(ant, x, y));
    if (type === 'attack') {
      const target = this.enemies.filter((enemy) => enemy.hp > 0).sort((a, b) => Phaser.Math.Distance.Between(this.queen.x, this.queen.y, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(this.queen.x, this.queen.y, b.sprite.x, b.sprite.y))[0];
      if (target) this.ants.filter((ant) => ['soldier', 'spy', 'acid_spitter', 'giant'].includes(ant.role)).forEach((ant) => this.setAntPath(ant, target.tileX, target.tileY));
    }
    this.taskText = `Feromônio ${type.toUpperCase()} emitido. A colônia reage.`;
  }

  private setAntPath(ant: BetaAnt, x: number, y: number) {
    const path = this.grid.findPath(ant.tileX, ant.tileY, x, y);
    if (path) { ant.path = path; ant.pathIndex = 0; this.playAntAnimation(ant, 'walk'); }
  }

  private thinkAnts() {
    const active = this.ants.filter((ant) => ant.path.length && ant.pathIndex < ant.path.length).length;
    const intents = this.ants.map((ant) => {
      const intent = ant.brain.think({
      hasPheromone: (type) => this.pheromone?.type === type,
      hasEnemy: this.enemies.some((enemy) => enemy.hp > 0),
      carrying: ant.carrying,
      hasPath: ant.path.length > ant.pathIndex,
      });
      ant.intent = intent;
      return intent;
    });
    const priority: AntIntent[] = ['defend', 'collect', 'dig', 'return', 'follow', 'idle'];
    this.aiFocus = priority.find((intent) => intents.includes(intent)) ?? 'idle';
    const labels: Record<AntIntent, string> = { defend: 'defendendo', collect: 'coletando', dig: 'escavando', return: 'retornando', follow: 'seguindo ordem', idle: 'aguardando' };
    this.hud.aiStatus = labels[this.aiFocus];
    this.hud.aiFocus = this.aiFocus;
    this.eventBus.emit('ai:telemetry', { status: labels[this.aiFocus], focus: this.aiFocus, active });
  }

  private burstParticles(x: number, y: number, color: number, count = 12) {
    for (let index = 0; index < count; index += 1) {
      const particle = this.add.rectangle(x, y, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7), color, 1).setDepth(1300);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(22, 68);
      this.tweens.add({ targets: particle, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, alpha: 0, angle: Phaser.Math.Between(-180, 180), duration: Phaser.Math.Between(280, 620), ease: 'Quad.easeOut', onComplete: () => particle.destroy() });
    }
  }

  private comicReaction(x: number, y: number, message: string, color: number = GAME.colors.amber) {
    const bubble = this.add.text(x, y - 28, message, { fontFamily: 'FumigaHUD', fontSize: '15px', color: '#ffffff', backgroundColor: `#${color.toString(16).padStart(6, '0')}`, padding: { x: 8, y: 5 }, stroke: '#2b6c86', strokeThickness: 2 }).setOrigin(.5).setDepth(1400).setScale(.7);
    this.tweens.add({ targets: bubble, y: y - 62, alpha: 0, scale: 1.05, duration: 900, ease: 'Back.easeOut', onComplete: () => bubble.destroy() });
  }

  private updateAnt(ant: BetaAnt, delta: number) {
    if (!ant.path.length || ant.pathIndex >= ant.path.length) return;
    const next = this.grid.tileToWorld(ant.path[ant.pathIndex].x, ant.path[ant.pathIndex].y);
    const distance = Phaser.Math.Distance.Between(ant.sprite.x, ant.sprite.y, next.x, next.y);
    const eliteSpeed = ant.eliteKind === 'spy' ? 1.3 : ant.eliteKind === 'giant' ? .7 : 1;
    const speed = 0.09 * delta * eliteSpeed * (1 + this.metaValue('movementSpeed')) * (this.colonySlowUntil > this.runClock ? .55 : 1);
    ant.sprite.setRotation(Phaser.Math.Angle.Between(ant.sprite.x, ant.sprite.y, next.x, next.y));
    ant.sprite.x = Phaser.Math.Linear(ant.sprite.x, next.x, Math.min(1, speed / Math.max(distance, 1)));
    ant.sprite.y = Phaser.Math.Linear(ant.sprite.y, next.y, Math.min(1, speed / Math.max(distance, 1)));
    ant.shadow.setPosition(ant.sprite.x, ant.sprite.y + 12);
    ant.badge?.setPosition(ant.sprite.x, ant.sprite.y - 32);
    if (distance < 3) { ant.tileX = next.x === next.x ? ant.path[ant.pathIndex].x : ant.tileX; ant.tileY = ant.path[ant.pathIndex].y; ant.pathIndex += 1; }
    if (ant.pathIndex >= ant.path.length && ant.target) {
      const target = ant.target;
      ant.target = undefined;
      this.grid.set(target.x, target.y, 1);
      this.taskText = `Escavação concluída em ${target.x},${target.y}. Grid v${this.grid.version}.`;
      this.playAntAnimation(ant, 'idle');
      ant.path = [];
    }
    if (this.pheromone?.type === 'collect' && ant.role === 'collector' && ant.pathIndex >= ant.path.length && ant.path.length > 0) {
      if (!ant.carrying) {
        ant.carrying = true;
        this.playAntAnimation(ant, ant.eliteKind ? 'ability' : 'walk');
        this.setAntPath(ant, 10, 6);
        this.taskText = 'Coletora encontrou Biomassa e retorna à Câmara Central.';
      } else {
        ant.carrying = false;
        ant.path = [];
        this.playAntAnimation(ant, 'idle');
        this.hud.biomass = Math.min(this.hud.biomassCapacity, this.hud.biomass + 8);
        this.taskText = 'Coletora retornou com Biomassa.';
      }
    }
    if (this.pheromone?.type === 'attack' && ['soldier', 'spy', 'acid_spitter', 'giant'].includes(ant.role)) {
      const target = this.enemies.filter((enemy) => enemy.hp > 0).sort((a, b) => Phaser.Math.Distance.Between(ant.sprite.x, ant.sprite.y, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(ant.sprite.x, ant.sprite.y, b.sprite.x, b.sprite.y))[0];
      const range = ant.eliteKind === 'acid_spitter' || ant.eliteKind === 'spy' ? 150 : 54;
      const cooldown = ant.eliteKind === 'giant' ? 1.8 : ant.eliteKind ? 1.1 : .7;
      if (target && Phaser.Math.Distance.Between(ant.sprite.x, ant.sprite.y, target.sprite.x, target.sprite.y) < range && this.runClock - ant.lastAbility > cooldown) {
        ant.lastAbility = this.runClock;
        const damage = ant.eliteKind === 'giant' ? 16 : ant.eliteKind === 'acid_spitter' ? 11 : ant.eliteKind === 'spy' ? 8 : 9;
        const type = ant.eliteKind === 'acid_spitter' ? 'acid' : ant.eliteKind === 'spy' ? 'venom' : this.run.acquiredCards.includes('acid_spit') ? 'acid' : this.run.acquiredCards.includes('poison_gland') ? 'venom' : 'physical';
        this.playAntAnimation(ant, ant.eliteKind ? 'ability' : 'walk');
        this.damageEnemy(target, damage, type);
        this.comicReaction(ant.sprite.x, ant.sprite.y, ant.eliteKind ? ELITE_ANT_PROFILES[ant.eliteKind].ability : 'ATAQUE', ant.eliteKind ? ELITE_ANT_PROFILES[ant.eliteKind].color : GAME.colors.enemy);
      }
    }
    if (ant.eliteKind === 'healer' && this.runClock - ant.lastAbility > 6 && this.hud.queenHp < this.hud.queenMaxHp) {
      ant.lastAbility = this.runClock;
      this.playAntAnimation(ant, 'ability');
      const healed = Math.min(10, this.hud.queenMaxHp - this.hud.queenHp);
      this.hud.queenHp += healed;
      this.run.queenHp = this.hud.queenHp;
      this.burstParticles(this.queen.x, this.queen.y, ELITE_ANT_PROFILES.healer.color, 18);
      this.comicReaction(this.queen.x, this.queen.y, `+${healed} CURA`, ELITE_ANT_PROFILES.healer.color);
      this.taskText = `Curandeira ativou ${ELITE_ANT_PROFILES.healer.ability}: Rainha recuperou ${healed} HP.`;
    }
  }

  private updateWaves() {
    const living = this.enemies.filter((enemy) => enemy.hp > 0).length;
    if (!this.waveDirector.shouldSpawn(this.runClock, living)) return;
    const plan = this.waveDirector.next(this.runClock, { queenHpRatio: this.hud.queenHp / this.hud.queenMaxHp, soldiers: this.hud.soldiers, biomass: this.hud.biomass });
    const entrances: Array<[number, number]> = [[18, 2], [18, 9], [2, 2], [2, 9], [17, 5], [3, 5]];
    plan.composition.forEach(({ kind, elite, boss }, index) => {
      const [tileX, tileY] = entrances[(index + plan.number) % entrances.length];
      this.spawnEnemy(kind, tileX, tileY, this.enemies.length + index + plan.number * 10, elite, boss);
    });
    this.hud.enemies = this.enemies.filter((enemy) => enemy.hp > 0).length;
    this.hud.surfaceThreats = Math.min(9, this.hud.surfaceThreats + plan.composition.length);
    this.taskText = plan.number % 10 === 0 ? `CHEFE DO BIOMA: MATRIARCA DO BOSQUE · O enxame precisa sobreviver.` : `ONDA ${plan.number}${plan.number % 3 === 0 ? ' · ELITE' : ''}: ${plan.composition.map(({ kind, elite }) => `${elite ? 'ELITE ' : ''}${ENEMY_PROFILES[kind].name}`).join(' · ')}`;
    this.burstParticles(this.grid.tileToWorld(10, 6).x, this.grid.tileToWorld(10, 6).y, GAME.colors.enemy, 22);
    this.comicReaction(this.grid.tileToWorld(10, 6).x, this.grid.tileToWorld(10, 6).y, `ONDA ${plan.number}!`, GAME.colors.enemy);
  }

  private updateEnemy(enemy: BetaEnemy, delta: number) {
    if (enemy.hp <= 0) return;
    const profile = ENEMY_PROFILES[enemy.kind];
    const queenTile = this.grid.worldToTile(this.queen.x, this.queen.y);
    const nearestCollector = this.ants.filter((ant) => ant.role === 'collector').sort((a, b) => Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, b.sprite.x, b.sprite.y))[0];
    if (this.runClock - enemy.lastDecision > .7) {
      enemy.lastDecision = this.runClock;
      enemy.intent = enemy.brain.think({ kind: enemy.kind, hasAttackPheromone: this.pheromone?.type === 'attack', queenDistance: Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.queen.x, this.queen.y), nearestCollectorDistance: nearestCollector ? Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, nearestCollector.sprite.x, nearestCollector.sprite.y) : 9999, hasPath: enemy.path.length > enemy.pathIndex });
      let target = { x: queenTile.x, y: queenTile.y };
      if (enemy.intent === 'rush-collector' && nearestCollector) target = { x: nearestCollector.tileX, y: nearestCollector.tileY };
      if (enemy.intent === 'patrol') { const patrol = [[16, 9], [14, 10], [12, 9], [14, 7]][enemy.patrolIndex]; target = { x: patrol[0], y: patrol[1] }; enemy.patrolIndex = (enemy.patrolIndex + 1) % 4; }
      if (enemy.intent === 'ambush') { const ambush = this.ants.find((ant) => ant.role === 'collector') ?? this.ants[0]; target = { x: ambush?.tileX ?? queenTile.x, y: ambush?.tileY ?? queenTile.y }; }
      enemy.path = this.grid.findPath(enemy.tileX, enemy.tileY, target.x, target.y) ?? [];
      enemy.pathIndex = 0;
    }
    if (enemy.path.length && enemy.pathIndex < enemy.path.length) {
      const next = this.grid.tileToWorld(enemy.path[enemy.pathIndex].x, enemy.path[enemy.pathIndex].y);
      const distance = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, next.x, next.y);
      enemy.sprite.x = Phaser.Math.Linear(enemy.sprite.x, next.x, Math.min(1, delta * profile.speed / Math.max(distance, 1)));
      enemy.sprite.y = Phaser.Math.Linear(enemy.sprite.y, next.y, Math.min(1, delta * profile.speed / Math.max(distance, 1)));
      if (distance < 4) { enemy.tileX = enemy.path[enemy.pathIndex].x; enemy.tileY = enemy.path[enemy.pathIndex].y; enemy.pathIndex += 1; }
    }
    const targetAnt = enemy.intent === 'rush-collector' ? nearestCollector : undefined;
    const targetX = targetAnt?.sprite.x ?? this.queen.x;
    const targetY = targetAnt?.sprite.y ?? this.queen.y;
    if (this.hud.mode === 'active' && Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, targetX, targetY) < (targetAnt ? 54 : 70) && this.runClock - enemy.lastAttack > profile.attackCooldown) {
      enemy.lastAttack = this.runClock;
      if (targetAnt && enemy.kind === 'wasp') { targetAnt.hp -= profile.damage; this.comicReaction(targetAnt.sprite.x, targetAnt.sprite.y, 'ZUM!', profile.tint); if (targetAnt.hp <= 0) { targetAnt.sprite.destroy(); targetAnt.shadow.destroy(); this.ants = this.ants.filter((ant) => ant !== targetAnt); this.taskText = 'Uma coletora foi derrubada pela Vespa Predadora.'; } }
      else this.damageQueen(profile.damage);
    }
    if (this.hud.mode === 'active' && Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, targetX, targetY) < (targetAnt ? 70 : 86) && this.runClock - enemy.lastSpecial > profile.specialCooldown) {
      enemy.lastSpecial = this.runClock;
      this.useEnemySpecial(enemy, targetAnt);
    }
  }

  private useEnemySpecial(enemy: BetaEnemy, targetAnt?: BetaAnt) {
    const profile = ENEMY_PROFILES[enemy.kind];
    this.burstParticles(enemy.sprite.x, enemy.sprite.y, profile.tint, 16);
    this.comicReaction(enemy.sprite.x, enemy.sprite.y, enemy.ability, profile.tint);
    if (enemy.boss) {
      this.damageQueen(32, 'physical', 'PULSO DO PÂNTANO');
      this.colonySlowUntil = this.runClock + 9;
      this.ants.forEach((ant) => { ant.path = []; ant.pathIndex = 0; });
      this.burstParticles(this.queen.x, this.queen.y, GAME.colors.enemy, 30);
      this.taskText = 'A Matriarca do Bosque lançou Pulso do Pântano: dano alto e rotas interrompidas por 9 segundos.';
      return;
    }
    if (enemy.elite) {
      if (enemy.kind === 'centipede') {
        this.queenPoisonUntil = this.runClock + 8;
        this.damageQueen(16, 'venom', 'NINHADA ÁCIDA');
        this.taskText = 'Centopeia Elite lançou Ninhada Ácida: veneno prolongado na Rainha.';
      } else if (enemy.kind === 'beetle') {
        this.damageQueen(24, 'physical', 'CARAPAÇA REFLETORA');
        this.ants.forEach((ant) => { ant.path = []; ant.pathIndex = 0; });
        this.taskText = 'Besouro Elite refletiu o impacto: rotas foram interrompidas e o ninho sofreu dano pesado.';
      } else if (enemy.kind === 'spider') {
        this.colonySlowUntil = this.runClock + 7;
        this.ants.filter((ant) => ant.role === 'soldier').forEach((ant) => { ant.path = []; ant.pathIndex = 0; });
        this.taskText = 'Aranha Elite lançou Teia de Domínio: soldados perderam suas rotas por 7 segundos.';
      } else if (enemy.kind === 'wasp') {
        this.ants.filter((ant) => ant.role === 'collector').forEach((ant) => { ant.hp -= 10; this.comicReaction(ant.sprite.x, ant.sprite.y, 'ZUM!', profile.tint); });
        this.taskText = 'Vespa Elite liberou Enxame de Ferrões contra todas as coletoras.';
      }
      return;
    }
    if (enemy.kind === 'centipede') {
      this.queenPoisonUntil = this.runClock + 5;
      this.queenPoisonTick = this.runClock;
      this.damageQueen(10, 'venom', 'MORDIDA VENENOSA');
      this.taskText = 'A Centopeia aplicou veneno: a Rainha sofrerá dano por 5 segundos.';
    } else if (enemy.kind === 'beetle') {
      this.damageQueen(18, 'physical', 'IMPACTO DE CARAPAÇA');
      this.ants.forEach((ant) => { ant.path = []; ant.pathIndex = 0; });
      this.taskText = 'O Besouro Guardião abalou o ninho e interrompeu as rotas das formigas.';
    } else if (enemy.kind === 'spider') {
      this.colonySlowUntil = this.runClock + 4;
      this.taskText = 'A Aranha lançou uma teia: o enxame está 45% mais lento por 4 segundos.';
    } else if (enemy.kind === 'wasp') {
      const victim = targetAnt ?? this.ants.find((ant) => ant.role === 'collector');
      if (victim) { victim.hp -= 12; this.comicReaction(victim.sprite.x, victim.sprite.y, 'PARA!', profile.tint); if (victim.hp <= 0) { victim.sprite.destroy(); victim.shadow.destroy(); this.ants = this.ants.filter((ant) => ant !== victim); } }
      this.taskText = 'A Vespa aplicou Ferrão Paralisante e priorizou uma coletora.';
    }
  }

  private damageEnemy(enemy: BetaEnemy, amount: number, type: DamageType = 'physical') {
    if (enemy.hp <= 0) return;
    const eliteArmor = enemy.elite && enemy.kind === 'beetle' && type === 'physical' ? .55 : 1;
    const resistedAmount = Math.max(1, Math.round(amount * ENEMY_PROFILES[enemy.kind].resistances[type] * eliteArmor));
    enemy.hp -= resistedAmount;
    this.damageDealt += resistedAmount;
    this.burstParticles(enemy.sprite.x, enemy.sprite.y, ENEMY_PROFILES[enemy.kind].tint, 7);
    this.comicReaction(enemy.sprite.x, enemy.sprite.y, enemy.hp > 0 ? 'AI!' : 'PLOFT!', ENEMY_PROFILES[enemy.kind].tint);
    const resistanceText = ENEMY_PROFILES[enemy.kind].resistances[type] < 1 ? ' resistência' : ENEMY_PROFILES[enemy.kind].resistances[type] > 1 ? ' vulnerabilidade' : '';
    this.taskText = `Soldados usam ${type.toUpperCase()} contra ${enemy.elite ? 'ELITE ' : ''}${ENEMY_PROFILES[enemy.kind].name} · ${resistedAmount} dano${resistanceText}. HP ${Math.max(0, enemy.hp)}/${enemy.maxHp}.`;
    if (enemy.hp <= 0) { this.enemiesDefeated += 1; if (enemy.elite) this.elitesDefeated += 1; if (enemy.boss) { this.bossDefeated += 1; } this.burstParticles(enemy.sprite.x, enemy.sprite.y, GAME.colors.amber, enemy.boss ? 70 : enemy.elite ? 42 : 28); enemy.sprite.destroy(); this.hud.enemies = Math.max(0, this.hud.enemies - 1); const reward = enemy.boss ? 140 : enemy.elite ? 55 : enemy.kind === 'beetle' ? 35 : 18; const jelly = enemy.boss || enemy.elite || enemy.kind === 'beetle'; this.biomassReward += reward; if (jelly) this.royalJellyReward += 1; this.hud.biomass = Math.min(this.hud.biomassCapacity, this.hud.biomass + reward); this.hud.specialBiomass = Math.min(3, this.hud.specialBiomass + (jelly ? 1 : 0)); this.run.royalJellyEarned += jelly ? 1 : 0; this.taskText = `${enemy.boss ? 'Chefe do bioma ' : enemy.elite ? 'Elite ' : ''}${ENEMY_PROFILES[enemy.kind].name} derrotado — drop: +${reward} Biomassa${jelly ? ', +1 Geleia Real' : ''}.`; if (enemy.boss) this.endRun('victory'); }
  }

  private damageQueen(amount: number, type: DamageType = 'physical', source = 'ATAQUE') {
    const armorMultiplier = type === 'physical' && this.run.acquiredCards.includes('rigid_carapace') ? .75 : 1;
    const finalAmount = Math.max(1, Math.round(amount * armorMultiplier));
    this.damageTaken += finalAmount;
    this.hud.queenHp = Math.max(0, this.hud.queenHp - finalAmount);
    this.run.queenHp = this.hud.queenHp;
    this.queen.setTint(0xff6a55);
    this.burstParticles(this.queen.x, this.queen.y, GAME.colors.enemy, 11);
    this.comicReaction(this.queen.x, this.queen.y, 'EI!', GAME.colors.enemy);
    this.time.delayedCall(180, () => this.queen.clearTint());
    this.taskText = `${source} · Rainha atingida por ${finalAmount} dano. HP ${this.hud.queenHp}/${this.hud.queenMaxHp}.`;
    if (this.hud.queenHp <= 0) this.endRun('gameover');
  }

  private handleCommand(command: { type: string; cardId?: string }) {
    if (command.type === 'new-run') this.startNewRun();
    if (command.type === 'spawn-elite' && command.cardId) this.spawnEliteAnt(command.cardId as EliteAntKind);
    if (command.type === 'open-mutation') this.openMutationChoice();
    if (command.type === 'choose-mutation' && command.cardId) this.applyMutation(command.cardId);
    if (command.type === 'build-pantry') this.buildPantry();
    if (command.type === 'save-meta') this.saveManager.saveMeta(this.meta).then(() => { this.taskText = 'Metaprogressão salva localmente.'; this.emitHud(); });
    if (command.type === 'toggle-layer') this.setLayer(this.activeLayer === 'surface' ? 'underground' : 'surface');
  }

  private buildPantry() {
    if (this.hud.mode !== 'active' || this.hud.biomass < 40) { this.taskText = 'Biomassa insuficiente para a Despensa (40).'; return; }
    this.hud.biomass -= 40; this.hud.biomassCapacity += 50; this.hud.rooms += 1; this.run.rooms.push('pantry'); this.burstParticles(this.queen.x, this.queen.y, GAME.colors.biomass, 22); this.comicReaction(this.queen.x, this.queen.y, 'TÁ PAGO!', GAME.colors.biomass); this.taskText = 'Despensa construída. Capacidade +50 Biomassa.'; this.emitHud();
  }

  private openMutationChoice() {
    if (this.hud.mode !== 'active' || this.hud.specialBiomass < 1) return;
    this.time.timeScale = 0;
    this.hud = { ...this.hud, mode: 'mutation', timeScale: 0, lastAction: 'Biomassa Especial: escolha uma mutação.' };
    this.mutationCards = [BETA_CARDS[1], BETA_CARDS[2], BETA_CARDS[3]];
    this.eventBus.emit('mutation:opened', { cards: this.mutationCards });
    this.emitHud();
  }

  private applyMutation(cardId: string) {
    if (this.hud.mode !== 'mutation' || !this.mutationCards.some((card) => card.id === cardId)) return;
    const card = BETA_CARDS.find((entry) => entry.id === cardId)!;
    if (this.run.acquiredCards.includes(card.id)) return;
    this.run.acquiredCards.push(card.id);
    this.hud.specialBiomass = Math.max(0, this.hud.specialBiomass - 1);
    if (card.id === 'light_legs') this.ants.forEach((ant) => ant.sprite.setScale(ant.role === 'soldier' ? 1.7 : 1.45));
    if (card.id === 'rigid_carapace') this.hud.queenMaxHp += 25;
    if (card.id === 'poison_gland') this.taskText = 'Glândula Venenosa ativa. Sinergia Venom disponível com Mandíbulas Serrilhadas.';
    this.burstParticles(this.queen.x, this.queen.y, GAME.colors.queen, 24);
    this.comicReaction(this.queen.x, this.queen.y, 'TÁ TURBINADA!', GAME.colors.queen);
    this.time.timeScale = 1;
    this.hud = { ...this.hud, mode: 'active', timeScale: 1, lastAction: `Mutação ${card.name} aplicada.` };
    this.eventBus.emit('mutation:closed', { cardId });
    this.emitHud();
  }

  private endRun(result: 'gameover' | 'victory') {
    this.time.timeScale = 0;
    this.hud = { ...this.hud, mode: 'gameover', timeScale: 0, lastAction: result === 'gameover' ? 'A Rainha caiu. A colônia entrou em silêncio.' : 'Bioma conquistado.' };
    this.run.status = result;
    this.saveManager.settleRun(this.run, result).then((meta) => { this.meta = meta; this.emitHud(); });
    const summaryBase: Omit<RunSummary, 'score' | 'isPersonalBest' | 'rank' | 'personalRecords'> = { result, runId: this.run.runId, duration: Math.floor(this.runClock), wave: this.waveDirector.currentWave, enemiesDefeated: this.enemiesDefeated, elitesDefeated: this.elitesDefeated, bossDefeated: this.bossDefeated, damageDealt: this.damageDealt, damageTaken: this.damageTaken, biomassReward: this.biomassReward, royalJellyReward: this.royalJellyReward, mutations: this.run.acquiredCards.length, queenHp: this.hud.queenHp, queenMaxHp: this.hud.queenMaxHp, summary: result === 'victory' ? `A Matriarca caiu. O Bosque Úmido agora reconhece esta colônia.` : `A Rainha caiu após ${Math.floor(this.runClock)} segundos.` };
    const summary = this.saveManager.recordScore(summaryBase);
    this.eventBus.emit('run:ended', summary);
    this.emitHud();
  }

  private emitHud() {
    this.hud.royalJelly = this.meta.royalJelly;
    this.hud.unlockedEliteClasses = (['spy', 'acid_spitter', 'giant', 'healer'] as const).filter((kind) => this.meta.unlockedClasses.includes(kind)).map((kind) => ({ id: kind, name: ELITE_ANT_PROFILES[kind].name, cost: ELITE_ANT_PROFILES[kind].cost }));
    this.hud.lastAction = this.taskText;
    this.hud.eliteCooldowns = this.enemies.filter((enemy) => enemy.elite && enemy.hp > 0).map((enemy) => {
      const max = ENEMY_PROFILES[enemy.kind].specialCooldown;
      return { id: enemy.id, name: ENEMY_PROFILES[enemy.kind].name, ability: enemy.ability, remaining: Math.max(0, max - (this.runClock - enemy.lastSpecial)), max };
    });
    const imminent = this.hud.eliteCooldowns.filter((elite) => elite.remaining > 0 && elite.remaining <= 3).sort((a, b) => a.remaining - b.remaining)[0];
    this.hud.eliteAlert = imminent ? { name: imminent.name, ability: imminent.ability, seconds: imminent.remaining } : undefined;
    const boss = this.enemies.find((enemy) => enemy.boss && enemy.hp > 0);
    this.hud.bossHud = boss ? { name: 'MATRIARCA DO BOSQUE', hp: boss.hp, maxHp: boss.maxHp, ability: boss.ability } : undefined;
    this.hud.activeEffects = [
      ...(this.queenPoisonUntil > this.runClock ? [{ label: 'RAINHA · VENENO', remaining: this.queenPoisonUntil - this.runClock, color: 'venom' as const }] : []),
      ...(this.colonySlowUntil > this.runClock ? [{ label: 'ENXAME · TEIA', remaining: this.colonySlowUntil - this.runClock, color: 'web' as const }] : []),
    ];
    this.eventBus.emit('beta:hud', this.hud);
  }
}
