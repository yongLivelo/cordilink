import {
  Card,
  Image,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Anchor,
  Select,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import type { Report, Incident } from "@/types/report";

interface ReportCardProps {
  report: Report | Incident;
  onDelete?: () => void;
  onSelect?: () => void;
  onChangeStatus?: (newStatus: string) => void;
  checkIncidentId?: (incidentId: number) => void;
}

export default function ReportCard({
  report,
  onDelete,
  onSelect,
  onChangeStatus,
  checkIncidentId,
}: ReportCardProps) {
  const { session } = useAuth();

  // ==========================================
  // 1. Derived Variables
  // ==========================================
  const isIncident = "title" in report;
  const { id, image_url: image, description, category, location_name } = report;

  const connectedIncidentId = !isIncident
    ? (report as Report).incident_id
    : null;

  const statusColors: Record<string, string> = {
    pending: "orange",
    "in-progress": "blue",
    resolved: "green",
  };

  // ==========================================
  // 2. State
  // ==========================================
  //
  //

  const [statusVal, setStatusVal] = useState<string>("");
  useEffect(() => {
    if (isIncident) {
      setStatusVal(report.status);
      return;
    }
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("incident")
        .select("status")
        .eq("id", report.incident_id)
        .maybeSingle();

      if (error) {
        console.error("Error getting incident status: ", error);
      }
      if (data) {
        setStatusVal(data?.status);
      }
    };

    fetchStatus();
  }, []);

  const [score, setScore] = useState<number>(0);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | "none">(
    "none",
  );
  const [isVoting, setIsVoting] = useState(false);

  // ==========================================
  // 3. Effects
  // ==========================================
  useEffect(() => {
    if (!isIncident) return;

    const fetchVotes = async () => {
      // Fetch upvotes
      const { count: upCount } = await supabase
        .from("vote")
        .select("*", { count: "exact", head: true })
        .eq("incident_id", id)
        .eq("vote_type", "up")
        .maybeSingle();

      // Fetch downvotes
      const { count: downCount } = await supabase
        .from("vote")
        .select("*", { count: "exact", head: true })
        .eq("incident_id", id)
        .eq("vote_type", "down")
        .maybeSingle();

      setScore((upCount || 0) - (downCount || 0));

      // Fetch current user's vote
      if (session?.user?.id) {
        const { data } = await supabase
          .from("vote")
          .select("vote_type")
          .eq("incident_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (data) {
          setCurrentVote(data.vote_type as "up" | "down");
        }
      }
    };

    fetchVotes();
  }, [id, isIncident, session]);

  // ==========================================
  // 4. Handlers
  // ==========================================
  const handleVoteClick = async (type: "up" | "down") => {
    if (!session) {
      alert("You must be logged in to vote.");
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    const newVote = currentVote === type ? "none" : type;
    const previousVote = currentVote;
    const previousScore = score;

    // Optimistic UI update
    setCurrentVote(newVote);

    let scoreChange = 0;
    if (previousVote === "none" && newVote === "up") scoreChange = 1;
    else if (previousVote === "none" && newVote === "down") scoreChange = -1;
    else if (previousVote === "up" && newVote === "none") scoreChange = -1;
    else if (previousVote === "down" && newVote === "none") scoreChange = 1;
    else if (previousVote === "up" && newVote === "down") scoreChange = -2;
    else if (previousVote === "down" && newVote === "up") scoreChange = 2;

    setScore((prev) => prev + scoreChange);

    // Database Sync
    try {
      if (newVote === "none") {
        await supabase
          .from("vote")
          .delete()
          .eq("incident_id", id)
          .eq("user_id", session.user.id);
      } else {
        await supabase
          .from("vote")
          .delete()
          .eq("incident_id", id)
          .eq("user_id", session.user.id);

        await supabase.from("vote").insert({
          incident_id: id,
          user_id: session.user.id,
          vote_type: newVote,
        });
      }
    } catch (error) {
      console.error("Error saving vote:", error);
      setCurrentVote(previousVote);
      setScore(previousScore);
    } finally {
      setIsVoting(false);
    }
  };

  // ==========================================
  // 5. Render Helpers
  // ==========================================
  const renderFooterActions = () => {
    // Layout for the footer boundary
    const footerProps = {
      mt: "md",
      pt: "md",
      style: { borderTop: "1px solid #eee" },
    };

    // Case 1: Selecting an incident (Link flow)
    if (onSelect) {
      return (
        <Group justify="center" {...footerProps}>
          <Button fullWidth variant="light" color="blue" onClick={onSelect}>
            Yes, this is the same incident
          </Button>
        </Group>
      );
    }
    // Case 3: Personal Report view (Delete action)
    if (onDelete) {
      return (
        <Group justify="flex-end" {...footerProps}>
          <Button size="xs" variant="light" color="red" onClick={onDelete}>
            Delete
          </Button>
        </Group>
      );
    }
    // Case 2: Incident view (Community voting)
    if (isIncident) {
      return (
        <Group justify="space-between" {...footerProps}>
          <Text size="sm" fw={600}>
            Score:{" "}
            <Text span c={score > 0 ? "green" : score < 0 ? "red" : "dimmed"}>
              {score}
            </Text>
          </Text>

          <Group gap="xs">
            <Button
              size="xs"
              variant={currentVote === "up" ? "filled" : "light"}
              color="green"
              onClick={() => handleVoteClick("up")}
              loading={isVoting && currentVote !== "up"}
            >
              Upvote
            </Button>
            <Button
              size="xs"
              variant={currentVote === "down" ? "filled" : "light"}
              color="red"
              onClick={() => handleVoteClick("down")}
              loading={isVoting && currentVote !== "down"}
            >
              Downvote
            </Button>
          </Group>
        </Group>
      );
    }

    return null;
  };

  // ==========================================
  // 6. Main Render
  // ==========================================
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
        {isIncident && (
          <Text fw={700} size="lg">
            {report.title}
          </Text>
        )}

        <Stack>
          <Badge color={statusColors[statusVal] || "gray"} variant="light">
            {statusVal}
          </Badge>
          <Badge color={statusColors[category] || "gray"} variant="light">
            {category}
          </Badge>
        </Stack>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2}>
        {description}
      </Text>

      <Stack gap="xs" mt="md">
        <Text size="sm" fw={500}>
          📍 {location_name}
        </Text>
        {connectedIncidentId && (
          <Text size="xs" c="gray">
            Linked to Incident:{" "}
            <Anchor onClick={() => checkIncidentId?.(connectedIncidentId)}>
              #{connectedIncidentId}
            </Anchor>
          </Text>
        )}
      </Stack>

      {/* Admin Status Changer (Completed from your dangling code) */}
      {onChangeStatus && (
        <Select
          mt="md"
          label="Update Status"
          value={statusVal}
          onChange={(val) => {
            if (!val) return;
            setStatusVal(val);
            onChangeStatus(val);
          }}
          data={[
            { value: "pending", label: "Pending" },
            { value: "in-progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
          ]}
        />
      )}

      {/* Footer Actions (Voting, Select, or Delete) */}
      {renderFooterActions()}
    </Card>
  );
}
