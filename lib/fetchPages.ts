import { smartSearch } from "@/lib/searchRouter";

type SearchEngine = "auto" | "perplexity" | "google";

export async function fetchAndExtractText(
  query: string,
  options: { engine?: SearchEngine } = {}
): Promise<any[]> {
  const { engine = "auto" } = options;

  console.log(`[fetchAndExtractText] 🔍 Searching: ${query} (engine: ${engine})`);

  try {
    const { results } = await smartSearch(query, engine);

    console.log(`[fetchAndExtractText] ✅ Found ${results.length} results`);

    return results.map((r: any) => ({
      title: r.title || "Untitled",
      link: r.url || "",
      snippet: r.snippet || "",
    }));
  } catch (e: any) {
    console.error(`[fetchAndExtractText] ❌ Error:`, e?.message);
    throw new Error(`Search failed: ${e?.message}`);
  }
}

export async function fetchImages(query: string, limit = 6): Promise<string[]> {
  // Deprecated - use googleSearchImage instead
  return [];
}
