// lib/searchRouter.ts
import { perplexitySearch } from "@/lib/perplexitySearch";
import { googleSearchWeb } from "@/lib/googleSearch";

type SearchResult = { title: string; url: string; snippet?: string };

export async function smartSearch(
  q: string,
  engine: "auto" | "perplexity" | "google" = "auto"
) {
  // ให้ลอง Perplexity ก่อนเสมอ
  if (engine === "auto" || engine === "perplexity") {
    try {
      const p = await perplexitySearch(q);
      if (p?.results?.length) return { engine: "perplexity", results: p.results };
    } catch {}
  }
  // Fallback → Google CSE
  const g = await googleSearchWeb(q);
  return { engine: "google", results: g.results };
}


function hasAuthoritative(results: { url: string }[]) {
  return results.some((r) => {
    const u = r.url.toLowerCase();
    return (
      u.endsWith(".pdf") ||
      u.includes("datasheet") ||
      u.includes("manual") ||
      u.includes("catalog") ||
      /manufacturer|support|download|product/.test(u)
    );
  });
}
