import Camera from "@/pages/submit-reports/components/Camera";
import LocationForm, {
  EMPTY_MANUAL_LOCATION,
  type GpsLocation,
  type ManualLocationValue,
  type ReportLocation,
} from "@/pages/submit-reports/components/LocationForm";
import { Alert, Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

const schema = z.object({
  image: z.string().min(2, { error: "You must take an image" }),
  description: z
    .string()
    .min(5, { error: "You must have atleast 5 characters" }),
});

/* ---------- Placeholder backend call ----------
 * TODO(backend): replace the body with the real route once it exists.
 * Expected contract (adjust to match the backend team):
 *   POST /api/reports/:reportId/location   body: ReportLocation (JSON)
 */
async function saveReportLocation(
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

/** Short text version of a location, used for the existing `location` column. */
function formatLocation(location: ReportLocation | null): string {
  if (!location) return "Not specified";
  if (location.source === "gps") {
    return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
  }
  return [location.street, location.barangay, location.city]
    .filter(Boolean)
    .join(", ");
}

export default function SubmitReports() {
  const [loading, setLoading] = useState(false);

  // Automatic location (browser Geolocation API)
  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Manual location (dropdown form)
  const [manual, setManual] = useState<ManualLocationValue>(
    EMPTY_MANUAL_LOCATION,
  );

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      image: null as string | null,
      description: "",
    },
    validate: schemaResolver(schema, { sync: true }),
  });

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
            "Location access is blocked. Allow it in your browser settings, or choose the location below.",
          );
        } else if (error.code === error.TIMEOUT) {
          setGpsError("Getting your location took too long. Try again.");
        } else {
          setGpsError(
            "Your location is unavailable right now. Try again or choose it below.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const buildLocation = (): ReportLocation | null => {
    if (gps) return gps;
    if (manual.city) {
      return {
        source: "manual",
        city: manual.city,
        barangay: manual.barangay,
        street: manual.street.trim() || null,
      };
    }
    return null;
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.image) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    try {
      const base64Clean = values.image.replace(/^data:image\/\w+;base64,/, "");
      const arrayBuffer = Uint8Array.from(atob(base64Clean), (c) =>
        c.charCodeAt(0),
      );
      const fileName = `${Date.now()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("report_images")
        .upload(fileName, arrayBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("report_images")
        .getPublicUrl(uploadData.path);

      const imageUrl = publicUrlData.publicUrl;
      const location = buildLocation();

      // `.select("id").single()` returns the new row so we can attach the location.
      const { data: inserted, error: dbError } = await supabase
        .from("reports")
        .insert([
          {
            title: "Title Here",
            // Text label for the existing NOT NULL `location` column.
            location: formatLocation(location),
            category: "road_hazard",
            description: values.description,
            image_url: imageUrl,
            user_id: user?.id,
          },
        ])
        .select("id")
        .single();

      if (dbError) throw dbError;

      if (location) {
        await saveReportLocation(inserted.id, location);
      }

      alert("Report and image submitted successfully!");
      form.reset();
      setGps(null);
      setManual(EMPTY_MANUAL_LOCATION);
    } catch (error: any) {
      console.error("Error submitting report:", error.message);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Camera
          onCapture={(base64Image: string) => {
            form.setFieldValue("image", base64Image);
          }}
          onRetake={() => {
            form.setFieldValue("image", null);
          }}
        />

        <Textarea
          label="Description"
          description="Include specific facts: what exactly happened, and any visible damage or immediate actions taken."
          placeholder="e.g., I noticed a severe water leak coming from the ceiling pipe near the main entrance..."
          minRows={4}
          autosize
          {...form.getInputProps("description")}
        />

        {/* ---------- Location ---------- */}
        <Stack gap="xs">
          <Text fw={500} size="sm">
            Location
          </Text>

          {gps ? (
            <Alert color="green" title="Location added">
              <Group justify="space-between" align="center">
                <Text size="sm">
                  📍 {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)} (±
                  {Math.round(gps.accuracy)} m)
                </Text>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setGps(null)}
                >
                  Choose manually instead
                </Button>
              </Group>
            </Alert>
          ) : (
            <>
              <Button
                variant="light"
                onClick={requestLocation}
                loading={locating}
                disabled={permissionDenied}
              >
                Use my current location
              </Button>

              {gpsError && (
                <Alert color="orange" title="Couldn't get your location">
                  {gpsError}
                </Alert>
              )}

              {permissionDenied && !gpsError && (
                <Text size="sm" c="dimmed">
                  Location access is blocked for this site. Choose the location
                  below, or allow access in your browser settings.
                </Text>
              )}

              {/* Shown whenever automatic location is not active. */}
              <LocationForm value={manual} onChange={setManual} />
            </>
          )}
        </Stack>

        <Button type="submit" loading={loading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
}
