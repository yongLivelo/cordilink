import Camera from "@/pages/submit-reports/components/Camera";
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
  const [cameraResetKey, setCameraResetKey] = useState(0);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      image: null as string | null,
      description: "",
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.image) return;
    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // user_id is NOT NULL, so a missing session must fail here rather than
    // reaching the insert as an undefined -> null value.
    if (authError || !user) {
      setLoading(false);
      alert("You must be signed in to submit a report.");
      return;
    }

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

      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "ai-categorizer",
        {
          body: {
            // text: values.description,
            image: base64Clean,
          },
        },
      );

      if (aiError)
        throw new Error(`AI categorization failed: ${aiError.message}`);

      const { error: dbError } = await supabase.from("reports").insert([
        {
          title: "Title Here",
          location: "Location Here",
          category: aiData.category ?? "other",
          description: values.description,
          image_url: imageUrl,
          user_id: user.id,
        },
      ]);

      if (dbError) throw dbError;

      alert("Report and image submitted successfully!");
      form.reset();
      setCameraResetKey((key) => key + 1);
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

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
}
