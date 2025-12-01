// app/api/bir-search/route.ts
import { NextResponse } from "next/server";
import { fetchAndExtractText } from "@/lib/fetchPages";
import { summarizeStrict } from "@/lib/pipeline/summarize";
import type { SourceText } from "@/lib/pipeline/fetchSources";

export const runtime = "nodejs";

/**
 * BIR Search - ค้นหา part number + สรุป AI + ดึงรูป
 * 
 * Flow:
 * 1. fetchAndExtractText() → Perplexity search
 * 2. summarizeStrict() → AI summarize + Google Images
 * 3. Return complete part data
 */
export async function POST(req: Request) {
  try {
    const { part_number, engine, withImage } = await req.json();

    if (!part_number) {
      return NextResponse.json(
        { error: "part_number is required" },
        { status: 400 }
      );
    }

    console.log(`\n[bir-search] 🔍 BIR Search Started: ${part_number}`);
    console.log(`[bir-search] ⏱️ Engine: ${engine || "auto"}`);
    console.log(`[bir-search] 🖼️ With Images: ${withImage}`);

    // 1️⃣ Search sources
    let sources: any[] = [];
    try {
      console.log(`[bir-search] 🌐 Searching for sources...`);
      sources = await fetchAndExtractText(part_number, { engine });
      console.log(`[bir-search] ✅ Found ${sources.length} sources`);
      sources.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.title || s.name}`);
      });
    } catch (e: any) {
      console.error(`[bir-search] ❌ Search failed: ${e?.message}`);
      return NextResponse.json(
        { 
          error: `No information found for: ${part_number}`,
          part_number,
        },
        { status: 404 }
      );
    }

    // 2️⃣ Convert to SourceText format
    const sourceTexts: SourceText[] = sources.map((s: any) => ({
      url: s.link || s.url || "",
      name: s.title || s.name || "source",
      text: s.snippet || "",
    }));

    console.log(`[bir-search] 🤖 Enriching missing fields via AI...`);
    
    // 3️⃣ Summarize (includes images via getImagesOrGenerate)
    const summary = await summarizeStrict(part_number, sourceTexts);

    console.log(`[bir-search] 🧠 AI enriched:`, JSON.stringify(summary, null, 2));
    console.log(`[bir-search] ✨ Complete: ${summary.common_name_en}`);
    console.log(`[bir-search] 📸 Images: ${summary.images.length}\n`);

    return NextResponse.json(summary);
  } catch (e: any) {
    console.error(`[bir-search] ❌ Error: ${e?.message}`);
    return NextResponse.json(
      { error: e?.message || "Search failed" },
      { status: 500 }
    );
  }
}
