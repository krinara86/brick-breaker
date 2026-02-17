import { hfClient } from './client';
import { NARRATOR_SYSTEM_TEMPLATES, NARRATOR_EVENT_TEMPLATES } from './prompts';
import { gameEventBus, GameEventName, GameEventPayload } from '../types/events';
import { gameAPI } from '../game/api/GameCommandAPI';

export type NarratorPersonality = keyof typeof NARRATOR_SYSTEM_TEMPLATES;

/**
 * Dynamic Narrator: Subscribes to game events, batches them,
 * periodically calls the LLM for personality-driven commentary.
 *
 * This is the most "fluid" LLM feature - it generates free-form text.
 */
export class Narrator {
  private personality: NarratorPersonality = 'hype';
  private eventBuffer: string[] = [];
  private isProcessing = false;
  private minInterval = 5000; // ms between narrator outputs
  private lastSpeakTime = 0;
  private enabled = false;
  private unsubscribers: Array<() => void> = [];

  /** Start listening to game events */
  start(personality?: NarratorPersonality): void {
    if (personality) this.personality = personality;
    this.enabled = true;
    this.eventBuffer = [];

    // Subscribe to interesting events
    const events: GameEventName[] = [
      'game:start', 'brick:destroyed', 'combo:break',
      'ball:lost', 'powerup:collect', 'game:levelComplete', 'game:over',
    ];

    for (const event of events) {
      const unsub = gameEventBus.on(event, ((payload: GameEventPayload<typeof event>) => {
        this.onGameEvent(event, payload);
      }) as never);
      this.unsubscribers.push(unsub);
    }
  }

  /** Stop listening */
  stop(): void {
    this.enabled = false;
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.eventBuffer = [];
  }

  /** Change personality mid-game */
  setPersonality(personality: NarratorPersonality): void {
    this.personality = personality;
  }

  getPersonality(): NarratorPersonality {
    return this.personality;
  }

  getAvailablePersonalities(): NarratorPersonality[] {
    return Object.keys(NARRATOR_SYSTEM_TEMPLATES) as NarratorPersonality[];
  }

  private onGameEvent(event: GameEventName, payload: unknown): void {
    if (!this.enabled) return;

    const template = NARRATOR_EVENT_TEMPLATES[event];
    if (!template) return;

    // Fill in template with payload values
    let description = template;
    if (payload && typeof payload === 'object') {
      for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
        description = description.replace(`{${key}}`, String(value));
      }
    }

    // Add current stats context
    const stats = gameAPI.getStats();
    description += ` [Stats: Score=${stats.score}, Lives=${stats.lives}, Combo=${stats.currentCombo}]`;

    this.eventBuffer.push(description);

    // High-priority events trigger immediate narration
    const highPriority: GameEventName[] = ['ball:lost', 'game:levelComplete', 'game:over'];
    if (highPriority.includes(event)) {
      this.flush();
      return;
    }

    // Combo milestones
    if (event === 'combo:break' && payload && (payload as { finalCombo: number }).finalCombo >= 5) {
      this.flush();
      return;
    }

    // Otherwise, check if enough time has passed
    if (Date.now() - this.lastSpeakTime > this.minInterval && this.eventBuffer.length >= 3) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.isProcessing || this.eventBuffer.length === 0 || !this.enabled) return;

    this.isProcessing = true;
    const events = this.eventBuffer.splice(0, 10); // Take up to 10 events

    try {
      if (!hfClient.isConfigured()) {
        // Fallback: generate simple commentary without LLM
        const fallback = this.generateFallbackComment(events);
        if (fallback) {
          gameEventBus.emit('narrator:speak', { text: fallback, priority: 'medium' });
        }
        return;
      }

      gameEventBus.emit('llm:request', { feature: 'narrator' });

      const systemPrompt = NARRATOR_SYSTEM_TEMPLATES[this.personality];
      const result = await hfClient.complete({
        systemPrompt,
        prompt: `Recent game events:\n${events.join('\n')}\n\nProvide a short, in-character commentary on what just happened.`,
        maxTokens: 100,
        temperature: 0.9,
      });

      if (result.success && result.text) {
        gameEventBus.emit('narrator:speak', { text: result.text, priority: 'medium' });
        gameEventBus.emit('llm:response', { feature: 'narrator', success: true });
      } else {
        gameEventBus.emit('llm:error', { feature: 'narrator', error: result.error ?? 'Empty' });
      }
    } catch (err) {
      console.error('Narrator error:', err);
    } finally {
      this.isProcessing = false;
      this.lastSpeakTime = Date.now();
    }
  }

  /** Simple fallback commentary when LLM is unavailable */
  private generateFallbackComment(events: string[]): string | null {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return null;

    if (lastEvent.includes('lost the ball')) return '💀 Ouch! Watch that ball!';
    if (lastEvent.includes('completed level')) return '🎉 Level complete! Onwards!';
    if (lastEvent.includes('Game over')) return '💥 Game over! What a run!';
    if (lastEvent.includes('combo')) return '🔥 Nice combo streak!';
    if (lastEvent.includes('power-up')) return '⚡ Power up! Let\'s go!';
    if (events.length >= 5) return '🧱 Bricks are falling fast!';
    return null;
  }
}

export const narrator = new Narrator();
