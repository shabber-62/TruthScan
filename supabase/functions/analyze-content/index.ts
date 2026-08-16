import { webSearch, reverseImageSearch, type SearchHit } from "../_shared/websearch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    functionDeclarations: [
      {
        name: "web_search",
        description:
          "Search the live web (news, fact-check sites, official pages) for evidence about a claim. Use for any factual, dated or time-sensitive claim (holidays, events, statistics, quotes, viral posts, images).",
        parameters: {
          type: "OBJECT",
          properties: { query: { type: "STRING", description: "Search query" } },
          required: ["query"],
        },
      },
      {
        name: "reverse_image_search",
        description:
          "Perform a reverse image search on an uploaded image URL to find the original source, older occurrences, or fact-checks of the image.",
        parameters: {
          type: "OBJECT",
          properties: { imageUrl: { type: "STRING", description: "The image URL (data URI or http URL) to search for" } },
          required: ["imageUrl"],
        },
      }
    ]
  }
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
    if (!h.url || h.url === "#") continue;
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
1. If the input is an IMAGE, FIRST extract and read any text inside the image (OCR). Extract any factual claims from the text or the image's context.
2. Call the web_search tool or reverse_image_search tool BEFORE judging any claim. Run 1-3 searches with different wordings to cross-check.
3. Compare the image or extracted claims with the search results.
4. Base every conclusion on what the search results actually say. Never invent sources or URLs.
5. If evidence is thin or contradictory, use verdict UNVERIFIED or MISLEADING with lower confidence.
6. LANGUAGE INDEPENDENCE: You MUST automatically detect the language of the user's input/context and write the analysis in the exact same language:
   - If the input/context is in English, reply in English.
   - If the input/context is in Telugu Unicode, reply in formal Telugu script.
   - If the input/context is in Telugish / Roman Telugu (e.g. "idi nijamena?"), reply in Telugish.
   - If no context is provided, default to ${language === "te" ? "formal Telugu" : "English"}.
   - Adapt dynamically based on the specific input provided for this analysis.

FINAL ANSWER FORMAT: After your research, your final response must ONLY be a JSON object (no markdown fences, no other text):
{
  "isReal": boolean,
  "confidence": number (60-99),
  "verdict": "REAL" | "FAKE" | "MISLEADING" | "UNVERIFIED",
  "reason": "2-3 sentence summary stating the verified facts found on the web, including OCR text if applicable.",
  "reasonPoints": ["Point 1: specific evidence found + which site it came from", "Point 2: ...", "Point 3: ..."]
}`;

  if (type === "text") return `${shared}\n\nTEXT FOCUS: verify each factual claim against live search results; flag sensationalism, missing context, outdated dates.`;
  if (type === "image") return `${shared}\n\nIMAGE FOCUS: Inspect the image for manipulation. Perform OCR on the image to read text. Use reverse_image_search on the image if needed, and web_search for the extracted text to verify claims. Do NOT automatically call something TRUE just because a web result exists, and do NOT automatically call something FALSE because no result was found.`;
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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SERPAPI_API_KEY = Deno.env.get("SERPAPI_API_KEY");
    
    if (!GEMINI_API_KEY) {
       console.error("GEMINI_API_KEY is missing");
       throw new Error("AI is not configured properly (Missing GEMINI_API_KEY).");
    }

    const isImage = (type === "image" || type === "live") && typeof content === "string" && content.startsWith("data:");

    let userContent: any[] = [];
    if (isImage) {
      const mimeTypeMatch = content.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      const base64Data = content.split(",")[1];
      
      const textPrompt =
        type === "live"
          ? "Analyze this live camera capture for authenticity."
          : `Analyze this image for manipulation. Perform OCR and extract claims. Image context provided by user: "${context || 'None'}"\n\nImage URL for reverse search (if you need it): ${content}`;
          
      userContent = [
        { text: textPrompt },
        { inlineData: { mimeType, data: base64Data } }
      ];
    } else if (type === "social") {
      userContent = [{ text: `Analyze this ${platform || "social media"} post for troll/bot behaviour AND fact-check its claims using live web search:\n\n"${content}"` }];
    } else {
      userContent = [{ text: `Fact-check this content using live web search:\n\n"${content}"` }];
    }

    const contents = [
      {
        role: "user",
        parts: userContent
      }
    ];

    const allHits: SearchHit[] = [];
    let finalJsonResponse = "";

    for (let step = 0; step < 5; step++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
      
      const requestBody = {
        systemInstruction: {
          parts: [{ text: getSystemPrompt(type, platform, language) }]
        },
        contents,
        tools,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Gemini API Error:", res.status, errorText);
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error("AI request failed");
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content || !candidate.content.parts) {
         throw new Error("Empty AI response or failed analysis");
      }

      const parts = candidate.content.parts;
      const functionCalls = parts.filter((p: any) => p.functionCall);
      const textParts = parts.filter((p: any) => p.text);

      if (functionCalls.length === 0) {
        // No more tools to call, we should have our JSON
        if (textParts.length > 0) {
           finalJsonResponse = textParts[0].text;
        }
        break;
      }
      
      // Append the model's tool calls to the history
      contents.push({ role: "model", parts: functionCalls.map(f => ({ functionCall: f.functionCall })) });
      
      const functionResponses: any[] = [];
      
      for (const call of functionCalls) {
         const name = call.functionCall.name;
         const args = call.functionCall.args || {};
         let resultData;
         
         try {
             if (name === "web_search") {
                 console.log("Executing web_search for:", args.query);
                 const hits = await webSearch(args.query);
                 if (hits.length === 0) {
                    resultData = { error: "Fact-check search returned no results" };
                 } else {
                    allHits.push(...hits.slice(0, 4));
                    resultData = hits;
                 }
             } else if (name === "reverse_image_search") {
                 console.log("Executing reverse_image_search");
                 // Pass the original image content (base64/data URI) if the model passed back something else, 
                 // but since SerpApi requires a public URL, this might fail if it's base64. 
                 // Let's pass the image we got. If it's base64, SerpApi won't work without uploading.
                 // In a production app, we would upload to storage first. Since we are fixing this within constraints,
                 // we will rely on the text/OCR claims and web search mostly if the image is not a public URL.
                 if (args.imageUrl && args.imageUrl.startsWith("http")) {
                    const hits = await reverseImageSearch(args.imageUrl, SERPAPI_API_KEY);
                    if (hits.length === 0) {
                       resultData = { error: "No reliable matching image found or SerpApi key missing." };
                    } else {
                       allHits.push(...hits.slice(0, 4));
                       resultData = hits;
                    }
                 } else {
                    resultData = { error: "Reverse image search requires a public URL. Proceed with OCR and text search instead." };
                 }
             } else {
                 resultData = { error: "Unknown function call" };
             }
         } catch (err: any) {
             resultData = { error: "Search failed: " + err.message };
         }
         
         functionResponses.push({
            functionResponse: {
                name,
                response: resultData
            }
         });
      }
      
      // Send the tool response back
      contents.push({ role: "user", parts: functionResponses });
    }

    const parsed = parseJson(finalJsonResponse);
    if (!parsed) {
        console.error("Failed to parse JSON:", finalJsonResponse);
        throw new Error("Unable to verify this claim with the available evidence (Parsing failed).");
    }

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

    console.log("Final result ready with", result.sources.length, "sources.");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-content:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred during analysis.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
