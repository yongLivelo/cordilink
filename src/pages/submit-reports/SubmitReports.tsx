import Camera from "@/pages/submit-reports/components/Camera";
import LocationForm from "@/pages/submit-reports/components/LocationForm";
import {
  formatLocation,
  saveReportLocation,
  useReportLocation,
} from "@/pages/submit-reports/components/useReportLocation";
import { Button, Stack, Textarea } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { z } from "zod/v4";
import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  image: z.string().min(2, { error: "You must take an image" }),
  description: z
    .string()
    .min(5, { error: "You must have at least 5 characters" }),
});

export default function SubmitReports() {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const reportLocation = useReportLocation();
  const { session } = useAuth();
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

  const aggregateReport = async (location: string, category: string) => {
    const { data, error } = await supabase.functions.invoke("aggregateReport", {
      body: {
        location,
        category,
      },
    });

    if (error) {
      throw new Error(`Report aggregation failed: ${error.message}`);
    }

    return data?.incidentId;
  };

  const createReport = async (
    userId: string,
    description: string,
    imageUrl: string,
    category: string,
    incidentId: string,
  ) => {
    const { error: dbError } = await supabase.from("report").insert([
      {
        location: "Location Here",
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
    if (!values.image || !session?.user) {
      alert("You must be signed in to submit a report.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { imageUrl, base64Clean } = await uploadImage(values.image);
      const category = await aiCategorize(base64Clean, values.description);
      const incidentId = await aggregateReport(location, category);
      await createReport(
        session.user.id,
        values.description,
        imageUrl,
        incidentId,
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
          description="Use this format: What happened, Where, When, and the Impact. Stick to facts you saw."
          placeholder={
            "What: Broken water pipe flooding the road\n" +
            "Where: In front of Burnham Park main gate, Baguio City\n" +
            "When: Since this morning\n" +
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
  );
}
