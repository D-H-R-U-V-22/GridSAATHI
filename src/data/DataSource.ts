import {
  Topology,
  Alert,
  DemandResponseEvent,
  BackupRequest,
  PreCutNotice,
} from '../domain/types';

export type Topic =
  | 'grid.readings'
  | 'grid.status'
  | 'forecast.updated'
  | 'weather.updated'
  | 'alerts.created'
  | 'dr.updated'
  | 'storage.updated'
  | 'outage.updated';

export interface DataSource {
  getTopology(): Promise<Topology>;
  subscribe<T>(topic: Topic, cb: (payload: T) => void): () => void;
  publishAlert(a: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert>;
  startDemandResponse(e: Omit<DemandResponseEvent, 'id'>): Promise<DemandResponseEvent>;
  requestBackup(colonyId: string, reason: BackupRequest['reason']): Promise<BackupRequest>;
  decideBackup(id: string, decision: 'approve' | 'deny', maxMinutes?: number): Promise<BackupRequest>;
  sendPreCutNotice(n: Omit<PreCutNotice, 'id'>): Promise<PreCutNotice>;
  respondPreCut(id: string, consent: 'consented' | 'declined'): Promise<PreCutNotice>;
  activateBackup(colonyId: string): Promise<void>;
}
