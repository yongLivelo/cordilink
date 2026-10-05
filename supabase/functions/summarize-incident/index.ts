// supabase/functions/summarize-incident/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

serve(async (req) => {
  try {
    // 1. Parse the Webhook payload from Supabase
    const payload = await req.json();
    const newReport = payload.record; // The newly inserted report
    const incidentId = newReport.incident_id;

    if (!incidentId) {
      return new Response("No incident_id found", { status: 200 });
    }

    // 2. Initialize Supabase client (using service role to bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Check how many reports are connected to this incident
    const { data: reports, error: fetchError } = await supabase
      .from("report")
      .select("description, image_url")
      .eq("incident_id", incidentId);

    if (fetchError) throw fetchError;

    // Only run the AI summarization if there are exactly 5 reports
    // (You can change this to >= 5, but running it exactly at 5 saves AI costs)
    if (reports.length === 5) {
      // 4. Prepare data for Gemini
      const descriptions = reports.map((r) => r.description).join("\n- ");
      const imageUrls = reports.map((r) => r.image_url).filter(Boolean);

      // 5. Call Gemini to summarize
      const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are an assistant for a city reporting system. 
        Here are multiple user reports about a single community incident:
        - ${descriptions}
        
        Please provide a short, professional title (max 6 words) and a consolidated, factual description summarizing the issue.
        Return ONLY a JSON object in this exact format, with no markdown formatting or backticks:
        {"title": "...", "description": "..."}
      `;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text().trim();

      // Parse the JSON safely
      const aiGenerated = JSON.parse(
        textResponse.replace(/```json/g, "").replace(/```/g, ""),
      );

      // 6. Select 3 random images
      const shuffledImages = imageUrls.sort(() => 0.5 - Math.random());
      const selectedImages = shuffledImages.slice(0, 3);

      // 7. Update the Incident record in the database
      const { error: updateError } = await supabase
        .from("incident")
        .update({
          title: aiGenerated.title,
          description: aiGenerated.description,
          // Assuming you change your incident schema to store multiple images (e.g., JSON or comma-separated string)
          image_url: selectedImages.join(","),
          is_community_report: true, // Ensure it gets flagged for the community board
        })
        .eq("id", incidentId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true, aiGenerated }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not enough reports to summarize yet.", {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
