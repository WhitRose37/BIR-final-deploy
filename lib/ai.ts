import { summarizeStrict } from "@/lib/pipeline/summarize";
import type { SourceText } from "@/lib/pipeline/fetchSources";

/**
 * Generate part data using GPT API only
 * 
 * Flow:
 * 1. Skip external search (Google/Perplexity)
 * 2. Summarize with GPT using internal knowledge
 * 3. Return complete part data
 */
export async function generatePartData(
  partNumber: string,
  options: {
    strict?: boolean;
    withImage?: boolean;
  } = {}
): Promise<any> {
  try {
    const { withImage = true } = options;

    console.log(`\n[generatePartData] 🔍 Generating for: ${partNumber}`);
    console.log(`[generatePartData] 🖼️ With Images: ${withImage}`);
    console.log(`[generatePartData] 🤖 Mode: GPT-Only (No external search)`);

    // 1️⃣ Create a dummy source to trigger GPT generation
    // We pass the part number as the "source text" so GPT knows what to generate about.
    const sourceTexts: SourceText[] = [{
      url: "",
      name: "GPT Knowledge Base",
      text: `PART NUMBER: ${partNumber}. Please generate full specifications based on your internal knowledge.`,
    }];

    // 2️⃣ Summarize
    console.log(`[generatePartData] 🤖 Summarizing...`);
    const summary = await summarizeStrict(partNumber, sourceTexts);

    if (!summary) {
      throw new Error("Summarize returned null");
    }

    console.log(`[generatePartData] ✅ Complete`);
    return summary;

  } catch (e: any) {
    console.error(`[generatePartData] ❌ Error: ${e?.message}`);

    // Return minimal fallback on error
    return {
      part_number: partNumber,
      common_name_en: partNumber,
      common_name_th: partNumber,
      function_en: "Product information",
      function_th: "ข้อมูลผลิตภัณฑ์",
      where_used_en: "Industrial use",
      where_used_th: "ใช้งานอุตสาหกรรม",
      characteristics_of_material_en: "Unknown",
      characteristics_of_material_th: "ไม่ทราบ",
      uom: "piece",
      images: [],
      tags: ["product", "part", partNumber],
      sources: [{
        name: "Fallback",
        url: "",
      }],
      source_confidence: "low",
    };
  }
}
