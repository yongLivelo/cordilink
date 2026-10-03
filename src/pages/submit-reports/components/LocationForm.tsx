import { Select, Stack, Text, TextInput } from "@mantine/core";

/* ---------- Types (move to src/types/report.ts if you prefer) ---------- */

export type GpsLocation = {
  source: "gps";
  latitude: number;
  longitude: number;
  /** Accuracy radius in meters, as reported by the browser */
  accuracy: number;
};

export type ManualLocationValue = {
  city: string | null;
  barangay: string | null;
  street: string;
};

export type ReportLocation =
  | GpsLocation
  | {
      source: "manual";
      city: string;
      barangay: string | null;
      street: string | null;
    };

export const EMPTY_MANUAL_LOCATION: ManualLocationValue = {
  city: null,
  barangay: null,
  street: "",
};

/* ---------- Dropdown data ----------
 * PLACEHOLDER DATA: a short sample so the dropdowns work.
 * Replace with the full list (e.g. from PSGC data or your own table).
 */
const LOCATIONS: Record<string, string[]> = {
  "Baguio City": [
    "Aurora Hill",
    "Burnham-Legarda",
    "Camp 7",
    "Engineers' Hill",
    "Irisan",
    "Kayang-Hilltop",
    "Loakan Proper",
    "Magsaysay",
    "Pacdal",
    "Quirino Hill",
  ],
  "La Trinidad": ["Alno", "Balili", "Betag", "Pico", "Wangal"],
};

const CITY_OPTIONS = Object.keys(LOCATIONS);

/* ---------- Component ---------- */

interface LocationFormProps {
  value: ManualLocationValue;
  onChange: (value: ManualLocationValue) => void;
  disabled?: boolean;
}

export default function LocationForm({
  value,
  onChange,
  disabled = false,
}: LocationFormProps) {
  const barangayOptions = value.city ? (LOCATIONS[value.city] ?? []) : [];

  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        Choose where the issue is. This is optional.
      </Text>

      <Select
        label="City / Municipality"
        placeholder="Select city or municipality"
        data={CITY_OPTIONS}
        value={value.city}
        // Changing the city clears the barangay, since the lists differ.
        onChange={(city) => onChange({ ...value, city, barangay: null })}
        searchable
        clearable
        disabled={disabled}
      />

      <Select
        label="Barangay"
        placeholder={
          value.city ? "Select barangay" : "Select a city or municipality first"
        }
        data={barangayOptions}
        value={value.barangay}
        onChange={(barangay) => onChange({ ...value, barangay })}
        searchable
        clearable
        disabled={disabled || !value.city}
      />

      <TextInput
        label="Street or landmark"
        placeholder="e.g., In front of the public market entrance"
        value={value.street}
        onChange={(event) =>
          onChange({ ...value, street: event.currentTarget.value })
        }
        disabled={disabled || !value.city}
      />
    </Stack>
  );
}
