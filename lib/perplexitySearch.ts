// lib/perplexitySearch.ts
import { resolvePerplexityOnlineModel } from "@/lib/perplexityModels";

type SearchItem = { title: string; url: string; snippet?: string };

export async function perplexitySearch(query: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Missing PERPLEXITY_API_KEY");

  const model = await resolvePerplexityOnlineModel(); // ✅ ใช้ตัวที่ probe ผ่าน
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a search assistant. Return concise answer with high-quality citations (manufacturer/datasheet if possible)." },
        { role: "user", content: query },
      ],
      temperature: 0.0,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${text || res.statusText}`);
  const json = JSON.parse(text);

  const msg = json?.choices?.[0]?.message ?? {};
  const citations: string[] = msg?.citations ?? json?.citations ?? [];
  const unique = Array.from(new Set(citations)).slice(0, 10);
  const results: SearchItem[] = unique.map((u) => {
    try { return { title: new URL(u).hostname, url: u }; }
    catch { return { title: u, url: u }; }
  });

  return { results, raw: json };
}
