import { Reading, Feeder, Colony, Battery, SupplyStatus } from './types';
import { THRESHOLDS } from '../config/thresholds';

export function calculateFeederLoadPct(reading: Reading | undefined, feeder: Feeder): number {
  if (!reading || feeder.capacityKw <= 0) return 0;
  return Math.min(100, (reading.demandKw / feeder.capacityKw) * 100);
}

export function calculateBatteryMinutesRemaining(battery: Battery | undefined, loadKw = 18): number {
  if (!battery || battery.socPct <= 5) return 0;
  // Available usable energy (leave 5% buffer)
  const usableKwh = battery.capacityKwh * Math.max(0, (battery.socPct - 5) / 100);
  const effectiveLoad = Math.max(2, loadKw);
  const hours = usableKwh / effectiveLoad;
  return Math.round(hours * 60);
}

export function evaluateColonyRisk(
  colony: Colony,
  reading: Reading | undefined,
  feeder: Feeder | undefined,
  hasActiveOutage: boolean
): {
  status: SupplyStatus;
  loadPct: number;
  shortfallKw: number;
  batteryMinutes: number;
} {
  if (hasActiveOutage) {
    return {
      status: 'outage',
      loadPct: 0,
      shortfallKw: 0,
      batteryMinutes: 0,
    };
  }

  const demand = reading?.demandKw || 120;
  const capacity = (feeder?.capacityKw || 2200) / Math.max(1, feeder?.colonyIds.length || 2);
  const loadPct = (demand / capacity) * 100;
  const supply = reading?.supplyKw || demand;
  const shortfallKw = Math.max(0, demand - supply);

  let status: SupplyStatus = 'stable';
  if (shortfallKw > 0 || loadPct >= THRESHOLDS.load.colonyConstrainedPct) {
    status = 'constrained';
  } else if (loadPct >= THRESHOLDS.load.colonyWatchPct) {
    status = 'watch';
  }

  return {
    status,
    loadPct: Math.round(loadPct),
    shortfallKw: Math.round(shortfallKw),
    batteryMinutes: 180,
  };
}
