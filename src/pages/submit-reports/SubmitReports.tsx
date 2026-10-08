import { useState } from "react";
import { z } from "zod/v4";
import { Button, Stack, Textarea } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";

import Camera from "@/pages/submit-reports/components/Camera";
import LocationForm from "@/pages/submit-reports/components/LocationForm";
import SimilarIncidentsModal from "@/pages/submit-reports/components/SimilarIncidentsModal";
import { useReportLocation } from "@/pages/submit-reports/components/useReportLocation";
import { useReportSubmission } from "@/pages/submit-reports/components/useReportSubmission";

// ==========================================
// 1. SCHEMA
// ==========================================

const schema = z.object({
  image: z.string().min(2, { error: "You must take an image" }),
  description: z
    .string()
    .min(5, { error: "You must have at least 5 characters" }),
});

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function SubmitReports() {
  const reportLocation = useReportLocation();

  const [description, setDescription] = useState("");
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

  form.watch("description", ({ value }) => setDescription(value));

  // Comprehensive reset function to clear form values, camera state, and location state
  const resetFormAndInputs = () => {
    form.reset();
    form.setFieldValue("image", null);
    setDescription("");
    reportLocation.reset();
    setCameraResetKey((prev) => prev + 1);
  };

  // Owns the whole submit → match → finalize flow (see useReportSubmission)
  const submission = useReportSubmission({ onSubmitted: resetFormAndInputs });

  const handleSubmit = async (values: typeof form.values) => {
    console.log("hello");
    if (!values.image) return;

    const { ok, value: location } = reportLocation.validate();
    if (!ok || !location) return;

    await submission.submitReport(location, values.image, values.description);
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

          <Button type="submit" loading={submission.loading}>
            Submit
          </Button>
        </Stack>
      </form>

      {/* Modal to prompt user if similar active reports/incidents are nearby */}
      <SimilarIncidentsModal
        opened={submission.isModalOpen}
        onClose={submission.closeMatchModal}
        incidents={submission.matchingIncidents}
        loading={submission.loading}
        onSelect={submission.selectExistingIncident}
        onCreateNew={submission.createNewAnyway}
      />
    </>
  );
}
