import {
  Stack,
  Loader,
  Center,
  TextInput,
  Select,
  Group,
  Pagination,
  Text,
  Box,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import type { Incident } from "@/types/report";
import ReportCard from "@/components/ReportCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import "leaflet/dist/leaflet.css";

const BRAND = {
  orange: "#FF3900", // Action / Alert / Primary Accent
  navy: "#003953", // Deep Mountain Navy / Headers
  teal: "#027F8D", // Mountain Teal / Primary Branding
  tealDark: "#002B3F", // Deep Navy Dark Gradient Stop
};

const ITEMS_PER_PAGE = 2;

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

  // Dynamic quick categories chip list
  const quickCategories = useMemo(() => {
    return ["All", ...categories];
  }, [categories]);

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
            COMMUNITY REPORTS
          </Title>
          <Text size="xs" c="dimmed" mt={2}>
            Browse verified community incident reports, updates, and active
            hazards.
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

      {/* Reports List */}
      {isLoading ? (
        <Center mt="xl">
          <Loader color="blue" />
        </Center>
      ) : paginatedReports.length > 0 ? (
        <Stack mt="xs">
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
          <Text c="dimmed">
            No community reports found matching your criteria.
          </Text>
        </Center>
      )}
    </Stack>
  );
}
