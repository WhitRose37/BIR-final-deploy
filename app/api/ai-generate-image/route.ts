/**
 * ⚠️ API DEPRECATED - Image generation disabled
 * 
 * This endpoint has been disabled. Images are now fetched via:
 * - Google Custom Search API (lib/googleSearch.ts)
 * - lib/pipeline/images.ts → getImagesOrGenerate()
 * 
 * To re-enable image generation:
 * 1. Configure OPENAI_API_KEY or OPENROUTER_API_KEY
 * 2. Update lib/image_gen.ts
 * 3. Remove this file and restore original implementation
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { 
        error: "Image generation is disabled. Images are fetched via Google Custom Search API instead.",
        urls: [],
        count: 0
      },
      { status: 501 } // Not Implemented
    );
  } catch (e: any) {
    console.error("[ai-generate-image] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
