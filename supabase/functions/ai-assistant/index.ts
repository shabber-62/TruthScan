const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

interface SearchHit { title: string; url: string; snippet: string }

async function webSearch(query: string): Promise<SearchHit[]> {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TruthScanBot/1.0)" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const hits: SearchHit[] = [];
    const re = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    const strip = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    while ((m = re.exec(html)) && hits.length < 6) {
      let url = m[1];
      const uddg = url.match(/uddg=([^&]+)/);
      if (uddg) url = decodeURIComponent(uddg[1]);
      hits.push({ title: strip(m[2]), url, snippet: strip(m[3]) });
    }
    return hits;
  } catch (_e) {
    return [];
  }
}

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the live web for up-to-date facts: today's news, holidays, dates, prices, scores, events. Use it whenever the answer depends on current or recent information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI is not configured");

    const { messages = [], language = "en" } = await req.json();

    const today = new Date().toISOString().slice(0, 10);
    const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const system = `You are TruthScan AI, a helpful, accurate general-purpose assistant (like a research-backed chat assistant).

Current UTC date: ${today}. Current time in India (IST): ${nowIST}.

RULES:
1. For anything time-sensitive (today's news, holidays, weather, prices, sports, "is today a holiday", recent events), you MUST call the web_search tool first and base the answer on the results. Never guess.
2. You may call web_search multiple times with different queries to cross-check facts.
3. Cite sources at the end as a markdown list of links when you used search.
4. Be concise, well-structured markdown. Say clearly when something is uncertain.
5. Reply in ${language === "te" ? "Telugu" : "English"} unless the user writes in another language.`;

    const convo: any[] = [{ role: "system", content: system }, ...messages];
    const usedSources: SearchHit[] = [];

    for (let step = 0; step < 4; step++) {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, messages: convo, tools }),
      });

      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!res.ok) {
        const t = await res.text();
        console.error("Gateway error", res.status, t);
        throw new Error("AI request failed");
      }

      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error("Empty AI response");
      convo.push(msg);

      const calls = msg.tool_calls || [];
      if (calls.length === 0) {
        return new Response(
          JSON.stringify({ content: msg.content ?? "", sources: usedSources }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      for (const call of calls) {
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch (_e) { /* ignore */ }
        const hits = await webSearch(String(args.query || ""));
        usedSources.push(...hits.slice(0, 3));
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(hits),
        });
      }
    }

    return new Response(
      JSON.stringify({ content: "I couldn't complete the research in time. Please rephrase your question.", sources: usedSources }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("ai-assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
