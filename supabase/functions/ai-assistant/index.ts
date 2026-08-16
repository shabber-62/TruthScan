import { webSearch, imageSearch, type SearchHit, type ImageHit } from "../_shared/websearch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tools = [
  {
    functionDeclarations: [
      {
        name: "web_search",
        description:
          "Search the live web for up-to-date facts: today's news, holidays, dates, prices, scores, events. Use it whenever the answer depends on current or recent information.",
        parameters: {
          type: "OBJECT",
          properties: { query: { type: "STRING", description: "Search query" } },
          required: ["query"],
        },
      },
      {
        name: "search_images",
        description:
          "Search the web for images, photos, pictures, posters, or visual references of a person, place, or object. Use this ONLY when the user explicitly asks to see or show photos/images.",
        parameters: {
          type: "OBJECT",
          properties: { query: { type: "STRING", description: "Image search query" } },
          required: ["query"],
        },
      }
    ]
  }
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SERPAPI_API_KEY = Deno.env.get("SERPAPI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("AI is not configured properly (Missing GEMINI_API_KEY).");

    const { messages = [], language = "en" } = await req.json();

    const today = new Date().toISOString().slice(0, 10);
    const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const system = `You are TruthScan AI, a helpful, accurate general-purpose assistant with LIVE WEB and IMAGE SEARCH ACCESS.

Current UTC date: ${today}. Current time in India (IST): ${nowIST}.

RULES:
1. For time-sensitive questions, news, facts, holidays, use web_search first.
2. If the user explicitly asks to SHOW or GIVE photos, images, or pictures, you MUST call search_images.
3. You can call both tools if the user asks for images AND information (e.g. "show me photos of X and tell me their latest news").
4. FAST IMAGE DELIVERY: If the user ONLY asks for photos (e.g., "prabhas photos", "show me laptop images"), call search_images, and then IMMEDIATELY output a brief confirmation message and STOP. Do NOT over-analyze or perform unnecessary extra searches.
5. CRITICAL: NEVER say you "cannot display images" or "cannot send image files". The UI *will* render the images you return via the search_images tool. Always confirm you have found them.
6. Base your answers on the results. Be concise.
7. LANGUAGE INDEPENDENCE: You MUST automatically detect the language of the user's CURRENT message and respond in the exact same language:
   - If they write in English, reply in English.
   - If they write in Telugu Unicode (e.g. "ఇది ఏమిటి?"), reply in Telugu script.
   - If they write in Telugish / Roman Telugu (e.g. "idi enti bro?"), reply in Telugish.
   - If they explicitly ask you to speak in a specific language, follow their request.
   - Adapt message-by-message. Do NOT permanently lock to one language.`;

    const contents = [
       ...messages.map((m: any) => ({
           role: m.role === "assistant" ? "model" : m.role,
           parts: [{ text: m.content }]
       }))
    ];

    const usedSources: SearchHit[] = [];
    const usedImages: ImageHit[] = [];
    let finalJsonResponse = "";
    let lastSeenText = "";

    for (let step = 0; step < 4; step++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           systemInstruction: { parts: [{ text: system }] },
           contents,
           tools,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please try again shortly.");
        }
        console.error("Gemini API Error:", res.status, await res.text());
        throw new Error("AI request failed");
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content || !candidate.content.parts) {
         throw new Error("Empty AI response");
      }

      const parts = candidate.content.parts;
      const functionCalls = parts.filter((p: any) => p.functionCall);
      const textParts = parts.filter((p: any) => p.text);

      if (textParts.length > 0) {
         lastSeenText = textParts.map((p: any) => p.text).join("\n");
      }

      if (functionCalls.length === 0) {
        if (textParts.length > 0) {
           finalJsonResponse = lastSeenText;
        }
        break;
      }

      contents.push({ role: "model", parts: functionCalls.map((f: any) => ({ functionCall: f.functionCall })) });
      const functionResponses: any[] = [];

      for (const call of functionCalls) {
         const name = call.functionCall.name;
         const args = call.functionCall.args || {};
         let resultData;
         
         try {
             if (name === "web_search") {
                 const hits = await webSearch(args.query);
                 usedSources.push(...hits.slice(0, 3));
                 resultData = hits;
             } else if (name === "search_images") {
                 const hits = await imageSearch(args.query, SERPAPI_API_KEY);
                 if (hits.length === 0) {
                     resultData = { error: "No relevant images were found." };
                 } else {
                     usedImages.push(...hits);
                     resultData = hits;
                 }
             } else {
                 resultData = { error: "Unknown function call" };
             }
         } catch (err: any) {
             resultData = { error: "Search failed: " + err.message };
         }
         
         functionResponses.push({
            functionResponse: { name, response: resultData }
         });
      }
      
      contents.push({ role: "user", parts: functionResponses });
    }

    if (!finalJsonResponse) {
       if (lastSeenText) {
          finalJsonResponse = lastSeenText;
       } else if (usedImages.length > 0 || usedSources.length > 0) {
          // Fallback message prioritizing dynamic language
          const userMessage = messages[messages.length - 1]?.content || "";
          if (userMessage.match(/[a-zA-Z]/) && userMessage.toLowerCase().includes("bro")) {
              finalJsonResponse = "Bro, konni relevant results dorikayi. Kindha chudu. Complete research time out ayyindi.";
          } else if (userMessage.match(/[\u0C00-\u0C7F]/)) {
              finalJsonResponse = "కొన్ని ఫలితాలు దొరికాయి. పూర్తి పరిశోధన సమయం ముగిసింది. దయచేసి కింద ఉన్న సమాచారాన్ని చూడండి.";
          } else {
              finalJsonResponse = "I found some partial results, but the full research process timed out. Please see the available results below.";
          }
       } else {
          finalJsonResponse = "I couldn't complete the research in time. Please rephrase your question.";
       }
    }

    return new Response(
      JSON.stringify({ content: finalJsonResponse, sources: usedSources, images: usedImages }),
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
