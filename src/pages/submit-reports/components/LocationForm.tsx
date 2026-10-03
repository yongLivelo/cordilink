import { Loader, Select, Stack, Text, TextInput } from "@mantine/core";
import { useBarangays, useCities } from "./usePsgc";
import type {
  ManualLocationErrors,
  ManualLocationValue,
} from "./LocationSchema";

/* Types and validation live in ./locationSchema; re-exported for convenience. */
export {
  EMPTY_MANUAL_LOCATION,
  type GpsLocation,
  type ManualLocationValue,
  type ReportLocation,
} from "./LocationSchema";

interface LocationFormProps {
  value: ManualLocationValue;
  onChange: (value: ManualLocationValue) => void;
  /** Validation messages from `getManualLocationErrors`. */
  errors?: ManualLocationErrors;
  disabled?: boolean;
}

export default function LocationForm({
  value,
  onChange,
  errors = {},
  disabled = false,
}: LocationFormProps) {
  const cities = useCities();
  const barangays = useBarangays(value.cityCode);

  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        Choose where the issue is. This is optional.
      </Text>

      <Select
        label="City / Municipality"
        placeholder="Select city or municipality"
        data={cities.options}
        value={value.cityCode}
        onChange={(cityCode, option) =>
          // Changing the city clears the barangay, since the lists differ.
          onChange({
            ...value,
            cityCode,
            city: option?.label ?? null,
            barangayCode: null,
            barangay: null,
          })
        }
        error={errors.city ?? cities.error}
        rightSection={cities.loading ? <Loader size="xs" /> : undefined}
        searchable
        clearable
        disabled={disabled}
      />

      <Select
        label="Barangay"
        placeholder={
          value.cityCode ? "Select barangay" : "Select a city or municipality first"
        }
        data={barangays.options}
        value={value.barangayCode}
        onChange={(barangayCode, option) =>
          onChange({
            ...value,
            barangayCode,
            barangay: option?.label ?? null,
          })
        }
        error={errors.barangay ?? barangays.error}
        rightSection={barangays.loading ? <Loader size="xs" /> : undefined}
        searchable
        clearable
        disabled={disabled || !value.cityCode}
      />

      <TextInput
        label="Street or landmark"
        placeholder="e.g., In front of the public market entrance"
        value={value.street}
        onChange={(event) =>
          onChange({ ...value, street: event.currentTarget.value })
        }
        error={errors.street}
        disabled={disabled || !value.cityCode}
      />
    </Stack>
  );
}
