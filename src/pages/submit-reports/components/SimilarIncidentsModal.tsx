import { Button, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
import ReportCard from "@/components/ReportCard";
import type { Incident } from "@/types/report";

interface SimilarIncidentsModalProps {
  opened: boolean;
  onClose: () => void;
  incidents: Incident[];
  loading: boolean;
  /** User confirmed the report is about one of the listed incidents. */
  onSelect: (incidentId: string | number) => void;
  /** User wants a new, separate incident instead. */
  onCreateNew: () => void;
}

/** Prompts the user when similar active incidents were found nearby. */
export default function SimilarIncidentsModal({
  opened,
  onClose,
  incidents,
  loading,
  onSelect,
  onCreateNew,
}: SimilarIncidentsModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Similar Incidents Found Nearby"
      size="lg"
    >
      <Stack>
        <Text size="sm" c="dimmed">
          We found existing reported incidents close to your location matching
          this category. Is your report about one of these?
        </Text>

        <SimpleGrid cols={1}>
          {incidents.map((incident) => (
            <ReportCard
              key={incident.id}
              report={incident}
              onSelect={() => onSelect(incident.id)}
            />
          ))}
        </SimpleGrid>

        <Button
          variant="default"
          fullWidth
          mt="md"
          onClick={onCreateNew}
          loading={loading}
        >
          No, create a new separate incident
        </Button>
      </Stack>
    </Modal>
  );
}
