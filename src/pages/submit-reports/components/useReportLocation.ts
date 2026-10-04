import { useEffect, useState } from "react";
import {
  reportLocationSchema,
  type GpsLocation,
  type PlaceLocation,
  type PlaceSuggestion,
  type ReportLocation,
} from "./LocationSchema";

/** Short text version of a location, used for the existing `location` column. */
export function formatLocation(location: ReportLocation | null): string {
  if (!location) return "Not specified";
  if (location.source === "gps") {
    return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
  }
  return [location.name, location.secondary].filter(Boolean).join(", ");
}

/* ---------- Placeholder backend call ----------
 * TODO(backend): replace the body with the real route once it exists.
 * Expected contract (adjust to match the backend team):
 *   POST /api/reports/:reportId/location   body: ReportLocation (JSON)
 */
export async function saveReportLocation(
  reportId: number,
  location: ReportLocation,
): Promise<void> {
  console.log("[placeholder] saveReportLocation", reportId, location);

  // const res = await fetch(`/api/reports/${reportId}/location`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(location),
  // });
  // if (!res.ok) throw new Error("Failed to save location");
}

/**
 * All location state for the submit form: automatic (browser GPS) or a place
 * picked from the search suggestions, plus validation and the final payload.
 */
export function useReportLocation() {
  // Automatic location (browser Geolocation API)
  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Searched location
  const [place, setPlace] = useState<PlaceLocation | null>(null);
  const [query, setQueryValue] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Check (without prompting) whether location access was already blocked.
  useEffect(() => {
    if (!("permissions" in navigator)) return;

    let status: PermissionStatus | undefined;
    const update = () => setPermissionDenied(status?.state === "denied");

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        status = result;
        update();
        status.addEventListener("change", update);
      })
      .catch(() => {
        // Permissions API not supported for geolocation; ignore.
      });

    return () => status?.removeEventListener("change", update);
  }, []);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("This browser does not support location access.");
      return;
    }

    setLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          source: "gps",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setGpsError(
            "Location access is blocked. Allow it in your browser settings, or search for the place below.",
          );
        } else if (error.code === error.TIMEOUT) {
          setGpsError("Getting your location took too long. Try again.");
        } else {
          setGpsError(
            "Your location is unavailable right now. Try again or search for it below.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  /** Update the search text; clears a stale error message. */
  const setQuery = (next: string) => {
    setQueryValue(next);
    setSearchError(null);
  };

  const selectPlace = (suggestion: PlaceSuggestion) => {
    setPlace({ source: "place", ...suggestion });
    setQueryValue(suggestion.name);
    setSearchError(null);
  };

  const clearPlace = () => {
    setPlace(null);
    setQueryValue("");
    setSearchError(null);
  };

  /**
   * Location is optional, but if one is provided it must be valid.
   * Shows an error and returns `ok: false` when it isn't.
   */
  const validate = (): { ok: boolean; value: ReportLocation | null } => {
    const location: ReportLocation | null = gps ?? place;

    if (!location) {
      if (query.trim()) {
        setSearchError(
          "Pick a place from the suggestions, or clear the search box.",
        );
        return { ok: false, value: null };
      }
      return { ok: true, value: null };
    }

    const parsed = reportLocationSchema.safeParse(location);
    if (!parsed.success) {
      setGps(null);
      setPlace(null);
      setSearchError("That location looks invalid. Please choose it again.");
      return { ok: false, value: null };
    }
    return { ok: true, value: parsed.data };
  };

  const reset = () => {
    setGps(null);
    setPlace(null);
    setQueryValue("");
    setSearchError(null);
  };

  return {
    gps,
    clearGps: () => setGps(null),
    locating,
    gpsError,
    permissionDenied,
    requestLocation,
    place,
    query,
    setQuery,
    searchError,
    selectPlace,
    clearPlace,
    validate,
    reset,
  };
}

export type ReportLocationState = ReturnType<typeof useReportLocation>;
