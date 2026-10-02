export function getDemandProfileFactor(hourFraction: number): number {
  // Normalize hour into 0..24
  const h = (hourFraction % 24 + 24) % 24;

  if (h < 5) {
    // Night base: 0.35 - 0.40
    return 0.35 + 0.05 * Math.cos((h / 5) * Math.PI);
  } else if (h < 9.5) {
    // Morning surge (cooking, geysers, pumps): 0.45 -> 0.78
    const t = (h - 5) / 4.5;
    return 0.40 + 0.38 * Math.sin(t * Math.PI * 0.5);
  } else if (h < 17) {
    // Daytime plateau with afternoon dip: 0.55 - 0.65
    const t = (h - 9.5) / 7.5;
    return 0.78 - 0.20 * Math.sin(t * Math.PI);
  } else if (h < 22) {
    // Evening peak (the primary intermittency squeeze window): 0.70 -> 1.00
    const t = (h - 17) / 5;
    return 0.60 + 0.40 * Math.sin(t * Math.PI);
  } else {
    // Night decline: 0.85 -> 0.40
    const t = (h - 22) / 2;
    return 0.80 - 0.45 * t;
  }
}

export function getSolarGenerationFactor(hourFraction: number, cloudCoverPct: number): number {
  const h = (hourFraction % 24 + 24) % 24;
  const sunrise = 6.0;
  const sunset = 18.5;

  if (h <= sunrise || h >= sunset) {
    return 0;
  }

  // Bell-shaped clear-sky curve with peak at 12:15
  const peak = (sunrise + sunset) / 2;
  const width = (sunset - sunrise) / 2;
  const dist = Math.abs(h - peak) / width;
  const clearSky = Math.max(0, Math.cos(dist * (Math.PI / 2)));

  // Attenuation due to cloud cover: up to 85% drop
  const cloudFactor = Math.max(0.12, 1 - 0.85 * (cloudCoverPct / 100));
  return clearSky * cloudFactor;
}

export function getWindGenerationFactor(windSpeedMs: number): number {
  const cutIn = 3.0;
  const rated = 12.0;
  const cutOut = 25.0;

  if (windSpeedMs < cutIn || windSpeedMs > cutOut) {
    return 0;
  }
  if (windSpeedMs >= rated) {
    return 1.0;
  }

  // Cubic ramp curve between cut-in and rated speed
  const ratio = (windSpeedMs - cutIn) / (rated - cutIn);
  return Math.min(1.0, Math.max(0, Math.pow(ratio, 2.5)));
}
