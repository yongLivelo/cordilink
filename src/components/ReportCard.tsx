import {
  Card,
  Image,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Select,
  Box,
  Avatar,
  ActionIcon,
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

  // 1. Derived Variables
  const isIncident = "title" in report;
  const {
    id,
    image_url: image,
    description,
    category,
    location_name,
    status,
    created_at,
  } = report;

  const connectedIncidentId = !isIncident
    ? (report as Report).incident_id
    : null;

  const displayTitle = isIncident ? report.title : `${category} Incident Report`;

  // Status Color Mapping
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FF3900", text: "#fff" },       // Alert Orange
    "in-progress": { bg: "#027F8D", text: "#fff" }, // Cordillera Teal
    resolved: { bg: "#2B8A3E", text: "#fff" },      // Forest Green
  };

  // Format date string
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Recent";

  // 2. Voting State
  const [score, setScore] = useState<number>(0);
  const [statusVal, setStatusVal] = useState<string>(status);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | "none">("none");
  const [isVoting, setIsVoting] = useState(false);

  // 3. Effects: Fetch Votes
  useEffect(() => {
    if (!isIncident) return;

    const fetchVotes = async () => {
      const { count: upCount } = await supabase
        .from("vote")
        .select("*", { count: "exact", head: true })
        .eq("incident_id", id)
        .eq("vote_type", "up")
        .maybeSingle();

      const { count: downCount } = await supabase
        .from("vote")
        .select("*", { count: "exact", head: true })
        .eq("incident_id", id)
        .eq("vote_type", "down")
        .maybeSingle();

      setScore((upCount || 0) - (downCount || 0));

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

  // 4. Vote Handler
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

    setCurrentVote(newVote);

    let scoreChange = 0;
    if (previousVote === "none" && newVote === "up") scoreChange = 1;
    else if (previousVote === "none" && newVote === "down") scoreChange = -1;
    else if (previousVote === "up" && newVote === "none") scoreChange = -1;
    else if (previousVote === "down" && newVote === "none") scoreChange = 1;
    else if (previousVote === "up" && newVote === "down") scoreChange = -2;
    else if (previousVote === "down" && newVote === "up") scoreChange = 2;

    setScore((prev) => prev + scoreChange);

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

  // 5. Render Footer Actions
  const renderFooterActions = () => {
    const footerStyle = {
      borderTop: "1px solid #F0F4F5",
      marginTop: "12px",
      paddingTop: "12px",
    };

    if (onSelect) {
      return (
        <Box style={footerStyle}>
          <Button fullWidth variant="light" color="blue" radius="md" onClick={onSelect}>
            Yes, this is the same incident
          </Button>
        </Box>
      );
    }

    if (onDelete) {
      return (
        <Group justify="flex-end" style={footerStyle}>
          <Button size="xs" variant="light" color="red" radius="md" onClick={onDelete}>
            Delete Report
          </Button>
        </Group>
      );
    }

    if (isIncident) {
      return (
        <Group justify="space-between" align="center" style={footerStyle}>
          <Group gap={6} align="center">
            <Text size="xs" fw={700} c="gray.7">
              Verification:
            </Text>
            <Badge
              size="sm"
              variant="light"
              color={score > 0 ? "teal" : score < 0 ? "red" : "gray"}
            >
              {score > 0 ? `+${score}` : score} votes
            </Badge>
          </Group>

          <Group gap="xs">
            <Button
              size="xs"
              radius="md"
              variant={currentVote === "up" ? "filled" : "light"}
              color="teal"
              onClick={() => handleVoteClick("up")}
              loading={isVoting && currentVote !== "up"}
              leftSection={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              }
            >
              Upvote
            </Button>
            <Button
              size="xs"
              radius="md"
              variant={currentVote === "down" ? "filled" : "light"}
              color="red"
              onClick={() => handleVoteClick("down")}
              loading={isVoting && currentVote !== "down"}
              leftSection={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              }
            >
              Downvote
            </Button>
          </Group>
        </Group>
      );
    }

    return null;
  };

  const currentStatusStyle = statusColors[statusVal] || { bg: "#718096", text: "#fff" };

  return (
    <Card
      shadow="xs"
      padding={0}
      radius="lg"
      withBorder
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#E5ECEE",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 57, 83, 0.1)";
        e.currentTarget.style.borderColor = "#027F8D";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = "#E5ECEE";
      }}
    >
      {/* =========================================================================
          IMAGE CONTAINER WITH FLOATING OVERLAY PILLS (Reference Image Inspired)
          ========================================================================= */}
      <Card.Section style={{ position: "relative", overflow: "hidden" }}>
        <Image
          src={image}
          height={190}
          alt={category}
          fallbackSrc="https://placehold.co/600x340/003953/FFFFFF?text=CordiLink+Incident"
          style={{ transition: "transform 0.3s ease" }}
        />

        {/* Top-Left Floating Badge: Status (like "For Sale" in reference image) */}
        <Box
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: currentStatusStyle.bg,
            color: currentStatusStyle.text,
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            zIndex: 2,
          }}
        >
          {statusVal}
        </Box>

        {/* Top-Right Floating Badge: Category (like "House/Apartment" in reference image) */}
        <Box
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "rgba(0, 57, 83, 0.88)",
            color: "#ffffff",
            backdropFilter: "blur(4px)",
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 2,
          }}
        >
          {category || "GENERAL"}
        </Box>

        {/* Bottom-Left Floating Highlight Pill */}
        <Box
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            backgroundColor: "#027F8D",
            color: "#ffffff",
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 800,
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 2,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>ID #{id}</span>
          {isIncident && <span>• {score} pts</span>}
        </Box>

        {/* Bottom-Right Floating Action Button */}
        {connectedIncidentId && (
          <ActionIcon
            variant="default"
            radius="xl"
            size="md"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              zIndex: 2,
              border: "none",
            }}
            onClick={() => checkIncidentId?.(connectedIncidentId)}
            title={`View Incident #${connectedIncidentId}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#027F8D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </ActionIcon>
        )}
      </Card.Section>

      {/* =========================================================================
          CONTENT AREA: LOCATION, TITLE, DESCRIPTION, META
          ========================================================================= */}
      <Stack p="md" gap="xs">
        {/* Location Row with SVG Pin Icon */}
        <Group gap={6} align="center">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <Text size="xs" fw={700} c="gray.6">
            {location_name || "Cordillera Administrative Region"}
          </Text>
        </Group>

        {/* High-Hierarchy Bold Title */}
        <Text fw={800} size="md" c="#003953" lh={1.25} lineClamp={1}>
          {displayTitle}
        </Text>

        {/* Description */}
        <Text size="xs" c="dimmed" lineClamp={2} lh={1.4}>
          {description}
        </Text>

        {/* Reporter & Date Meta Row */}
        <Group justify="space-between" align="center" pt={4}>
          <Group gap={6} align="center">
            <Avatar size="xs" radius="xl" color="teal">
              {category ? category.charAt(0).toUpperCase() : "C"}
            </Avatar>
            <Text size="11px" fw={600} c="gray.7">
              Community Report
            </Text>
          </Group>
          <Group gap={4} align="center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <Text size="11px" fw={500} c="gray.5">
              {formattedDate}
            </Text>
          </Group>
        </Group>

        {/* Admin Status Changer */}
        {onChangeStatus && (
          <Select
            mt="xs"
            size="xs"
            label="Admin: Update Status"
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

        {/* Footer Actions (Upvote/Downvote/Delete/Select) */}
        {renderFooterActions()}
      </Stack>
    </Card>
  );
}
