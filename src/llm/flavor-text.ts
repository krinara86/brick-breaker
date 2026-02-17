import { hfClient } from './client';
import { FLAVOR_TEXT_SYSTEM } from './prompts';
import { PowerUpType } from '../types/level';
import { gameEventBus } from '../types/events';

interface FlavorText {
  name: string;
  description: string;
}

/** Static fallback flavor texts (used when LLM is unavailable) */
const FALLBACK_FLAVOR: Record<PowerUpType, FlavorText> = {
  [PowerUpType.MultiBall]: { name: 'Quantum Split', description: 'Your ball fragments into a chaotic trio of destruction.' },
  [PowerUpType.WidePaddle]: { name: 'Titan\'s Reach', description: 'Your paddle expands to dominate the battlefield.' },
  [PowerUpType.NarrowPaddle]: { name: 'Needle Mode', description: 'Your paddle shrinks. Good luck with that.' },
  [PowerUpType.FastBall]: { name: 'Lightspeed', description: 'The ball accelerates beyond mortal reflexes.' },
  [PowerUpType.SlowBall]: { name: 'Time Warp', description: 'Reality bends as the ball crawls through spacetime.' },
  [PowerUpType.Laser]: { name: 'Death Ray', description: 'Your paddle transforms into a brick-melting laser cannon.' },
  [PowerUpType.StickyPaddle]: { name: 'Gecko Grip', description: 'The ball sticks to your paddle for a precision relaunch.' },
  [PowerUpType.ExtraLife]: { name: 'Second Wind', description: 'Death takes a coffee break. You live another day.' },
  [PowerUpType.FireBall]: { name: 'Inferno Sphere', description: 'An unstoppable fireball that tears through everything.' },
};

/**
 * Flavor Text: PowerUpData → creative name and description.
 * Results are cached so we don't call the API for repeats.
 */
export class FlavorTextGenerator {
  private cache = new Map<string, FlavorText>();

  async generate(type: PowerUpType): Promise<FlavorText> {
    // Check cache first
    const cached = this.cache.get(type);
    if (cached) return cached;

    // Check if LLM is available
    if (!hfClient.isConfigured()) {
      return FALLBACK_FLAVOR[type] ?? { name: type, description: 'A mysterious power-up.' };
    }

    gameEventBus.emit('llm:request', { feature: 'flavorText' });

    const effectDescriptions: Record<PowerUpType, string> = {
      [PowerUpType.MultiBall]: 'Splits the ball into 3 balls',
      [PowerUpType.WidePaddle]: 'Makes the paddle 50% wider for 10 seconds',
      [PowerUpType.NarrowPaddle]: 'Shrinks the paddle by 40% for 8 seconds',
      [PowerUpType.FastBall]: 'Increases ball speed by 40% for 8 seconds',
      [PowerUpType.SlowBall]: 'Decreases ball speed by 30% for 8 seconds',
      [PowerUpType.Laser]: 'Paddle shoots lasers for 8 seconds',
      [PowerUpType.StickyPaddle]: 'Next paddle hit catches the ball',
      [PowerUpType.ExtraLife]: 'Grants one extra life',
      [PowerUpType.FireBall]: 'Ball passes through bricks for 8 seconds',
    };

    const result = await hfClient.completeJSON<FlavorText>({
      systemPrompt: FLAVOR_TEXT_SYSTEM,
      prompt: `Power-up type: "${type}". Effect: ${effectDescriptions[type] ?? 'Unknown effect'}.`,
      maxTokens: 128,
      temperature: 0.8, // Higher creativity for flavor text
    });

    if (result.success && result.data?.name && result.data?.description) {
      const flavor: FlavorText = {
        name: result.data.name.slice(0, 30),
        description: result.data.description.slice(0, 80),
      };
      this.cache.set(type, flavor);
      gameEventBus.emit('llm:response', { feature: 'flavorText', success: true });
      return flavor;
    }

    gameEventBus.emit('llm:error', { feature: 'flavorText', error: result.error ?? 'Parse failed' });
    return FALLBACK_FLAVOR[type] ?? { name: type, description: 'A mysterious power-up.' };
  }

  /** Get all cached flavor texts */
  getCached(): Map<string, FlavorText> {
    return new Map(this.cache);
  }

  /** Preload flavor for all power-up types */
  async preloadAll(): Promise<void> {
    const types = Object.values(PowerUpType);
    await Promise.allSettled(types.map(t => this.generate(t)));
  }
}

export const flavorTextGenerator = new FlavorTextGenerator();
