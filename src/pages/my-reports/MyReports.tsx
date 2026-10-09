import {
  Stack,
  Loader,
  Center,
  TextInput,
  Select,
  Group,
  Pagination,
  Text,
  Modal,
  useModalsStack,
  Button,
  Box,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import type { Incident, Report } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { notifications } from "@mantine/notifications";

const BRAND = {
  orange: "#FF3900", // Action / Alert / Primary Accent
  navy: "#003953", // Deep Mountain Navy / Headers
  teal: "#027F8D", // Mountain Teal / Primary Branding
  tealDark: "#002B3F", // Deep Navy Dark Gradient Stop
};

const ITEMS_PER_PAGE = 2;

export default function MyReports() {
  const { session } = useAuth();
  const [incident, setIncident] = useState<null | Incident>(null);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const stack = useModalsStack(["incident", "delete"]);

  // Delete modal target state
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch reports from Supabase filtered by user ID
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("report")
        .select("*, incident(status)")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching user reports:", error);
      } else {
        setMyReports(data || []);
      }
      setIsLoading(false);
    };

    fetchUserReports();
  }, [session]);

  // Handle report deletion
  const handleDelete = async (
    reportId: number,
    incidentId: number | string,
    imageUrl: string,
  ) => {
    const { error } = await supabase.from("report").delete().eq("id", reportId);

    if (imageUrl) {
      const { error: storageError } = await supabase.storage
        .from("report_images")
        .remove([imageUrl]);

      if (storageError) {
        console.error("Error deleting image:", storageError);
      }
    }

    supabase.functions
      .invoke("summarize-incident", {
        body: { incidentId },
      })
      .catch((err) => console.error("Summarization check failed:", err));

    if (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete the report.");
    } else {
      notifications.show({
        title: "Success",
        message: "Report deleted",
      });
      setMyReports((prev) => prev.filter((report) => report.id !== reportId));
    }
  };

  const confirmDelete = () => {
    if (!reportToDelete) return;
    const { id, incident_id, image_url } = reportToDelete;
    stack.close("delete");
    setReportToDelete(null);
    handleDelete(id, incident_id, image_url);
  };

  // Reset page pagination on filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder, selectedStatus]);

  // Derive available categories dynamically
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      myReports.map((item) => item.category).filter(Boolean),
    );
    return Array.from(uniqueCategories);
  }, [myReports]);

  // Dynamic quick categories chip list
  const quickCategories = useMemo(() => {
    return ["All", ...categories];
  }, [categories]);

  // Filter, sort, and paginate data
  const processedData = useMemo(() => {
    let result = [...myReports];

    // 1. Search Filter
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.location_name?.toLowerCase().includes(lowerQuery),
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // 3. Status Filter
    if (selectedStatus !== "all") {
      result = result.filter((r: any) => r.incident?.status === selectedStatus);
    }

    // 4. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [myReports, searchQuery, selectedCategory, sortOrder, selectedStatus]);

  // Pagination bounds
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedReports = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const checkIncidentId = async (incidentId: number) => {
    const { data, error } = await supabase
      .from("incident")
      .select("*")
      .eq("id", incidentId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching incident:", error);
      return;
    }

    setIncident(data);
    stack.open("incident");
  };

  return (
    <Stack gap="md">
      {/* Primary Styled Search Bar */}
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
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
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

      {/* Styled Interactive Category Chips */}
      <Group gap={6} align="center" wrap="wrap">
        <Text size="xs" fw={700} c={BRAND.navy} mr={4}>
          Filter:
        </Text>
        {quickCategories.map((cat) => {
          const isSelected =
            cat === "All"
              ? selectedCategory === null
              : selectedCategory === cat;

          return (
            <UnstyledButton
              key={cat}
              onClick={() => setSelectedCategory(cat === "All" ? null : cat)}
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: isSelected ? BRAND.orange : "#EAEFEF",
                color: isSelected ? "#ffffff" : BRAND.navy,
                border: isSelected
                  ? `1px solid ${BRAND.orange}`
                  : "1px solid #CBD5E0",
                boxShadow: isSelected
                  ? "0 2px 8px rgba(255, 57, 0, 0.3)"
                  : "none",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
            >
              {cat}
            </UnstyledButton>
          );
        })}
      </Group>

      {/* Header, Status Pills, and Sort By Controls */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
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
            Track status updates as reports move from Received to In-Progress to
            Resolved.
          </Text>
        </Box>

        <Group gap="md" align="center" wrap="wrap">
          {/* Status Tab Filter */}
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

          {/* Cleanly Styled Sort By Dropdown */}
          <Select
            placeholder="Sort By"
            data={[
              { value: "latest", label: "Sort: Latest" },
              { value: "oldest", label: "Sort: Oldest" },
            ]}
            value={sortOrder}
            onChange={setSortOrder}
            w={140}
            size="xs"
            radius="md"
            allowDeselect={false}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#CBD5E0",
                color: BRAND.navy,
                fontWeight: 700,
                fontSize: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                ":focus": {
                  borderColor: BRAND.teal,
                },
              },
            }}
          />
        </Group>
      </Group>

      {/* Delete Confirmation Modal */}
      <Modal
        {...stack.register("delete")}
        title="Delete Report"
        centered
        radius="md"
      >
        <Stack gap="md">
          <Group gap="sm" align="flex-start">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D32F2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <Text size="sm" fw={600} mb={2}>
                Are you sure you want to delete this report?
              </Text>
              <Text size="sm" c="dimmed">
                This action cannot be undone.
              </Text>
            </div>
          </Group>

          <Group justify="flex-end" gap="sm" mt="xs">
            <Button
              variant="default"
              radius="md"
              onClick={() => stack.close("delete")}
            >
              Cancel
            </Button>
            <Button color="red" radius="md" onClick={confirmDelete}>
              Delete Report
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reports List / Loader / Empty state */}
      {isLoading ? (
        <Center mt="xl">
          <Loader color="blue" />
        </Center>
      ) : paginatedReports.length > 0 ? (
        <Stack mt="md">
          {paginatedReports.map((reportItem) => (
            <ReportCard
              key={reportItem.id}
              report={reportItem}
              onDelete={() => {
                setReportToDelete(reportItem);
                stack.open("delete");
              }}
              checkIncidentId={checkIncidentId}
            />
          ))}

          {incident && (
            <Modal
              {...stack.register("incident")}
              title="Incident Details"
              centered
            >
              <ReportCard report={incident} />
            </Modal>
          )}

          {totalPages > 1 && (
            <Center mt="xl">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
              />
            </Center>
          )}
        </Stack>
      ) : (
        <Center mt="xl">
          <Text c="dimmed">No reports found matching your criteria.</Text>
        </Center>
      )}
    </Stack>
  );
}
