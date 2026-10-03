/**
 * Carbon Impact Engine for GridSaathi
 * Formulas based on Central Electricity Authority (CEA) Baseline Database for the Indian Power Sector
 */

/**
 * Weighted average emission factor of the Indian National Grid (CEA CO2 Baseline Database v19).
 * Approximately 0.716 kg CO2 / kWh (716 g CO2 / kWh).
 */
export const INDIA_GRID_EF_KG_PER_KWH = 0.716;

/**
 * 1 mature tree absorbs ~21.77 kg CO2 per year (~0.0596 kg CO2 per day).
 * Ref: ICAR - Central Agroforestry Research Institute / UNFCCC standard metrics.
 */
export const DAILY_TREE_ABSORPTION_KG = 0.0596;

export interface CarbonImpactMetrics {
  emissionsTodayKg: number;
  emissionsAvoidedTodayKg: number;
  liveCarbonIntensityGPerKwh: number;
  cleanSharePct: number;
  treesDailyEquivalent: number;
  historySparkline: Array<{
    hour: string;
    intensity: number;
    avoidedKg: number;
  }>;
}

export function calculateCarbonImpact(
  gridImportKwhToday: number,
  cleanEnergyKwhToday: number,
  currentCleanKw: number,
  currentTotalKw: number
): CarbonImpactMetrics {
  // 1. Grid import emissions (kg CO2)
  const emissionsTodayKg = parseFloat((gridImportKwhToday * INDIA_GRID_EF_KG_PER_KWH).toFixed(1));

  // 2. Emissions avoided by local solar + wind + storage (kg CO2)
  const emissionsAvoidedTodayKg = parseFloat((cleanEnergyKwhToday * INDIA_GRID_EF_KG_PER_KWH).toFixed(1));

  // 3. Clean share %
  const totalKwh = gridImportKwhToday + cleanEnergyKwhToday;
  const cleanSharePct = totalKwh > 0
    ? Math.min(100, Math.round((cleanEnergyKwhToday / totalKwh) * 100))
    : currentTotalKw > 0
    ? Math.min(100, Math.round((currentCleanKw / currentTotalKw) * 100))
    : 45;

  // 4. Live carbon intensity (g CO2 / kWh)
  // Grid electricity is ~716 g/kWh; local renewables are ~0 g/kWh
  const thermalRatio = Math.max(0, 1 - (cleanSharePct / 100));
  const liveCarbonIntensityGPerKwh = Math.round(thermalRatio * 716);

  // 5. Equivalent trees absorption
  const treesDailyEquivalent = parseFloat(
    (emissionsAvoidedTodayKg / DAILY_TREE_ABSORPTION_KG).toFixed(1)
  );

  // 6. Generate 24-hour sparkline based on diurnal solar curve
  const historySparkline = Array.from({ length: 12 }, (_, i) => {
    const hourNum = i * 2;
    const hourLabel = `${hourNum.toString().padStart(2, '0')}:00`;
    const isSolarPeak = hourNum >= 10 && hourNum <= 16;
    const intensity = isSolarPeak
      ? Math.round(180 + Math.random() * 60)
      : Math.round(520 + Math.random() * 120);
    const avoidedKg = isSolarPeak
      ? parseFloat((24 + Math.random() * 10).toFixed(1))
      : parseFloat((4 + Math.random() * 3).toFixed(1));
    return {
      hour: hourLabel,
      intensity,
      avoidedKg,
    };
  });

  return {
    emissionsTodayKg,
    emissionsAvoidedTodayKg,
    liveCarbonIntensityGPerKwh,
    cleanSharePct,
    treesDailyEquivalent,
    historySparkline,
  };
}
