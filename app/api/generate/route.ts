// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { generatePartData } from "@/lib/ai";
import { trackUsage } from "@/lib/tokenUsage";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generate part data with images from Google Search
 * 
 * Flow:
 * 1. generatePartData() → Perplexity search + summarize
 * 2. getImagesOrGenerate() → Google Custom Search API
 * 3. Return part data with images
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // image prompt override: if caller passes a string use it,
    // if caller passes no_text_in_image !== false use a default instruction
    const image_prompt_override: string | undefined =
      typeof body?.image_prompt_override === "string"
        ? body.image_prompt_override
        : (body?.no_text_in_image === false ? undefined : "Photorealistic product photo. Do NOT include any overlaid text, captions, labels, numbers, watermarks, or line breaks on the image. No banners or textual UI elements. Focus on the object only.");

    // Safer parsing: coerce to string before trim to avoid runtime errors
    const part_number = String(body?.part_number ?? "").trim();
    const withImage = body?.withImage !== false;

    // If batch array provided, prefer it
    const batchInput = Array.isArray(body?.part_numbers) ? body.part_numbers.map((p: any) => String(p ?? "").trim()).filter((p: string) => p) : null;

    if (!batchInput && !part_number) {
      return NextResponse.json(
        { error: "part_number or part_numbers is required" },
        { status: 400 }
      );
    }

    // Helper: validate URLs for images
    function isValidUrl(s: string) {
      try {
        const url = new URL(s);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }

    // Normalize single raw -> response object (structured Part Summary)
    function normalizeRaw(raw: any, originalPart: string) {
      const out = {
        part_number: String(raw?.part_number || originalPart),
        project_name: String(raw?.project_name || ""),
        product_name: String(raw?.product_name || ""),
        common_name_en: String(raw?.common_name_en || originalPart),
        common_name_th: String(raw?.common_name_th || originalPart),
        uom: String(raw?.uom || "pcs"),

        // Characteristics of material
        characteristics_of_material_en: String(
          raw?.characteristics_of_material_en || raw?.characteristics_of_material || ""
        ),
        characteristics_of_material_th: String(raw?.characteristics_of_material_th || ""),

        // EN section
        function_en: String(raw?.function_en || raw?.function || ""),
        where_used_en: String(raw?.where_used_en || ""),
        characteristics_en: String(raw?.characteristics_en || ""),

        // TH section
        function_th: String(raw?.function_th || ""),
        where_used_th: String(raw?.where_used_th || raw?.where_used || ""),
        characteristics_th: String(raw?.characteristics_th || ""),

        // Trade fields
        eccn: String(raw?.eccn || ""),
        hts: String(raw?.hts || ""),
        coo: String(raw?.coo || raw?.country_of_origin || ""),

        // metadata
        // images: keep only valid absolute http(s) urls
        images: Array.isArray(raw?.images)
          ? raw.images
            .map((u: any) => (typeof u === "string" ? u : u?.url ? String(u.url) : ""))
            .filter((u: any) => isValidUrl(String(u)))
          : [],
        tags: Array.isArray(raw?.tags) ? raw.tags.filter((t: any) => typeof t === "string") : [],
        // sources: accept array of strings or objects {name,url} and keep urls/strings
        sources: Array.isArray(raw?.sources)
          ? raw.sources
            .map((s: any) => {
              if (typeof s === "string") return s;
              if (s && typeof s === "object" && (s.url || s.name)) {
                return s.url ? String(s.url) : String(s.name);
              }
              return "";
            })
            .filter((x: any) => typeof x === "string" && x)
          : [],

        source_confidence: String(raw?.source_confidence || "low"),
        // Combined long fields (will be computed below)
        long_en: "",
        long_th: "",
        tokens: raw?.tokens,
      };

      // sensible defaults when raw missing
      if (!raw) {
        out.function_en = out.function_en || "Information not available";
        out.where_used_en = out.where_used_en || "Information not available";
        out.function_th = out.function_th || "ไม่มีข้อมูล";
        out.where_used_th = out.where_used_th || "ไม่มีข้อมูล";
        out.characteristics_of_material_en = out.characteristics_of_material_en || "Unknown";
        out.characteristics_of_material_th = out.characteristics_of_material_th || "ไม่ทราบ";
        out.images = [];
        out.sources = [];
        out.tags = out.tags && out.tags.length ? out.tags : ["product"];
        out.source_confidence = out.source_confidence || "low";
        // set combined fallbacks
        out.long_en = `${out.function_en}${out.characteristics_of_material_en ? " — " + out.characteristics_of_material_en : ""}`.trim();
        out.long_th = `${out.function_th}${out.where_used_th ? " — " + out.where_used_th : ""}`.trim();
      }

      // Helper to join two fields cleanly (avoid extra separators)
      function joinTwo(a: string | undefined, b: string | undefined, sep = " — ") {
        const A = (a ?? "").toString().trim();
        const B = (b ?? "").toString().trim();
        if (A && B) return `${A}${sep}${B}`;
        if (A) return A;
        if (B) return B;
        return "";
      }

      // Compute combined fields for normal cases (overwrites any prior fallback)
      out.long_en = joinTwo(out.function_en, out.characteristics_of_material_en);
      out.long_th = joinTwo(out.function_th, out.where_used_th);

      return out;
    }

    // Get current user for tracking
    const user = await getCurrentUser();
    const userId = user?.id || null;

    // Batch handling
    if (batchInput) {
      console.log(`[generate] 🔍 Batch Generating for: ${batchInput.length} items`);
      const promises = batchInput.map((pn: string) =>
        generatePartData(pn, { strict: false, withImage })
          .then((raw) => ({ status: "fulfilled", raw, part: pn }))
          .catch((err: any) => ({ status: "rejected", error: err?.message || String(err), part: pn }))
      );

      const settled = await Promise.all(promises);

      const results = settled.map((res: any) => {
        if (res.status === "fulfilled") {
          // Track usage for batch item
          if (res.raw?.tokens) {
            const { prompt, completion, model } = res.raw.tokens;
            // Fire and forget tracking
            trackUsage(userId, model || "gpt-3.5-turbo", prompt, completion, "batch-generate").catch(console.error);
          }
          return normalizeRaw(res.raw, res.part);
        } else {
          // per-item error -> use fallback but include an error hint in a conservative field
          const fallback = normalizeRaw(null, res.part);
          // include minimal error info only in non-production for debugging
          if (process.env.NODE_ENV !== "production") {
            (fallback as any)._error = String(res.error || "generation_failed");
          }
          return fallback;
        }
      });

      return NextResponse.json({ results });
    }

    // Single-item flow (unchanged behavior)
    console.log(`[generate] 🔍 Generating for: ${part_number}`);
    console.log(`[generate] 🖼️ With Images: ${withImage}`);

    let raw;
    try {
      raw = await generatePartData(part_number, {
        strict: false,
        withImage,
      });
    } catch (e: any) {
      console.warn(`[generate] ⚠️ Generation error: ${e?.message}`);

      // Return structured fallback using normalizeRaw for consistency
      const fallback = normalizeRaw(null, part_number);
      if (process.env.NODE_ENV !== "production") {
        (fallback as any)._error = String(e?.message || e);
      }
      return NextResponse.json(fallback);
    }

    if (!raw) {
      throw new Error("Failed to generate part data - returned null");
    }

    console.log(`[generate] ✅ Generated successfully`);
    console.log(`[generate] 📸 Images: ${raw.images?.length || 0}`);

    // Track usage for single item
    if (raw.tokens) {
      const { prompt, completion, model } = raw.tokens;
      trackUsage(userId, model || "gpt-3.5-turbo", prompt, completion, "generate").catch(console.error);
    }

    const response = normalizeRaw(raw, part_number);

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (e: any) {
    console.error(`[generate] ❌ Fatal error:`, e?.message || e);

    return new NextResponse(
      JSON.stringify({
        error: e?.message || "Internal error",
        part_number: "unknown"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
