import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  GoogleGenerativeAI,
  SchemaType,
} from "https://esm.sh/@google/generative-ai";

Deno.serve(async (req) => {
  try {
    // 1. Parse the Webhook payload from Supabase
    const payload = await req.json();

    // Handle both INSERTs (record) and DELETEs (old_record)
    const incidentId = payload.incidentId;

    if (!incidentId) {
      return new Response(JSON.stringify({ message: "No incident_id found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Get current incident state to know if it's ALREADY promoted
    const { data: incident, error: incidentError } = await supabase
      .from("incident")
      .select("is_community_report")
      .eq("id", incidentId)
      .single();

    if (incidentError) {
      // PGRST116 means zero rows returned (Incident might already be deleted)
      if (incidentError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ message: "Incident already deleted" }),
          { status: 200 },
        );
      }
      throw incidentError;
    }

    // 4. Fetch all active reports connected to this incident
    const { data: reports, error: fetchError } = await supabase
      .from("report")
      .select("description, image_url")
      .eq("incident_id", incidentId);

    if (fetchError) throw fetchError;

    // Configuration
    const THRESHOLD = 2; // Keep at 2 for testing, change to 5 for production
    const reportCount = reports.length;
    const isCurrentlyPromoted = incident.is_community_report;

    // ==========================================
    // 5. STATE MACHINE LOGIC
    // ==========================================

    // State A: 0 Reports left -> Delete the incident entirely
    if (reportCount === 0) {
      const { error: deleteError } = await supabase
        .from("incident")
        .delete()
        .eq("id", incidentId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true, status: "incident-deleted" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // State B: Crossed the threshold AND not yet promoted -> Call Gemini & Promote
    if (reportCount >= THRESHOLD && !isCurrentlyPromoted) {
      const descriptions = reports.map((r) => r.description).join("\n- ");

      const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
        },
      });

      const prompt = `
        You are an assistant for a city reporting system. 
        Here are multiple user reports about a single community incident:
        - ${descriptions}
        
        Please provide a short, professional title (max 6 words) and a consolidated, factual description summarizing the issue.
      `;

      const result = await model.generateContent(prompt);
      const aiGenerated = JSON.parse(result.response.text());

      const { error: updateError } = await supabase
        .from("incident")
        .update({
          title: aiGenerated.title,
          description: aiGenerated.description,
          is_community_report: true,
        })
        .eq("id", incidentId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, status: "promoted", aiGenerated }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // State C: Dropped below threshold BUT is still promoted -> Demote it
    if (reportCount < THRESHOLD && isCurrentlyPromoted) {
      const { error: updateError } = await supabase
        .from("incident")
        .update({
          title: "",
          description: "", // Wipe the AI summary so it reverts to standard appearance
          is_community_report: false,
        })
        .eq("id", incidentId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, status: "demoted" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // State D: Above threshold and already promoted, OR below threshold and not promoted
    // -> Do nothing, save API tokens!
    return new Response(
      JSON.stringify({
        success: true,
        status: "no-action-needed",
        reportCount,
        isCurrentlyPromoted,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
