import { ForecastPoint, ShortfallWindow, NodeLevel } from '../domain/types';

export interface Scope {
  level: NodeLevel;
  id: string;
}

export interface ForecastProvider {
  demand(scope: Scope, horizonH: number, nowTs: number): Promise<ForecastPoint[]>;
  renewable(scope: Scope, horizonH: number, nowTs: number): Promise<ForecastPoint[]>;
  shortfalls(scope: Scope, horizonH: number, nowTs: number): Promise<ShortfallWindow[]>;
  houseUsage(houseId: string, horizonH: number, nowTs: number): Promise<ForecastPoint[]>;
}
