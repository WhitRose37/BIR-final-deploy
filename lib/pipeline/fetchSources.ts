// lib/pipeline/fetchSources.ts
import { smartSearch } from "@/lib/searchRouter";

export type SourceText = { url: string; name: string; text: string; priority?: number };

export async function fetchTopSources(urls: string[], limit = 5): Promise<SourceText[]> {
  const picked = urls.slice(0, limit);
  const out: SourceText[] = []; 
  
  for (const u of picked) {
    try {
      // ✅ fetchAndExtractText returns array of search results
      // We'll use smartSearch directly instead
      const { results } = await smartSearch(u, "google");
      
      if (!results || results.length === 0) continue;
      
      // Take first result
      const first = results[0];
      
      // ✅ Priority: datasheet > manual > product page
      const priority = 
        u.includes("datasheet") ? 1000 :
        u.includes("manual") ? 900 :
        u.includes("product") ? 800 : 0;
      
      if (first.snippet && first.snippet.length > 300) {
        out.push({ 
          url: first.url || u, 
          name: first.title || new URL(u).hostname,
          text: first.snippet,
          priority 
        });
      }
    } catch (e) {
      console.warn(`[fetchTopSources] Failed to fetch ${u}:`, e);
    }
  }
  
  // Sort by priority (datasheet first)
  out.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return out;
}

