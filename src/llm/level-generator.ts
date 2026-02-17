import { hfClient } from './client';
import { LEVEL_GENERATOR_SYSTEM } from './prompts';
import { LevelSpec, BrickDef, BrickType, PowerUpType } from '../types/level';
import { gameEventBus } from '../types/events';

/**
 * Level Generator: Natural language → LevelSpec JSON → game loads it.
 * The LLM outputs structured data, the game engine interprets it.
 */
export class LevelGenerator {
  /**
   * Generate a level from a natural language description.
   */
  async generate(prompt: string): Promise<{ success: boolean; level?: LevelSpec; error?: string }> {
    gameEventBus.emit('llm:request', { feature: 'levelGenerator' });

    const result = await hfClient.completeJSON<LevelSpec>({
      systemPrompt: LEVEL_GENERATOR_SYSTEM,
      prompt: `Design a Brick Breaker level based on this description: "${prompt}"`,
      maxTokens: 2048,
      temperature: 0.5,
    });

    if (!result.success || !result.data) {
      gameEventBus.emit('llm:error', { feature: 'levelGenerator', error: result.error ?? 'Unknown' });
      return { success: false, error: result.error };
    }

    // Validate and sanitize the level
    const validated = this.validateLevel(result.data);
    if (!validated.success) {
      gameEventBus.emit('llm:error', { feature: 'levelGenerator', error: validated.error ?? 'Validation failed' });
      return validated;
    }

    gameEventBus.emit('llm:response', { feature: 'levelGenerator', success: true });
    gameEventBus.emit('level:generated', { name: validated.level!.name, prompt });
    return validated;
  }

  /**
   * Validate and sanitize an LLM-generated level spec.
   * Ensures all values are within acceptable ranges.
   */
  private validateLevel(raw: Partial<LevelSpec>): { success: boolean; level?: LevelSpec; error?: string } {
    try {
      const level: LevelSpec = {
        name: typeof raw.name === 'string' ? raw.name.slice(0, 50) : 'Generated Level',
        description: typeof raw.description === 'string' ? raw.description.slice(0, 200) : undefined,
        gridCols: this.clamp(raw.gridCols ?? 10, 4, 16),
        gridRows: this.clamp(raw.gridRows ?? 8, 2, 12),
        ballSpeed: this.clamp(raw.ballSpeed ?? 1.0, 0.3, 2.0),
        paddleWidth: this.clamp(raw.paddleWidth ?? 1.0, 0.3, 2.0),
        bricks: [],
      };

      if (!Array.isArray(raw.bricks) || raw.bricks.length === 0) {
        return { success: false, error: 'Level must contain at least one brick' };
      }

      // Validate each brick
      const validTypes = new Set(Object.values(BrickType));
      const validPowerUps = new Set(Object.values(PowerUpType));

      for (const brick of raw.bricks) {
        if (typeof brick !== 'object' || brick === null) continue;

        const b: BrickDef = {
          row: this.clamp(Math.floor(brick.row ?? 0), 0, level.gridRows - 1),
          col: this.clamp(Math.floor(brick.col ?? 0), 0, level.gridCols - 1),
          type: validTypes.has(brick.type as BrickType) ? brick.type as BrickType : BrickType.Standard,
          hits: this.clamp(brick.hits ?? 1, 1, 5),
        };

        if (b.type === BrickType.PowerUp && brick.powerUp && validPowerUps.has(brick.powerUp as PowerUpType)) {
          b.powerUp = brick.powerUp as PowerUpType;
        } else if (b.type === BrickType.PowerUp) {
          b.powerUp = PowerUpType.MultiBall; // Default power-up
        }

        if (b.type === BrickType.Indestructible) {
          b.hits = 999;
        }

        level.bricks.push(b);
      }

      // Deduplicate bricks at the same position
      const seen = new Set<string>();
      level.bricks = level.bricks.filter(b => {
        const key = `${b.row},${b.col}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (level.bricks.length === 0) {
        return { success: false, error: 'No valid bricks after validation' };
      }

      return { success: true, level };
    } catch (err) {
      return { success: false, error: `Validation error: ${err instanceof Error ? err.message : 'Unknown'}` };
    }
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, typeof val === 'number' ? val : min));
  }
}

export const levelGenerator = new LevelGenerator();
