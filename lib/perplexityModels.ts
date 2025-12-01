// lib/perplexityModels.ts

// รุ่น online ที่นิยมและยังใช้งานได้กับบัญชีส่วนใหญ่ (เรียงลำดับความชอบ)
const CANDIDATES = [
  "llama-3.1-sonar-large-128k-online",
  "llama-3.1-sonar-small-128k-online",
  // legacy เผื่อบัญชีเก่า (จะโดน 400 ก็ข้าม)
  "sonar-large-online",
  "sonar-medium-online",
  "sonar-small-online",
];

export async function resolvePerplexityOnlineModel(): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("Missing PERPLEXITY_API_KEY");

  // ให้ผู้ใช้ปักเองได้ก่อน
  const pinned = process.env.PERPLEXITY_SEARCH_MODEL || process.env.PERPLEXITY_MODEL;
  if (pinned) return pinned;

  // ลองยิงทีละรุ่น: ขอ completion สั้น ๆ เพื่อเช็คว่า model ใช้ได้
  for (const model of CANDIDATES) {
    try {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "probe" },
            { role: "user", content: "ok" },
          ],
          temperature: 0.0,
          max_tokens: 5, // เบาที่สุด
        }),
      });
      if (res.ok) return model;            // ✅ ใช้ได้
      const txt = await res.text().catch(() => "");
      // ถ้าเป็น invalid_model ก็ลองตัวถัดไป
      if (!/invalid[_\s-]?model/i.test(txt)) {
        // ไม่ใช่ invalid model (เช่น rate limit) ก็ถือว่า model ใช้ได้
        return model;
      }
    } catch {
      // network error → ลองตัวถัดไป
    }
  }

  throw new Error(
    "No usable Perplexity online model from candidates. " +
    "Set PERPLEXITY_SEARCH_MODEL in .env.local to a model your key supports."
  );
}
