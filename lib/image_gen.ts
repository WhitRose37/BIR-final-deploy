/**
 * ⚠️ FILE DEPRECATED - DO NOT USE
 * 
 * Image generation via OpenAI/OpenRouter has been disabled.
 * 
 * Use instead:
 * - lib/googleSearch.ts → googleSearchImage() for image search
 * - lib/pipeline/images.ts → getImagesOrGenerate() for orchestration
 */

export const image_gen = {
  async text2im(): Promise<never> {
    throw new Error(
      "❌ Image generation is disabled. Use Google Custom Search Images instead. " +
      "See: lib/googleSearch.ts → googleSearchImage()"
    );
  },
};
