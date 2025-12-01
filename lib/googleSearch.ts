// lib/googleSearch.ts
/**
 * Wrapper สำหรับ Google Custom Search API (Programmable Search Engine)
 * ใช้ได้ทั้งค้นหน้าเว็บและค้นรูป
 *
 * ต้องตั้งค่าคีย์ใน .env.local:
 *   GOOGLE_SEARCH_API_KEY=...
 *   GOOGLE_SEARCH_ENGINE_ID=...
 */

export async function googleSearchWeb(query: string, limit = 5) {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!key || !cx) {
    console.warn("[googleSearchWeb] ⚠️ Google Search not configured");
    return { results: [] };
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", limit.toString());
  url.searchParams.set("safe", "active");

  console.log(`[googleSearchWeb] 🔍 Searching: ${query}`);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GoogleSearch failed (${res.status})`);
  const j = await res.json();

  const results = (j.items || []).map((i: any) => ({
    title: i.title,
    url: i.link,
    snippet: i.snippet,
  }));

  console.log(`[googleSearchWeb] ✅ Found ${results.length} results`);
  return { results };
}

/**
 * Image search — ใช้ Google Custom Search API (ต้องเปิด Image Search ด้วยใน CSE)
 */
export async function googleSearchImage(query: string, limit = 6) {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!key || !cx) {
    console.warn("[googleSearchImage] ⚠️ Google Search not configured (GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID missing)");
    return { results: [] };
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", limit.toString());
  url.searchParams.set("safe", "active");
  
  console.log(`[googleSearchImage] 🖼️ Searching images for: ${query}`);
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`[googleSearchImage] ❌ API error: ${res.status}`);
    throw new Error(`GoogleImageSearch failed (${res.status})`);
  }
  
  const j = await res.json();

  const results = (j.items || []).map((i: any) => ({
    url: i.link,
    thumbnail: i.image?.thumbnailLink,
    context: i.image?.contextLink,
  }));

  console.log(`[googleSearchImage] ✅ Found ${results.length} images`);
  // ✅ Add type annotation for forEach parameter
  results.slice(0, 3).forEach((r: { url: string; thumbnail?: string; context?: string }, i: number) => {
    console.log(`  ${i + 1}. ${r.url.substring(0, 80)}...`);
  });

  return { results };
}
