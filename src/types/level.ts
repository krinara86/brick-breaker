/** Brick types available in the game */
export enum BrickType {
  Standard = 'standard',
  Multi = 'multi',         // Takes multiple hits, changes color
  Indestructible = 'indestructible',
  PowerUp = 'powerup',     // Drops a power-up when destroyed
  Explosive = 'explosive', // Destroys adjacent bricks
}

/** Single brick definition in a level */
export interface BrickDef {
  row: number;       // 0-based row index
  col: number;       // 0-based column index
  type: BrickType;
  hits?: number;     // For multi-hit bricks (default: 1)
  color?: string;    // Hex color override
  powerUp?: PowerUpType; // For powerup bricks, which power-up to drop
}

/** Complete level specification - this is what the LLM generates */
export interface LevelSpec {
  name: string;
  description?: string;
  bricks: BrickDef[];
  gridCols: number;    // Number of columns in the grid (default: 10)
  gridRows: number;    // Number of rows in the grid (default: 8)
  ballSpeed?: number;  // Multiplier, 1.0 = default
  paddleWidth?: number; // Multiplier, 1.0 = default
  background?: string;  // Hex color for level background
}

/** Power-up types */
export enum PowerUpType {
  MultiBall = 'multiBall',
  WidePaddle = 'widePaddle',
  NarrowPaddle = 'narrowPaddle',
  FastBall = 'fastBall',
  SlowBall = 'slowBall',
  Laser = 'laser',
  StickyPaddle = 'sticky',
  ExtraLife = 'extraLife',
  FireBall = 'fireBall', // Passes through bricks
}

/** Built-in level pack */
export const BUILT_IN_LEVELS: LevelSpec[] = [
  {
    name: 'Classic',
    description: 'The original brick wall with a twist',
    gridCols: 10,
    gridRows: 6,
    bricks: Array.from({ length: 60 }, (_, i) => {
      const row = Math.floor(i / 10);
      const col = i % 10;
      // Row 0: multi-hit bricks (3 hits)
      if (row === 0) return { row, col, type: BrickType.Multi, hits: 3 };
      // Row 1: explosive bricks
      if (row === 1) return { row, col, type: BrickType.Explosive, hits: 1 };
      // Row 2: powerup bricks at col 3 and 6, explosive at col 5
      if (row === 2 && col === 3) return { row, col, type: BrickType.PowerUp, hits: 1, powerUp: PowerUpType.WidePaddle };
      if (row === 2 && col === 6) return { row, col, type: BrickType.PowerUp, hits: 1, powerUp: PowerUpType.MultiBall };
      if (row === 2 && col === 5) return { row, col, type: BrickType.Explosive, hits: 1 };
      // Row 4: multi-hit (2 hits)
      if (row === 4) return { row, col, type: BrickType.Multi, hits: 2 };
      // Everything else: standard
      return { row, col, type: BrickType.Standard, hits: 1 };
    }),
  },
  {
    name: 'Fortress',
    description: 'Protected by indestructible walls',
    gridCols: 10,
    gridRows: 8,
    bricks: [
      // Top rows - standard
      ...Array.from({ length: 20 }, (_, i) => ({
        row: Math.floor(i / 10),
        col: i % 10,
        type: BrickType.Standard,
        hits: 1,
      })),
      // Middle row - indestructible wall with gaps
      ...[0, 1, 3, 4, 5, 6, 8, 9].map(col => ({
        row: 2,
        col,
        type: BrickType.Indestructible,
        hits: 999,
      })),
      // Behind the wall - multi-hit with powerups
      ...Array.from({ length: 10 }, (_, i) => ({
        row: 3,
        col: i,
        type: i === 4 || i === 5 ? BrickType.PowerUp : BrickType.Multi,
        hits: i === 4 || i === 5 ? 1 : 3,
        powerUp: i === 4 ? PowerUpType.MultiBall : i === 5 ? PowerUpType.WidePaddle : undefined,
      })),
      // Bottom rows
      ...Array.from({ length: 20 }, (_, i) => ({
        row: 4 + Math.floor(i / 10),
        col: i % 10,
        type: BrickType.Multi,
        hits: 2,
      })),
    ],
  },
  {
    name: 'Diamond',
    description: 'A diamond pattern with explosive surprises',
    gridCols: 10,
    gridRows: 8,
    bricks: (() => {
      const bricks: BrickDef[] = [];
      const center = 4.5;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 10; col++) {
          const dist = Math.abs(row - 3.5) + Math.abs(col - center);
          if (dist <= 4) {
            bricks.push({
              row,
              col,
              type: dist <= 1 ? BrickType.Explosive : dist <= 2 ? BrickType.Multi : BrickType.Standard,
              hits: dist <= 2 ? 3 : 1,
            });
          }
        }
      }
      return bricks;
    })(),
  },
  {
    name: 'Spiral',
    description: 'A spiraling challenge',
    gridCols: 10,
    gridRows: 8,
    ballSpeed: 1.1,
    bricks: (() => {
      const bricks: BrickDef[] = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 10; col++) {
          if ((row + col) % 2 === 0) {
            bricks.push({
              row,
              col,
              type: row < 2 ? BrickType.Multi : BrickType.Standard,
              hits: row < 2 ? 2 : 1,
              powerUp: (row === 3 && col === 4) ? PowerUpType.ExtraLife : undefined,
            });
          }
        }
      }
      return bricks;
    })(),
  },
  {
    name: 'Gauntlet',
    description: 'The ultimate test',
    gridCols: 10,
    gridRows: 8,
    ballSpeed: 1.2,
    paddleWidth: 0.8,
    bricks: Array.from({ length: 80 }, (_, i) => {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const isEdge = row === 0 || row === 7 || col === 0 || col === 9;
      return {
        row,
        col,
        type: isEdge ? BrickType.Multi : (row + col) % 7 === 0 ? BrickType.Explosive : BrickType.Standard,
        hits: isEdge ? 4 : 1,
        powerUp: (row === 4 && col === 5) ? PowerUpType.FireBall : undefined,
      };
    }),
  },
];
