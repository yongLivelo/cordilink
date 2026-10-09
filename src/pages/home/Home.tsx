import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
  TextInput,
  Button,
  Badge,
  SimpleGrid,
  Loader,
  Center,
  Modal,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import type { Report } from "@/types/report";
import ReportCard from "@/components/ReportCard";

// CordiLink Branding Palette
const BRAND = {
  orange: "#FF3900", // Action / Alert / Primary Accent
  navy: "#003953", // Deep Mountain Navy / Headers
  teal: "#027F8D", // Mountain Teal / Primary Branding
  tealDark: "#002B3F", // Deep Navy Dark Gradient Stop
};

export default function Home() {
  const { session, role } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>("All");

  // Emergency 911 Confirmation Modal disclosure
  const [emergencyModalOpened, { open: openEmergency, close: closeEmergency }] =
    useDisclosure(false);

  // Clean formatted user name (handles long email prefixes gracefully)
  const displayName = useMemo(() => {
    const email = session?.user?.email;
    if (!email) return "";
    return email.split("@")[0].toUpperCase();
  }, [session]);

  // Formatted date string
  const formattedDate = useMemo(() => {
    const today = new Date();
    const datePart = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const dayPart = today.toLocaleDateString("en-US", { weekday: "long" });
    return { datePart, dayPart };
  }, []);

  // Time-based Ilocano greeting
  const ilocanoGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Naimbag a bigat,";
    if (hour < 18) return "Naimbag a malem,";
    return "Naimbag a rabii,";
  }, []);

  // Fetch current user's reports from Supabase
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("report")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
      } else {
        setReports(data || []);
      }
      setIsLoading(false);
    };

    fetchUserReports();
  }, [session]);

  // Baguio Civic Categories for quick filtering (from project context)
  const quickCategories = [
    "All",
    "Pothole",
    "Landslide",
    "Fallen Debris",
    "Flooding",
    "Power Outage",
    "Waste Management",
  ];

  // Interactive filtering by search, category, and status
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // 1. Category Filter
    if (activeCategoryFilter !== "All") {
      result = result.filter((r) =>
        r.category?.toLowerCase().includes(activeCategoryFilter.toLowerCase()),
      );
    }

    // 2. Status Filter
    if (selectedStatus !== "all") {
      result = result.filter((r) => r.status === selectedStatus);
    }

    // 3. Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.category?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.location_name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [reports, searchQuery, selectedStatus, activeCategoryFilter]);

  // For Admin accounts: only the Dashboard is visible on screen!
  // (kept below all hooks — they must run unconditionally on every render)
  if (role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box style={{ width: "100%", margin: 0, padding: 0 }}>
      {/* =========================================================================
          EMERGENCY 911 ACCIDENTAL-DIAL CONFIRMATION MODAL
          ========================================================================= */}
      <Modal
        opened={emergencyModalOpened}
        onClose={closeEmergency}
        title={
          <Group gap="xs">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D32F2F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <Text fw={800} size="md" c="#D32F2F">
              Confirm Emergency Call
            </Text>
          </Group>
        }
        centered
        radius="lg"
      >
        <Text size="sm" mb="md" lh={1.5}>
          You are about to dial <strong>911 Emergency Services</strong> for
          Baguio City.
        </Text>
        <Text size="xs" c="dimmed" mb="lg">
          CordiLink is strictly for non-emergency municipal concerns. Please
          confirm that this is a critical, life-threatening situation (medical,
          fire, or police dispatch).
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={closeEmergency} radius="md">
            Cancel
          </Button>
          <Button
            component="a"
            href="tel:911"
            color="red"
            radius="md"
            onClick={closeEmergency}
            leftSection={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          >
            Confirm & Call 911
          </Button>
        </Group>
      </Modal>

      {/* =========================================================================
          1. FULL-SPAN TEAL GRADIENT HEADER (NO WHITE BORDERS, 100% WIDTH, 0 RADIUS)
          ========================================================================= */}
      <Box
        style={{
          width: "100%",
          margin: 0,
          borderRadius: 0,
          background: `linear-gradient(135deg, ${BRAND.tealDark} 0%, ${BRAND.navy} 45%, ${BRAND.teal} 100%)`,
          color: "#ffffff",
          boxShadow: "0 6px 20px rgba(0, 43, 63, 0.2)",
          position: "relative",
        }}
      >
        <Container
          size="xl"
          px={{ base: "md", md: "xl" }}
          py={{ base: "xl", md: 48 }}
        >
          <Stack gap="md" maw={900}>
            {/* Top Date & Civic Badge Row */}
            <Group justify="space-between" align="center" wrap="wrap">
              <Group
                gap={6}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  padding: "4px 14px",
                  borderRadius: 999,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <Text size="xs" fw={800} c={BRAND.orange}>
                  {formattedDate.datePart}
                </Text>
                <Text size="xs" fw={600} c="#4A5568">
                  | {formattedDate.dayPart}
                </Text>
              </Group>
            </Group>

            {/* Greeting & Resident Title */}
            <Box>
              <Text size="sm" fw={500} c="rgba(255, 255, 255, 0.85)" mb={2}>
                {ilocanoGreeting}
              </Text>
              <Title
                order={1}
                size="h1"
                fw={900}
                c="#ffffff"
                lh={1.15}
                style={{ letterSpacing: "-0.5px" }}
              >
                {displayName}
              </Title>
            </Box>

            <Text size="sm" c="rgba(255, 255, 255, 0.88)" maw={640} lh={1.5}>
              Welcome to CordiLink. Empowering Baguio City residents to report
              non-emergency everyday concerns like damaged roads, fallen debris,
              and public safety hazards directly to local authorities.
            </Text>

            {/* Interactive Search Bar */}
            <Box mt="xs" maw={640}>
              <TextInput
                placeholder="Search active reports, road hazards, or barangay locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                radius="md"
                size="md"
                styles={{
                  input: {
                    backgroundColor: "rgba(255, 255, 255, 0.96)",
                    color: "#1A202C",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    "::placeholder": {
                      color: "#718096",
                    },
                  },
                }}
                leftSection={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={BRAND.teal}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
              />
            </Box>

            {/* Interactive Category Filter Chips */}
            <Group gap={6} mt={4} wrap="wrap">
              <Text size="xs" fw={700} c="rgba(255,255,255,0.75)" mr={4}>
                Filter:
              </Text>
              {quickCategories.map((cat) => {
                const isSelected = activeCategoryFilter === cat;
                return (
                  <UnstyledButton
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: isSelected
                        ? BRAND.orange
                        : "rgba(255, 255, 255, 0.18)",
                      color: "#ffffff",
                      border: isSelected
                        ? "none"
                        : "1px solid rgba(255, 255, 255, 0.3)",
                      transition: "all 0.15s ease",
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </UnstyledButton>
                );
              })}
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* =========================================================================
          2. QUICK ACTIONS SECTION (PRIMARY EMPHASIS: SUBMIT A REPORT)
          ========================================================================= */}
      <Container
        size="xl"
        px={{ base: "md", md: "xl" }}
        pt={{ base: "md", md: "xl" }}
      >
        <Stack gap="md">
          {/* PRIMARY HERO ACTION CARD: SUBMIT A CIVIC REPORT (HIGH VISUAL HIERARCHY) */}
          <Card
            withBorder
            shadow="md"
            radius="lg"
            p={{ base: "md", sm: "xl" }}
            component={Link}
            to="/submit-reports"
            style={{
              backgroundColor: "#ffffff",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.25s ease",
              borderLeft: `6px solid ${BRAND.orange}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 12px 30px rgba(255, 57, 0, 0.16)";
              e.currentTarget.style.borderColor = BRAND.orange;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="lg">
              <Group
                gap="lg"
                align="center"
                wrap="nowrap"
                style={{ flex: 1, minWidth: 280 }}
              >
                {/* Elevated Action Icon */}
                <Box
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: BRAND.orange,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 18px rgba(255, 57, 0, 0.35)",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </Box>

                {/* Content with Badges and Clear Text */}
                <Box style={{ flex: 1 }}>
                  <Group gap="xs" mb={6}>
                    <Badge color="orange" variant="filled" size="sm" fw={800}>
                      PRIMARY CITIZEN ACTION
                    </Badge>
                    <Badge color="teal" variant="light" size="sm" fw={700}>
                      FAST LANE & AI LANE
                    </Badge>
                  </Group>

                  <Title order={2} size="h3" fw={900} c={BRAND.navy} lh={1.2}>
                    SUBMIT A CIVIC REPORT
                  </Title>
                  <Text size="xs" c="dimmed" mt={4} lh={1.5} maw={700}>
                    Report potholes, landslides, fallen debris, or public safety
                    hazards. Includes instant GPS location tagging, photo
                    evidence capture, and automated 20-meter incident
                    deduplication.
                  </Text>
                </Box>
              </Group>

              {/* Bold CTA Button */}
              <Button
                size="md"
                color={BRAND.orange}
                radius="md"
                fw={800}
                style={{
                  boxShadow: "0 4px 14px rgba(255, 57, 0, 0.35)",
                }}
                rightSection={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                }
              >
                File Report Now
              </Button>
            </Group>
          </Card>

          {/* DE-EMPHASIZED AUXILIARY SAFETY STRIP: CALL 911 */}
          <Box
            p="xs"
            px="md"
            style={{
              backgroundColor: "#FAFBFB",
              borderRadius: "10px",
              border: "1px solid #ECECEC",
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Group gap="xs" align="center" wrap="nowrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D32F2F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <Text size="xs" c="gray.7">
                  <strong style={{ color: "#D32F2F" }}>
                    Emergency Hotline:
                  </strong>{" "}
                  For critical life-threatening situations (medical, fire, or
                  police dispatch), call 911 directly. CordiLink is strictly for
                  municipal non-emergencies.
                </Text>
              </Group>

              <Button
                onClick={openEmergency}
                color="red"
                variant="subtle"
                size="xs"
                radius="sm"
                fw={700}
                leftSection={
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              >
                Call 911
              </Button>
            </Group>
          </Box>
        </Stack>
      </Container>

      {/* =========================================================================
          3. ACTIVE REPORTS SECTION (MODERN 3-COLUMN DESKTOP GRID)
          ========================================================================= */}
      <Container
        size="xl"
        px={{ base: "md", md: "xl" }}
        py={{ base: "xl", md: 36 }}
      >
        {/* Section Header & Status Filters */}
        <Group
          justify="space-between"
          align="flex-end"
          mb="lg"
          wrap="wrap"
          gap="md"
        >
          <Box>
            <Title
              order={2}
              size="h3"
              fw={900}
              c={BRAND.navy}
              tt="uppercase"
              style={{ letterSpacing: "0.5px" }}
            >
              YOUR ACTIVE REPORTS
            </Title>
            <Text size="xs" c="dimmed" mt={2}>
              Track status updates as reports move from Received to In-Progress
              to Resolved.
            </Text>
          </Box>

          {/* Interactive Status Pills */}
          <Group gap={6}>
            {[
              { label: "All Status", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "In-Progress", value: "in-progress" },
              { label: "Resolved", value: "resolved" },
            ].map((tab) => {
              const isActive = selectedStatus === tab.value;
              return (
                <UnstyledButton
                  key={tab.value}
                  onClick={() => setSelectedStatus(tab.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: isActive ? BRAND.teal : "#EAEFEF",
                    color: isActive ? "#ffffff" : "#4A5568",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </UnstyledButton>
              );
            })}
          </Group>
        </Group>

        {/* Reports Content */}
        {isLoading ? (
          <Center py={60}>
            <Loader color={BRAND.teal} size="lg" />
          </Center>
        ) : filteredReports.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" py={50} gap="md">
            <Text c="dimmed" size="sm">
              No civic reports currently found under "{selectedStatus}" status.
            </Text>
            <Button
              component={Link}
              to="/submit-reports"
              color={BRAND.orange}
              radius="md"
              size="sm"
            >
              Submit a Civic Report
            </Button>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
