import { DataSource, Topic } from '../DataSource';
import {
  Topology,
  Alert,
  DemandResponseEvent,
  BackupRequest,
  PreCutNotice,
} from '../../domain/types';
import { INITIAL_TOPOLOGY } from '../../config/topology';
import { useAlertStore } from '../../store/useAlertStore';
import { useDemandResponseStore } from '../../store/useDemandResponseStore';
import { useStorageStore } from '../../store/useStorageStore';
import { eventBus, EventMap } from '../../store/eventBus';

export class MockDataSource implements DataSource {
  async getTopology(): Promise<Topology> {
    return INITIAL_TOPOLOGY;
  }

  subscribe<T>(topic: Topic, cb: (payload: T) => void): () => void {
    const unsubscribers: Array<() => void> = [];

    if (topic === 'alerts.created') {
      const unsub = eventBus.on('alert.published', (alert) => cb(alert as unknown as T));
      unsubscribers.push(unsub);
    } else if (topic === 'dr.updated') {
      const unsub1 = eventBus.on('dr.started', (dr) => cb(dr as unknown as T));
      const unsub2 = eventBus.on('dr.ended', (res) => cb(res as unknown as T));
      unsubscribers.push(unsub1, unsub2);
    } else if (topic === 'storage.updated') {
      const unsub1 = eventBus.on('storage.requested', (req) => cb(req as unknown as T));
      const unsub2 = eventBus.on('storage.activated', (act) => cb(act as unknown as T));
      unsubscribers.push(unsub1, unsub2);
    } else if (topic === 'outage.updated') {
      const unsub1 = eventBus.on('outage.started', (out) => cb(out as unknown as T));
      const unsub2 = eventBus.on('outage.restored', (res) => cb(res as unknown as T));
      unsubscribers.push(unsub1, unsub2);
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }

  async publishAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    return useAlertStore.getState().publishAlert(alertData);
  }

  async startDemandResponse(
    drData: Omit<DemandResponseEvent, 'id'>
  ): Promise<DemandResponseEvent> {
    return useDemandResponseStore.getState().startEvent(drData);
  }

  async requestBackup(colonyId: string, reason: BackupRequest['reason']): Promise<BackupRequest> {
    return useStorageStore.getState().requestBackup(colonyId, reason);
  }

  async decideBackup(
    id: string,
    decision: 'approve' | 'deny',
    maxMinutes?: number
  ): Promise<BackupRequest> {
    useStorageStore.getState().decideBackup(id, decision, maxMinutes);
    const updated = useStorageStore.getState().backupRequests.find((r) => r.id === id);
    return updated!;
  }

  async sendPreCutNotice(noticeData: Omit<PreCutNotice, 'id'>): Promise<PreCutNotice> {
    return useStorageStore.getState().sendPreCutNotice(noticeData);
  }

  async respondPreCut(id: string, consent: 'consented' | 'declined'): Promise<PreCutNotice> {
    useStorageStore.getState().respondPreCut(id, consent);
    const updated = useStorageStore.getState().preCutNotices.find((n) => n.id === id);
    return updated!;
  }

  async activateBackup(colonyId: string): Promise<void> {
    useStorageStore.getState().activateEmergencyBackup(colonyId);
  }
}

export const dataSource: DataSource = new MockDataSource();
