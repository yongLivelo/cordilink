import { useEffect, useState } from "react";

/**
 * Live Philippine Standard Geographic Code (PSGC) data from the public,
 * static PSGC API: https://psgc.gitlab.io/api
 *
 * Nothing is hardcoded: cities/municipalities and barangays are fetched on
 * demand and cached in memory for the session.
 */
const BASE_URL = "https://psgc.gitlab.io/api";

/**
 * Region the app covers. 140000000 = Cordillera Administrative Region (CAR).
 * Set to `null` to list every city/municipality in the country.
 */
const REGION_CODE: string | null = "140000000";

export type PsgcOption = { value: string; label: string };

const cache = new Map<string, Promise<PsgcOption[]>>();

function load(path: string): Promise<PsgcOption[]> {
  let request = cache.get(path);
  if (!request) {
    request = fetch(`${BASE_URL}${path}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`PSGC request failed (${res.status})`);
        const data = (await res.json()) as { code: string; name: string }[];
        return data
          .map((item) => ({ value: item.code, label: item.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
      })
      // Don't cache failures, so the next attempt retries.
      .catch((error) => {
        cache.delete(path);
        throw error;
      });
    cache.set(path, request);
  }
  return request;
}

function usePsgcOptions(path: string | null) {
  const [result, setResult] = useState<{
    path: string;
    options: PsgcOption[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    load(path)
      .then((options) => {
        if (!cancelled) setResult({ path, options, error: null });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({
            path,
            options: [],
            error: "Couldn't load locations. Check your connection.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  const current = result && result.path === path ? result : null;
  return {
    options: current?.options ?? [],
    loading: path !== null && !current,
    error: current?.error ?? null,
  };
}

/** All cities and municipalities in the configured region. */
export function useCities() {
  return usePsgcOptions(
    REGION_CODE
      ? `/regions/${REGION_CODE}/cities-municipalities/`
      : "/cities-municipalities/",
  );
}

/** Barangays of one city/municipality (pass its PSGC code). */
export function useBarangays(cityCode: string | null) {
  return usePsgcOptions(
    cityCode ? `/cities-municipalities/${cityCode}/barangays/` : null,
  );
}