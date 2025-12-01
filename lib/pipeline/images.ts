// lib/pipeline/images.ts
import { image_gen } from "@/lib/image_gen";
import { fetchImages } from "@/lib/fetchPages";
import { googleSearchImage } from "@/lib/googleSearch";

// Placeholder images สำหรับ fallback
const PLACEHOLDER_IMAGES = [
  "https://via.placeholder.com/1024x768?text=Product+Image+1",
  "https://via.placeholder.com/1024x768?text=Product+Image+2",
  "https://via.placeholder.com/1024x768?text=Product+Image+3",
  "https://via.placeholder.com/1024x768?text=Product+Image+4",
  "https://via.placeholder.com/1024x768?text=Product+Image+5",
  "https://via.placeholder.com/1024x768?text=Product+Image+6",
];

/**
 * Build AI prompt for image generation
 * Used as fallback when Google Search returns no results
 */
function buildPrompt(part: string, fields: any): string {
  const name = fields?.product_name || fields?.common_name_en || part;
  const specs = [
    fields?.common_name_en,
    fields?.characteristics_of_material_en,
  ].filter(Boolean).join(", ");

  return [
    `hyper-realistic professional product photography of ${name}`,
    specs,
    "isolated on clean white background",
    "studio lighting, 8k resolution, highly detailed texture, sharp focus",
    "no text, no watermark, no labels, no ruler, no measuring tape",
    "pure product view, photorealistic"
  ].filter(Boolean).join(", ");
}

/**
 * Main orchestrator for image retrieval
 * Called ONCE per summarization
 */
export async function getImagesOrGenerate(
  part: string,
  fields: any
): Promise<string[]> {
  const images: string[] = [];

  // 1. Try Google Image Search (Get 1 Real Image)
  try {
    console.log(`[getImagesOrGenerate] 🔍 Searching Google Images for: ${part}`);
    // Fetch a few to ensure we get a valid one, but we'll only take the top 1
    const googleRes = await googleSearchImage(part, 3);
    if (googleRes.results && googleRes.results.length > 0) {
      const realImages = googleRes.results
        .map((r: any) => r.url)
        .filter((url: string) => url && (url.startsWith("http") || url.startsWith("https")));

      if (realImages.length > 0) {
        console.log(`[getImagesOrGenerate] ✅ Found real image: ${realImages[0]}`);
        images.push(realImages[0]); // Take only the first one
      }
    }
  } catch (err) {
    console.warn("[getImagesOrGenerate] ⚠️ Google Image Search failed:", err);
  }

  // 2. Generate AI Image (DALL-E Only)
  try {
    console.log(`[getImagesOrGenerate] 🖼️ Generating image with DALL·E for: ${part}`);
    const prompt = buildPrompt(part, fields);
    const key = process.env.OPENAI_API_KEY;

    if (key) {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          n: 1,
          size: "1024x1024"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiUrl = data?.data?.[0]?.url;
        if (aiUrl) {
          console.log(`[getImagesOrGenerate] ✅ DALL·E image generated`);
          images.push(aiUrl);
        }
      } else {
        const error = await res.text();
        console.error("[getImagesOrGenerate] ❌ DALL·E error:", error);
      }
    }
  } catch (err) {
    console.error("[getImagesOrGenerate] ❌ AI Generation Error:", err);
  }

  // 3. Return combined results or placeholder
  if (images.length > 0) {
    return images;
  }

  return [PLACEHOLDER_IMAGES[0]];
}
