import { z } from "zod/v4";

export const STREET_MAX_LENGTH = 150;

/** PSGC codes are 9-digit numeric strings, e.g. "141102000". */
const psgcCode = z.string().regex(/^\d{9}$/, { error: "Invalid location code" });

/* ---------- Manual location: the raw LocationForm input ----------
 * Mirrors exactly what <LocationForm /> holds in state. The city and barangay
 * options come from the PSGC API (see usePsgc.ts), so the dropdowns are the
 * source of truth; this schema checks the shape and the dependencies.
 *
 * Rules:
 *  - The whole location is optional, so an empty form (no city) is valid.
 *  - A city is a code + name pair; so is a barangay.
 *  - Barangay and street need a city (the inputs are disabled without one).
 *  - Street is trimmed and length-limited.
 */
export const manualLocationInputSchema = z
  .object({
    cityCode: psgcCode.nullable(),
    city: z.string().min(1).nullable(),
    barangayCode: psgcCode.nullable(),
    barangay: z.string().min(1).nullable(),
    street: z
      .string()
      .trim()
      .max(STREET_MAX_LENGTH, {
        error: `Keep this under ${STREET_MAX_LENGTH} characters`,
      }),
  })
  .superRefine((value, ctx) => {
    const hasCity = Boolean(value.cityCode && value.city);

    if (!hasCity && (value.barangayCode || value.barangay || value.street)) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Select a city or municipality first",
      });
    }

    if (Boolean(value.barangayCode) !== Boolean(value.barangay)) {
      ctx.addIssue({
        code: "custom",
        path: ["barangay"],
        message: "Select a barangay from the list",
      });
    }
  });

/* ---------- Final location payload (what gets saved) ---------- */

export const gpsLocationSchema = z.object({
  source: z.literal("gps"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Accuracy radius in meters, as reported by the browser */
  accuracy: z.number().nonnegative(),
});

export const manualLocationSchema = z.object({
  source: z.literal("manual"),
  cityCode: psgcCode,
  city: z.string().min(1, { error: "City or municipality is required" }),
  barangayCode: psgcCode.nullable(),
  barangay: z.string().min(1).nullable(),
  street: z.string().max(STREET_MAX_LENGTH).nullable(),
});

export const reportLocationSchema = z.discriminatedUnion("source", [
  gpsLocationSchema,
  manualLocationSchema,
]);

/* ---------- Types (inferred, so they can't drift from the schema) ---------- */

export type ManualLocationValue = z.infer<typeof manualLocationInputSchema>;
export type GpsLocation = z.infer<typeof gpsLocationSchema>;
export type ReportLocation = z.infer<typeof reportLocationSchema>;

export const EMPTY_MANUAL_LOCATION: ManualLocationValue = {
  cityCode: null,
  city: null,
  barangayCode: null,
  barangay: null,
  street: "",
};

/** Per-field error messages for <LocationForm />. */
export type ManualLocationErrors = Partial<
  Record<keyof ManualLocationValue, string>
>;

export function getManualLocationErrors(
  value: ManualLocationValue,
): ManualLocationErrors {
  const result = manualLocationInputSchema.safeParse(value);
  if (result.success) return {};

  const errors: ManualLocationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ManualLocationValue | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}