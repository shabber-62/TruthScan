import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, context, platform } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!OPENAI_API_KEY && !GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI service configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "text") {
      systemPrompt = `You are an expert fact-checker and fake news detection AI with access to vast knowledge. Your job is to analyze text and determine if it contains real, verifiable information or fake/misleading content.

IMPORTANT ANALYSIS GUIDELINES:
1. Check if the claim can be verified against known facts
2. Look for logical inconsistencies, exaggerations, or sensationalism
3. Consider the plausibility of the statement
4. For date-specific claims (like "today is holiday"), explain that you cannot verify real-time dates but can assess the claim's structure
5. Identify potential misinformation patterns

You MUST respond with a valid JSON object containing:
- isReal: boolean (true if the information appears factual/verifiable, false if fake/misleading/unverifiable)
- confidence: number between 60-99 (your confidence level in the assessment)
- reason: string (2-4 sentences explaining your analysis. Include:
  * What sources or knowledge you used to verify (Wikipedia, official records, scientific consensus, news archives, etc.)
  * Specific reasons why the content is real or fake
  * Any red flags or verification points found)
- sources: string (mention where this could be verified: "Wikipedia", "Official Government Records", "News Archives", "Scientific Journals", "Cannot be verified - requires real-time data", etc.)`;
      userPrompt = `Analyze this text for authenticity and fact-check it:\n\n"${content}"\n\nProvide detailed analysis with sources.`;
    } else if (type === "image") {
      systemPrompt = `You are an expert image forensics analyst specializing in detecting manipulated, AI-generated, or fake images.

ANALYSIS CRITERIA:
1. Check for signs of digital manipulation (inconsistent lighting, shadows, edges)
2. Look for AI-generation artifacts (unnatural patterns, distorted features)
3. Assess metadata consistency if context is provided
4. Identify deepfake indicators
5. Check for copy-paste or cloning artifacts

You MUST respond with a valid JSON object containing:
- isReal: boolean (true if image appears authentic, false if likely manipulated/AI-generated)
- confidence: number between 60-99
- reason: string (2-4 sentences explaining:
  * Specific manipulation indicators found or absent
  * Technical analysis of the image characteristics
  * Why you believe it's real or fake)
- sources: string (mention analysis techniques used: "Pixel Analysis", "Shadow/Lighting Consistency Check", "AI Artifact Detection", "Edge Analysis", etc.)`;
      userPrompt = `Analyze this image for manipulation or AI generation. ${context ? `Context provided: "${context}"` : "No context provided."}\n\nProvide detailed forensic analysis.`;
    } else if (type === "live") {
      systemPrompt = `You are a real-time image verification expert analyzing camera-captured content.

ANALYSIS FOCUS:
1. Assess if the capture appears to be a genuine camera photo
2. Check for signs of screen capture or re-photographed content
3. Look for editing or filter applications
4. Verify natural lighting and environment consistency

You MUST respond with a valid JSON object containing:
- isReal: boolean (true if appears to be genuine camera capture, false otherwise)
- confidence: number between 60-99
- reason: string (2-4 sentences explaining your verification findings)
- sources: string (analysis methods used)`;
      userPrompt = "Analyze this live camera capture for authenticity. Is this a genuine, unmanipulated photo?";
    } else if (type === "social") {
      systemPrompt = `You are a social media analysis expert specializing in detecting trolls, bots, and coordinated misinformation campaigns.

DETECTION CRITERIA:
1. Language patterns typical of trolls (inflammatory, divisive, provocative)
2. Bot-like behavior indicators (repetitive phrases, unnatural timing references)
3. Misinformation tactics (false claims, misleading statistics, emotional manipulation)
4. Coordinated campaign indicators
5. Account authenticity signals

You MUST respond with a valid JSON object containing:
- isReal: boolean (true if appears to be genuine human user, false if likely troll/bot/misinformation)
- confidence: number between 60-99
- reason: string (2-4 sentences explaining:
  * Specific troll/bot indicators found or absent
  * Language and behavior pattern analysis
  * Misinformation tactics detected if any)
- sources: string (mention analysis basis: "Language Pattern Analysis", "Bot Behavior Detection", "Misinformation Tactic Recognition", "Sentiment Analysis", etc.)`;
      userPrompt = `Analyze this ${platform || "social media"} content for troll/bot behavior and misinformation:\n\n"${content}"\n\nProvide detailed analysis.`;
    }

    let result = null;
    let lastError = null;

    // Try OpenAI first
    if (OPENAI_API_KEY && !result) {
      try {
        console.log("Attempting OpenAI...");
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
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
          result = JSON.parse(data.choices[0].message.content);
          console.log("OpenAI success");
        } else {
          const errorText = await response.text();
          console.log("OpenAI failed:", response.status, errorText);
          lastError = `OpenAI: ${response.status}`;
        }
      } catch (e) {
        console.log("OpenAI error:", e);
        lastError = `OpenAI error: ${e}`;
      }
    }

    // Try Gemini if OpenAI failed
    if (GEMINI_API_KEY && !result) {
      try {
        console.log("Attempting Gemini...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only, no markdown.`
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
          result = JSON.parse(textContent);
          console.log("Gemini success");
        } else {
          const errorText = await response.text();
          console.log("Gemini failed:", response.status, errorText);
          lastError = `Gemini: ${response.status}`;
        }
      } catch (e) {
        console.log("Gemini error:", e);
        lastError = `Gemini error: ${e}`;
      }
    }

    // Fallback to Lovable AI
    if (LOVABLE_API_KEY && !result) {
      try {
        console.log("Attempting Lovable AI...");
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (response.ok) {
          const data = await response.json();
          result = JSON.parse(data.choices[0].message.content);
          console.log("Lovable AI success");
        } else {
          const errorText = await response.text();
          console.log("Lovable AI failed:", response.status, errorText);
          lastError = `Lovable AI: ${response.status}`;
        }
      } catch (e) {
        console.log("Lovable AI error:", e);
        lastError = `Lovable AI error: ${e}`;
      }
    }

    if (!result) {
      throw new Error(`All AI providers failed. Last error: ${lastError}`);
    }

    // Ensure result has required fields with defaults
    const finalResult = {
      isReal: result.isReal ?? false,
      confidence: result.confidence ?? 75,
      reason: result.reason ?? "Analysis completed.",
      sources: result.sources ?? "AI Analysis"
    };

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
