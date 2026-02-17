/** Real-time game statistics - fed to narrator and used for difficulty */
export interface GameStats {
  score: number;
  lives: number;
  level: number;
  bricksRemaining: number;
  bricksDestroyed: number;
  totalBricks: number;
  currentCombo: number;
  maxCombo: number;
  ballsInPlay: number;
  powerUpsCollected: string[];
  timePlaying: number;      // seconds
  deathCount: number;
  shotsFired: number;       // laser shots
  perfectLevels: number;    // levels completed without losing a life
}

/** Default starting stats */
export const DEFAULT_STATS: GameStats = {
  score: 0,
  lives: 3,
  level: 1,
  bricksRemaining: 0,
  bricksDestroyed: 0,
  totalBricks: 0,
  currentCombo: 0,
  maxCombo: 0,
  ballsInPlay: 1,
  powerUpsCollected: [],
  timePlaying: 0,
  deathCount: 0,
  shotsFired: 0,
  perfectLevels: 0,
};
