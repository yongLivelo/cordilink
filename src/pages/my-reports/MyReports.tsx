import {
  Stack,
  Loader,
  Center,
  Group,
  Pagination,
  Text,
  Modal,
  useModalsStack,
  Button,
} from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import type { Incident, Report } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import ReportsToolbar from "@/components/ReportsToolbar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { notifications } from "@mantine/notifications";

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
      {/* Search, Filters, Status Pills & Sort */}
      <ReportsToolbar
        title="YOUR ACTIVE REPORTS"
        subtitle="Track status updates as reports move from Received to In-Progress to Resolved."
        searchPlaceholder="Search active reports, road hazards, or barangay locations..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

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
