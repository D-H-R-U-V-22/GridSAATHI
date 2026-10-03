import areasData from '../../data/areas.json';
import { isPointInPolygon, haversineDistanceKm } from './pointInPolygon';
import { defaultReverseGeocoder } from './reverseGeocode';

export interface PowerHouseAreaEntity {
  id: string;
  legacyAreaId: string;
  name: { en: string; hi: string };
  state: { en: string; hi: string };
  district: { en: string; hi: string };
  lat: number;
  lng: number;
  geohash: string;
  timezone: string;
  lgdCode: string;
  climateProfile: string;
  capacityKw: number;
  installedSolarKw: number;
  installedWindKw: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  feeders: Array<{ id: string; name: string; capacityKw: number }>;
  colonies: Array<{
    id: string;
    name: { en: string; hi: string };
    lat: number;
    lng: number;
    houseCount: number;
    feederId: string;
    batteryId: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
  }>;
}

export const ALL_AREAS = areasData as unknown as PowerHouseAreaEntity[];

export interface GeoResolutionResult {
  lat: number;
  lng: number;
  area: PowerHouseAreaEntity;
  colony: PowerHouseAreaEntity['colonies'][0];
  isInsidePolygon: boolean;
  distanceKm: number;
  humanAddress: string;
}

export async function resolveCoordinatesToArea(
  lat: number,
  lng: number
): Promise<GeoResolutionResult> {
  const pt: [number, number] = [lng, lat];

  // 1. Try point-in-polygon matching for area
  let matchedArea = ALL_AREAS.find((area) =>
    isPointInPolygon(pt, area.geometry.coordinates)
  );

  let isInside = true;
  let distanceKm = 0;

  // 2. If outside all polygons, find nearest area by centroid
  if (!matchedArea) {
    isInside = false;
    let minD = Infinity;
    for (const a of ALL_AREAS) {
      const d = haversineDistanceKm(lat, lng, a.lat, a.lng);
      if (d < minD) {
        minD = d;
        matchedArea = a;
      }
    }
    distanceKm = minD;
  }

  // Fallback safe default
  if (!matchedArea) {
    matchedArea = ALL_AREAS[0];
  }

  // 3. Try point-in-polygon for colony within that area
  let matchedColony = matchedArea.colonies.find((col) =>
    isPointInPolygon(pt, col.geometry.coordinates)
  );

  if (!matchedColony) {
    // Pick nearest colony in that area
    let minColD = Infinity;
    matchedColony = matchedArea.colonies[0];
    for (const col of matchedArea.colonies) {
      const d = haversineDistanceKm(lat, lng, col.lat, col.lng);
      if (d < minColD) {
        minColD = d;
        matchedColony = col;
      }
    }
  }

  // 4. Reverse geocode label
  const geoResult = await defaultReverseGeocoder.reverseGeocode(lat, lng);

  return {
    lat,
    lng,
    area: matchedArea,
    colony: matchedColony,
    isInsidePolygon: isInside,
    distanceKm: parseFloat(distanceKm.toFixed(1)),
    humanAddress: geoResult.displayName,
  };
}

/**
 * Prompts browser geolocation with graceful timeout.
 */
export function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
