export type Severity = 'info' | 'advisory' | 'warning' | 'critical';

export type AlertCategory =
  | 'weather'
  | 'high_load'
  | 'demand_response'
  | 'outage'
  | 'maintenance'
  | 'shared_storage'
  | 'recommendation';

export type AlertStatus = 'draft' | 'published' | 'acknowledged' | 'resolved' | 'expired';

export type AlertChannel = 'in_app' | 'push' | 'telegram' | 'whatsapp' | 'sms';

export interface GridAlert {
  id: string;
  areaId: string; // geolocation scope (e.g. area-lucknow-central)
  colonyIds?: string[]; // optional narrower targeting
  houseIds?: string[]; // optional (personal alerts)
  category: AlertCategory;
  severity: Severity;
  title: { en: string; hi: string };
  body: { en: string; hi: string };
  actions?: { en: string; hi: string }[];
  startsAt: string; // ISO, IST
  endsAt?: string; // ISO, IST
  source: 'ml_model' | 'operator' | 'weather_api' | 'system';
  confidence?: number; // 0-1 when source is ml_model
  channels: AlertChannel[];
  status: AlertStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseDeliveryState {
  houseId: string;
  houseLabel: string;
  ownerName: string;
  phoneMasked: string;
  channel: AlertChannel;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
}
