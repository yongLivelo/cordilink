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
  // Which report the delete-confirmation modal is targeting
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  // Fetch reports from Supabase filtered by the current user's ID
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Fetch report data AND the status from the linked incident table
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

  // Handle report deletion from database and local state
  const handleDelete = async (
    reportId: number,
    incidentId: number | string,
    imageUrl: string,
  ) => {
    const { error } = await supabase.from("report").delete().eq("id", reportId);

    // 2. Delete the file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("report_images")
      .remove([imageUrl]);
    if (storageError) {
      console.error("Error deleting image", error);
    }

    supabase.functions
      .invoke("summarize-incident", {
        body: { incidentId: incidentId },
      })
      .catch((err) => console.error("Summarization check failed:", err));
    if (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete the report.");
    } else {
      // Filter out the deleted report from local state instantly
      notifications.show({
        title: "Success",
        message: "Report deleted",
      });
      setMyReports((prev) => prev.filter((report) => report.id !== reportId));
    }
  };

  // Confirm deletion: close the modal immediately, then delete in the background
  const confirmDelete = () => {
    if (!reportToDelete) return;
    const { id, incident_id, image_url } = reportToDelete;
    stack.close("delete");
    setReportToDelete(null);
    handleDelete(id, incident_id, image_url);
  };

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder, selectedStatus]);

  // Derive available categories dynamically from the fetched data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(myReports.map((item) => item.category));
    return Array.from(uniqueCategories);
  }, [myReports]);

  // Process data: Filter -> Sort -> Paginate
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

    // 3. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    if (selectedStatus !== "all") {
      result = result.filter((r: any) => r.incident?.status === selectedStatus);
    }

    return result;
  }, [myReports, searchQuery, selectedCategory, sortOrder, selectedStatus]);

  // 4. Pagination
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
      console.error("error fetching incident: ", error);
      return;
    }

    setIncident(data);
    stack.open("incident");
  };

  return (
    <Stack>
      <Group
        justify="space-between"
        align="flex-end"
        mb="lg"
        wrap="wrap"
        gap="md"
      >
        <Box>
          {" "}
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
      {/* =========================================================================
          DELETE REPORT CONFIRMATION MODAL (registered once for the whole list)
          ========================================================================= */}
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

      {/* Controls Section */}
      <Group align="flex-end">
        <TextInput
          label="Search"
          placeholder="Search descriptions or locations..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          flex={1}
        />
        <Select
          label="Category"
          placeholder="All Categories"
          data={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          clearable
          w={200}
        />
        <Select
          label="Sort By"
          data={[
            { value: "latest", label: "Latest" },
            { value: "oldest", label: "Oldest" },
          ]}
          value={sortOrder}
          onChange={setSortOrder}
          w={150}
          allowDeselect={false}
        />
      </Group>

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
