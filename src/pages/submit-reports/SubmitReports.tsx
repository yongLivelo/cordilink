import { useState } from "react";
import { z } from "zod/v4";
import {
  Button,
  Stack,
  Textarea,
  Card,
  Container,
  Title,
  Text,
  Group,
  Box,
  Badge,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";

import Camera from "@/pages/submit-reports/components/Camera";
import LocationForm from "@/pages/submit-reports/components/LocationForm";
import SimilarIncidentsModal from "@/pages/submit-reports/components/SimilarIncidentsModal";
import { useReportLocation } from "@/pages/submit-reports/components/useReportLocation";
import { useReportSubmission } from "@/pages/submit-reports/components/useReportSubmission";

// Brand Color Palette
const BRAND = {
  orange: "#FF3900",
  navy: "#003953",
  teal: "#027F8D",
};

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
    if (!values.image) return;

    const { ok, value: location } = reportLocation.validate();
    if (!ok || !location) return;

    await submission.submitReport(location, values.image, values.description);
  };

  return (
    <Container size="sm" py={{ base: "md", sm: "xl" }} px={{ base: "xs", sm: "md" }}>
      {/* BRANDING HEADER */}
      <Stack gap="xs" mb="lg">
        <Group justify="space-between" align="center">
          <Badge color="teal" variant="light" size="sm">
            SMART CIVIC REPORTING
          </Badge>
          <Text size="xs" fw={700} c={BRAND.teal}>
            Baguio City LGU Dispatch
          </Text>
        </Group>

        <Title order={1} size="h2" fw={900} c={BRAND.navy}>
          File a Civic Hazard Report
        </Title>
        <Text size="xs" c="dimmed">
          Capture photo evidence and tag GPS coordinates. Reports are automatically deduplicated
          and routed directly to responsible municipal offices.
        </Text>
      </Stack>

      {/* MAIN REPORT FORM CARD */}
      <Card
        withBorder
        shadow="sm"
        radius="lg"
        p={{ base: "md", sm: "xl" }}
        style={{ backgroundColor: "#ffffff" }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            {/* 1. Camera Section */}
            <Box>
              <Text fw={700} size="sm" c={BRAND.navy} mb={6}>
                1. Photo Evidence (Required)
              </Text>
              <Camera
                onCapture={(base64Image: string) =>
                  form.setFieldValue("image", base64Image)
                }
                onRetake={() => form.setFieldValue("image", null)}
                resetKey={cameraResetKey}
              />
            </Box>

            {/* 2. Description Section */}
            <Box>
              <Text fw={700} size="sm" c={BRAND.navy} mb={6}>
                2. Incident Description
              </Text>
              <Textarea
                description="State clearly what happened and its community impact."
                placeholder={
                  "What: Landslide debris blocking one lane\n" +
                  "Impact: Traffic slowed down, needs clearing crew"
                }
                minRows={5}
                autosize
                radius="md"
                {...form.getInputProps("description")}
              />
            </Box>

            {/* 3. Location Section */}
            <Box>
              <Text fw={700} size="sm" c={BRAND.navy} mb={6}>
                3. Barangay & GPS Location
              </Text>
              <LocationForm location={reportLocation} description={description} />
            </Box>

            {/* Submit Action Button */}
            <Button
              type="submit"
              size="md"
              radius="md"
              color={BRAND.orange}
              loading={submission.loading}
              mt="sm"
              fw={800}
              leftSection={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              }
            >
              Submit Report to LGU
            </Button>
          </Stack>
        </form>
      </Card>

      {/* Modal to prompt user if similar active reports/incidents are nearby */}
      <SimilarIncidentsModal
        opened={submission.isModalOpen}
        onClose={submission.closeMatchModal}
        incidents={submission.matchingIncidents}
        loading={submission.loading}
        onSelect={submission.selectExistingIncident}
        onCreateNew={submission.createNewAnyway}
      />
    </Container>
  );
}
