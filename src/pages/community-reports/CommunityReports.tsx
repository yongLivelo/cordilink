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
import type { Incident } from "@/types/report"; // Using Incident instead of the discarded CommunityReport schema
import ReportCard from "@/components/ReportCard";

// Mock data flattened and strictly typed to the Incident schema[cite: 1]
const MOCK_INCIDENTS: Incident[] = [
  {
    id: 8821,
    title: "Broken Streetlight on 5th",
    description:
      "The streetlight has been flickering for three days, creating a hazard at night.",
    image_url: "https://placehold.co/400x300?text=Broken+Streetlight",
    category: "Infrastructure",
    location: "POINT(120.596 16.416)",
    status: "pending",
    created_at: "2023-10-25T08:00:00Z",
    is_community_report: true,
  },
  {
    id: 8822,
    title: "Large Pothole",
    description:
      "Large pothole in the right lane. Needs immediate filling before winter.",
    image_url: "https://placehold.co/400x300?text=Pothole",
    category: "Road Hazard",
    location: "POINT(120.601 16.402)",
    status: "in-progress",
    created_at: "2023-10-26T14:30:00Z",
    is_community_report: true,
  },
  {
    id: 8850,
    title: "Library Graffiti",
    description: "Vandalism on the east wall of the library building.",
    image_url: "https://placehold.co/400x300?text=Graffiti",
    category: "Vandalism",
    location: "POINT(120.590 16.410)",
    status: "resolved",
    created_at: "2023-10-27T09:15:00Z",
    is_community_report: true,
  },
];

const ITEMS_PER_PAGE = 2;

export default function CommunityReportPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulate network request (e.g., supabase.from('incident').select('*').eq('is_community_report', true))
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIncidents(MOCK_INCIDENTS);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder]);

  // Derive available categories dynamically from the data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(incidents.map((item) => item.category));
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
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.location.toLowerCase().includes(lowerQuery),
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
            <ReportCard key={reportItem.id} report={reportItem} />
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
          <Text color="dimmed">
            No community reports found matching your criteria.
          </Text>
        </Center>
      )}
    </Stack>
  );
}
