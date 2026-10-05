import Camera from "@/pages/submit-reports/components/Camera";
import { Button, Modal, Stack, Textarea } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { z } from "zod/v4";
import { useAuth } from "@/context/AuthContext";
import { useDisclosure } from "@mantine/hooks";

const schema = z.object({
  image: z.string().min(2, { error: "You must take an image" }),
  description: z
    .string()
    .min(5, { error: "You must have at least 5 characters" }),
});

export default function SubmitReports() {
  const { session } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraResetKey, setCameraResetKey] = useState(0);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      image: null as null | string,
      location: "",
      description: "",
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  const uploadImage = async (base64Image: string) => {
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
  };

  const aiCategorize = async (image: string, description: string) => {
    const { data, error } = await supabase.functions.invoke("ai-categorizer", {
      body: {
        image: image,
        description: description,
      },
    });

    if (error) {
      throw new Error(`AI categorization failed: ${error.message}`);
    }

    return data?.category ?? "other";
  };

  async function findNearbyIncidents(location: string, category: string) {
    const [latStr, lngStr] = location.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid location string format");
    }

    const { data, error } = await supabase.rpc("get_nearby_incidents", {
      query_lat: lat,
      query_lng: lng,
      radius_meters: 50,
      category: category,
    });

    if (error) {
      console.error("Error fetching nearby incidents:", error);
      return null;
    }

    return data;
  }

  async function aggregateReport(location: string, category: string) {
    const nearbyIncidents = await findNearbyIncidents(location, category);

    if (!nearbyIncidents || nearbyIncidents.length === 0) {
      const [lat, lng] = location.split(",");
      const pointLocation = `POINT(${lng} ${lat})`;
      const { data, error } = await supabase
        .from("incident")
        .insert({ location: pointLocation, category })
        .select("id")
        .single();

      if (error) {
        console.error("Error inserting new incident: ", error);
      }

      return [data?.id];
    } else {
      return nearbyIncidents;
    }
  }
  const createReport = async (
    userId: string,
    description: string,
    location: string,
    imageUrl: string,
    incidentId: string,
    category: string,
  ) => {
    const [latStr, lngStr] = location.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid location string format");
    }
    const { error: dbError } = await supabase.from("report").insert([
      {
        location: `POINT(${lat}, ${lng})`,
        category,
        description,
        image_url: imageUrl,
        incident_id: incidentId,
        user_id: userId,
      },
    ]);

    if (dbError) throw dbError;
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.image || !session?.user.id) return;
    setIsSubmitting(true);

    try {
      const location = values.location?.trim() || "Location Here";
      const { imageUrl, base64Clean } = await uploadImage(values.image);
      const category = await aiCategorize(base64Clean, values.description);
      const { incidentId, isNew } = await aggregateReport(location, category);
      await createReport(
        session.user.id,
        values.description,
        imageUrl,
        location,
        incidentId[0],
        category,
      );
      alert("Report and image submitted successfully!");
      form.reset();
      setCameraResetKey((key) => key + 1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error submitting report:", errorMessage);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Modal opened={opened} onClose={close} title="Authentication">
        {/* Modal content */}
      </Modal>

      <Stack>
        <Camera
          onCapture={(base64Image: string) => {
            form.setFieldValue("image", base64Image);
          }}
          onRetake={() => {
            form.setFieldValue("image", null);
          }}
          resetKey={cameraResetKey}
        />

        <Textarea
          label="Description"
          description="Include specific facts: what exactly happened, and any visible damage or immediate actions taken."
          placeholder="e.g., I noticed a severe water leak coming from the ceiling pipe near the main entrance..."
          minRows={4}
          autosize
          {...form.getInputProps("description")}
        />

        <Button type="submit" loading={isSubmitting}>
          Submit
        </Button>
      </Stack>
    </form>
  );
}
