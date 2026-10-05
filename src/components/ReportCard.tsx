import { supabase } from "@/lib/supabaseClient";
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
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Import Auth to get current user

interface ReportCardProps {
  report: Report | Incident;
  onDelete?: () => void;
  onSelect?: () => void;
}

export default function ReportCard({
  report,
  onDelete,
  onSelect,
}: ReportCardProps) {
  const { session } = useAuth();
  const isIncident = "title" in report;
  const {
    image_url: image,
    description,
    category,
    location_name,
    status,
    id,
  } = report;

  const displayTitle = isIncident ? report.title : `${category} Report`;
  const connectedIncidentId = !isIncident
    ? (report as Report).incident_id
    : null;

  // Real Backend State
  const [score, setScore] = useState<number>(0);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | "none">(
    "none",
  );
  const [isVoting, setIsVoting] = useState(false);

  // Fetch initial vote counts and user's specific vote
  useEffect(() => {
    if (!isIncident) return; // Only fetch votes if it's an incident

    const fetchVotes = async () => {
      // 1. Get total upvotes
      const { count: upCount } = await supabase
        .from("vote")
        .select("*", { count: "exact", head: true })
        .eq("incident_id", id)
        .eq("vote_type", "up")
        .maybeSingle();

      // 2. Get total downvotes
      const { count: downCount } = await supabase
        .from("vote")
        .select("*", { count: "exact", head: true })
        .eq("incident_id", id)
        .eq("vote_type", "down")
        .maybeSingle();

      setScore((upCount || 0) - (downCount || 0));

      // 3. Get the current user's vote status
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

  // Handle interacting with the database
  const handleVoteClick = async (type: "up" | "down") => {
    if (!session) {
      alert("You must be logged in to vote.");
      return;
    }

    // Prevent spam clicking while request is in flight
    if (isVoting) return;
    setIsVoting(true);

    // If clicking the same button twice, toggle it off (remove vote)
    const newVote = currentVote === type ? "none" : type;
    const previousVote = currentVote;
    const previousScore = score;

    setCurrentVote(newVote);

    let scoreChange = 0;
    if (previousVote === "none" && newVote === "up") scoreChange = 1;
    else if (previousVote === "none" && newVote === "down") scoreChange = -1;
    else if (previousVote === "up" && newVote === "none") scoreChange = -1;
    else if (previousVote === "down" && newVote === "none") scoreChange = 1;
    else if (previousVote === "up" && newVote === "down") scoreChange = -2;
    else if (previousVote === "down" && newVote === "up") scoreChange = 2;

    setScore((prev) => prev + scoreChange);

    // --- 2. Database Sync ---
    try {
      if (newVote === "none") {
        // Remove the vote completely
        await supabase
          .from("vote")
          .delete()
          .eq("incident_id", id)
          .eq("user_id", session.user.id);
      } else {
        // Safe Update/Insert: Delete old vote first to prevent duplicates, then insert new vote
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
      // Revert Optimistic Update on failure
      setCurrentVote(previousVote);
      setScore(previousScore);
    } finally {
      setIsVoting(false);
    }
  };

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
          📍 {location_name}
        </Text>
        {connectedIncidentId && (
          <Text size="xs" c="gray">
            Linked to Incident: <Anchor>#{connectedIncidentId}</Anchor>
          </Text>
        )}
      </Stack>

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
      ) : (
        // Report Footer (Edit/Delete Actions for the user's own reports)
        <Group
          justify="flex-end"
          mt="md"
          pt="md"
          style={{ borderTop: "1px solid #eee" }}
        >
          <Button size="xs" variant="light" color="red" onClick={onDelete}>
            Delete
          </Button>
        </Group>
      )}
    </Card>
  );
}
