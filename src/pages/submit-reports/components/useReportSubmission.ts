import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import type { Incident } from "@/types/report";
import {
  aiCategorize,
  createNewIncident,
  createReport,
  findNearbyIncidents,
  uploadImage,
} from "../services";
import type { ReportDraft } from "../types";
import { notifications } from "@mantine/notifications";
import type { ReportLocation } from "@/components/Location/LocationSchema";

interface UseReportSubmissionOptions {
  /** Called after a report is saved so the caller can reset its form. */
  onSubmitted: () => void;
}

/**
 * Whole submission flow: upload → categorize → match nearby incidents →
 * either prompt the user (modal) or finalize immediately. Owns the loading
 * and pending-match state so the page only has to wire the UI.
 */
export function useReportSubmission({
  onSubmitted,
}: UseReportSubmissionOptions) {
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [matchingIncidents, setMatchingIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<ReportDraft | null>(null);

  // Core execution once an incident choice is finalized
  const finalizeReportSubmission = async (
    incidentId: number,
    draft: ReportDraft,
  ) => {
    if (!session) return;
    upvoteIncident(incidentId, session.user.id);
    // 1. Create the report in the database
    await createReport({
      userId: session.user.id,
      description: draft.description,
      imageUrl: draft.imageUrl,
      category: draft.category,
      incidentId,
      locationPoint: draft.locationPoint,
      locationName: draft.locationName,
    });

    // 2. Trigger the AI summarizer in the background (fire and forget).
    // The catch keeps network errors from crashing the React app.
    supabase.functions
      .invoke("summarize-incident", { body: { incidentId } })
      .catch((err) => console.error("Summarization check failed:", err));

    // 3. Close modal state cleanups first
    setIsModalOpen(false);
    setMatchingIncidents([]);
    setPendingDraft(null);

    // 4. Let the caller reset its form elements and trigger camera wipe
    onSubmitted();

    notifications.show({
      title: "Success",
      message: "Report submitted",
    });
  };

  /**
   * Step 1: process the captured image, then either pause on the match modal
   * or create a new incident and finalize right away.
   */
  const submitReport = async (
    location: ReportLocation,
    image: string,
    description: string,
  ) => {
    if (!session) return;

    setLoading(true);
    try {
      const lat = location.latitude;
      const lng = location.longitude;
      const locationName = "name" in location ? location.name : undefined;
      const locationPoint = `POINT(${lng} ${lat})`;

      // 1. Process & Upload Image
      const { imageUrl, base64Clean } = await uploadImage(image);

      // 2. Analyze category via Edge Function
      const { category, embedding } = await aiCategorize(
        base64Clean,
        description,
      );

      // 3. Look up nearby active incidents
      const nearbyIncidents = await findNearbyIncidents(
        session.user.id,
        lat,
        lng,
        category,
        embedding,
      );

      const draft: ReportDraft = {
        lat,
        lng,
        category,
        locationName,
        imageUrl,
        description,
        locationPoint,
        embedding,
      };

      if (nearbyIncidents.length > 0) {
        // Pause and display matching cards to the user (don't reset the form
        // yet — the user still needs to decide).
        setMatchingIncidents(nearbyIncidents);
        setPendingDraft(draft);
        setIsModalOpen(true);
      } else {
        // Automatically create a new incident if no matches exist
        const newIncidentId = await createNewIncident(draft);
        await finalizeReportSubmission(newIncidentId, draft);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error submitting report:", errorMessage);
      notifications.show({
        title: "Error submitting report:",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Triggered when user clicks "Yes, this is the same incident"
  const selectExistingIncident = async (incidentId: string | number) => {
    if (!pendingDraft) return;

    setLoading(true);
    try {
      await finalizeReportSubmission(incidentId, pendingDraft);
    } catch (error) {
      console.error("Error linking to existing incident:", error);
      alert("Failed to link report to incident.");
    } finally {
      setLoading(false);
    }
  };

  const upvoteIncident = async (incidentId: number, userId: string) => {
    await supabase
      .from("vote")
      .delete()
      .eq("incident_id", incidentId)
      .eq("user_id", userId);
    await supabase.from("vote").insert({
      incident_id: incidentId,
      user_id: userId,
      vote_type: "up",
    });
  };

  // Triggered if user decides none of the matches apply and forces a new incident
  const createNewAnyway = async () => {
    if (!pendingDraft) return;

    setLoading(true);
    try {
      const newIncidentId = await createNewIncident(pendingDraft);
      await finalizeReportSubmission(newIncidentId, pendingDraft);
    } catch (error) {
      console.error("Error creating new incident:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    matchingIncidents,
    isModalOpen,
    closeMatchModal: () => setIsModalOpen(false),
    submitReport,
    selectExistingIncident,
    createNewAnyway,
  };
}
