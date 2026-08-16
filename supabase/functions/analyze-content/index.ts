import { webSearch, type SearchHit } from "../_shared/websearch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

interface SourceInfo {
  name: string;
  url: string;
  type: "fact-check" | "news" | "database" | "web" | "official";
  contribution: number;
}

interface AnalysisResult {
  isReal: boolean;
  confidence: number;
  reason: string;
  reasonPoints: string[];
  sources: SourceInfo[];
  verdict: "REAL" | "FAKE" | "MISLEADING" | "UNVERIFIED";
}

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the live web (news, fact-check sites, official pages) for evidence about a claim. Use for any factual, dated or time-sensitive claim (holidays, events, statistics, quotes, viral posts, images).",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

function classify(url: string): SourceInfo["type"] {
  const u = url.toLowerCase();
  if (/(factcheck|politifact|snopes|fact-check|altnews|boomlive|factly)/.test(u)) return "fact-check";
  if (/(\.gov|\.gov\.in|\.nic\.in|who\.int|un\.org)/.test(u)) return "official";
  if (/(wikipedia|britannica)/.test(u)) return "database";
  if (/(reuters|apnews|bbc|ndtv|thehindu|indianexpress|timesofindia|cnn|guardian|news)/.test(u)) return "news";
  return "web";
}

function hostName(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function buildSources(hits: SearchHit[]): SourceInfo[] {
  const seen = new Set<string>();
  const picked: SearchHit[] = [];
  for (const h of hits) {
    const host = hostName(h.url);
    if (seen.has(host)) continue;
    seen.add(host);
    picked.push(h);
    if (picked.length >= 4) break;
  }
  if (picked.length === 0) return [];
  const base = Math.floor(100 / picked.length);
  return picked.map((h, i) => ({
    name: h.title?.slice(0, 80) || hostName(h.url),
    url: h.url,
    type: classify(h.url),
    contribution: i === 0 ? 100 - base * (picked.length - 1) : base,
  }));
}

function getSystemPrompt(type: string, platform: string | undefined, language: string) {
  const today = new Date().toISOString().slice(0, 10);
  const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const shared = `You are TruthScan, a government-grade fact-checking system with LIVE WEB ACCESS.

Current UTC date: ${today}. Current time in India (IST): ${nowIST}.

MANDATORY PROCESS:
1. Call the web_search tool BEFORE judging any factual/time-sensitive claim (today's holidays, news, events, numbers, quotes). Run 1-3 searches with different wordings to cross-check.
2. Base every conclusion on what the search results actually say. Never invent sources or URLs.
3. If evidence is thin or contradictory, use verdict UNVERIFIED or MISLEADING with lower confidence.
4. Write the analysis in ${language === "te" ? "formal Telugu" : "English"}.

FINAL ANSWER: after research, reply with ONLY a JSON object (no markdown fences):
{
  "isReal": boolean,
  "confidence": number (60-99),
  "verdict": "REAL" | "FAKE" | "MISLEADING" | "UNVERIFIED",
  "reason": "2-3 sentence summary stating the verified facts found on the web",
  "reasonPoints": ["Point 1: specific evidence found + which site it came from", "Point 2: ...", "Point 3: ..."]
}`;

  if (type === "text") return `${shared}\n\nTEXT FOCUS: verify each factual claim against live search results; flag sensationalism, missing context, outdated dates.`;
  if (type === "image") return `${shared}\n\nIMAGE FOCUS: inspect the image for manipulation, AI-generation artifacts, lighting/shadow inconsistency; ALSO search the web for the described scene/event to check whether it really happened and whether the image is known to be recycled or fake.`;
  if (type === "live") return `${shared}\n\nLIVE CAPTURE FOCUS: verify genuine camera characteristics, re-capture of a screen, filters/post-processing; search the web only if the scene shows a claimable public event.`;
  return `${shared}\n\nSOCIAL MEDIA FOCUS (platform: ${platform || "general"}): detect troll/bot behaviour, coordinated campaigns, inflammatory language, AND fact-check any claim in the post with live web search.`;
}

function parseJson(text: string): AnalysisResult | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, content, context, platform, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI is not configured");

    const isImage = (type === "image" || type === "live") && typeof content === "string" && content.startsWith("data:");

    let userContent: unknown;
    if (isImage) {
      const text =
        type === "live"
          ? "Analyze this live camera capture for authenticity."
          : `Analyze this image for manipulation or AI generation.${context ? ` Context provided by user: "${context}"` : ""}`;
      userContent = [
        { type: "text", text },
        { type: "image_url", image_url: { url: content } },
      ];
    } else if (type === "social") {
      userContent = `Analyze this ${platform || "social media"} post for troll/bot behaviour AND fact-check its claims using live web search:\n\n"${content}"`;
    } else {
      userContent = `Fact-check this content using live web search:\n\n"${content}"`;
    }

    const convo: any[] = [
      { role: "system", content: getSystemPrompt(type, platform, language) },
      { role: "user", content: userContent },
    ];

    const allHits: SearchHit[] = [];
    let finalText = "";

    for (let step = 0; step < 4; step++) {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: convo, tools }),
      });

      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!res.ok) {
        console.error("Gateway error", res.status, await res.text());
        throw new Error("AI request failed");
      }

      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error("Empty AI response");
      convo.push(msg);

      const calls = msg.tool_calls || [];
      if (calls.length === 0) {
        finalText = msg.content ?? "";
        break;
      }

      for (const call of calls) {
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
        const query = String(args.query || "");
        console.log("web_search:", query);
        const hits = await webSearch(query);
        allHits.push(...hits.slice(0, 4));
        convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(hits) });
      }
    }

    const parsed = parseJson(finalText);
    if (!parsed) throw new Error("Could not complete the verification. Please try again.");

    const sources = buildSources(allHits);
    const result: AnalysisResult = {
      isReal: parsed.verdict ? parsed.verdict === "REAL" : !!parsed.isReal,
      confidence: Math.min(99, Math.max(50, Number(parsed.confidence) || 75)),
      verdict: parsed.verdict || (parsed.isReal ? "REAL" : "FAKE"),
      reason: parsed.reason || "Analysis completed.",
      reasonPoints: Array.isArray(parsed.reasonPoints) && parsed.reasonPoints.length
        ? parsed.reasonPoints.slice(0, 5)
        : ["Analysis completed"],
      sources: sources.length
        ? sources
        : [{ name: "AI forensic analysis (no web evidence needed)", url: "#", type: "web", contribution: 100 }],
    };

    console.log("Final result:", JSON.stringify({ ...result, sources: result.sources.map((s) => s.url) }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
