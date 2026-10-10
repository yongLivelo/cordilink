import {
  Stack,
  Loader,
  Center,
  Group,
  Pagination,
  Text,
  SimpleGrid,
} from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import type { Incident } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import ReportsToolbar from "@/components/ReportsToolbar";
import ReportsMapButton from "@/components/ReportsMapButton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import "leaflet/dist/leaflet.css";

const ITEMS_PER_PAGE = 6;

export default function CommunityReportPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchUserReports = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("incident")
        .select("*")
        .eq("is_community_report", true);

      if (error) {
        console.error("Error fetching community reports:", error);
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
  }, [searchQuery, selectedCategory, sortOrder, selectedStatus]);

  // Derive available categories dynamically from dataset
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      incidents
        .map((item) => item.category)
        .filter((cat): cat is string => Boolean(cat)),
    );
    return Array.from(uniqueCategories);
  }, [incidents]);

  // Process data: Filter -> Sort -> Paginate
  const processedData = useMemo(() => {
    let result = [...incidents];

    // 1. Search Filter
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.location?.toLowerCase().includes(lowerQuery),
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // 3. Status Filter
    if (selectedStatus !== "all") {
      result = result.filter((item) => item.status === selectedStatus);
    }

    // 4. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [incidents, searchQuery, selectedCategory, sortOrder, selectedStatus]);

  // Pagination Calculations
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedReports = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <Stack gap="md">
      {/* Search, Filters, Status Pills & Sort */}
      <ReportsToolbar
        title="COMMUNITY REPORTS"
        subtitle="Browse verified community incident reports, updates, and active hazards."
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

      {/* Map view of all community reports */}
      <Group justify="flex-end">
        <ReportsMapButton reports={incidents} />
      </Group>

      {/* Reports List */}
      {isLoading ? (
        <Center mt="xl">
          <Loader color="blue" />
        </Center>
      ) : paginatedReports.length > 0 ? (
        <Stack gap="lg" mt="xs">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {paginatedReports.map((reportItem) => (
              <ReportCard key={reportItem.id} report={reportItem} />
            ))}
          </SimpleGrid>

          {totalPages > 1 && (
            <Center mt="xl">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                color="teal"
                radius="md"
              />
            </Center>
          )}
        </Stack>
      ) : (
        <Center mt="xl">
          <Text c="dimmed">
            No community reports found matching your criteria.
          </Text>
        </Center>
      )}
    </Stack>
  );
}
