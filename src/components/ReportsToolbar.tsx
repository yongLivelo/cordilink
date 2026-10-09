import {
  Box,
  Group,
  Select,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";

const BRAND = {
  orange: "#FF3900", // Action / Alert / Primary Accent
  navy: "#003953", // Deep Mountain Navy / Headers
  teal: "#027F8D", // Mountain Teal / Primary Branding
};

export type StatusOption = { label: string; value: string };

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In-Progress", value: "in-progress" },
  { label: "Resolved", value: "resolved" },
];

interface ReportsToolbarProps {
  /** Page heading — omit to render the controls only */
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Categories derived from the data — the "All" chip is prepended automatically */
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  /** Override the default pills, e.g. to include counts */
  statusOptions?: StatusOption[];
  sortOrder: string | null;
  onSortChange: (sort: string | null) => void;
}

/**
 * Shared search / category-filter / status-pills / sort toolbar used by
 * MyReports, CommunityReports, and the admin Dashboard.
 * Renders a fragment so its sections slot straight into the parent Stack.
 */
export default function ReportsToolbar({
  title,
  subtitle,
  searchPlaceholder = "Search reports...",
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  statusOptions,
  sortOrder,
  onSortChange,
}: ReportsToolbarProps) {
  const statusTabs = statusOptions ?? DEFAULT_STATUS_OPTIONS;
  const quickCategories = ["All", ...categories];

  return (
    <>
      {/* Primary Styled Search Bar */}
      <Box mt="xs" maw={640}>
        <TextInput
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
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
            cat === "All" ? selectedCategory === null : selectedCategory === cat;

          return (
            <UnstyledButton
              key={cat}
              onClick={() => onCategoryChange(cat === "All" ? null : cat)}
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
        {title && (
          <Box>
            <Title
              order={2}
              size="h3"
              fw={900}
              c={BRAND.navy}
              tt="uppercase"
              style={{ letterSpacing: "0.5px" }}
            >
              {title}
            </Title>
            {subtitle && (
              <Text size="xs" c="dimmed" mt={2}>
                {subtitle}
              </Text>
            )}
          </Box>
        )}

        <Group gap="md" align="center" wrap="wrap">
          {/* Status Tab Filter */}
          <Group gap={6}>
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.value;
              return (
                <UnstyledButton
                  key={tab.value}
                  onClick={() => onStatusChange(tab.value)}
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
            onChange={onSortChange}
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
    </>
  );
}
