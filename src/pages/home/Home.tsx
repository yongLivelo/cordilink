import { useMemo } from "react";
import {
  Box,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Button,
  Badge,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import FaqModal from "@/components/FaqModal";

// CordiLink Branding Palette
const BRAND = {
  orange: "#FF3900", // Action / Alert / Primary Accent
  navy: "#003953", // Deep Mountain Navy / Headers
  teal: "#027F8D", // Mountain Teal / Primary Branding
  tealDark: "#002B3F", // Deep Navy Dark Gradient Stop
};

export default function Home() {
  const { session, role } = useAuth();

  // Emergency 911 Confirmation Modal disclosure
  const [emergencyModalOpened, { open: openEmergency, close: closeEmergency }] =
    useDisclosure(false);

  // FAQ Knowledge Hub Modal disclosure
  const [faqModalOpened, { open: openFaq, close: closeFaq }] =
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

  // Interactive filtering by search, category, and status
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
        px={{ base: "md", md: "xl", lg: 36 }}
        py={{ base: "xl", md: 36 }}
      >
        {/* Top Date & FAQ Row: Spans full width edge-to-edge, pushing FAQ button to the pinaka side */}
        <Group justify="space-between" align="center" w="100%" wrap="wrap" gap="xs" mb="lg">
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

          {/* FAQ Knowledge Hub Button - pushed to the far right (pinaka side) */}
          <Button
            onClick={openFaq}
            size="xs"
            variant="white"
            color={BRAND.navy}
            radius="xl"
            fw={800}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
              flexShrink: 0,
            }}
            leftSection={
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={BRAND.teal}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          >
            FAQs & Guide
          </Button>
        </Group>

        {/* Greeting & Resident Title */}
        <Stack gap="xs" maw={860}>
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
              style={{ letterSpacing: "-0.5px", wordBreak: "break-word" }}
            >
              {displayName}
            </Title>
          </Box>

          <Text size="sm" c="rgba(255, 255, 255, 0.88)" lh={1.5}>
            Welcome to CordiLink. Empowering Baguio City residents to report
            non-emergency everyday concerns like damaged roads, fallen debris,
            and public safety hazards directly to local authorities.
          </Text>
        </Stack>
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

          {/* FAQ & CITIZEN KNOWLEDGE HUB CARD */}
          <Card
            withBorder
            radius="lg"
            p="md"
            style={{
              backgroundColor: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={openFaq}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(2, 127, 141, 0.12)";
              e.currentTarget.style.borderColor = BRAND.teal;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="md" align="center" wrap="nowrap">
                <Box
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "rgba(2, 127, 141, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={BRAND.teal}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </Box>
                <Box>
                  <Group gap="xs" mb={2}>
                    <Text fw={800} size="sm" c={BRAND.navy}>
                      Frequently Asked Questions (FAQ) & Citizen Guide
                    </Text>
                    <Badge size="xs" color="teal" variant="light">
                      5 Languages
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Read in English, Tagalog / Filipino, Ilocano, Kankanaey, or
                    Pangasinan. Learn how deduplication and AI routing work.
                  </Text>
                </Box>
              </Group>

              <Button
                variant="light"
                color="teal"
                size="xs"
                radius="md"
                fw={700}
                rightSection={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                }
              >
                View FAQs
              </Button>
            </Group>
          </Card>
        </Stack>
      </Container>

      {/* MULTILINGUAL FAQ POPUP MODAL */}
      <FaqModal opened={faqModalOpened} onClose={closeFaq} />
    </Box>
  );
}
