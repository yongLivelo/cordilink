import type { MyReport, CommunityReport } from "@/types/report";
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
  report: MyReport | CommunityReport;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ReportCard({
  report,
  onEdit,
  onDelete,
}: ReportCardProps) {
  const {
    title,
    image_url: image,
    description,
    category,
    location,
    status,
  } = report.report;
  const { connectedTo } = report;

  const isCommunity = report.type === "community-report";
  const [currentVote, setCurrentVote] = useState<"up" | "down" | "none">(
    isCommunity ? report.vote : "none",
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
        <Text fw={700}>{title}</Text>
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

        {connectedTo && (
          <Text size="xs" c="gray">
            Linked to: <Anchor>{connectedTo}</Anchor>
          </Text>
        )}
      </Stack>

      {isCommunity && (
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
      )}

      {/* Personal Actions: Edit / Delete */}
      {!isCommunity && (
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
