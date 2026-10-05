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
import type { Report } from "@/types/report"; // Make sure this matches your raw report type export
import ReportCard from "@/components/ReportCard";

// Mock data flattened to strictly match the report table schema[cite: 1]
const MOCK_REPORTS: Report[] = [
  {
    id: 101,
    user_id: "user-uuid-1",
    incident_id: 8821,
    image_url: "https://placehold.co/400x300?text=Broken+Streetlight",
    description:
      "The streetlight has been flickering for three days, creating a hazard at night.",
    category: "Infrastructure",
    location: "POINT(120.596 16.416)",
    status: "pending",
    created_at: "2023-10-25T08:00:00Z",
  },
  {
    id: 102,
    user_id: "user-uuid-1",
    incident_id: 8822,
    image_url: "https://placehold.co/400x300?text=Pothole",
    description:
      "Large pothole in the right lane. Needs immediate filling before winter.",
    category: "Road Hazard",
    location: "POINT(120.601 16.402)",
    status: "in-progress",
    created_at: "2023-10-26T14:30:00Z",
  },
  {
    id: 103,
    user_id: "user-uuid-1",
    incident_id: 8850,
    image_url: "https://placehold.co/400x300?text=Graffiti",
    description: "Vandalism on the east wall of the library building.",
    category: "Vandalism",
    location: "POINT(120.590 16.410)",
    status: "resolved",
    created_at: "2023-10-27T09:15:00Z",
  },
];

const ITEMS_PER_PAGE = 2;

export default function MyReports() {
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulating network request (Replace with Supabase fetch from 'report' table)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMyReports(MOCK_REPORTS);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder]);

  // Derive available categories dynamically from the flattened data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(myReports.map((item) => item.category));
    return Array.from(uniqueCategories);
  }, [myReports]);

  // Process data: Filter -> Sort -> Paginate
  const processedData = useMemo(() => {
    let result = [...myReports];

    // 1. Search Filter (checks description and location only, as title is not in the report schema[cite: 1])
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
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
          placeholder="Search descriptions..."
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
            <ReportCard key={reportItem.id} report={reportItem} />
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
          <Text color="dimmed">No reports found matching your criteria.</Text>
        </Center>
      )}
    </Stack>
  );
}
