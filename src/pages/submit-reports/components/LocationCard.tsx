import { Loader, NavLink, Stack, Text, ThemeIcon } from "@mantine/core";
import type { PlaceKind, PlaceSuggestion } from "./LocationSchema";
import type { SuggestionMode } from "./usePlaceSearch";

const KIND_LABEL: Record<PlaceKind, string> = {
  barangay: "Barangay / area",
  city: "City / town",
  street: "Street",
  landmark: "Landmark",
  address: "Address",
  other: "Place",
};

/** Simple outline map pin (inherits the surrounding text color). */
export function PinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

interface LocationCardProps {
  suggestions: PlaceSuggestion[];
  loading: boolean;
  error: string | null;
  mode: SuggestionMode;
  query: string;
  hasHints: boolean;
  onSelect: (place: PlaceSuggestion) => void;
}

/** The dropdown panel listing suggested places for the search box. */
export default function LocationCard({
  suggestions,
  loading,
  error,
  mode,
  query,
  hasHints,
  onSelect,
}: LocationCardProps) {
  const hasResults = suggestions.length > 0;

  return (
    <Stack gap={0}>
      {hasResults && (
        <Text size="xs" c="dimmed" px="sm" pt="xs">
          {mode === "description"
            ? "Suggested from your description"
            : "Places in the Cordillera"}
        </Text>
      )}

      {suggestions.map((place) => (
        <NavLink
          key={place.id}
          label={place.name}
          description={place.secondary || KIND_LABEL[place.kind]}
          leftSection={
            <ThemeIcon variant="light" color="gray" radius="xl" size={36}>
              <PinIcon />
            </ThemeIcon>
          }
          rightSection={
            <Text size="xs" c="dimmed">
              {KIND_LABEL[place.kind]}
            </Text>
          }
          // Keep focus in the search input while picking.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(place)}
        />
      ))}

      {!hasResults && loading && (
        <Text size="sm" c="dimmed" px="sm" py="sm">
          <Loader size="xs" mr="xs" />
          Searching…
        </Text>
      )}

      {!hasResults && !loading && error && (
        <Text size="sm" c="red" px="sm" py="sm">
          {error}
        </Text>
      )}

      {!hasResults && !loading && !error && mode === "search" && (
        <Text size="sm" c="dimmed" px="sm" py="sm">
          No places found for “{query.trim()}”. Try the barangay name or a
          nearby landmark.
        </Text>
      )}

      {!hasResults && !loading && !error && mode === "description" && (
        <Text size="sm" c="dimmed" px="sm" py="sm">
          {hasHints
            ? "No matching places found for your description yet. Try typing a barangay, landmark, or street."
            : "Type a barangay, landmark, or street. Places you mention in your description (e.g. “Where: …”) are suggested here automatically."}
        </Text>
      )}

      <Text size="xs" c="dimmed" ta="right" px="sm" py={6}>
        Map data © OpenStreetMap contributors
      </Text>
    </Stack>
  );
}