import { ForecastProvider, Scope } from '../ForecastProvider';
import { ForecastPoint, ShortfallWindow } from '../../domain/types';
import { INITIAL_TOPOLOGY } from '../../config/topology';
import { getDemandProfileFactor, getSolarGenerationFactor, getWindGenerationFactor } from './profiles';
import { weatherSim } from './weatherMock';
import { scenarioManager } from './scenarios';
import { computeSupplyStatus } from '../../domain/status';

export class MockForecastProvider implements ForecastProvider {
  async demand(scope: Scope, horizonH: number, nowTs: number): Promise<ForecastPoint[]> {
    return this.generateForecastPoints(scope, horizonH, nowTs);
  }

  async renewable(scope: Scope, horizonH: number, nowTs: number): Promise<ForecastPoint[]> {
    return this.generateForecastPoints(scope, horizonH, nowTs);
  }

  async shortfalls(scope: Scope, horizonH: number, nowTs: number): Promise<ShortfallWindow[]> {
    const points = await this.generateForecastPoints(scope, horizonH, nowTs);
    const windows: ShortfallWindow[] = [];
    let currentWindow: {
      start: number;
      end: number;
      peak: number;
      causes: string[];
    } | null = null;

    for (const pt of points) {
      if (pt.shortfallKw > 25) {
        if (!currentWindow) {
          currentWindow = {
            start: pt.ts,
            end: pt.ts + 15 * 60 * 1000,
            peak: pt.shortfallKw,
            causes: [],
          };
        } else {
          currentWindow.end = pt.ts + 15 * 60 * 1000;
          if (pt.shortfallKw > currentWindow.peak) {
            currentWindow.peak = pt.shortfallKw;
          }
        }

        // Assess cause
        const d = new Date(pt.ts);
        const hr = d.getHours();
        if (hr >= 18 && hr <= 22) {
          if (!currentWindow.causes.includes('evening_peak')) currentWindow.causes.push('evening_peak');
        }
        if (pt.solarKw < 50 && (hr >= 9 && hr <= 17)) {
          if (!currentWindow.causes.includes('low_solar')) currentWindow.causes.push('low_solar');
        }
        if (pt.windKw < 30) {
          if (!currentWindow.causes.includes('low_wind')) currentWindow.causes.push('low_wind');
        }
      } else {
        if (currentWindow) {
          let primaryCause: ShortfallWindow['cause'] = 'evening_peak';
          if (currentWindow.causes.length > 1) {
            primaryCause = 'combined';
          } else if (currentWindow.causes.includes('low_solar')) {
            primaryCause = 'low_solar';
          } else if (currentWindow.causes.includes('low_wind')) {
            primaryCause = 'low_wind';
          }

          windows.push({
            id: `sf-${currentWindow.start}`,
            scopeLevel: scope.level,
            scopeId: scope.id,
            start: currentWindow.start,
            end: currentWindow.end,
            peakShortfallKw: Math.round(currentWindow.peak),
            cause: primaryCause,
            confidence: 0.88,
            affectedColonyIds: this.getAffectedColonies(scope),
          });
          currentWindow = null;
        }
      }
    }

    if (currentWindow) {
      windows.push({
        id: `sf-${currentWindow.start}`,
        scopeLevel: scope.level,
        scopeId: scope.id,
        start: currentWindow.start,
        end: currentWindow.end,
        peakShortfallKw: Math.round(currentWindow.peak),
        cause: 'evening_peak',
        confidence: 0.85,
        affectedColonyIds: this.getAffectedColonies(scope),
      });
    }

    return windows;
  }

  async houseUsage(houseId: string, horizonH: number, nowTs: number): Promise<ForecastPoint[]> {
    // Base load for a single house ~1.5 - 3.5 kW
    const scope: Scope = { level: 'house', id: houseId };
    return this.generateForecastPoints(scope, horizonH, nowTs, 3.2);
  }

  private getAffectedColonies(scope: Scope): string[] {
    if (scope.level === 'colony') return [scope.id];
    if (scope.level === 'feeder') {
      const f = INITIAL_TOPOLOGY.feeders.find(fe => fe.id === scope.id);
      return f ? f.colonyIds : [];
    }
    if (scope.level === 'area') {
      const a = INITIAL_TOPOLOGY.areas.find(ar => ar.id === scope.id);
      if (!a) return [];
      const feeders = INITIAL_TOPOLOGY.feeders.filter(fe => a.feederIds.includes(fe.id));
      return feeders.flatMap(fe => fe.colonyIds);
    }
    return INITIAL_TOPOLOGY.colonies.map(c => c.id);
  }

  private generateForecastPoints(
    scope: Scope,
    horizonH: number,
    nowTs: number,
    overrideBaseKw?: number
  ): ForecastPoint[] {
    const points: ForecastPoint[] = [];
    const stepMinutes = horizonH <= 24 ? 15 : 60;
    const totalSteps = Math.min(96, Math.floor((horizonH * 60) / stepMinutes));

    // Base sizing according to scope
    let baseKw = overrideBaseKw || 6500; // default for whole powerhouse
    let capacityKw = 18000;
    let installedSolar = 5800;
    let installedWind = 4200;

    if (scope.level === 'area') {
      baseKw = 1600;
      capacityKw = 4500;
      installedSolar = 1450;
      installedWind = 1050;
    } else if (scope.level === 'feeder') {
      const f = INITIAL_TOPOLOGY.feeders.find(fe => fe.id === scope.id);
      capacityKw = f ? f.capacityKw : 2200;
      baseKw = capacityKw * 0.45;
      installedSolar = capacityKw * 0.35;
      installedWind = capacityKw * 0.25;
    } else if (scope.level === 'colony') {
      capacityKw = 350;
      baseKw = 140;
      installedSolar = 90;
      installedWind = 40;
    }

    const weather = weatherSim.getSnapshot(nowTs);
    const hasCloud = scenarioManager.hasScenario('cloudCover');
    const hasWindLull = scenarioManager.hasScenario('windLull');
    const hasHeatWave = scenarioManager.hasScenario('heatWave');

    const effectiveCloud = hasCloud ? 88 : weather.cloudCoverPct;
    const effectiveWind = hasWindLull ? 2.1 : weather.windSpeedMs;
    const tempMult = hasHeatWave ? 1.25 : 1.0;

    for (let i = 0; i <= totalSteps; i++) {
      const ts = nowTs + i * stepMinutes * 60 * 1000;
      const d = new Date(ts);
      const hour = d.getHours() + d.getMinutes() / 60;

      // Demand profile with day/night peaks
      const demandFactor = getDemandProfileFactor(hour);
      const demand = baseKw * demandFactor * tempMult;

      // Confidence interval widens with distance into the future
      const hoursAhead = (i * stepMinutes) / 60;
      const uncertainty = 0.04 + (hoursAhead / horizonH) * 0.14; // e.g. 4% -> 18%
      const p10 = demand * (1 - uncertainty);
      const p90 = demand * (1 + uncertainty);

      // Solar & wind profile
      const solarGenFactor = getSolarGenerationFactor(hour, effectiveCloud);
      const windGenFactor = getWindGenerationFactor(effectiveWind);

      const solarKw = installedSolar * solarGenFactor;
      const windKw = installedWind * windGenFactor;
      const renewableKw = solarKw + windKw;

      // Base grid import allocation (e.g. 50% of capacity)
      const gridAllocation = capacityKw * 0.48;
      const availableSupplyKw = gridAllocation + renewableKw;

      const shortfallKw = Math.max(0, demand - availableSupplyKw);

      const status = computeSupplyStatus({
        shortfallKw,
        capacityKw,
        currentDemandKw: demand,
      });

      points.push({
        ts,
        demandKw: Math.round(demand * 10) / 10,
        demandP10: Math.round(p10 * 10) / 10,
        demandP90: Math.round(p90 * 10) / 10,
        solarKw: Math.round(solarKw * 10) / 10,
        windKw: Math.round(windKw * 10) / 10,
        renewableKw: Math.round(renewableKw * 10) / 10,
        availableSupplyKw: Math.round(availableSupplyKw * 10) / 10,
        shortfallKw: Math.round(shortfallKw * 10) / 10,
        status,
        confidence: Math.max(0.65, 1 - uncertainty),
      });
    }

    return points;
  }
}

export const forecastProvider = new MockForecastProvider();
