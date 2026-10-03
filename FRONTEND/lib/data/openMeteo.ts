/**
 * Open-Meteo Live Weather & Solar/Wind Adapter (India coordinates)
 * Free API, no API key required.
 */

export interface LiveWeatherData {
  temperatureC: number;
  relativeHumidityPct: number;
  cloudCoverPct: number;
  directNormalIrradianceWsqm: number;
  windSpeed10mKmh: number;
  windSpeed10mMs: number;
  windSpeed80mMs: number;
  windDirectionDeg: number;
  source: 'open_meteo_live' | 'simulated_fallback';
  fetchedAt: string;
}

const cache = new Map<string, { data: LiveWeatherData; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

export async function fetchLiveWeather(lat: number, lng: number): Promise<LiveWeatherData> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const now = Date.now();

  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (now < entry.expiresAt) {
      return entry.data;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=direct_normal_irradiance,wind_speed_80m&timezone=Asia%2FKolkata&forecast_days=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const json = await res.json();
    const curr = json.current || {};
    const hourly = json.hourly || {};

    const wind10mKmh = curr.wind_speed_10m ?? 14.5;
    const calcWindSpeed10mMs = parseFloat((wind10mKmh / 3.6).toFixed(1));
    const wind80mKmh = hourly.wind_speed_80m?.[0] ?? wind10mKmh * 1.25;
    const calcWindSpeed80mMs = parseFloat((wind80mKmh / 3.6).toFixed(1));
    const dni = hourly.direct_normal_irradiance?.[0] ?? 640;

    const data: LiveWeatherData = {
      temperatureC: parseFloat((curr.temperature_2m ?? 31.5).toFixed(1)),
      relativeHumidityPct: Math.round(curr.relative_humidity_2m ?? 55),
      cloudCoverPct: Math.round(curr.cloud_cover ?? 25),
      directNormalIrradianceWsqm: Math.round(dni),
      windSpeed10mKmh: parseFloat(wind10mKmh.toFixed(1)),
      windSpeed10mMs: calcWindSpeed10mMs,
      windSpeed80mMs: calcWindSpeed80mMs,
      windDirectionDeg: Math.round(curr.wind_direction_10m ?? 225),
      source: 'open_meteo_live',
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
    return data;
  } catch {
    // Graceful fallback to deterministic physical values
    const fallback: LiveWeatherData = {
      temperatureC: 32.0,
      relativeHumidityPct: 52,
      cloudCoverPct: 30,
      directNormalIrradianceWsqm: 710,
      windSpeed10mKmh: 18.0,
      windSpeed10mMs: 5.0,
      windSpeed80mMs: 7.2,
      windDirectionDeg: 230,
      source: 'simulated_fallback',
      fetchedAt: new Date().toISOString(),
    };
    return fallback;
  }
}
