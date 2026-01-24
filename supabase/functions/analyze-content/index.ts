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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "text") {
      systemPrompt = `You are a fake news detection AI. Analyze the given text and determine if it's likely real news or fake/misinformation. 
      Respond with a JSON object containing:
      - isReal: boolean (true if likely real, false if likely fake)
      - confidence: number between 60-99 (your confidence percentage)
      - reason: string (2-3 sentences explaining your analysis)`;
      userPrompt = `Analyze this news/text for authenticity:\n\n${content}`;
    } else if (type === "image") {
      systemPrompt = `You are an image manipulation detection AI. Based on the description of an image, determine if it might be manipulated or authentic.
      Respond with a JSON object containing:
      - isReal: boolean (true if likely authentic, false if likely manipulated)
      - confidence: number between 60-99
      - reason: string (2-3 sentences about potential manipulation indicators)`;
      userPrompt = `Analyze this image for manipulation. ${context ? `Context: ${context}` : "No context provided."}`;
    } else if (type === "live") {
      systemPrompt = `You are a real-time image verification AI analyzing camera captures.
      Respond with a JSON object containing:
      - isReal: boolean
      - confidence: number between 60-99  
      - reason: string (2-3 sentences about the image authenticity)`;
      userPrompt = "Analyze this live captured image for authenticity.";
    } else if (type === "social") {
      systemPrompt = `You are a social media troll and bot detection AI. Analyze the given ${platform || "social media"} content for signs of trolling, bot behavior, or coordinated misinformation.
      Respond with a JSON object containing:
      - isReal: boolean (true if genuine user, false if likely troll/bot)
      - confidence: number between 60-99
      - reason: string (2-3 sentences explaining troll indicators found)`;
      userPrompt = `Analyze this ${platform || "social media"} content for troll/bot behavior:\n\n${content}`;
    }

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

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

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
