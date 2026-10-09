import { useDisclosure } from "@mantine/hooks";
import { Badge, Button, Center, Group, Modal, Stack, Text } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { divIcon, latLngBounds, type DivIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CORDILLERA_CENTER } from "@/components/Location/LocationSchema";

const BRAND = {
  orange: "#FF3900",
  navy: "#003953",
  teal: "#027F8D",
};

const STATUS_COLORS: Record<string, string> = {
  pending: BRAND.orange,
  "in-progress": BRAND.teal,
  resolved: "#2B8A3E",
};

/** Minimal shape shared by `Incident` and `Report` rows so every page can pass its list. */
export interface MappableReport {
  id: number | string;
  /** PostGIS geography value: EWKB hex, WKT, or GeoJSON (all handled by `toLatLng`). */
  location?: unknown;
  location_name?: string;
  title?: string;
  category?: string;
  status?: string;
  created_at?: string;
  /** MyReports joins `incident(status)` onto each report row. */
  incident?: { status?: string } | null;
}

type LatLng = [number, number];

function validLatLng(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/**
 * Extracts `[lat, lng]` from a PostGIS value:
 * - EWKB hex string (`0101000020E6100000…`) — what PostgREST returns for `geography`
 * - WKT (`SRID=4326;POINT(lng lat)`)
 * - GeoJSON Point (`{ type: "Point", coordinates: [lng, lat] }`)
 */
function toLatLng(value: unknown): LatLng | null {
  if (!value) return null;

  if (typeof value === "object") {
    const coords = (value as { coordinates?: unknown }).coordinates;
    if (
      Array.isArray(coords) &&
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      return validLatLng(coords[1], coords[0]);
    }
    return null;
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();

  const wkt = raw.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
  if (wkt) return validLatLng(Number(wkt[2]), Number(wkt[1]));

  // EWKB hex point: byteOrder(1) + type(4) + [srid(4)] + lng(8) + lat(8)
  if (/^[0-9a-f]+$/i.test(raw) && raw.length % 2 === 0 && raw.length >= 50) {
    const bytes = new Uint8Array(raw.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    }
    const view = new DataView(bytes.buffer);
    const littleEndian = view.getUint8(0) === 1;
    const type = view.getUint32(1, littleEndian);
    if ((type & 0xff) !== 1) return null; // not a Point
    const offset = type & 0x20000000 ? 9 : 5; // skip SRID if present
    return validLatLng(
      view.getFloat64(offset + 8, littleEndian),
      view.getFloat64(offset, littleEndian),
    );
  }

  return null;
}

// Cached per status so re-renders don't recreate icons (leaflet re-applies them).
const iconCache = new Map<string, DivIcon>();
function markerIcon(status?: string): DivIcon {
  const key = status ?? "unknown";
  let icon = iconCache.get(key);
  if (!icon) {
    const color = STATUS_COLORS[key] ?? BRAND.navy;
    icon = divIcon({
      className: "",
      html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

/** Fits the viewport to the markers, re-fitting once the modal transition settles. */
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      if (points.length === 1) {
        map.setView(points[0], 15);
      } else if (points.length > 1) {
        map.fitBounds(latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
      }
    };

    apply();
    // The modal's open animation can leave leaflet with a stale container size.
    const timer = setTimeout(() => {
      map.invalidateSize();
      apply();
    }, 350);
    return () => clearTimeout(timer);
  }, [map, points]);

  return null;
}

interface ReportsMapButtonProps {
  reports: readonly MappableReport[];
  /** Button caption; defaults to a map-pin action. */
  label?: string;
}

/**
 * Button that opens a modal with a leaflet map plotting one marker per report.
 * Reusable across Dashboard, CommunityReports, and MyReports — just pass the list.
 */
export default function ReportsMapButton({
  reports,
  label = "View Map",
}: ReportsMapButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const markers = useMemo(
    () =>
      reports
        .map((report) => {
          const position = toLatLng(report.location);
          return position ? { report, position } : null;
        })
        .filter((m): m is { report: MappableReport; position: LatLng } => !!m),
    [reports],
  );

  const points = useMemo(() => markers.map((m) => m.position), [markers]);

  return (
    <>
      <Button
        onClick={open}
        variant="light"
        color={BRAND.teal}
        radius="md"
        leftSection={
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        }
      >
        {label}
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Text fw={700} c={BRAND.navy}>
            Report Map {markers.length > 0 && `(${markers.length})`}
          </Text>
        }
        size="xl"
        centered
      >
        {markers.length === 0 ? (
          <Center h={300}>
            <Text size="sm" c="dimmed">
              No reports with location data to display.
            </Text>
          </Center>
        ) : (
          <MapContainer
            center={[CORDILLERA_CENTER.latitude, CORDILLERA_CENTER.longitude]}
            zoom={11}
            style={{ height: "min(65vh, 520px)", width: "100%" }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FitBounds points={points} />
            {markers.map(({ report, position }) => {
              const status = report.status ?? report.incident?.status;
              const formattedDate = report.created_at
                ? new Date(report.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : null;

              return (
                <Marker
                  key={`${report.id}`}
                  position={position}
                  icon={markerIcon(status)}
                >
                  <Popup>
                    <Stack gap={4} maw={240}>
                      <Text fw={700} size="sm">
                        {report.title ??
                          `${report.category || "Incident"} Report`}
                      </Text>
                      {report.location_name && (
                        <Text size="xs" c="dimmed">
                          {report.location_name}
                        </Text>
                      )}
                      <Group gap={6}>
                        {status && (
                          <Badge size="xs" color={STATUS_COLORS[status] ?? BRAND.navy}>
                            {status}
                          </Badge>
                        )}
                        {formattedDate && (
                          <Text size="xs" c="dimmed">
                            {formattedDate}
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </Modal>
    </>
  );
}
