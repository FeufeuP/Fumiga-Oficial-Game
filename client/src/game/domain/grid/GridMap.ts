import type { GridCellState, Vec2 } from '../core/Contracts';
import { DomainEventBus } from '../core/DomainEventBus';

export class GridMap {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  private cells: GridCellState[];
  private roomIds = new Map<number, string>();
  version = 0;

  constructor(width: number, height: number, cellSize: number, private readonly events: DomainEventBus) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cells = Array.from({ length: width * height }, () => 0);
  }

  private index(x: number, y: number): number { return y * this.width + x; }
  isInside(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  get(x: number, y: number): GridCellState { return this.isInside(x, y) ? this.cells[this.index(x, y)] : 3; }
  isWalkable(x: number, y: number): boolean { const state = this.get(x, y); return state === 1 || state === 2; }
  getRoomId(x: number, y: number): string | undefined { return this.roomIds.get(this.index(x, y)); }

  set(x: number, y: number, state: GridCellState, roomId?: string): boolean {
    if (!this.isInside(x, y) || this.get(x, y) === 3) return false;
    const index = this.index(x, y);
    if (this.cells[index] === state && (!roomId || this.roomIds.get(index) === roomId)) return false;
    this.cells[index] = state;
    if (roomId) this.roomIds.set(index, roomId);
    this.version += 1;
    this.events.emit('GRID_CHANGED', { version: this.version, changed: [{ x, y }] });
    return true;
  }

  setIndestructible(x: number, y: number): void { if (this.isInside(x, y)) this.cells[this.index(x, y)] = 3; }
  worldToTile(position: Vec2): Vec2 { return { x: Math.floor(position.x / this.cellSize), y: Math.floor(position.y / this.cellSize) }; }
  tileToWorld(tile: Vec2): Vec2 { return { x: tile.x * this.cellSize + this.cellSize / 2, y: tile.y * this.cellSize + this.cellSize / 2 }; }
  snapshot(): GridCellState[] { return [...this.cells]; }
}
