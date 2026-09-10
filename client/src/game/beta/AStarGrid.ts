export type TileState = 0 | 1 | 2 | 3;
export type GridChange = { x: number; y: number; previous: TileState; next: TileState; version: number };

export class AStarGrid {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;
  version = 1;
  private cells: TileState[];
  private onChange?: (change: GridChange) => void;

  constructor(width: number, height: number, cellSize: number, originX: number, originY: number, onChange?: (change: GridChange) => void) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.originX = originX;
    this.originY = originY;
    this.onChange = onChange;
    this.cells = Array.from({ length: width * height }, () => 0 as TileState);
  }

  index(x: number, y: number) { return y * this.width + x; }
  inBounds(x: number, y: number) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  get(x: number, y: number): TileState { return this.inBounds(x, y) ? this.cells[this.index(x, y)] : 3; }
  isWalkable(x: number, y: number) { return this.get(x, y) === 1 || this.get(x, y) === 2; }
  set(x: number, y: number, next: TileState) {
    if (!this.inBounds(x, y) || this.get(x, y) === next) return false;
    const previous = this.get(x, y);
    this.cells[this.index(x, y)] = next;
    this.version += 1;
    this.onChange?.({ x, y, previous, next, version: this.version });
    return true;
  }
  worldToTile(x: number, y: number) { return { x: Math.floor((x - this.originX) / this.cellSize), y: Math.floor((y - this.originY) / this.cellSize) }; }
  tileToWorld(x: number, y: number) { return { x: this.originX + x * this.cellSize + this.cellSize / 2, y: this.originY + y * this.cellSize + this.cellSize / 2 }; }
  neighbors(x: number, y: number) { return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([nx, ny]) => this.inBounds(nx, ny) && this.isWalkable(nx, ny)); }
  findPath(startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] | null {
    if (!this.isWalkable(startX, startY) || !this.isWalkable(endX, endY)) return null;
    const key = (x: number, y: number) => `${x},${y}`;
    const open = [{ x: startX, y: startY, f: 0, g: 0 }];
    const cameFrom = new Map<string, string>();
    const score = new Map<string, number>([[key(startX, startY), 0]]);
    const heuristic = (x: number, y: number) => Math.abs(x - endX) + Math.abs(y - endY);
    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift()!;
      if (current.x === endX && current.y === endY) {
        const path: { x: number; y: number }[] = [{ x: endX, y: endY }];
        let cursor = key(endX, endY);
        while (cameFrom.has(cursor)) { cursor = cameFrom.get(cursor)!; const [x, y] = cursor.split(',').map(Number); path.unshift({ x, y }); }
        return path;
      }
      for (const [nx, ny] of this.neighbors(current.x, current.y)) {
        const neighbor = { x: nx, y: ny };
        const neighborKey = key(nx, ny);
        const tentative = current.g + 1;
        if (tentative < (score.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, key(current.x, current.y));
          score.set(neighborKey, tentative);
          open.push({ ...neighbor, g: tentative, f: tentative + heuristic(nx, ny) });
        }
      }
    }
    return null;
  }

  seedChamber() {
    for (let y = 4; y <= 7; y += 1) for (let x = 8; x <= 12; x += 1) this.set(x, y, 2);
    for (let x = 0; x <= 19; x += 1) this.set(x, 5, 1);
    for (let y = 0; y <= 11; y += 1) this.set(10, y, 1);
    [[3, 2], [16, 2], [16, 9], [3, 9]].forEach(([x, y]) => this.set(x, y, 1));
  }

  findNearestWall(fromX: number, fromY: number) {
    let best: { x: number; y: number; distance: number } | null = null;
    for (let y = 1; y < this.height - 1; y += 1) for (let x = 1; x < this.width - 1; x += 1) {
      if (this.get(x, y) !== 0 || !this.neighbors(x, y).length) continue;
      const distance = Math.abs(x - fromX) + Math.abs(y - fromY);
      if (!best || distance < best.distance) best = { x, y, distance };
    }
    return best;
  }
}
