import type { Report, Incident } from "@/types/report";
import {
  Card,
  Image,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Anchor,
} from "@mantine/core";
import { useState } from "react";

interface ReportCardProps {
  report: Report | Incident;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void; // <-- Added to handle modal selection
}

export default function ReportCard({
  report,
  onEdit,
  onDelete,
  onSelect,
}: ReportCardProps) {
  const isIncident = "title" in report;
  const { image_url: image, description, category, location, status } = report;
  const displayTitle = isIncident ? report.title : `${category} Report`;
  const connectedIncidentId = !isIncident
    ? (report as Report).incident_id
    : null;
  const [currentVote, setCurrentVote] = useState<"up" | "down" | "none">(
    "none",
  );

  const statusColors: Record<string, string> = {
    pending: "orange",
    "in-progress": "blue",
    resolved: "green",
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={image}
          height={160}
          alt={category}
          fallbackSrc="https://placehold.co/400x300?text=No+Image"
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={700}>{displayTitle}</Text>
        <Badge color={statusColors[status] || "gray"} variant="light">
          {status}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2}>
        {description}
      </Text>

      <Stack gap="xs" mt="md">
        <Text size="sm" fw={500}>
          📍 {location}
        </Text>
        {connectedIncidentId && (
          <Text size="xs" c="gray">
            Linked to Incident: <Anchor>#{connectedIncidentId}</Anchor>
          </Text>
        )}
      </Stack>

      {/* Conditionally render the Select button if onSelect is passed */}
      {onSelect ? (
        <Group
          justify="center"
          mt="md"
          pt="md"
          style={{ borderTop: "1px solid #eee" }}
        >
          <Button fullWidth variant="light" color="blue" onClick={onSelect}>
            Yes, this is the same incident
          </Button>
        </Group>
      ) : isIncident ? (
        // Incident Footer (Community Voting)
        <Group
          justify="space-between"
          mt="md"
          pt="md"
          style={{ borderTop: "1px solid #eee" }}
        >
          <Text size="sm" c="dimmed">
            Your Vote: <b>{currentVote.toUpperCase()}</b>
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant={currentVote === "up" ? "filled" : "light"}
              color="green"
              onClick={() =>
                setCurrentVote(currentVote === "up" ? "none" : "up")
              }
            >
              Upvote
            </Button>
            <Button
              size="xs"
              variant={currentVote === "down" ? "filled" : "light"}
              color="red"
              onClick={() =>
                setCurrentVote(currentVote === "down" ? "none" : "down")
              }
            >
              Downvote
            </Button>
          </Group>
        </Group>
      ) : (
        // Report Footer (Edit/Delete Actions for the user's own reports)
        <Group
          justify="flex-end"
          mt="md"
          pt="md"
          style={{ borderTop: "1px solid #eee" }}
        >
          <Button size="xs" variant="light" color="blue" onClick={onEdit}>
            Edit
          </Button>
          <Button size="xs" variant="light" color="red" onClick={onDelete}>
            Delete
          </Button>
        </Group>
      )}
    </Card>
  );
}
