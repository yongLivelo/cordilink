import { useState } from "react";
import { z } from "zod/v4";
import {
  Button,
  Stack,
  Textarea,
  Text,
  SimpleGrid,
  Modal,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Camera from "@/pages/submit-reports/components/Camera";
import LocationForm from "@/pages/submit-reports/components/LocationForm";
import { useReportLocation } from "@/pages/submit-reports/components/useReportLocation";
import ReportCard from "@/components/ReportCard";
import type { Incident } from "@/types/report";

// ==========================================
// 1. SCHEMAS & TYPES
// ==========================================

const schema = z.object({
  image: z.string().min(2, { error: "You must take an image" }),
  description: z
    .string()
    .min(5, { error: "You must have at least 5 characters" }),
});

type ReportPayload = {
  userId: string;
  description: string;
  imageUrl: string;
  category: string;
  incidentId: string | number;
  locationPoint: string;
  locationName?: string;
};

// ==========================================
// 2. API & SERVICES
// ==========================================

async function uploadImage(base64Image: string) {
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

async function aiCategorize(image: string, description: string) {
  const { data, error } = await supabase.functions.invoke("ai-categorizer", {
    body: {
      image,
      text: description,
    },
  });

  if (error) throw new Error(`AI categorization failed: ${error.message}`);
  return data?.category ?? "other";
}

async function findNearbyIncidents(
  userId: string,
  lat: number,
  lng: number,
  category: string,
) {
  const { data, error } = await supabase.rpc("get_nearby_incidents", {
    query_lat: lat,
    query_lng: lng,
    query_category: category,
    radius_meters: 100,
    exclude_user_id: userId,
  });

  if (error) console.error("Error finding nearby incidents reports: ", error);
  return data || [];
}

async function createNewIncident(
  lat: number,
  lng: number,
  category: string,
  locationName: string | undefined,
  description: string,
  imageUrl: string,
) {
  const pointLocation = `POINT(${lng} ${lat})`;
  const { data, error } = await supabase
    .from("incident")
    .insert({
      location: `SRID=4326;${pointLocation}`,
      category,
      location_name: locationName,
      description,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function createReport(payload: ReportPayload) {
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

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export default function SubmitReports() {
  const { session } = useAuth();
  const reportLocation = useReportLocation();

  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [cameraResetKey, setCameraResetKey] = useState(0);

  // States for handling matching incidents interruption flow
  const [matchingIncidents, setMatchingIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    lat: number;
    lng: number;
    category: string;
    locationName?: string;
    imageUrl: string;
    description: string;
    locationPoint: string;
  } | null>(null);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      image: null as null | string,
      location: "",
      description: "",
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  form.watch("description", ({ value }) => setDescription(value));

  // Comprehensive reset function to clear form values, camera state, and location state
  const resetFormAndInputs = () => {
    form.reset();
    form.setFieldValue("image", null);
    setDescription("");
    reportLocation.reset();
    setCameraResetKey((prev) => prev + 1);
  };

  // Core execution once an incident choice is finalized
  const finalizeReportSubmission = async (
    incidentId: string | number,
    payload: {
      lat: number;
      lng: number;
      category: string;
      locationName?: string;
      imageUrl: string;
      description: string;
      locationPoint: string;
    },
  ) => {
    if (!session) return;

    // 1. Create the report in the database
    await createReport({
      userId: session.user.id,
      description: payload.description,
      imageUrl: payload.imageUrl,
      category: payload.category,
      incidentId: incidentId,
      locationPoint: payload.locationPoint,
      locationName: payload.locationName,
    });

    // 2. Trigger the AI summarizer in the background (fire and forget)
    // We add a catch block so network errors don't crash the React app
    supabase.functions
      .invoke("summarize-incident", {
        body: { incidentId: incidentId },
      })
      .catch((err) => console.error("Summarization check failed:", err));

    // 3. Close modal state cleanups first
    setIsModalOpen(false);
    setMatchingIncidents([]);
    setPendingPayload(null);

    // 4. Reset all form elements and trigger camera wipe
    resetFormAndInputs();

    alert("Report and image submitted successfully!");
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.image || !session) {
      return;
    }

    const { ok, value: location } = reportLocation.validate();
    if (!ok || !location) return;

    setLoading(true);

    try {
      const lat = location.latitude;
      const lng = location.longitude;
      const locationName = "name" in location ? location.name : undefined;
      const locationPoint = `POINT(${lng} ${lat})`;

      // 1. Process & Upload Image
      const { imageUrl, base64Clean } = await uploadImage(values.image);

      // 2. Analyze category via Edge Function
      const category = await aiCategorize(base64Clean, values.description);

      // 3. Look up nearby active incidents
      const nearbyIncidents = await findNearbyIncidents(
        session.user.id,
        lat,
        lng,
        category,
      );

      const payloadData = {
        lat,
        lng,
        category,
        locationName,
        imageUrl,
        description: values.description,
        locationPoint,
      };

      if (nearbyIncidents && nearbyIncidents.length > 0) {
        // Pause and display matching cards to the user (Don't reset form yet since user needs to decide)
        setMatchingIncidents(nearbyIncidents);
        setPendingPayload(payloadData);
        setIsModalOpen(true);
      } else {
        // Automatically create a new incident if no matches exist
        const newIncidentId = await createNewIncident(
          lat,
          lng,
          category,
          locationName,
          values.description,
          imageUrl,
        );
        await finalizeReportSubmission(newIncidentId, payloadData);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error submitting report:", errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Triggered when user clicks "Yes, this is the same incident" on an existing ReportCard
  const handleSelectExistingIncident = async (incidentId: string | number) => {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      await finalizeReportSubmission(incidentId, pendingPayload);
    } catch (error) {
      console.error("Error linking to existing incident:", error);
      alert("Failed to link report to incident.");
    } finally {
      setLoading(false);
    }
  };

  // Triggered if user decides none of the matches apply and forces a new incident
  const handleCreateNewAnyway = async () => {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      const newIncidentId = await createNewIncident(
        pendingPayload.lat,
        pendingPayload.lng,
        pendingPayload.category,
        pendingPayload.locationName,
        pendingPayload.description,
        pendingPayload.imageUrl,
      );
      await finalizeReportSubmission(newIncidentId, pendingPayload);
    } catch (error) {
      console.error("Error creating new incident:", error);
      alert("Failed to create new incident.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Camera
            onCapture={(base64Image: string) =>
              form.setFieldValue("image", base64Image)
            }
            onRetake={() => form.setFieldValue("image", null)}
            resetKey={cameraResetKey}
          />

          <Textarea
            label="Description"
            description="Use this format: What happened and the Impact. Stick to facts you saw."
            placeholder={
              "What: Broken water pipe flooding the road\n" +
              "Impact: One lane blocked, water is ankle-deep"
            }
            minRows={6}
            autosize
            {...form.getInputProps("description")}
          />

          <LocationForm location={reportLocation} description={description} />

          <Button type="submit" loading={loading}>
            Submit
          </Button>
        </Stack>
      </form>

      {/* Modal to prompt user if similar active reports/incidents are nearby */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Similar Incidents Found Nearby"
        size="lg"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            We found existing reported incidents close to your location matching
            this category. Is your report about one of these?
          </Text>

          <SimpleGrid cols={1}>
            {matchingIncidents.map((incident) => (
              <ReportCard
                key={incident.id}
                report={incident}
                onSelect={() => handleSelectExistingIncident(incident.id)}
              />
            ))}
          </SimpleGrid>

          <Button
            variant="default"
            fullWidth
            mt="md"
            onClick={handleCreateNewAnyway}
            loading={loading}
          >
            No, create a new separate incident
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
