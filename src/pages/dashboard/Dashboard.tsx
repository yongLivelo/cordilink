import {
  Stack,
  Loader,
  Center,
  TextInput,
  Select,
  Group,
  Pagination,
  Text,
} from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import type { Incident } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const ITEMS_PER_PAGE = 2;

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  // FIXED: Added async/await and protected against missing session

  useEffect(() => {
    const fetchUserReports = async () => {
      // Allow fetching even if logged out? If you want this hidden from
      // logged-out users, keep this guard.
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.from("incident").select("*");

      if (error) {
        console.error("Error fetching user reports:", error);
      } else {
        setIncidents(data || []);
      }
      setIsLoading(false);
    };

    fetchUserReports();
  }, [session]);

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder]);

  // Derive available categories dynamically from the data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      incidents
        .map((item) => item.category)
        .filter((cat): cat is string => Boolean(cat)), // Filter out undefined/null categories
    );
    return Array.from(uniqueCategories);
  }, [incidents]);

  // Process data: Filter -> Sort -> Paginate
  const processedData = useMemo(() => {
    let result = [...incidents];

    // 1. Search Filter (checks title, description, and location)
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          // FIXED: Added null-safety before calling .toLowerCase()
          item.title?.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.location?.toLowerCase().includes(lowerQuery),
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

    return result;
  }, [incidents, searchQuery, selectedCategory, sortOrder]);

  // 4. Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedReports = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleDelete = async (incidentId: number | string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

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
      // Filter out the deleted report from local state instantly
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
      console.error("error changing status: ", error);
    }
  };

  return (
    <Stack>
      {/* Controls Section */}
      <Group align="flex-end">
        <TextInput
          label="Search"
          placeholder="Search titles, descriptions..."
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

      {/* List Section */}
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
              onDelete={() => handleDelete(reportItem.id)}
              onChangeStatus={(newStatus) => {
                handleChangeStatus(reportItem.id, newStatus);
              }}
            />
          ))}

          {/* Pagination Controls */}
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
          <Text c="dimmed">
            {/* Note: 'color' is deprecated in Mantine v7, use 'c' */}
            No community reports found matching your criteria.
          </Text>
        </Center>
      )}
    </Stack>
  );
}
