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
import type { Report } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const ITEMS_PER_PAGE = 2;

export default function MyReports() {
  const { session } = useAuth();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
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
      const { data, error } = await supabase
        .from("report")
        .select("*")
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
    if (!confirm("Are you sure you want to delete this report?")) return;

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
      setMyReports((prev) => prev.filter((report) => report.id !== reportId));
    }
  };

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder]);

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

    return result;
  }, [myReports, searchQuery, selectedCategory, sortOrder]);

  // 4. Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedReports = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <Stack>
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
              onDelete={() =>
                handleDelete(
                  reportItem.id,
                  reportItem.incident_id,
                  reportItem.image_url,
                )
              }
            />
          ))}

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
