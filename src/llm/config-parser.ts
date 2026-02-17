import { hfClient } from './client';
import { CONFIG_PARSER_SYSTEM } from './prompts';
import { ConfigPatch } from '../types/config';
import { gameEventBus } from '../types/events';

/**
 * Config Parser: Natural language → ConfigPatch JSON → game applies it.
 * Pure function-calling pattern. LLM does zero reasoning, just maps NL to schema.
 */
export class ConfigParser {
  async parse(input: string): Promise<{ success: boolean; patch?: ConfigPatch; error?: string }> {
    gameEventBus.emit('llm:request', { feature: 'configParser' });

    const result = await hfClient.completeJSON<ConfigPatch>({
      systemPrompt: CONFIG_PARSER_SYSTEM,
      prompt: input,
      maxTokens: 512,
      temperature: 0.2, // Very low temp for deterministic mapping
    });

    if (!result.success || !result.data) {
      gameEventBus.emit('llm:error', { feature: 'configParser', error: result.error ?? 'Unknown' });
      return { success: false, error: result.error };
    }

    // Validate the patch structure
    const validated = this.validatePatch(result.data);
    gameEventBus.emit('llm:response', { feature: 'configParser', success: validated.success });
    return validated;
  }

  private validatePatch(raw: Record<string, unknown>): { success: boolean; patch?: ConfigPatch; error?: string } {
    const validSections = new Set(['ball', 'paddle', 'gameplay', 'visual']);
    const patch: ConfigPatch = {};

    for (const [section, values] of Object.entries(raw)) {
      if (!validSections.has(section)) continue;
      if (typeof values !== 'object' || values === null) continue;

      (patch as Record<string, unknown>)[section] = { ...values as Record<string, unknown> };
    }

    if (Object.keys(patch).length === 0) {
      return { success: false, error: 'No valid configuration changes parsed' };
    }

    return { success: true, patch };
  }
}

export const configParser = new ConfigParser();
