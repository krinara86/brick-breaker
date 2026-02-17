import { PowerUpType } from './level';

/** All game events with their payloads */
export interface GameEventMap {
  // Ball events
  'ball:launch': { x: number; y: number };
  'ball:lost': { livesRemaining: number };
  'ball:wallBounce': { side: 'left' | 'right' | 'top' };
  'ball:paddleHit': { x: number; relativeX: number }; // relativeX: -1 to 1

  // Brick events
  'brick:hit': { row: number; col: number; hitsLeft: number };
  'brick:destroyed': { row: number; col: number; points: number };
  'brick:explode': { row: number; col: number };

  // Combo events
  'combo:increment': { combo: number };
  'combo:break': { finalCombo: number };

  // Power-up events
  'powerup:spawn': { type: PowerUpType; x: number; y: number };
  'powerup:collect': { type: PowerUpType };
  'powerup:expire': { type: PowerUpType };

  // Game state events
  'game:start': { level: number };
  'game:pause': undefined;
  'game:resume': undefined;
  'game:over': { score: number; level: number };
  'game:levelComplete': { level: number; score: number; perfect: boolean };
  'game:configChanged': { section: string; key: string; value: unknown };

  // Level events
  'level:loaded': { name: string; brickCount: number };
  'level:generated': { name: string; prompt: string };

  // Narrator events
  'narrator:speak': { text: string; priority: 'low' | 'medium' | 'high' };

  // LLM events
  'llm:request': { feature: string };
  'llm:response': { feature: string; success: boolean };
  'llm:error': { feature: string; error: string };
}

export type GameEventName = keyof GameEventMap;
export type GameEventPayload<E extends GameEventName> = GameEventMap[E];
export type GameEventHandler<E extends GameEventName> = (payload: GameEventMap[E]) => void;

/**
 * Typed event bus - the spine of the game architecture.
 * Decouples all systems: physics emits events, audio/particles/scoring subscribe.
 */
export class EventBus {
  private handlers = new Map<string, Set<GameEventHandler<GameEventName>>>();

  on<E extends GameEventName>(event: E, handler: GameEventHandler<E>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const handlerSet = this.handlers.get(event)!;
    handlerSet.add(handler as GameEventHandler<GameEventName>);

    // Return unsubscribe function
    return () => {
      handlerSet.delete(handler as GameEventHandler<GameEventName>);
    };
  }

  emit<E extends GameEventName>(event: E, payload: GameEventMap[E]): void {
    const handlerSet = this.handlers.get(event);
    if (handlerSet) {
      for (const handler of handlerSet) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`Event handler error for ${event}:`, err);
        }
      }
    }
  }

  off<E extends GameEventName>(event: E, handler?: GameEventHandler<E>): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler as GameEventHandler<GameEventName>);
    } else {
      this.handlers.delete(event);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** Singleton event bus instance */
export const gameEventBus = new EventBus();
