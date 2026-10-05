import {
  GoogleGenerativeAI,
  SchemaType,
} from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "road_hazard",
  "streetlight",
  "graffiti",
  "sanitation",
  "water",
  "other",
] as const;

// Official, active Google model name
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

type Category = (typeof CATEGORIES)[number];

const isCategory = (v: unknown): v is Category =>
  typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "POST only" },
      { status: 405, headers: corsHeaders },
    );
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY not set" },
      { status: 500, headers: corsHeaders },
    );
  }

  let body: { text?: string; image?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "invalid JSON" },
      { status: 400, headers: corsHeaders },
    );
  }

  const { text, image } = body;

  // Image is optional as long as text is provided (and vice versa)
  if (!text?.trim() && !image) {
    return Response.json(
      { error: "provide text, image, or both" },
      { status: 400, headers: corsHeaders },
    );
  }

  // Dynamic prompt generated directly from the CATEGORIES array
  const categoryListText = CATEGORIES.map((cat) => `- ${cat}`).join("\n");
  const prompt = `You are a strict public infrastructure classifier. Look at the provided text and/or image report and classify it into EXACTLY ONE of these category keys:
${categoryListText}

Respond strictly in JSON format matching the schema.`;

  const parts: any[] = [{ text: prompt }];

  if (image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: image,
      },
    });
  }

  if (text?.trim()) {
    parts.push({ text: `Report text: ${text.trim()}` });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            category: {
              type: SchemaType.STRING,
              enum: CATEGORIES as unknown as string[],
            },
            confidence: { type: SchemaType.NUMBER },
            reasoning: { type: SchemaType.STRING },
          },
          required: ["category", "confidence", "reasoning"],
        },
      },
    });

    // Clean, direct call with no retry loops
    const result = await model.generateContent(parts);
    const raw = result.response.text();

    console.log("RAW GEMINI OUTPUT:", raw);

    if (!raw) {
      return Response.json(
        { error: "empty response from gemini" },
        { status: 502, headers: corsHeaders },
      );
    }

    let parsed: {
      category?: unknown;
      confidence?: unknown;
      reasoning?: unknown;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "invalid JSON from gemini" },
        { status: 502, headers: corsHeaders },
      );
    }

    if (!isCategory(parsed.category)) {
      console.error("Invalid category received from AI:", parsed.category);
      return Response.json(
        { error: "gemini returned an invalid category", got: parsed.category },
        { status: 422, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        category: parsed.category,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Gemini SDK Error:", error);
    return Response.json(
      {
        error: "gemini error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502, headers: corsHeaders },
    );
  }
});
