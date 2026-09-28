import Camera from "@/pages/submit-reports/components/Camera";
import { Button, NativeSelect, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function SubmitReports() {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      image: null as string | null,
      description: "",
      category: "Road",
    },
    validate: {
      description: (value: string) =>
        value.length < 5 ? "Description must be at least 5 characters" : null,
      image: (value: string | null) =>
        !value ? "Please capture a photo of the incident" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.image) return;
    setLoading(true);

    try {
      const base64Clean = values.image.replace(/^data:image\/\w+;base64,/, "");
      const arrayBuffer = Uint8Array.from(atob(base64Clean), (c) =>
        c.charCodeAt(0),
      );
      const fileName = `${Date.now()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("reports-images")
        .upload(fileName, arrayBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("reports-images")
        .getPublicUrl(uploadData.path);

      const imageUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from("reports").insert([
        {
          description: values.description,
          category: values.category,
          image_url: imageUrl,
        },
      ]);

      if (dbError) throw dbError;

      alert("Report and image submitted successfully!");
      form.reset();
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
          description="Description of incident"
          placeholder="Input Description"
          {...form.getInputProps("description")}
        />

        <NativeSelect
          label="Type of incident"
          data={["Road", "Others"]}
          {...form.getInputProps("category")}
        />

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
}
