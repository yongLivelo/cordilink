import { z } from "zod/v4";

/* ---------- Search area: Cordillera Administrative Region ----------
 * Rough bounding box around Abra, Apayao, Benguet (incl. Baguio), Ifugao,
 * Kalinga and Mountain Province. Used to limit place search and to validate
 * that a chosen place is really in the region.
 */
export const CORDILLERA_BBOX = {
  west: 120.3,
  south: 16.1,
  east: 121.6,
  north: 18.6,
} as const;

/** Baguio City. Used to rank nearby results first. */
export const CORDILLERA_CENTER = { latitude: 16.4023, longitude: 120.596 };

export function isInCordillera(latitude: number, longitude: number): boolean {
  return (
    latitude >= CORDILLERA_BBOX.south &&
    latitude <= CORDILLERA_BBOX.north &&
    longitude >= CORDILLERA_BBOX.west &&
    longitude <= CORDILLERA_BBOX.east
  );
}

/* ---------- A place picked from the search suggestions ---------- */

export const PLACE_KINDS = [
  "barangay",
  "city",
  "street",
  "landmark",
  "address",
  "other",
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number];

export const placeSuggestionSchema = z.object({
  /** Stable id from the search provider, e.g. "N123456" */
  id: z.string().min(1),
  name: z.string().min(1),
  /** Second line: street / barangay / city / province, as available */
  secondary: z.string(),
  kind: z.enum(PLACE_KINDS),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/* ---------- Final location payload (what gets saved) ---------- */

export const gpsLocationSchema = z.object({
  source: z.literal("gps"),
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Accuracy radius in meters, as reported by the browser */
  accuracy: z.number().nonnegative(),
});

export const placeLocationSchema = placeSuggestionSchema
  .extend({ source: z.literal("place") })
  .refine((place) => isInCordillera(place.latitude, place.longitude), {
    error: "That place is outside the Cordillera region",
  });

export const reportLocationSchema = z.discriminatedUnion("source", [
  gpsLocationSchema,
  placeLocationSchema,
]);

/* ---------- Types (inferred, so they can't drift from the schema) ---------- */

export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;
export type GpsLocation = z.infer<typeof gpsLocationSchema>;
export type PlaceLocation = z.infer<typeof placeLocationSchema>;
export type ReportLocation = z.infer<typeof reportLocationSchema>;
