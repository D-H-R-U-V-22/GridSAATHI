export type Severity = 'info' | 'advisory' | 'warning' | 'critical';
export type SupplyStatus = 'stable' | 'watch' | 'constrained' | 'outage';
export type AlertType = 'weather' | 'high_load' | 'system' | 'maintenance' | 'demand_response' | 'storage' | 'outage';
export type NodeLevel = 'powerhouse' | 'area' | 'feeder' | 'colony' | 'house';

export interface Area {
  id: string;
  name: string;
  feederIds: string[];
}

export interface Feeder {
  id: string;
  name: string;
  areaId: string;
  capacityKw: number;
  colonyIds: string[];
}

export interface Colony {
  id: string;
  name: string;
  areaId: string;
  feederId: string;
  houseCount: number;
  batteryId?: string;
  autoConsentBackup: boolean;
}

export interface Appliance {
  id: string;
  name: string;
  category: 'cooling' | 'heating' | 'lighting' | 'cooking' | 'water' | 'entertainment' | 'cold_chain' | 'other';
  ratedKw: number;
  heavy: boolean;
  deferrable: boolean;
}

export interface House {
  id: string;
  colonyId: string;
  label: string;
  occupants: number;
  sanctionedLoadKw: number;
  appliances: Appliance[];
}

export interface Reading {
  ts: number;                 // epoch ms
  demandKw: number;
  supplyKw: number;           // grid import + local renewables + battery
  solarKw: number;
  windKw: number;
  gridImportKw: number;
  batteryKw: number;          // + discharging, - charging
  voltageV: number;           // nominal 230 single-phase
  frequencyHz: number;        // nominal 50
}

export interface ForecastPoint {
  ts: number;
  demandKw: number;
  demandP10: number;
  demandP90: number;
  solarKw: number;
  windKw: number;
  renewableKw: number;
  availableSupplyKw: number;
  shortfallKw: number;        // max(0, demand - availableSupply)
  status: SupplyStatus;
  confidence: number;         // 0..1
}

export interface ShortfallWindow {
  id: string;
  scopeLevel: NodeLevel;
  scopeId: string;
  start: number;
  end: number;
  peakShortfallKw: number;
  cause: 'low_solar' | 'low_wind' | 'evening_peak' | 'heat_demand' | 'maintenance' | 'combined';
  confidence: number;
  affectedColonyIds: string[];
}

export interface WeatherSnapshot {
  ts: number;
  cloudCoverPct: number;
  windSpeedMs: number;
  tempC: number;
  rainMm: number;
  uvIndex: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  body: string;
  bodyHi?: string;
  scope: { level: NodeLevel; ids: string[] };
  startsAt: number;
  endsAt?: number;
  source: 'auto' | 'operator';
  status: 'draft' | 'scheduled' | 'active' | 'resolved';
  channels: Array<'app' | 'sms' | 'banner'>;
  createdAt: number;
  publishedAt?: number;
}

export interface Message {
  id: string;
  alertId?: string;
  colonyId: string;
  text: string;
  ts: number;
  read: boolean;
  channel: 'sms' | 'app';
}

export interface DemandResponseEvent {
  id: string;
  scope: { level: NodeLevel; ids: string[] };
  startsAt: number;
  endsAt: number;
  severity: 'request' | 'strong_request';
  targetReductionKw: number;
  avoidAppliances: string[];
  message: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  actualReductionKw: number;
  participation: Record<string /* colonyId */, { houses: number; responded: number }>;
}

export interface Battery {
  id: string;
  colonyId: string;
  capacityKwh: number;
  socPct: number;
  healthPct: number;
  mode: 'idle' | 'charging' | 'discharging' | 'emergency';
  maxDischargeKw: number;
  circuits: string[];     // e.g. ['Emergency lighting', 'Water pumps', 'Community clinic fridge']
}

export interface BackupRequest {
  id: string;
  colonyId: string;
  requestedAt: number;
  reason: 'blackout' | 'pre_cut' | 'other';
  status: 'pending' | 'approved' | 'denied' | 'active' | 'ended';
  approvedBy?: string;
  maxMinutes?: number;
  endedAt?: number;
}

export interface PreCutNotice {
  id: string;
  colonyId: string;
  cutAt: number;
  expectedMinutes: number;
  reason: string;
  consent: 'waiting' | 'auto_consented' | 'consented' | 'declined';
  backupActivated: boolean;
}

export interface Outage {
  id: string;
  colonyId: string;
  feederId: string;
  startedAt: number;
  restoredAt?: number;
  etaAt?: number;
  cause: 'fault' | 'planned' | 'load_shedding' | 'weather' | 'unknown';
}

export interface Topology {
  powerHouse: {
    id: string;
    name: string;
    capacityKw: number;
  };
  areas: Area[];
  feeders: Feeder[];
  colonies: Colony[];
}

export type UserRole = 'operator' | 'public';
