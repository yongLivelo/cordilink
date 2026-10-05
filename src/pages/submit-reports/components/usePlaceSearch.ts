import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import {
  CORDILLERA_BBOX,
  CORDILLERA_CENTER,
  isInCordillera,
  type PlaceKind,
  type PlaceSuggestion,
} from "./LocationSchema";

/**
 * Place search for Cordillera locations (barangays, landmarks, streets,
 * addresses) using Photon, a search-as-you-type geocoder over OpenStreetMap
 * data: https://photon.komoot.io
 *
 * The public Photon server is meant for light use. For production, host your
 * own Photon instance and change PHOTON_URL (the response format is the same).
 */
const PHOTON_URL = "https://photon.komoot.io/api/";
const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

/* ---------- Photon response -> PlaceSuggestion ---------- */

interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [longitude, latitude]
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
  };
}

const LANDMARK_KEYS = new Set([
  "amenity",
  "tourism",
  "shop",
  "leisure",
  "historic",
  "building",
  "office",
  "natural",
  "man_made",
  "healthcare",
  "public_transport",
  "railway",
  "aeroway",
  "craft",
]);

function classify(p: PhotonFeature["properties"]): PlaceKind | null {
  // Whole provinces / regions / countries are too broad for a report.
  if (p.type === "county" || p.type === "state" || p.type === "country") {
    return null;
  }
  if (p.type === "house" || p.housenumber) return "address";
  if (p.type === "street") return "street";
  if (p.type === "city") return "city";
  if (p.type === "district" || p.type === "locality") return "barangay";
  if (p.osm_key && LANDMARK_KEYS.has(p.osm_key)) return "landmark";
  if (p.osm_key === "place") return "barangay";
  return "other";
}

export function toPlaceSuggestion(feature: PhotonFeature): PlaceSuggestion | null {
  const p = feature.properties;
  const kind = classify(p);
  const [longitude, latitude] = feature.geometry.coordinates;
  if (!kind || !isInCordillera(latitude, longitude)) return null;

  const name =
    p.name ?? ([p.housenumber, p.street].filter(Boolean).join(" ") || null);
  if (!name) return null;

  // Second line, e.g. "Session Road, Baguio, Benguet" (no duplicates).
  const seen = new Set([name.toLowerCase()]);
  const secondary = [p.street, p.district, p.locality, p.city, p.county]
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const key = part.toLowerCase();
      // Skip repeats, including a street already part of the name.
      if (seen.has(key) || name.toLowerCase().includes(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .join(", ");

  return {
    id: `${p.osm_type}${p.osm_id}`,
    name,
    secondary,
    kind,
    latitude,
    longitude,
  };
}

/* ---------- Fetching ---------- */

const cache = new Map<string, PlaceSuggestion[]>();

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const cacheKey = q.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    limit: String(RESULT_LIMIT),
    lat: String(CORDILLERA_CENTER.latitude),
    lon: String(CORDILLERA_CENTER.longitude),
    // minLon,minLat,maxLon,maxLat
    bbox: [
      CORDILLERA_BBOX.west,
      CORDILLERA_BBOX.south,
      CORDILLERA_BBOX.east,
      CORDILLERA_BBOX.north,
    ].join(","),
  });

  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const results = dedupe(
    (data.features ?? [])
      .map(toPlaceSuggestion)
      .filter((place): place is PlaceSuggestion => place !== null),
  );

  cache.set(cacheKey, results);
  return results;
}

function dedupe(places: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${place.name.toLowerCase()}|${place.secondary.toLowerCase()}`;
    if (seen.has(key) || seen.has(place.id)) return false;
    seen.add(key);
    seen.add(place.id);
    return true;
  });
}

/* ---------- Suggestions from the report description ---------- */

// A capitalised word, optionally followed by a number ("Camp 7").
const CAP = String.raw`[A-Z][\w'’-]*(?:[ \t]+\d{1,3}\b)?`;
// Words are joined by spaces/tabs only, so a name never runs across lines.
const SP = String.raw`[ \t]+`;
const CONNECTOR = String.raw`(?:of|de|del|ng|sa|the|and)`;
const PREPOSITION = String.raw`(?:at|near|in front of|beside|behind|along|inside|around|across from|sa|malapit sa|harap ng|katabi ng)`;

/**
 * Pulls place-like phrases out of a report description, best guesses first:
 *  1. a "Where: ..." line (the format we suggest to users)
 *  2. "Barangay X" / "Brgy. X"
 *  3. "near / at / along / in front of ..." followed by a capitalised name
 *  4. any capitalised multi-word name mid-sentence (e.g. "Session Road")
 */
export function extractPlaceHints(description: string): string[] {
  const hints: string[] = [];
  const add = (raw: string) => {
    const hint = raw
      .replace(new RegExp(String.raw`${SP}${CONNECTOR}$`, "i"), "")
      .replace(/[.,;:!?)]+$/, "")
      .trim();
    if (
      hint.length >= 3 &&
      !hints.some((existing) => existing.toLowerCase() === hint.toLowerCase())
    ) {
      hints.push(hint);
    }
  };

  const where = description.match(/^\s*where\s*:\s*(.+)$/im);
  if (where) add(where[1]);

  for (const m of description.matchAll(
    new RegExp(String.raw`\b(?:[Bb]arangay|[Bb]rgy\.?)\s+(${CAP}(?:${SP}${CAP}){0,2})`, "g"),
  )) {
    add(m[1]);
  }

  for (const m of description.matchAll(
    new RegExp(
      String.raw`\b${PREPOSITION}${SP}(${CAP}(?:${SP}(?:${CAP}|${CONNECTOR}))*)`,
      "g",
    ),
  )) {
    add(m[1]);
  }

  for (const m of description.matchAll(
    new RegExp(String.raw`(?<!^|[.!?:]\s)\b${CAP}(?:${SP}${CAP})+`, "gm"),
  )) {
    add(m[0]);
  }

  return hints.slice(0, 3);
}

async function searchHints(hints: string[], signal: AbortSignal) {
  const lists = await Promise.all(
    hints.slice(0, 2).map((hint) => searchPlaces(hint, signal)),
  );
  return dedupe(lists.flatMap((list) => list.slice(0, 3)));
}

/* ---------- Hook ---------- */

export type SuggestionMode = "search" | "description";

/**
 * Suggested places for the location box.
 *  - 2+ typed characters: results for what the user typed.
 *  - otherwise: places mentioned in the report description.
 * Pass `enabled = false` to skip all network requests (e.g. box closed).
 */
export function usePlaceSuggestions(
  query: string,
  description: string,
  enabled: boolean,
) {
  const typed = query.trim();
  const [debouncedQuery] = useDebouncedValue(typed, 350);
  const [debouncedDescription] = useDebouncedValue(description, 700);

  const mode: SuggestionMode =
    debouncedQuery.length >= MIN_QUERY_LENGTH ? "search" : "description";

  const hints = useMemo(
    () => (mode === "description" ? extractPlaceHints(debouncedDescription) : []),
    [mode, debouncedDescription],
  );

  const key = !enabled
    ? null
    : mode === "search"
      ? `q:${debouncedQuery}`
      : hints.length > 0
        ? `h:${hints.join("|")}`
        : null;

  const [result, setResult] = useState<{
    key: string;
    items: PlaceSuggestion[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();

    const request =
      mode === "search"
        ? searchPlaces(debouncedQuery, controller.signal)
        : searchHints(hints, controller.signal);

    request
      .then((items) => setResult({ key, items, error: null }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          items: [],
          error: "Couldn't load suggestions. Check your connection.",
        });
      });

    return () => controller.abort();
  }, [key, mode, debouncedQuery, hints]);

  const current = result && result.key === key ? result : null;
  const waitingForDebounce = typed !== debouncedQuery;

  return {
    mode,
    suggestions: current?.items ?? [],
    error: current?.error ?? null,
    loading: enabled && (waitingForDebounce || (key !== null && !current)),
    hasHints: hints.length > 0,
  };
}