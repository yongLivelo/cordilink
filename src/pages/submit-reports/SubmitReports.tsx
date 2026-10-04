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
const schema = z.object({
  image: z.string().min(2, { error: "You must take an image" }),
  description: z
    .string()
    .min(5, { error: "You must have atleast 5 characters" }),
});
export default function SubmitReports() {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const reportLocation = useReportLocation();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      image: null as string | null,
      description: "",
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  // The description feeds the location suggestions.
  form.watch("description", ({ value }) => setDescription(value));

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.image) return;

    // Location is optional, but if one is provided it must be valid.
    const { ok, value: location } = reportLocation.validate();
    if (!ok) return;

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    try {
      const base64Clean = values.image.replace(/^data:image\/\w+;base64,/, "");
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

      const imageUrl = publicUrlData.publicUrl;

      const { data: inserted, error: dbError } = await supabase
        .from("reports")
        .insert([
          {
            title: "Title Here",
            location: formatLocation(location),
            category: "road_hazard",
            description: values.description,
            image_url: imageUrl,
            user_id: user?.id,
          },
        ])
        .select("id")
        .single();

      if (dbError) throw dbError;

      if (location) await saveReportLocation(inserted.id, location);

      alert("Report and image submitted successfully!");
      form.reset();
      setDescription("");
      reportLocation.reset();
    } catch (error: any) {
      console.error("Error submitting report:", error.message);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setLoading(false);
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
