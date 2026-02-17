import { describe, it, expect } from 'vitest';
import { BUILT_IN_LEVELS, BrickType, LevelSpec } from '../../types/level';

describe('Level System', () => {
  describe('Built-in levels', () => {
    it('should have at least 3 built-in levels', () => {
      expect(BUILT_IN_LEVELS.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid structure for all built-in levels', () => {
      for (const level of BUILT_IN_LEVELS) {
        expect(level.name).toBeTruthy();
        expect(level.gridCols).toBeGreaterThan(0);
        expect(level.gridRows).toBeGreaterThan(0);
        expect(level.bricks.length).toBeGreaterThan(0);
      }
    });

    it('should have bricks within grid bounds', () => {
      for (const level of BUILT_IN_LEVELS) {
        for (const brick of level.bricks) {
          expect(brick.row).toBeGreaterThanOrEqual(0);
          expect(brick.row).toBeLessThan(level.gridRows);
          expect(brick.col).toBeGreaterThanOrEqual(0);
          expect(brick.col).toBeLessThan(level.gridCols);
        }
      }
    });

    it('should have valid brick types', () => {
      const validTypes = new Set(Object.values(BrickType));
      for (const level of BUILT_IN_LEVELS) {
        for (const brick of level.bricks) {
          expect(validTypes.has(brick.type)).toBe(true);
        }
      }
    });

    it('should have at least one destructible brick per level', () => {
      for (const level of BUILT_IN_LEVELS) {
        const destructible = level.bricks.filter(b => b.type !== BrickType.Indestructible);
        expect(destructible.length).toBeGreaterThan(0);
      }
    });

    it('should not have duplicate brick positions within a level', () => {
      for (const level of BUILT_IN_LEVELS) {
        const positions = new Set<string>();
        for (const brick of level.bricks) {
          const key = `${brick.row},${brick.col}`;
          expect(positions.has(key)).toBe(false);
          positions.add(key);
        }
      }
    });
  });

  describe('LevelSpec validation', () => {
    it('should accept a minimal valid level', () => {
      const level: LevelSpec = {
        name: 'Test',
        gridCols: 5,
        gridRows: 3,
        bricks: [{ row: 0, col: 0, type: BrickType.Standard, hits: 1 }],
      };
      expect(level.bricks.length).toBe(1);
      expect(level.name).toBe('Test');
    });

    it('should handle optional fields gracefully', () => {
      const level: LevelSpec = {
        name: 'Minimal',
        gridCols: 10,
        gridRows: 8,
        bricks: [{ row: 0, col: 0, type: BrickType.Standard }],
      };
      expect(level.ballSpeed).toBeUndefined();
      expect(level.paddleWidth).toBeUndefined();
      expect(level.background).toBeUndefined();
    });
  });
});
