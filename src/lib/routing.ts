// OSRM (Open Source Routing Machine) — free routing + ETA
// Uses the public demo server at router.project-osrm.org

export interface RouteResult {
  /** Total distance in meters */
  distance: number;
  /** Total duration in seconds */
  duration: number;
  /** Decoded polyline coordinates [[lat, lng], ...] */
  coordinates: [number, number][];
}

/**
 * Fetch the driving route between two points using OSRM.
 * Returns the road geometry, distance, and ETA.
 */
export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  // OSRM expects lng,lat (not lat,lng)
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    // GeoJSON coordinates are [lng, lat] — flip to [lat, lng] for Leaflet
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    return {
      distance: route.distance,
      duration: route.duration,
      coordinates,
    };
  } catch {
    return null;
  }
}

/** Format seconds into a human-readable ETA string */
export function formatETA(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

/**
 * Given a polyline and a progress fraction (0–1), return the interpolated point.
 */
export function interpolateAlongRoute(
  coords: [number, number][],
  fraction: number
): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (fraction <= 0) return coords[0];
  if (fraction >= 1) return coords[coords.length - 1];

  // Calculate total distance of polyline
  let totalDist = 0;
  const segDists: number[] = [];
  for (let i = 1; i < coords.length; i++) {
    const d = haversine(coords[i - 1], coords[i]);
    segDists.push(d);
    totalDist += d;
  }

  const targetDist = totalDist * fraction;
  let traveled = 0;

  for (let i = 0; i < segDists.length; i++) {
    if (traveled + segDists[i] >= targetDist) {
      const segFraction = (targetDist - traveled) / segDists[i];
      const [lat1, lng1] = coords[i];
      const [lat2, lng2] = coords[i + 1];
      return [
        lat1 + (lat2 - lat1) * segFraction,
        lng1 + (lng2 - lng1) * segFraction,
      ];
    }
    traveled += segDists[i];
  }

  return coords[coords.length - 1];
}

/** Haversine distance between two [lat, lng] points in meters */
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}
