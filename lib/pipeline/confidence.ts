// lib/pipeline/confidence.ts
import { PartOut } from "@/lib/types";

export function computeConfidence(out: PartOut): PartOut["source_confidence"] {
  const hasManu = (out.sources || []).some(s =>
    /(\.pdf$|datasheet|manual|catalog)/i.test(s.url || "") ||
    /(manufacturer|support|download|product)/i.test(s.url || "")
  );
  const core = ["common_name_en", "uom", "long_en"].filter(k => (out as any)[k]) .length;

  if (hasManu && core >= 2) return "authoritative";
  if (core >= 1) return "derived";
  if (!out.sources?.length) return "no_source_strict";
  return "ai_guess";
}
