import { LevelSpec, BUILT_IN_LEVELS, BrickType, PowerUpType } from '../../types/level';
import { GameConfig, ConfigPatch, DEFAULT_CONFIG, applyConfigPatch } from '../../types/config';
import { GameStats, DEFAULT_STATS } from '../../types/stats';
import { gameEventBus } from '../../types/events';

/**
 * GameCommandAPI — the single entry point for all game mutations.
 *
 * Both the React UI and LLM integrations call this API.
 * The LLM never touches Phaser internals directly.
 * This is the "Command Pattern" in action.
 */
export class GameCommandAPI {
  private config: GameConfig = structuredClone(DEFAULT_CONFIG);
  private stats: GameStats = structuredClone(DEFAULT_STATS);
  private currentLevel: LevelSpec | null = null;
  private currentLevelIndex = 0;
  private phaserScene: Phaser.Scene | null = null;
  private _onConfigChange?: (config: GameConfig) => void;
  private _onStatsChange?: (stats: GameStats) => void;
  private _onLevelLoad?: (level: LevelSpec) => void;
  private _onNarratorSpeak?: (text: string) => void;

  constructor() {
    // Wire up event bus listeners for stats tracking
    gameEventBus.on('brick:destroyed', (payload) => {
      this.stats.bricksDestroyed++;
      this.stats.bricksRemaining--;
      this.stats.score += payload.points;
      this.notifyStatsChange();
    });

    gameEventBus.on('combo:increment', ({ combo }) => {
      this.stats.currentCombo = combo;
      if (combo > this.stats.maxCombo) this.stats.maxCombo = combo;
      this.notifyStatsChange();
    });

    gameEventBus.on('combo:break', () => {
      this.stats.currentCombo = 0;
      this.notifyStatsChange();
    });

    gameEventBus.on('ball:lost', ({ livesRemaining }) => {
      this.stats.lives = livesRemaining;
      this.stats.deathCount++;
      this.notifyStatsChange();
    });

    gameEventBus.on('powerup:collect', ({ type }) => {
      this.stats.powerUpsCollected.push(type);
      this.notifyStatsChange();
    });

    gameEventBus.on('narrator:speak', ({ text }) => {
      this._onNarratorSpeak?.(text);
    });
  }

  // --- Scene binding ---

  bindScene(scene: Phaser.Scene): void {
    this.phaserScene = scene;
  }

  // --- Callback registration (React subscribes here) ---

  onConfigChange(cb: (config: GameConfig) => void): void {
    this._onConfigChange = cb;
  }

  onStatsChange(cb: (stats: GameStats) => void): void {
    this._onStatsChange = cb;
  }

  onLevelLoad(cb: (level: LevelSpec) => void): void {
    this._onLevelLoad = cb;
  }

  onNarratorSpeak(cb: (text: string) => void): void {
    this._onNarratorSpeak = cb;
  }

  // --- Level commands ---

  loadLevel(spec: LevelSpec): void {
    this.currentLevel = spec;
    this.stats.bricksRemaining = spec.bricks.filter(b => b.type !== BrickType.Indestructible).length;
    this.stats.totalBricks = this.stats.bricksRemaining;
    this.stats.bricksDestroyed = 0;
    this.stats.currentCombo = 0;

    // Apply level-specific config overrides
    if (spec.ballSpeed) {
      this.config.ball.speed = DEFAULT_CONFIG.ball.speed * spec.ballSpeed;
    }
    if (spec.paddleWidth) {
      this.config.paddle.width = DEFAULT_CONFIG.paddle.width * spec.paddleWidth;
    }

    this._onLevelLoad?.(spec);
    this._onConfigChange?.(this.config);
    gameEventBus.emit('level:loaded', { name: spec.name, brickCount: this.stats.totalBricks });
    this.notifyStatsChange();
  }

  loadBuiltInLevel(index: number): void {
    if (index >= 0 && index < BUILT_IN_LEVELS.length) {
      this.currentLevelIndex = index;
      this.stats.level = index + 1;
      this.loadLevel(BUILT_IN_LEVELS[index]);
    }
  }

  nextLevel(): boolean {
    const nextIndex = this.currentLevelIndex + 1;
    if (nextIndex < BUILT_IN_LEVELS.length) {
      this.loadBuiltInLevel(nextIndex);
      return true;
    }
    return false;
  }

  getLevelCount(): number {
    return BUILT_IN_LEVELS.length;
  }

  getCurrentLevel(): LevelSpec | null {
    return this.currentLevel;
  }

  // --- Config commands (Chat-to-Config targets these) ---

  applyConfig(patch: ConfigPatch): GameConfig {
    this.config = applyConfigPatch(this.config, patch);
    this._onConfigChange?.(this.config);

    // Emit events for each changed section
    for (const [section, values] of Object.entries(patch)) {
      if (values) {
        for (const [key, value] of Object.entries(values)) {
          gameEventBus.emit('game:configChanged', { section, key, value });
        }
      }
    }

    return this.config;
  }

  getConfig(): GameConfig {
    return structuredClone(this.config);
  }

  resetConfig(): void {
    this.config = structuredClone(DEFAULT_CONFIG);
    this._onConfigChange?.(this.config);
  }

  // --- Stats ---

  getStats(): GameStats {
    return structuredClone(this.stats);
  }

  resetStats(): void {
    this.stats = structuredClone(DEFAULT_STATS);
    this.stats.lives = this.config.gameplay.lives;
    this.notifyStatsChange();
  }

  updateTimePlaying(delta: number): void {
    this.stats.timePlaying += delta;
  }

  // --- Power-up commands ---

  spawnPowerUp(type: PowerUpType, x?: number, y?: number): void {
    gameEventBus.emit('powerup:spawn', {
      type,
      x: x ?? 400,
      y: y ?? 200,
    });
  }

  // --- Game flow ---

  startGame(): void {
    this.resetStats();
    this.loadBuiltInLevel(0);
    gameEventBus.emit('game:start', { level: 1 });
  }

  pauseGame(): void {
    gameEventBus.emit('game:pause', undefined);
  }

  resumeGame(): void {
    gameEventBus.emit('game:resume', undefined);
  }

  gameOver(): void {
    gameEventBus.emit('game:over', { score: this.stats.score, level: this.stats.level });
  }

  levelComplete(): void {
    const perfect = this.stats.deathCount === 0;
    if (perfect) this.stats.perfectLevels++;
    gameEventBus.emit('game:levelComplete', {
      level: this.stats.level,
      score: this.stats.score,
      perfect,
    });
  }

  // --- Private ---

  private notifyStatsChange(): void {
    this._onStatsChange?.(structuredClone(this.stats));
  }
}

/** Singleton instance */
export const gameAPI = new GameCommandAPI();
