import {
  Stack,
  Loader,
  Center,
  Group,
  Pagination,
  Text,
  Title,
  Box,
  Card,
  SimpleGrid,
  Badge,
  Button,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState, useMemo } from "react";
import type { Incident } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import ReportsToolbar from "@/components/ReportsToolbar";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

// Items per page - set to 6 for a full, well-utilized 3-column grid
const ITEMS_PER_PAGE = 6;

// Branding Colors
const BRAND = {
  orange: "#FF3900",
  navy: "#003953",
  teal: "#027F8D",
  darkNavy: "#002436",
};

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all incidents from Supabase
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.from("incident").select("*");

      if (error) {
        console.error("Error fetching incidents:", error);
      } else {
        setIncidents(data || []);
      }
      setIsLoading(false);
    };

    fetchIncidents();
  }, [session]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatusTab, sortOrder]);

  // Summary Metrics for space utilization
  const metrics = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((i) => i.status === "pending").length;
    const inProgress = incidents.filter(
      (i) => i.status === "in-progress",
    ).length;
    const resolved = incidents.filter((i) => i.status === "resolved").length;
    return { total, pending, inProgress, resolved };
  }, [incidents]);

  // Dynamic Categories from data
  const categories = useMemo(() => {
    const unique = new Set(
      incidents
        .map((item) => item.category)
        .filter((cat): cat is string => Boolean(cat)),
    );
    return Array.from(unique);
  }, [incidents]);

  // Process data: Filter -> Sort -> Paginate
  const processedData = useMemo(() => {
    let result = [...incidents];

    // 1. Search Filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location_name?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q),
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // 3. Status Tab Filter
    if (selectedStatusTab !== "all") {
      result = result.filter((item) => item.status === selectedStatusTab);
    }

    // 4. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [incidents, searchQuery, selectedCategory, selectedStatusTab, sortOrder]);

  // Pagination slicing
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedReports = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Handlers (Preserving 100% of the original logic)
  const handleDelete = async (incidentId: number | string) => {
    if (!confirm("Are you sure you want to delete this incident report?"))
      return;

    const { error } = await supabase
      .from("report")
      .delete()
      .eq("incident_id", incidentId);

    supabase.functions
      .invoke("summarize-incident", {
        body: { incidentId: incidentId },
      })
      .catch((err) => console.error("Summarization check failed:", err));

    if (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete the report.");
    } else {
      setIncidents((prev) => prev.filter((report) => report.id !== incidentId));
    }
  };

  const handleChangeStatus = async (reportId: number, newStatus: string) => {
    const { error } = await supabase
      .from("incident")
      .update({ status: newStatus })
      .eq("id", reportId);

    const { error: reportError } = await supabase
      .from("report")
      .update({ status: newStatus })
      .eq("incident_id", reportId);

    if (error && reportError) {
      console.error("Error changing status: ", error);
    } else {
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === reportId
            ? { ...item, status: newStatus as Incident["status"] }
            : item,
        ),
      );
    }
  };
  const [opened, { close }] = useDisclosure();
  const [logoutModalOpened, { open: openLogout, close: closeLogout }] =
    useDisclosure(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleAdminLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    closeLogout();
  };

  return (
    <Box style={{ width: "100%", margin: 0, padding: 0 }}>
      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        opened={logoutModalOpened}
        onClose={closeLogout}
        title="Confirm Logout"
        centered
        radius="md"
      >
        <Text size="sm" mb="lg">
          Are you sure you want to sign out of the Admin Incident Dispatch
          Portal?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeLogout} radius="md">
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleAdminLogout}
            loading={isLoggingOut}
            radius="md"
          >
            Yes, Log Out
          </Button>
        </Group>
      </Modal>

      {/* =========================================================================
          1. HEADER FOR ADMIN (Executive LGU Command Banner - Full Span, Borderless)
          ========================================================================= */}
      <Box
        style={{
          width: "100%",
          borderRadius: 0,
          background: `linear-gradient(135deg, ${BRAND.darkNavy} 0%, ${BRAND.navy} 50%, ${BRAND.teal} 100%)`,
          color: "#ffffff",
          boxShadow: "0 6px 20px rgba(0, 36, 54, 0.2)",
        }}
        px={{ base: "md", md: "xl", lg: 36 }}
        py={{ base: "xl", md: 36 }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box maw={740}>
            <Group gap="xs" mb={8}>
              <Badge
                size="sm"
                variant="filled"
                style={{
                  backgroundColor: BRAND.orange,
                  color: "#ffffff",
                  letterSpacing: "0.5px",
                  fontWeight: 800,
                }}
              >
                LGU DISPATCH
              </Badge>
              <Text size="xs" fw={700} c="rgba(255, 255, 255, 0.8)">
                BAGUIO CITY MUNICIPAL OPERATIONS
              </Text>
            </Group>

            <Title
              order={1}
              size="h1"
              fw={900}
              c="#ffffff"
              lh={1.15}
              style={{ letterSpacing: "-0.5px" }}
            >
              Central Incident Dispatch Portal
            </Title>
            <Text size="sm" c="rgba(255, 255, 255, 0.88)" mt={6} lh={1.5}>
              Manage municipal field reports, update department triage status
              (CEPMO, CDRRMO, City Engineering), and monitor community upvotes
              in real-time.
            </Text>
          </Box>

          {/* Admin Info & High-Contrast Live Sync Chip */}
          <Box
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              padding: "12px 18px",
              borderRadius: "14px",
              backdropFilter: "blur(6px)",
            }}
          >
            <Group justify="space-between" align="center" gap="md" mb={4}>
              <Box>
                <Text
                  size="11px"
                  fw={700}
                  c="rgba(255,255,255,0.75)"
                  tt="uppercase"
                >
                  Logged in as
                </Text>
                <Text size="sm" fw={800} c="#ffffff">
                  LGU Operations Admin
                </Text>
              </Box>
              <Button
                size="xs"
                variant="white"
                color="red"
                radius="md"
                fw={700}
                onClick={openLogout}
              >
                Log Out
              </Button>
            </Group>

            {/* High-Contrast "● Live Database Sync" Chip */}
            <Box
              mt={8}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#ffffff",
                padding: "5px 14px",
                borderRadius: "999px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  boxShadow: "0 0 6px #10B981",
                  display: "inline-block",
                }}
              />
              <Text
                size="xs"
                fw={800}
                c={BRAND.navy}
                style={{ letterSpacing: "0.4px" }}
              >
                Live Database Sync
              </Text>
            </Box>
          </Box>
        </Group>
      </Box>

      {/* =========================================================================
          2. SPACE UTILIZATION: EXECUTIVE KPI METRIC CARDS (Full Span, Borderless)
          ========================================================================= */}
      <Box
        px={{ base: "md", md: "xl", lg: 36 }}
        pt={{ base: "md", md: "xl" }}
        pb="xl"
        style={{ width: "100%" }}
      >
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          {/* Metric 1: Total Incidents */}
          <Card
            shadow="sm"
            radius="lg"
            p="md"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 10px rgba(0, 57, 83, 0.05)",
            }}
          >
            <Text size="xs" fw={700} c="gray.6" tt="uppercase">
              Total Incidents Logged
            </Text>
            <Title order={2} size="h1" fw={900} c={BRAND.navy} mt={4}>
              {metrics.total}
            </Title>
            <Text size="11px" c="dimmed">
              Across all Baguio City barangays
            </Text>
          </Card>

          {/* Metric 2: Pending Triage */}
          <Card
            shadow="sm"
            radius="lg"
            p="md"
            style={{
              backgroundColor: "#FFF8F5",
              boxShadow: "0 2px 10px rgba(255, 57, 0, 0.06)",
            }}
          >
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c={BRAND.orange} tt="uppercase">
                Pending Triage
              </Text>
              <Badge color="orange" size="xs">
                Urgent
              </Badge>
            </Group>
            <Title order={2} size="h1" fw={900} c={BRAND.orange} mt={4}>
              {metrics.pending}
            </Title>
            <Text size="11px" c="dimmed">
              Awaiting review & crew dispatch
            </Text>
          </Card>

          {/* Metric 3: In Progress */}
          <Card
            shadow="sm"
            radius="lg"
            p="md"
            style={{
              backgroundColor: "#F2F9F9",
              boxShadow: "0 2px 10px rgba(2, 127, 141, 0.06)",
            }}
          >
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c={BRAND.teal} tt="uppercase">
                In Progress
              </Text>
              <Badge color="teal" size="xs">
                Active
              </Badge>
            </Group>
            <Title order={2} size="h1" fw={900} c={BRAND.teal} mt={4}>
              {metrics.inProgress}
            </Title>
            <Text size="11px" c="dimmed">
              Field teams actively working on site
            </Text>
          </Card>

          {/* Metric 4: Resolved */}
          <Card
            shadow="sm"
            radius="lg"
            p="md"
            style={{
              backgroundColor: "#F2F9F4",
              boxShadow: "0 2px 10px rgba(43, 138, 62, 0.06)",
            }}
          >
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="green.8" tt="uppercase">
                Resolved
              </Text>
              <Badge color="green" size="xs">
                Closed
              </Badge>
            </Group>
            <Title order={2} size="h1" fw={900} c="green.8" mt={4}>
              {metrics.resolved}
            </Title>
            <Text size="11px" c="dimmed">
              Successfully addressed & cleared
            </Text>
          </Card>
        </SimpleGrid>

        {/* =========================================================================
            3. INTERACTIVE CONTROL BAR (SEARCH, CATEGORY, STATUS TABS, SORT - Borderless)
            ========================================================================= */}
        <Card
          shadow="sm"
          radius="lg"
          p="md"
          mt="xl"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 10px rgba(0, 57, 83, 0.05)",
          }}
        >
          <Stack gap="md">
            <ReportsToolbar
              searchPlaceholder="Search by title, description, barangay..."
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatusTab}
              onStatusChange={setSelectedStatusTab}
              statusOptions={[
                { label: `All (${metrics.total})`, value: "all" },
                { label: `Pending (${metrics.pending})`, value: "pending" },
                {
                  label: `In-Progress (${metrics.inProgress})`,
                  value: "in-progress",
                },
                { label: `Resolved (${metrics.resolved})`, value: "resolved" },
              ]}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          </Stack>
        </Card>

        {/* =========================================================================
            4. DASHBOARDS REPORT LIST (3-COLUMN DESKTOP GRID)
            ========================================================================= */}
        <Box mt="xl" pb="xl">
          {isLoading ? (
            <Center py={60}>
              <Loader color={BRAND.teal} size="lg" />
            </Center>
          ) : paginatedReports.length > 0 ? (
            <Stack gap="xl">
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {paginatedReports.map((incidentItem) => (
                  <>
                    <Modal opened={opened} onClose={close}>
                      <Button
                        onClick={() => handleDelete(incidentItem.id)}
                      ></Button>
                    </Modal>
                    <ReportCard
                      showCommunity={true}
                      key={incidentItem.id}
                      report={incidentItem}
                      onDelete={() => handleDelete(incidentItem.id)}
                      onChangeStatus={(newStatus) => {
                        handleChangeStatus(incidentItem.id, newStatus);
                      }}
                    />
                  </>
                ))}
              </SimpleGrid>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Center mt="lg">
                  <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                    radius="md"
                    color="teal"
                  />
                </Center>
              )}
            </Stack>
          ) : (
            <Center py={60}>
              <Stack align="center" gap="xs">
                <Text fw={700} size="md" c={BRAND.navy}>
                  No incident reports matching your filter criteria.
                </Text>
                <Text size="xs" c="dimmed">
                  Try clearing your search query or selecting a different status
                  filter.
                </Text>
              </Stack>
            </Center>
          )}
        </Box>
      </Box>
    </Box>
  );
}
