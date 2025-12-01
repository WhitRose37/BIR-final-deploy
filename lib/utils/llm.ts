/**
 * JSON coercion utility
 * Extracts JSON from LLM responses that may contain markdown code fences
 */
export function coerceToJson(raw: string): string {
  if (!raw) return "{}";
  
  // Remove markdown code fences
  let clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim(); // ตัดรั้วโค้ด
  try { JSON.parse(clean); return clean; } catch {}
  const start = clean.indexOf("{"); if (start === -1) throw new Error("No JSON object found");
  let depth = 0, end = -1;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Unbalanced JSON braces");
  const candidate = clean.slice(start, end + 1).trim();
  JSON.parse(candidate);
  return candidate;
}
