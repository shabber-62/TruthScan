export interface SearchHit { title: string; url: string; snippet: string }

export async function webSearch(query: string): Promise<SearchHit[]> {
  const hits: SearchHit[] = [];
  const clean = (u: string) => {
    const uddg = u.match(/uddg=([^&)]+)/);
    return uddg ? decodeURIComponent(uddg[1]) : u;
  };

  try {
    const res = await fetch(
      "https://r.jina.ai/https://duckduckgo.com/html/?q=" + encodeURIComponent(query),
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; TruthScanBot/1.0)" } },
    );
    if (res.ok) {
      const md = await res.text();
      const re = /##\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(md)) && hits.length < 6) {
        const url = clean(m[2]);
        if (url.includes("duckduckgo.com")) continue;
        const after = md.slice(m.index + m[0].length, m.index + m[0].length + 600);
        const snippet = after
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("[") && !l.startsWith("!") && !l.startsWith("#"))
          .slice(0, 2)
          .join(" ")
          .slice(0, 400);
        hits.push({ title: m[1].trim(), url, snippet });
      }
    }
  } catch (e) {
    console.log("jina search failed", e);
  }

  if (hits.length > 0) return hits;

  try {
    const res = await fetch(
      "https://www.bing.com/search?format=rss&q=" + encodeURIComponent(query),
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } },
    );
    if (res.ok) {
      const xml = await res.text();
      const strip = (s: string) =>
        s.replace(/<!\[CDATA\[|\]\]>/g, "")
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const item of items.slice(0, 6)) {
        const title = strip(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
        const url = strip(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
        const snippet = strip(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "");
        if (url) hits.push({ title, url, snippet });
      }
    }
  } catch (e) {
    console.log("bing search failed", e);
  }

  return hits;
}
