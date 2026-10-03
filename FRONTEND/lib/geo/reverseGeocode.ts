/**
 * Swappable Reverse Geocoder Interface (Nominatim OSM default + ISRO Bhuvan stub)
 */

export interface GeocodeResult {
  displayName: string;
  suburbOrColony?: string;
  district?: string;
  state?: string;
}

export interface ReverseGeocoder {
  reverseGeocode(lat: number, lng: number): Promise<GeocodeResult>;
}

const geocodeCache = new Map<string, GeocodeResult>();
let lastRequestTime = 0;

export class NominatimReverseGeocoder implements ReverseGeocoder {
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeCache.has(key)) {
      return geocodeCache.get(key)!;
    }

    // Rate-limit to max 1 req/sec
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < 1050) {
      await new Promise((r) => setTimeout(r, 1050 - elapsed));
    }
    lastRequestTime = Date.now();

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GridSaathi-App/2.0 (India Clean Grid Initiative; contact@gridsaathi.org)',
        },
      });

      if (!res.ok) {
        throw new Error(`Nominatim HTTP ${res.status}`);
      }

      const data = await res.json();
      const addr = data.address || {};
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
      const district = addr.state_district || addr.county || addr.city || '';
      const state = addr.state || '';

      const result: GeocodeResult = {
        displayName: data.display_name || `${suburb}, ${district}, ${state}`,
        suburbOrColony: suburb,
        district,
        state,
      };

      geocodeCache.set(key, result);
      return result;
    } catch {
      // Fallback
      return {
        displayName: `Coordinates (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
      };
    }
  }
}

/**
 * ISRO Bhuvan Geocoder stub for future production rollout
 */
export class IsroBhuvanReverseGeocoder implements ReverseGeocoder {
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    // Stub implementation awaiting ISRO token
    return {
      displayName: `ISRO Bhuvan Loc (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
    };
  }
}

export const defaultReverseGeocoder = new NominatimReverseGeocoder();
