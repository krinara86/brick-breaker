import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LevelGenerator } from '../../llm/level-generator';
import { BrickType, PowerUpType } from '../../types/level';
import { gameEventBus } from '../../types/events';

// Mock the HF client
vi.mock('../../llm/client', () => ({
  hfClient: {
    isConfigured: () => true,
    completeJSON: vi.fn(),
  },
}));

import { hfClient } from '../../llm/client';

describe('LevelGenerator', () => {
  let generator: LevelGenerator;

  beforeEach(() => {
    gameEventBus.clear();
    generator = new LevelGenerator();
    vi.clearAllMocks();
  });

  it('should validate a well-formed LLM response', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'Test Level',
        description: 'A test',
        gridCols: 10,
        gridRows: 8,
        bricks: [
          { row: 0, col: 0, type: BrickType.Standard, hits: 1 },
          { row: 1, col: 5, type: BrickType.Multi, hits: 3 },
        ],
      },
    });

    const result = await generator.generate('test level');
    expect(result.success).toBe(true);
    expect(result.level?.name).toBe('Test Level');
    expect(result.level?.bricks.length).toBe(2);
  });

  it('should clamp out-of-bounds brick positions', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'OOB Test',
        gridCols: 10,
        gridRows: 8,
        bricks: [
          { row: -5, col: 99, type: BrickType.Standard, hits: 1 },
          { row: 100, col: -1, type: BrickType.Standard, hits: 1 },
        ],
      },
    });

    const result = await generator.generate('oob test');
    expect(result.success).toBe(true);
    // Positions should be clamped
    for (const brick of result.level!.bricks) {
      expect(brick.row).toBeGreaterThanOrEqual(0);
      expect(brick.row).toBeLessThan(result.level!.gridRows);
      expect(brick.col).toBeGreaterThanOrEqual(0);
      expect(brick.col).toBeLessThan(result.level!.gridCols);
    }
  });

  it('should deduplicate bricks at the same position', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'Dedup Test',
        gridCols: 10,
        gridRows: 8,
        bricks: [
          { row: 0, col: 0, type: BrickType.Standard, hits: 1 },
          { row: 0, col: 0, type: BrickType.Multi, hits: 2 }, // duplicate position
          { row: 1, col: 1, type: BrickType.Standard, hits: 1 },
        ],
      },
    });

    const result = await generator.generate('dedup');
    expect(result.success).toBe(true);
    expect(result.level?.bricks.length).toBe(2); // Not 3
  });

  it('should sanitize invalid brick types to Standard', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'Bad Types',
        gridCols: 10,
        gridRows: 8,
        bricks: [
          { row: 0, col: 0, type: 'banana' as BrickType, hits: 1 },
        ],
      },
    });

    const result = await generator.generate('bad types');
    expect(result.success).toBe(true);
    expect(result.level?.bricks[0].type).toBe(BrickType.Standard);
  });

  it('should assign default powerup when powerup brick has invalid powerUp type', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'PU Test',
        gridCols: 10,
        gridRows: 8,
        bricks: [
          { row: 0, col: 0, type: BrickType.PowerUp, hits: 1, powerUp: 'invalidPowerUp' },
        ],
      },
    });

    const result = await generator.generate('pu test');
    expect(result.success).toBe(true);
    expect(result.level?.bricks[0].powerUp).toBe(PowerUpType.MultiBall);
  });

  it('should fail when LLM returns no bricks', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'Empty',
        gridCols: 10,
        gridRows: 8,
        bricks: [],
      },
    });

    const result = await generator.generate('empty level');
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least one brick');
  });

  it('should handle LLM API failure gracefully', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: false,
      error: 'API timeout',
    });

    const result = await generator.generate('anything');
    expect(result.success).toBe(false);
    expect(result.error).toBe('API timeout');
  });

  it('should clamp grid dimensions', async () => {
    vi.mocked(hfClient.completeJSON).mockResolvedValue({
      success: true,
      data: {
        name: 'Huge Grid',
        gridCols: 999,
        gridRows: 999,
        bricks: [{ row: 0, col: 0, type: BrickType.Standard, hits: 1 }],
      },
    });

    const result = await generator.generate('huge');
    expect(result.success).toBe(true);
    expect(result.level!.gridCols).toBeLessThanOrEqual(16);
    expect(result.level!.gridRows).toBeLessThanOrEqual(12);
  });
});
