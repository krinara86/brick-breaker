import { describe, it, expect } from 'vitest';
import { applyConfigPatch, DEFAULT_CONFIG, ConfigPatch } from '../../types/config';

describe('Config System', () => {
  describe('applyConfigPatch', () => {
    it('should apply a simple ball speed change', () => {
      const patch: ConfigPatch = { ball: { speed: 500 } };
      const result = applyConfigPatch(DEFAULT_CONFIG, patch);

      expect(result.ball.speed).toBe(500);
      // Other values unchanged
      expect(result.ball.radius).toBe(DEFAULT_CONFIG.ball.radius);
      expect(result.paddle.width).toBe(DEFAULT_CONFIG.paddle.width);
    });

    it('should apply changes across multiple sections', () => {
      const patch: ConfigPatch = {
        ball: { speed: 400, radius: 12 },
        paddle: { width: 200 },
        gameplay: { lives: 5 },
      };
      const result = applyConfigPatch(DEFAULT_CONFIG, patch);

      expect(result.ball.speed).toBe(400);
      expect(result.ball.radius).toBe(12);
      expect(result.paddle.width).toBe(200);
      expect(result.gameplay.lives).toBe(5);
    });

    it('should clamp values to valid ranges', () => {
      const patch: ConfigPatch = {
        ball: { speed: 9999, radius: -5 },
        gameplay: { lives: 100 },
      };
      const result = applyConfigPatch(DEFAULT_CONFIG, patch);

      expect(result.ball.speed).toBe(800);    // max
      expect(result.ball.radius).toBe(4);      // min
      expect(result.gameplay.lives).toBe(10);  // max
    });

    it('should not mutate the original config', () => {
      const original = structuredClone(DEFAULT_CONFIG);
      const patch: ConfigPatch = { ball: { speed: 999 } };
      applyConfigPatch(DEFAULT_CONFIG, patch);

      expect(DEFAULT_CONFIG.ball.speed).toBe(original.ball.speed);
    });

    it('should handle empty patch', () => {
      const result = applyConfigPatch(DEFAULT_CONFIG, {});
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should handle visual config (non-numeric values)', () => {
      const patch: ConfigPatch = {
        visual: { backgroundColor: '#ff0000', particlesEnabled: false },
      };
      const result = applyConfigPatch(DEFAULT_CONFIG, patch);

      expect(result.visual.backgroundColor).toBe('#ff0000');
      expect(result.visual.particlesEnabled).toBe(false);
    });

    it('should ignore unknown sections', () => {
      const patch = { unknownSection: { foo: 'bar' } } as unknown as ConfigPatch;
      const result = applyConfigPatch(DEFAULT_CONFIG, patch);
      expect(result).toEqual(DEFAULT_CONFIG);
    });
  });
});
