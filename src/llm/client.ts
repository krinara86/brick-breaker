export interface HFCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface HFResponse {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * HuggingFace Inference API client.
 * Wraps the text generation endpoint with error handling and rate limiting.
 */
export class HFClient {
  private apiKey: string;
  private model: string;
  private lastCallTime = 0;
  private minInterval = 1000; // ms between calls

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_HF_API_KEY || '';
    this.model = model || import.meta.env.VITE_HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0 && this.apiKey !== 'your_huggingface_api_key_here';
  }

  async complete(options: HFCompletionOptions): Promise<HFResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        text: '',
        error: 'HuggingFace API key not configured. Add VITE_HF_API_KEY to your .env file.',
      };
    }

    // Rate limiting
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastCallTime = Date.now();

    try {
      // Build the prompt in instruction format
      const fullPrompt = options.systemPrompt
        ? `<s>[INST] ${options.systemPrompt}\n\n${options.prompt} [/INST]`
        : `<s>[INST] ${options.prompt} [/INST]`;

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${this.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: options.maxTokens ?? 1024,
              temperature: options.temperature ?? 0.7,
              return_full_text: false,
              do_sample: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // Model loading case
        if (response.status === 503) {
          return {
            success: false,
            text: '',
            error: 'Model is loading, please try again in a few seconds.',
          };
        }
        return {
          success: false,
          text: '',
          error: `HuggingFace API error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      const text = Array.isArray(data) ? data[0]?.generated_text ?? '' : data.generated_text ?? '';

      return { success: true, text: text.trim() };
    } catch (err) {
      return {
        success: false,
        text: '',
        error: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Complete and parse JSON from the response.
   * The LLM is instructed to output JSON, and we extract it.
   */
  async completeJSON<T>(options: HFCompletionOptions): Promise<{ success: boolean; data?: T; error?: string }> {
    const response = await this.complete({
      ...options,
      temperature: options.temperature ?? 0.3, // Lower temp for structured output
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    try {
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try array format
        const arrayMatch = response.text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const data = JSON.parse(arrayMatch[0]) as T;
          return { success: true, data };
        }
        return { success: false, error: 'No JSON found in response' };
      }

      const data = JSON.parse(jsonMatch[0]) as T;
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: `JSON parse error: ${err instanceof Error ? err.message : 'Unknown'}. Raw: ${response.text.slice(0, 200)}`,
      };
    }
  }
}

/** Singleton client instance */
export const hfClient = new HFClient();
