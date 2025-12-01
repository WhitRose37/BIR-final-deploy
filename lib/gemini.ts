/**
 * ⚠️ FILE DEPRECATED - Gemini integration disabled
 * 
 * This file is kept for reference but not used in production.
 * Use Perplexity API instead (lib/perplexity.ts)
 */

export const gemini = {
  async complete(): Promise<never> {
    throw new Error(
      "❌ Gemini integration is disabled. Use Perplexity API instead. " +
      "See: lib/perplexity.ts → perplexitySummarizeFromSources()"
    );
  },
};

export async function listGeminiModels(): Promise<string[]> {
  console.warn("⚠️ Gemini is disabled, returning empty array");
  return [];
}
