// lib/pipeline/summarize.ts
import { coerceToJson } from "@/lib/utils/llm";
import { gptSummarizeFromSources } from "@/lib/perplexity";
import { getImagesOrGenerate } from "@/lib/pipeline/images";
import type { PartOut } from "@/lib/types";
import type { SourceText } from "./fetchSources";
import { z } from "zod";

const PartSchema = z.object({
  product_name: z.string().optional(),
  common_name_en: z.string().optional(),
  common_name_th: z.string().optional(),
  uom: z.string().optional(),
  characteristics_of_material_en: z.string().optional(),
  characteristics_of_material_th: z.string().optional(),
  estimated_capacity_machine_year: z.string().optional(),
  quantity_to_use: z.string().optional(),
  function_en: z.string().optional(),
  function_th: z.string().optional(),
  where_used_en: z.string().optional(),
  where_used_th: z.string().optional(),
  eccn: z.string().optional(),
  hts: z.string().optional(),
  coo: z.string().optional(),
  tags: z.array(z.string()).default([]),
  sources: z.array(z.object({ name: z.string(), url: z.string().optional().default("") })).default([]),
});

// ---------- helpers ----------
function sanitizeSourceText(t = "", max = 16000) {
  const stripped = t.replace(/(?<=^|\n)\s*(SYSTEM|USER|ASSISTANT)\s*:/gi, "[label:]");
  return stripped.slice(0, max);
}

function uniqBy<T>(arr: T[], key: (x: T) => string) {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function includesToken(haystack: string, token?: string) {
  if (!token) return false;
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${esc}\\b`, "i");
  return re.test(haystack);
}

function pickRepresentativeImages(
  candidateUrls: string[],
  sourceDomains: Set<string>,
  limit = 3
): string[] {
  if (!Array.isArray(candidateUrls) || candidateUrls.length === 0) return [];

  const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const BLOCK_WORDS = [
    "logo", "icon", "favicon", "sprite", "banner", "placeholder", "thumb", "thumbnail",
    "badge", "qr", "barcode", "certificate", "datasheet-cover", "pdf-cover"
  ];
  const PREFER_WORDS = [
    "product", "part", "module", "assembly", "front", "side", "top", "connector",
    "board", "pcb", "housing", "enclosure", "mount", "bracket"
  ];

  const items: Array<{ url: string; score: number; key: string }> = [];
  for (const raw of candidateUrls) {
    try {
      const u = new URL(raw);
      if (!["http:", "https:"].includes(u.protocol)) continue;
      if (sourceDomains.size && !sourceDomains.has(u.hostname)) continue;

      const path = u.pathname.toLowerCase();
      const ext = path.slice(path.lastIndexOf("."));
      if (!ALLOWED_EXT.has(ext)) continue;

      const file = path.replace(/\/+/g, "/");
      if (BLOCK_WORDS.some(w => file.includes(w))) continue;

      // หลบรูปจิ๋วตามแพทเทิร์นทั่วไป
      if (/\b(16|24|32|48|64|80|96|120|128|150|180|200)x\1\b/.test(file)) continue;

      let score = 0;
      for (const w of PREFER_WORDS) if (file.includes(w)) score += 2;
      if (/\/(product|products|images|asset|media)\//.test(file)) score += 1;

      // key ใช้ de-dupe โดยตัด query
      const k = (() => { const u2 = new URL(raw); u2.search = ""; return u2.toString(); })();
      items.push({ url: raw, score, key: k });
    } catch { /* skip */ }
  }

  const seen = new Set<string>();
  const dedup = items.filter(it => {
    if (seen.has(it.key)) return false;
    seen.add(it.key);
    return true;
  });

  dedup.sort((a, b) => b.score - a.score);
  return dedup.slice(0, limit).map(x => x.url);
}

async function translateEnToThBatch(fields: Record<string, string>): Promise<Record<string, string>> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v && v.trim()) clean[k] = v.trim();
  }
  if (!Object.keys(clean).length) return {};

  const tPrompt = `
You are a precise translator. Translate the given English fields to Thai faithfully, without adding facts or marketing language.
- Keep technical terms and numbers/units intact.
- Return ONE JSON object with EXACTLY the same keys as input. No code fences.

INPUT_KEYS: ${Object.keys(clean).join(", ")}
`.trim();

  const payload = JSON.stringify(clean, null, 2);
  let raw = "";
  try {
    const res = await gptSummarizeFromSources({
      prompt: tPrompt,
      sources: [{ name: "to-translate", url: "", text: payload }],
    });
    raw = res.content;
  } catch {
    return {};
  }

  let safe = "";
  try {
    safe = coerceToJson(raw);
  } catch {
    return {};
  }

  try {
    const obj = typeof safe === "string" ? JSON.parse(safe) : safe;
    const out: Record<string, string> = {};
    for (const k of Object.keys(clean)) {
      const val = (obj as any)?.[k];
      out[k] = typeof val === "string" ? val.trim() : "";
    }
    return out;
  } catch {
    return {};
  }
}

// ---------- main ----------
export async function summarizeStrict(
  partNumber: string,
  sources: SourceText[] | SourceText | null | undefined
): Promise<PartOut> {
  const prompt = `
You are an expert technical researcher for manufacturing parts.
PART NUMBER: ${partNumber}

🎯 YOUR PRIMARY TASK: Find or create a meaningful PRODUCT NAME and all technical details for this part.

SOURCES ANALYSIS:
- Prioritize technical datasheets and manufacturer catalogs over e-commerce listings.
- Extract exact values (Voltage, Dimensions, Material) where available. Do NOT round numbers unless necessary.

CRITICAL RULES:

1. PRODUCT NAME FORMATTING:
   - Structure: [Brand] [Model/Series] [Key Spec] [Device Type]
   - Example: "Omron MY2N-GS 24VDC Relay", "SMC KQ2H06-M5A Fitting"
   - Do NOT just repeat the part number. Make it readable and identifiable.

2. THAI TERMINOLOGY (common_name_th):
   - Use standard industrial terminology used by Thai engineers/technicians.
   - Example: Use "โซลินอยด์วาล์ว" instead of "วาล์วแม่เหล็กไฟฟ้า".
   - Example: Use "ลูกปืน" or "ตลับลูกปืน" instead of "อุปกรณ์รองรับการหมุน".
   - Do NOT simply translate English words literally. Use the term found in Thai catalogs or local usage.

3. DATA COMPLETENESS:
   - If sources are missing, use your internal knowledge of the brand/series to generate REALISTIC specs.
   - If you must guess, ensure it aligns with standard industry norms for this type of part.
   - Do NOT leave fields empty.

4. TRADE COMPLIANCE:
   - ECCN/HTS/COO: Return "" (empty string) unless you found explicit evidence or are 90%+ sure based on the brand's manufacturing base.

OUTPUT FIELDS GUIDANCE:
- product_name: The full, standardized model name as described above.
- common_name_en: General category (e.g., "Inductive Sensor", "Ball Bearing").
- common_name_th: Thai category (Industrial standard term).
- uom: Unit of Measure (e.g., "pcs", "set", "m").
- characteristics_of_material_en: Key technical specs (e.g., "Stainless Steel 304, 24VDC, IP67").
- function_en: Detailed explanation of what it does and how it works.
- where_used_en: Specific machines or industries where this is commonly found.

Return EXACT JSON only (no notes, no code fences).
`.trim();


  const srcList = Array.isArray(sources) ? sources.filter(Boolean) : sources ? [sources] : [];

  // ✅ Log source count for debugging
  console.log(`[summarizeStrict] 📊 Source count: ${srcList.length}`);
  if (srcList.length === 0) {
    console.warn(`[summarizeStrict] ⚠️ No sources available for: ${partNumber}`);
  }

  const list = uniqBy(
    srcList,
    (s: any) => `${(s?.url || "").trim()}|${(s?.name || "").trim()}`
  );

  const fused = list.length
    ? list.map((s) => {
      const name = s?.name?.trim() || "source";
      const url = s?.url?.trim() || "";
      const text = sanitizeSourceText(s?.text || "");
      return `SOURCE: ${name}\nURL: ${url}\n---\n${text}`;
    }).join("\n\n====\n\n")
    : "NO_SOURCES_AVAILABLE";

  const user = `
PART NUMBER TO RESEARCH: ${partNumber}

SOURCES FOUND:
${fused}

⭐ IMPORTANT: Extract the FULL PRODUCT NAME/MODEL from sources (not just the part number)
Example: "Siemens 1LE1 132M-2 Three-Phase Motor" instead of just "1LE1132M2"

Please carefully extract and structure all available information.
`;

  let raw: string = "";
  try {
    console.log(`[summarizeStrict] 📝 Calling Perplexity...`);
    console.log(`[summarizeStrict] 🎯 Finding product name for: ${partNumber}`);
    console.log(`[summarizeStrict] 📊 Sources to use:`, list.map(s => s.name));

    const res = await gptSummarizeFromSources({
      prompt,
      sources: [{ name: "bundle", url: "", text: user }],
    });
    raw = res.content;
    var usage = res.usage;
    var model = res.model; // ✅ Capture model

    console.log(`[summarizeStrict] ✅ Raw response:`, raw.substring(0, 500));

  } catch (e: any) {
    console.error(`[summarizeStrict] ❌ Perplexity error: ${e?.message}`);
    return {
      part_number: partNumber,
      product_name: partNumber,
      common_name_en: partNumber,
      common_name_th: partNumber,
      uom: "",
      characteristics_of_material_en: "",
      characteristics_of_material_th: "",
      estimated_capacity_machine_year: "",
      quantity_to_use: "",
      function_en: "",
      function_th: "",
      where_used_en: "",
      where_used_th: "",
      eccn: "",
      hts: "",
      coo: "",
      tags: [],
      sources: [],
      images: [],
      source_confidence: "no_source_strict",
    };
  }

  let safe = "";
  try {
    safe = coerceToJson(raw);
  } catch {
    console.warn(`[summarizeStrict] ⚠️ Failed to coerce JSON`);
    safe = "{}";
  }

  let parsed: z.infer<typeof PartSchema> = {} as any;
  try {
    const obj = typeof safe === "string" ? JSON.parse(safe) : safe;
    parsed = PartSchema.parse(obj);
    console.log(`[summarizeStrict] ✅ Schema validation passed`);
    console.log(`[summarizeStrict] 📋 Extracted fields:`, {
      product_name: parsed.product_name || "(empty)",
      common_name_en: parsed.common_name_en || "(empty)",
      uom: parsed.uom || "(empty)",
    });
  } catch (e: any) {
    console.warn(`[summarizeStrict] ⚠️ Schema validation failed:`, e?.message);
    parsed = PartSchema.parse({});
  }

  // ✅ Guard against hallucinated fields
  const safeECCN = includesToken(fused, parsed.eccn) ? parsed.eccn! : "";
  const safeHTS = includesToken(fused, parsed.hts) ? parsed.hts! : "";
  const safeCOO = includesToken(fused, parsed.coo) ? parsed.coo! : "";

  const sourceDomains = new Set(
    list.map((s: any) => {
      try { return s?.url ? new URL(s.url).hostname : ""; }
      catch { return ""; }
    }).filter(Boolean)
  );

  const normalizedSources = list.map((s: any) => ({
    name: s?.name?.trim() || "source",
    url: s?.url?.trim() || ""
  }));

  // 🖼️ Get images
  console.log(`[summarizeStrict] 🖼️ Fetching images...`);
  let images: string[] = [];
  try {
    images = await getImagesOrGenerate(partNumber, parsed);
    console.log(`[summarizeStrict] ✅ Images: ${images.length}`);
  } catch (e: any) {
    console.warn(`[summarizeStrict] ⚠️ Image fetch failed: ${e?.message}`);
    images = [];
  }

  // 🌏 Translate to Thai if needed
  const needTranslate: Record<string, string> = {};
  if (!parsed.common_name_th && parsed.common_name_en) {
    needTranslate.common_name_th = parsed.common_name_en;
  }
  if (!parsed.characteristics_of_material_th && parsed.characteristics_of_material_en) {
    needTranslate.characteristics_of_material_th = parsed.characteristics_of_material_en;
  }
  if (!parsed.function_th && parsed.function_en) {
    needTranslate.function_th = parsed.function_en;
  }
  if (!parsed.where_used_th && parsed.where_used_en) {
    needTranslate.where_used_th = parsed.where_used_en;
  }

  let translated: Record<string, string> = {};
  if (Object.keys(needTranslate).length > 0) {
    console.log(`[summarizeStrict] 🌏 Translating ${Object.keys(needTranslate).length} fields...`);
    try {
      translated = await translateEnToThBatch(needTranslate);
    } catch (e: any) {
      console.warn(`[summarizeStrict] ⚠️ Translation failed: ${e?.message}`);
    }
  }

  // ✅ Build final output - prefer parsed product_name over fallback
  const out: PartOut = {
    part_number: partNumber,
    // ✅ PRIORITY: product_name > common_name_en > part_number
    product_name: (
      parsed.product_name?.trim() &&
      parsed.product_name.trim() !== partNumber
    )
      ? parsed.product_name.trim()
      : (parsed.common_name_en?.trim() || partNumber),

    common_name_en: parsed.common_name_en?.trim() ?? partNumber,
    common_name_th: (parsed.common_name_th?.trim() || translated.common_name_th?.trim() || partNumber) ?? partNumber,
    uom: parsed.uom?.trim() ?? "",
    characteristics_of_material_en: parsed.characteristics_of_material_en?.trim() ?? "",
    characteristics_of_material_th: (parsed.characteristics_of_material_th?.trim() || translated.characteristics_of_material_th?.trim()) ?? "",
    estimated_capacity_machine_year: parsed.estimated_capacity_machine_year?.trim() ?? "",
    quantity_to_use: parsed.quantity_to_use?.trim() ?? "",
    function_en: parsed.function_en?.trim() ?? "",
    function_th: (parsed.function_th?.trim() || translated.function_th?.trim()) ?? "",
    where_used_en: parsed.where_used_en?.trim() ?? "",
    where_used_th: (parsed.where_used_th?.trim() || translated.where_used_th?.trim()) ?? "",
    eccn: safeECCN,
    hts: safeHTS,
    coo: safeCOO,
    tags: parsed.tags?.filter(t => typeof t === "string" && t.trim()) ?? [],
    sources: normalizedSources,
    images,
    source_confidence: list.length > 0 ? "derived" : "no_source_strict",
    tokens: usage ? {
      prompt: usage.prompt_tokens,
      completion: usage.completion_tokens,
      total: usage.total_tokens,
      model: model // ✅ Use captured model
    } : undefined,
  };

  console.log(`[summarizeStrict] ✅ Complete`);
  console.log(`[summarizeStrict] 🏷️ Product Name: ${out.product_name}`);
  console.log(`[summarizeStrict] 📸 Images: ${out.images.length}/6`);

  return out;
}
