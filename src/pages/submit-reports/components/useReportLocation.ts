import { useEffect, useState } from "react";
import {
  reportLocationSchema,
  type GpsLocation,
  type PlaceLocation,
  type PlaceSuggestion,
  type ReportLocation,
} from "./LocationSchema";

// ==========================================
// 1. REVERSE GEOCODING HELPER
// ==========================================
async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    if (!res.ok) return undefined;
    const data = await res.json();

    // Attempt to get the most relevant name (specific name > road > neighborhood > fallback)
    return (
      data.name ||
      data.address?.road ||
      data.address?.neighbourhood ||
      undefined
    );
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return undefined;
  }
}

/* ---------- Placeholder backend call ----------
 * TODO(backend): replace the body with the real route once it exists.
 */
export async function saveReportLocation(
  reportId: number,
  location: ReportLocation,
): Promise<void> {
  console.log("[placeholder] saveReportLocation", reportId, location);
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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Fetch the human-readable name!
        const locationName = await reverseGeocode(lat, lng);

        setGps({
          source: "gps",
          latitude: lat,
          longitude: lng,
          accuracy: accuracy,
          name: locationName, // <--- Add the fetched name here
        } as GpsLocation & { name?: string }); // Typecast protects against immediate TS errors

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
