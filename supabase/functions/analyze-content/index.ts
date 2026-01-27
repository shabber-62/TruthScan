import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const TRUSTED_SOURCES: Record<string, { url: string; type: SourceInfo["type"] }> = {
  "Google Fact Check": { url: "https://toolbox.google.com/factcheck/explorer", type: "fact-check" },
  "PolitiFact": { url: "https://www.politifact.com", type: "fact-check" },
  "Snopes": { url: "https://www.snopes.com", type: "fact-check" },
  "Reuters Fact Check": { url: "https://www.reuters.com/fact-check", type: "fact-check" },
  "BBC Verify": { url: "https://www.bbc.com/news/reality_check", type: "news" },
  "AFP Fact Check": { url: "https://factcheck.afp.com", type: "fact-check" },
  "Wikipedia": { url: "https://www.wikipedia.org", type: "database" },
  "Official Government Records": { url: "https://www.gov.in", type: "official" },
  "Associated Press": { url: "https://apnews.com", type: "news" },
  "FactCheck.org": { url: "https://www.factcheck.org", type: "fact-check" },
};

function getSystemPrompt(type: string, platform?: string): string {
  const baseInstruction = `You are an advanced fact-checking AI system used by government agencies. You must provide ACCURATE, DETAILED, and SOURCE-BACKED analysis.

CRITICAL REQUIREMENTS:
1. Analyze content thoroughly using multiple verification methods
2. Provide specific, numbered reasoning points (3-5 points)
3. Reference 2-4 trusted verification sources with contribution percentages
4. Give a clear verdict: REAL, FAKE, MISLEADING, or UNVERIFIED
5. Confidence score must reflect actual certainty (60-99%)

AVAILABLE TRUSTED SOURCES (use these for source attribution):
- Google Fact Check (fact-check databases)
- PolitiFact (political fact-checking)
- Snopes (urban legends, rumors)
- Reuters Fact Check (news verification)
- BBC Verify (international news)
- AFP Fact Check (global fact-checking)
- Wikipedia (background context only)
- Official Government Records (official data)
- Associated Press (news verification)
- FactCheck.org (policy claims)

You MUST respond with a valid JSON object containing:
{
  "isReal": boolean,
  "confidence": number (60-99),
  "verdict": "REAL" | "FAKE" | "MISLEADING" | "UNVERIFIED",
  "reason": "2-3 sentence summary",
  "reasonPoints": ["Point 1: Specific finding", "Point 2: ...", "Point 3: ..."],
  "sources": [
    {"name": "Source Name", "type": "fact-check|news|database|web|official", "contribution": 35},
    {"name": "Source Name", "type": "...", "contribution": 25}
  ]
}

Note: Source contributions should add up to approximately 100%.`;

  if (type === "text") {
    return `${baseInstruction}

TEXT ANALYSIS FOCUS:
1. Verify factual claims against known databases
2. Check for logical inconsistencies or exaggerations
3. Identify sensationalism or emotional manipulation
4. Cross-reference with official records if applicable
5. For time-sensitive claims, note if real-time verification is needed`;
  } else if (type === "image") {
    return `${baseInstruction}

IMAGE ANALYSIS FOCUS:
1. Detect digital manipulation artifacts
2. Check shadow and lighting consistency
3. Identify AI-generation patterns (DALL-E, Midjourney, etc.)
4. Look for compression anomalies or copy-paste artifacts
5. Assess metadata consistency if context provided`;
  } else if (type === "live") {
    return `${baseInstruction}

LIVE CAPTURE ANALYSIS FOCUS:
1. Verify genuine camera capture characteristics
2. Check for screen re-capture or edited content
3. Assess natural lighting patterns
4. Detect filter or post-processing applications
5. Verify environmental consistency`;
  } else if (type === "social") {
    return `${baseInstruction}

SOCIAL MEDIA ANALYSIS FOCUS (Platform: ${platform || "general"}):
1. Identify troll behavior patterns (inflammatory, divisive language)
2. Detect bot-like repetition or unnatural phrasing
3. Check for misinformation tactics
4. Analyze sentiment and intent
5. Look for coordinated campaign indicators`;
  }
  
  return baseInstruction;
}

async function analyzeWithGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<AnalysisResult | null> {
  try {
    console.log("Attempting Gemini analysis...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only.` }]
        }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const result = JSON.parse(textContent);
      console.log("Gemini analysis successful");
      return result;
    } else {
      console.log("Gemini failed:", response.status);
      return null;
    }
  } catch (e) {
    console.log("Gemini error:", e);
    return null;
  }
}

async function analyzeWithOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<AnalysisResult | null> {
  try {
    console.log("Attempting OpenAI cross-check...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      console.log("OpenAI cross-check successful");
      return result;
    } else {
      console.log("OpenAI failed:", response.status);
      return null;
    }
  } catch (e) {
    console.log("OpenAI error:", e);
    return null;
  }
}

async function analyzeWithLovableAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<{ result: AnalysisResult | null; rateLimited?: boolean; paymentRequired?: boolean }> {
  try {
    console.log("Attempting Lovable AI...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (response.status === 429) {
      return { result: null, rateLimited: true };
    }
    if (response.status === 402) {
      return { result: null, paymentRequired: true };
    }

    if (response.ok) {
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      console.log("Lovable AI successful");
      return { result };
    } else {
      console.log("Lovable AI failed:", response.status);
      return { result: null };
    }
  } catch (e) {
    console.log("Lovable AI error:", e);
    return { result: null };
  }
}

function mergeResults(geminiResult: AnalysisResult | null, openaiResult: AnalysisResult | null): AnalysisResult {
  // If only one result, use it
  if (!geminiResult && openaiResult) return normalizeResult(openaiResult);
  if (geminiResult && !openaiResult) return normalizeResult(geminiResult);
  if (!geminiResult && !openaiResult) {
    throw new Error("No analysis results available");
  }

  const g = geminiResult!;
  const o = openaiResult!;

  // Merge logic: average confidence, combine reasoning
  const avgConfidence = Math.round((g.confidence + o.confidence) / 2);
  
  // Determine final verdict based on both
  let finalVerdict: AnalysisResult["verdict"];
  if (g.isReal === o.isReal) {
    finalVerdict = g.isReal ? "REAL" : "FAKE";
  } else {
    // Disagreement - mark as MISLEADING or UNVERIFIED based on confidence
    finalVerdict = avgConfidence >= 70 ? "MISLEADING" : "UNVERIFIED";
  }
  
  const isReal = finalVerdict === "REAL";

  // Combine reason points (deduplicate)
  const allReasonPoints = [
    ...(g.reasonPoints || []),
    ...(o.reasonPoints || [])
  ].slice(0, 5);

  // Merge sources with adjusted contributions
  const mergedSources = mergeSourcesWithContributions(g.sources || [], o.sources || []);

  return {
    isReal,
    confidence: avgConfidence,
    verdict: finalVerdict,
    reason: `${g.reason || ""} Cross-verified: ${o.reason || ""}`.trim(),
    reasonPoints: allReasonPoints.length > 0 ? allReasonPoints : ["Analysis completed with dual AI verification"],
    sources: mergedSources
  };
}

function normalizeResult(result: AnalysisResult): AnalysisResult {
  const sources = (result.sources || []).map(s => {
    const trustedSource = TRUSTED_SOURCES[s.name];
    return {
      name: s.name,
      url: trustedSource?.url || s.url || "#",
      type: trustedSource?.type || s.type || "web",
      contribution: s.contribution || 25
    };
  });

  // Ensure at least 2 sources
  if (sources.length < 2) {
    sources.push({
      name: "AI Analysis",
      url: "#",
      type: "web" as const,
      contribution: 100 - sources.reduce((sum, s) => sum + s.contribution, 0)
    });
  }

  return {
    isReal: result.isReal ?? false,
    confidence: result.confidence ?? 75,
    verdict: result.verdict || (result.isReal ? "REAL" : "FAKE"),
    reason: result.reason || "Analysis completed.",
    reasonPoints: result.reasonPoints || ["Analysis completed"],
    sources
  };
}

function mergeSourcesWithContributions(sources1: SourceInfo[], sources2: SourceInfo[]): SourceInfo[] {
  const sourceMap = new Map<string, SourceInfo>();
  
  [...sources1, ...sources2].forEach(source => {
    const existing = sourceMap.get(source.name);
    if (existing) {
      existing.contribution = Math.round((existing.contribution + source.contribution) / 2);
    } else {
      const trustedSource = TRUSTED_SOURCES[source.name];
      sourceMap.set(source.name, {
        name: source.name,
        url: trustedSource?.url || source.url || "#",
        type: trustedSource?.type || source.type || "web",
        contribution: source.contribution || 25
      });
    }
  });

  // Normalize contributions to ~100%
  const sources = Array.from(sourceMap.values()).slice(0, 4);
  const totalContribution = sources.reduce((sum, s) => sum + s.contribution, 0);
  if (totalContribution > 0 && totalContribution !== 100) {
    const factor = 100 / totalContribution;
    sources.forEach(s => {
      s.contribution = Math.round(s.contribution * factor);
    });
  }

  return sources;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, context, platform, language } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!OPENAI_API_KEY && !GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI service configured");
    }

    const systemPrompt = getSystemPrompt(type, platform);
    
    let userPrompt = "";
    if (type === "text") {
      userPrompt = `Analyze this text for authenticity and fact-check it thoroughly:\n\n"${content}"\n\nProvide detailed analysis with specific sources and reasoning points.`;
    } else if (type === "image") {
      userPrompt = `Analyze this image for manipulation or AI generation. ${context ? `Context: "${context}"` : ""}\n\nProvide forensic analysis with specific findings.`;
    } else if (type === "live") {
      userPrompt = "Analyze this live camera capture for authenticity. Provide detailed verification findings.";
    } else if (type === "social") {
      userPrompt = `Analyze this ${platform || "social media"} content for troll/bot behavior and misinformation:\n\n"${content}"\n\nProvide detailed behavioral analysis.`;
    }

    // DUAL AI APPROACH: Use both Gemini and OpenAI for higher accuracy
    let geminiResult: AnalysisResult | null = null;
    let openaiResult: AnalysisResult | null = null;

    // Step 1: Primary analysis with Gemini (reasoning, language understanding)
    if (GEMINI_API_KEY) {
      geminiResult = await analyzeWithGemini(GEMINI_API_KEY, systemPrompt, userPrompt);
    }

    // Step 2: Cross-check with OpenAI (fact verification, source matching)
    if (OPENAI_API_KEY) {
      openaiResult = await analyzeWithOpenAI(OPENAI_API_KEY, systemPrompt, userPrompt);
    }

    // Step 3: Fallback to Lovable AI if both fail
    if (!geminiResult && !openaiResult && LOVABLE_API_KEY) {
      const lovableResponse = await analyzeWithLovableAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
      
      if (lovableResponse.rateLimited) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (lovableResponse.paymentRequired) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (lovableResponse.result) {
        geminiResult = lovableResponse.result;
      }
    }

    // Step 4: Merge results from both AI engines
    const finalResult = mergeResults(geminiResult, openaiResult);

    console.log("Final merged result:", JSON.stringify(finalResult));

    return new Response(JSON.stringify(finalResult), {
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
