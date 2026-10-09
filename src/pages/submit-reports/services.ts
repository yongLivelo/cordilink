import { supabase } from "@/lib/supabaseClient";
import type { Incident } from "@/types/report";
import type { ReportDraft, ReportPayload } from "./types";

// ==========================================
// API & SERVICES
// ==========================================

/** Uploads the captured image and returns its public URL + cleaned base64. */
export async function uploadImage(base64Image: string) {
  const base64Clean = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const arrayBuffer = Uint8Array.from(atob(base64Clean), (c) =>
    c.charCodeAt(0),
  );
  const fileName = `${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("report_images")
    .upload(fileName, arrayBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("report_images")
    .getPublicUrl(uploadData.path);

  return { imageUrl: publicUrlData.publicUrl, base64Clean };
}

/** Classifies the report via the `ai-categorizer` Edge Function. */
// 1. Define the exact shape of the returned data
export interface AiCategorizeResult {
  category: string;
  embedding: number[];
}

// 2. Change Promise<Object> to Promise<AiCategorizeResult>
export async function aiCategorize(
  image: string,
  description: string,
): Promise<AiCategorizeResult> {
  const { data, error } = await supabase.functions.invoke("ai-categorizer", {
    body: {
      image,
      text: description,
    },
  });

  if (error) throw new Error(`AI categorization failed: ${error.message}`);

  return {
    category: data?.category,
    embedding: data?.embedding,
  };
}

/** Finds active incidents near the report matching the given category. */
export async function findNearbyIncidents(
  userId: string,
  lat: number,
  lng: number,
  category: string,
  embedding: number[], // Properly typed vector array
  matchThreshold: number = 0.5, // Optional cosine similarity threshold (0.0 to 1.0)
): Promise<Incident[]> {
  const { data, error } = await supabase.rpc("get_nearby_incidents", {
    query_lat: lat,
    query_lng: lng,
    query_category: category,
    query_embedding: embedding, // Passed to PostgreSQL pgvector
    radius_meters: 100,
    match_threshold: matchThreshold,
    exclude_user_id: userId,
  });

  if (error) {
    console.error("Error finding nearby incident reports: ", error);
    return [];
  }

  return data ?? [];
}

/** Creates a new incident from a draft and returns its id. */
export async function createNewIncident(
  draft: ReportDraft,
): Promise<string | number> {
  const { lat, lng, category, locationName, description, imageUrl, embedding } =
    draft;
  const pointLocation = `POINT(${lng} ${lat})`;

  const { data, error } = await supabase
    .from("incident")
    .insert({
      location: `SRID=4326;${pointLocation}`,
      category,
      location_name: locationName,
      description,
      image_url: imageUrl,
      embedding,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/** Inserts the report row linking it to an incident. */
export async function createReport(payload: ReportPayload): Promise<void> {
  const formattedLocation = `SRID=4326;${payload.locationPoint}`;

  const { error: dbError } = await supabase.from("report").insert([
    {
      location: formattedLocation,
      location_name: payload.locationName,
      category: payload.category,
      description: payload.description,
      image_url: payload.imageUrl,
      incident_id: payload.incidentId,
      user_id: payload.userId,
    },
  ]);

  if (dbError) throw dbError;
}
