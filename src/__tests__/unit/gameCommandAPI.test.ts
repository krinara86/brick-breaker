import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameCommandAPI } from '../../game/api/GameCommandAPI';
import { BrickType, PowerUpType } from '../../types/level';
import { gameEventBus } from '../../types/events';

describe('GameCommandAPI', () => {
  let api: GameCommandAPI;

  beforeEach(() => {
    gameEventBus.clear();
    api = new GameCommandAPI();
  });

  describe('Config management', () => {
    it('should return default config initially', () => {
      const config = api.getConfig();
      expect(config.ball.speed).toBe(300);
      expect(config.paddle.width).toBe(120);
      expect(config.gameplay.lives).toBe(3);
    });

    it('should apply config patches', () => {
      const config = api.applyConfig({ ball: { speed: 500 } });
      expect(config.ball.speed).toBe(500);
      expect(config.paddle.width).toBe(120); // unchanged
    });

    it('should emit events on config change', () => {
      const handler = vi.fn();
      gameEventBus.on('game:configChanged', handler);

      api.applyConfig({ ball: { speed: 400 } });
      expect(handler).toHaveBeenCalledWith({ section: 'ball', key: 'speed', value: 400 });
    });

    it('should reset to defaults', () => {
      api.applyConfig({ ball: { speed: 999 } });
      api.resetConfig();
      expect(api.getConfig().ball.speed).toBe(300);
    });
  });

  describe('Level management', () => {
    it('should load built-in levels', () => {
      const onLevelLoad = vi.fn();
      api.onLevelLoad(onLevelLoad);
      api.loadBuiltInLevel(0);

      expect(onLevelLoad).toHaveBeenCalledOnce();
      expect(api.getCurrentLevel()?.name).toBe('Classic');
    });

    it('should track brick counts', () => {
      const onStats = vi.fn();
      api.onStatsChange(onStats);
      api.loadBuiltInLevel(0);

      const stats = api.getStats();
      expect(stats.totalBricks).toBeGreaterThan(0);
      expect(stats.bricksRemaining).toBe(stats.totalBricks);
    });

    it('should load custom levels', () => {
      api.loadLevel({
        name: 'Custom',
        gridCols: 5,
        gridRows: 3,
        bricks: [
          { row: 0, col: 0, type: BrickType.Standard, hits: 1 },
          { row: 0, col: 1, type: BrickType.Multi, hits: 3 },
          { row: 1, col: 0, type: BrickType.Indestructible, hits: 999 },
        ],
      });

      const stats = api.getStats();
      // Indestructible bricks don't count toward total
      expect(stats.totalBricks).toBe(2);
      expect(stats.bricksRemaining).toBe(2);
    });

    it('should advance to next level', () => {
      api.startGame();
      const hasNext = api.nextLevel();
      expect(hasNext).toBe(true);
      expect(api.getStats().level).toBe(2);
    });
  });

  describe('Stats tracking', () => {
    it('should start with default stats', () => {
      const stats = api.getStats();
      expect(stats.score).toBe(0);
      expect(stats.deathCount).toBe(0);
    });

    it('should update score on brick destroyed events', () => {
      api.startGame();
      gameEventBus.emit('brick:destroyed', { row: 0, col: 0, points: 10 });

      const stats = api.getStats();
      expect(stats.score).toBe(10);
      expect(stats.bricksDestroyed).toBe(1);
    });

    it('should track combos', () => {
      api.startGame();
      gameEventBus.emit('combo:increment', { combo: 3 });

      const stats = api.getStats();
      expect(stats.currentCombo).toBe(3);
      expect(stats.maxCombo).toBe(3);
    });

    it('should track deaths', () => {
      api.startGame();
      gameEventBus.emit('ball:lost', { livesRemaining: 2 });

      const stats = api.getStats();
      expect(stats.lives).toBe(2);
      expect(stats.deathCount).toBe(1);
    });

    it('should track power-up collections', () => {
      api.startGame();
      gameEventBus.emit('powerup:collect', { type: PowerUpType.MultiBall });
      gameEventBus.emit('powerup:collect', { type: PowerUpType.Laser });

      const stats = api.getStats();
      expect(stats.powerUpsCollected).toEqual([PowerUpType.MultiBall, PowerUpType.Laser]);
    });

    it('should reset stats properly', () => {
      api.startGame();
      gameEventBus.emit('brick:destroyed', { row: 0, col: 0, points: 50 });
      api.resetStats();

      expect(api.getStats().score).toBe(0);
      expect(api.getStats().bricksDestroyed).toBe(0);
    });
  });

  describe('Game flow', () => {
    it('should emit game:start on start', () => {
      const handler = vi.fn();
      gameEventBus.on('game:start', handler);
      api.startGame();
      expect(handler).toHaveBeenCalledWith({ level: 1 });
    });

    it('should emit game:over', () => {
      const handler = vi.fn();
      gameEventBus.on('game:over', handler);
      api.startGame();
      api.gameOver();
      expect(handler).toHaveBeenCalled();
    });

    it('should emit game:levelComplete with perfect tracking', () => {
      const handler = vi.fn();
      gameEventBus.on('game:levelComplete', handler);
      api.startGame();
      api.levelComplete();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ level: 1, perfect: true })
      );
      expect(api.getStats().perfectLevels).toBe(1);
    });
  });
});
