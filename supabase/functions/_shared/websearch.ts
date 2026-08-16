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
    console.error("jina search failed", e);
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
    console.error("bing search failed", e);
  }

  return hits;
}

export async function reverseImageSearch(imageUrl: string, serpapiKey?: string): Promise<SearchHit[]> {
  if (!serpapiKey) {
    console.warn("SERPAPI_API_KEY is not set. Reverse image search will be mocked/skipped.");
    return [];
  }

  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${serpapiKey}`
    );
    
    if (!res.ok) {
      console.error("SerpApi request failed:", res.status, await res.text());
      return [];
    }
    
    const data = await res.json();
    const matches = data.visual_matches || [];
    
    return matches.slice(0, 5).map((m: any) => ({
      title: m.title || "Image Match",
      url: m.link || "",
      snippet: m.source || "Found via Google Lens"
    }));
  } catch (e) {
    console.error("reverse image search failed", e);
    return [];
  }
}

export interface ImageHit {
  url: string;
  thumbnail: string;
  sourceUrl: string;
  sourceDomain: string;
  title: string;
}

export async function imageSearch(query: string, serpapiKey?: string): Promise<ImageHit[]> {
  if (!serpapiKey) {
    console.warn("SERPAPI_API_KEY is not set. Using Wikimedia Commons fallback for image search.");
    return await wikimediaImageSearchFallback(query);
  }

  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpapiKey}`
    );
    
    if (!res.ok) {
      console.error("SerpApi image request failed:", res.status, await res.text());
      return await wikimediaImageSearchFallback(query); // Fallback on SerpApi error
    }
    
    const data = await res.json();
    const matches = data.images_results || [];
    
    return matches.slice(0, 6).map((m: any) => ({
      url: m.original,
      thumbnail: m.thumbnail,
      sourceUrl: m.link,
      sourceDomain: m.source,
      title: m.title || "Image"
    }));
  } catch (e) {
    console.error("image search failed", e);
    return await wikimediaImageSearchFallback(query);
  }
}

// Fallback image search using DuckDuckGo + Wikimedia API
async function wikimediaImageSearchFallback(query: string): Promise<ImageHit[]> {
  const hits: ImageHit[] = [];
  try {
    // 1. Search DuckDuckGo for wikimedia files
    const ddgRes = await fetch(
      "https://r.jina.ai/https://duckduckgo.com/html/?q=" + encodeURIComponent(query + " site:wikimedia.org/wiki/File:"),
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; TruthScanBot/1.0)" } }
    );
    
    if (!ddgRes.ok) return hits;
    
    const md = await ddgRes.text();
    const fileRe = /https?:\/\/commons\.wikimedia\.org\/wiki\/(File:[^)]+)/g;
    
    let m: RegExpExecArray | null;
    const fileNames = new Set<string>();
    
    while ((m = fileRe.exec(md)) && fileNames.size < 6) {
      // Extract just the "File:..." part and decode it properly
      const fileName = decodeURIComponent(m[1].split("?")[0].split("#")[0]);
      fileNames.add(fileName);
    }
    
    if (fileNames.size === 0) return hits;
    
    // 2. Resolve actual image URLs via Wikimedia API
    const titles = Array.from(fileNames).map(encodeURIComponent).join("|");
    const wikiRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles}&prop=imageinfo&iiprop=url&format=json`
    );
    
    if (!wikiRes.ok) return hits;
    const wikiData = await wikiRes.json();
    
    const pages = wikiData?.query?.pages || {};
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo.length > 0) {
        const info = page.imageinfo[0];
        hits.push({
          title: page.title.replace("File:", "").replace(/\.\w+$/, ""),
          url: info.url,
          thumbnail: info.url, // Wikimedia URLs are usually fast enough, or we can use thumbnail API
          sourceUrl: info.descriptionurl,
          sourceDomain: "Wikimedia Commons"
        });
      }
    }
  } catch (e) {
    console.error("Wikimedia fallback failed", e);
  }
  return hits;
}
