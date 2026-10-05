import {
  Alert,
  Button,
  CloseButton,
  Group,
  Loader,
  Popover,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import LocationCard, { PinIcon } from "./LocationCard";
import { usePlaceSuggestions } from "./usePlaceSearch";
import type { ReportLocationState } from "./useReportLocation";

interface LocationFormProps {
  location: ReportLocationState;
  /** Current report description, used to suggest places it mentions. */
  description: string;
}

/** The "Location" block: GPS button, or a search box with suggested places. */
export default function LocationForm({
  location,
  description,
}: LocationFormProps) {
  const { gps, place } = location;
  const [open, setOpen] = useState(false);

  const search = usePlaceSuggestions(
    location.query,
    description,
    open && !gps && !place,
  );

  const choose = (selected: Parameters<typeof location.selectPlace>[0]) => {
    location.selectPlace(selected);
    setOpen(false);
  };

  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">
        Location
      </Text>

      {gps ? (
        <Alert color="green" title="Location added">
          <Group justify="space-between" align="center">
            <Group gap={6} wrap="nowrap">
              <PinIcon size={16} />
              <Text size="sm">
                {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)} (±
                {Math.round(gps.accuracy)} m) @ {gps.name}
              </Text>
            </Group>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={location.clearGps}
            >
              Search a place instead
            </Button>
          </Group>
        </Alert>
      ) : (
        <>
          <Button
            variant="light"
            onClick={location.requestLocation}
            loading={location.locating}
            disabled={location.permissionDenied}
          >
            Use my current location
          </Button>

          {location.gpsError && (
            <Alert color="orange" title="Couldn't get your location">
              {location.gpsError}
            </Alert>
          )}

          {location.permissionDenied && !location.gpsError && (
            <Text size="sm" c="dimmed">
              Location access is blocked for this site. Search for the place
              below, or allow access in your browser settings.
            </Text>
          )}

          {place ? (
            <Alert color="green" title="Location added">
              <Group justify="space-between" align="center">
                <Group gap={6} wrap="nowrap">
                  <PinIcon size={16} />
                  <Text size="sm">
                    {place.name}
                    {place.secondary ? `, ${place.secondary}` : ""}
                  </Text>
                </Group>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={location.clearPlace}
                >
                  Change
                </Button>
              </Group>
            </Alert>
          ) : (
            <Popover
              opened={open}
              onChange={setOpen}
              width="target"
              position="bottom-start"
              shadow="md"
              withinPortal={false}
            >
              <Popover.Target>
                <TextInput
                  label="Search for a place"
                  description="A barangay, landmark, street, or address in the Cordillera."
                  placeholder="e.g., Burnham Park, Session Road, Brgy. Irisan"
                  value={location.query}
                  onChange={(event) =>
                    location.setQuery(event.currentTarget.value)
                  }
                  onFocus={() => setOpen(true)}
                  onKeyDown={(event) => {
                    // Never submit the report from the search box.
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (open && search.suggestions[0]) {
                        choose(search.suggestions[0]);
                      }
                    }
                  }}
                  error={location.searchError}
                  rightSectionPointerEvents="all"
                  rightSection={
                    search.loading ? (
                      <Loader size="xs" />
                    ) : location.query ? (
                      <CloseButton
                        size="sm"
                        aria-label="Clear search"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => location.setQuery("")}
                      />
                    ) : undefined
                  }
                  autoComplete="off"
                />
              </Popover.Target>

              <Popover.Dropdown p={0}>
                <LocationCard
                  suggestions={search.suggestions}
                  loading={search.loading}
                  error={search.error}
                  mode={search.mode}
                  query={location.query}
                  hasHints={search.hasHints}
                  onSelect={choose}
                />
              </Popover.Dropdown>
            </Popover>
          )}
        </>
      )}
    </Stack>
  );
}
