import { create } from 'zustand';
import { Battery, BackupRequest, PreCutNotice } from '../domain/types';
import { eventBus } from './eventBus';
import { INITIAL_TOPOLOGY } from '../config/topology';

export interface AuditEntry {
  id: string;
  ts: number;
  colonyId: string;
  action: string;
  actor: string;
  details: string;
}

interface StorageState {
  batteries: Record<string, Battery>;
  backupRequests: BackupRequest[];
  preCutNotices: PreCutNotice[];
  auditTrail: AuditEntry[];
  autoConsentMap: Record<string, boolean>;

  requestBackup: (colonyId: string, reason: BackupRequest['reason']) => BackupRequest;
  decideBackup: (requestId: string, decision: 'approve' | 'deny', maxMinutes?: number) => void;
  sendPreCutNotice: (notice: Omit<PreCutNotice, 'id'>) => PreCutNotice;
  respondPreCut: (noticeId: string, consent: 'consented' | 'declined') => void;
  activateEmergencyBackup: (colonyId: string) => void;
  toggleAutoConsent: (colonyId: string) => void;
  stepBatteryDischarge: (colonyId: string, dischargeKw: number, stepSec: number) => void;
}

const initialBatteries: Record<string, Battery> = {};
const initialAutoConsent: Record<string, boolean> = {};

INITIAL_TOPOLOGY.colonies.forEach((colony, idx) => {
  const batId = colony.batteryId || `bat-${colony.id}`;
  initialBatteries[colony.id] = {
    id: batId,
    colonyId: colony.id,
    capacityKwh: 120 + (idx % 3) * 40, // 120, 160, 200 kWh
    socPct: 84 - (idx % 4) * 8, // 84%, 76%, 68%, 60%
    healthPct: 96 - (idx % 3),
    mode: 'idle',
    maxDischargeKw: 45,
    circuits: [
      'Street & Stairwell Lights',
      'Community Water Pump',
      'Cold Storage & Clinic Fridge',
      'Wi-Fi & Telecom Repeater',
    ],
  };
  initialAutoConsent[colony.id] = colony.autoConsentBackup;
});

const initialRequests: BackupRequest[] = [
  {
    id: 'req-001',
    colonyId: 'colony-kisan-4',
    requestedAt: Date.now() - 10 * 60 * 1000,
    reason: 'blackout',
    status: 'pending',
  },
];

const initialPreCut: PreCutNotice[] = [
  {
    id: 'precut-001',
    colonyId: 'colony-shanti-vihar',
    cutAt: Date.now() + 45 * 60 * 1000, // in 45 minutes
    expectedMinutes: 60,
    reason: 'Substation transformer filter replacement and feeder balancing',
    consent: 'auto_consented',
    backupActivated: true,
  },
];

const initialAudit: AuditEntry[] = [
  {
    id: 'aud-01',
    ts: Date.now() - 40 * 60 * 1000,
    colonyId: 'colony-shanti-vihar',
    action: 'Pre-Cut Notice Dispatched',
    actor: 'Power House Dispatcher',
    details: 'Scheduled cut at 45 min horizon. Colony auto-consent registered.',
  },
];

export const useStorageStore = create<StorageState>((set) => ({
  batteries: initialBatteries,
  backupRequests: initialRequests,
  preCutNotices: initialPreCut,
  auditTrail: initialAudit,
  autoConsentMap: initialAutoConsent,

  requestBackup: (colonyId, reason) => {
    const newReq: BackupRequest = {
      id: `req-${Date.now()}`,
      colonyId,
      requestedAt: Date.now(),
      reason,
      status: 'pending',
    };

    set((state) => ({
      backupRequests: [newReq, ...state.backupRequests],
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          ts: Date.now(),
          colonyId,
          action: 'Emergency Backup Requested',
          actor: 'Colony RWA Committee',
          details: `Requested due to: ${reason}`,
        },
        ...state.auditTrail,
      ],
    }));

    eventBus.emit('storage.requested', newReq);
    return newReq;
  },

  decideBackup: (requestId, decision, maxMinutes = 90) => {
    set((state) => {
      let colonyId = '';
      const updatedReqs = state.backupRequests.map((req) => {
        if (req.id === requestId) {
          colonyId = req.colonyId;
          return {
            ...req,
            status: (decision === 'approve' ? 'approved' : 'denied') as BackupRequest['status'],
            approvedBy: 'Operator on Duty',
            maxMinutes: decision === 'approve' ? maxMinutes : undefined,
          };
        }
        return req;
      });

      const updatedBatteries = { ...state.batteries };
      if (decision === 'approve' && colonyId && updatedBatteries[colonyId]) {
        updatedBatteries[colonyId] = {
          ...updatedBatteries[colonyId],
          mode: 'emergency',
        };
      }

      const updatedAudit = [
        {
          id: `aud-${Date.now()}`,
          ts: Date.now(),
          colonyId,
          action: decision === 'approve' ? 'Backup Permission Granted' : 'Backup Request Denied',
          actor: 'Power House Operator',
          details: decision === 'approve' ? `Approved for up to ${maxMinutes} minutes` : 'Denied due to grid reserves',
        },
        ...state.auditTrail,
      ];

      return {
        backupRequests: updatedReqs,
        batteries: updatedBatteries,
        auditTrail: updatedAudit,
      };
    });
  },

  sendPreCutNotice: (notice) => {
    const id = `precut-${Date.now()}`;
    const autoConsented = !!INITIAL_TOPOLOGY.colonies.find((c) => c.id === notice.colonyId)?.autoConsentBackup;
    const newNotice: PreCutNotice = {
      ...notice,
      id,
      consent: autoConsented ? 'auto_consented' : 'waiting',
      backupActivated: autoConsented,
    };

    set((state) => {
      const updatedBatteries = { ...state.batteries };
      if (autoConsented && updatedBatteries[notice.colonyId]) {
        updatedBatteries[notice.colonyId] = {
          ...updatedBatteries[notice.colonyId],
          mode: 'emergency',
        };
      }

      return {
        preCutNotices: [newNotice, ...state.preCutNotices],
        batteries: updatedBatteries,
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            ts: Date.now(),
            colonyId: notice.colonyId,
            action: 'Pre-Cut Notice Dispatched',
            actor: 'Power House Dispatcher',
            details: `Cut scheduled in ${Math.round((notice.cutAt - Date.now()) / 60000)}m. Reason: ${notice.reason}`,
          },
          ...state.auditTrail,
        ],
      };
    });

    eventBus.emit('precut.sent', newNotice);
    return newNotice;
  },

  respondPreCut: (noticeId, consent) => {
    set((state) => {
      let colonyId = '';
      const updated = state.preCutNotices.map((n) => {
        if (n.id === noticeId) {
          colonyId = n.colonyId;
          return {
            ...n,
            consent,
            backupActivated: consent === 'consented',
          };
        }
        return n;
      });

      const updatedBatteries = { ...state.batteries };
      if (consent === 'consented' && colonyId && updatedBatteries[colonyId]) {
        updatedBatteries[colonyId] = {
          ...updatedBatteries[colonyId],
          mode: 'emergency',
        };
      }

      return {
        preCutNotices: updated,
        batteries: updatedBatteries,
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            ts: Date.now(),
            colonyId,
            action: consent === 'consented' ? 'Colony Consented to Pre-Cut Backup' : 'Colony Declined Backup',
            actor: 'Colony Committee',
            details: `Consent status: ${consent}`,
          },
          ...state.auditTrail,
        ],
      };
    });
  },

  activateEmergencyBackup: (colonyId) => {
    set((state) => {
      const bat = state.batteries[colonyId];
      if (!bat) return state;

      return {
        batteries: {
          ...state.batteries,
          [colonyId]: {
            ...bat,
            mode: 'emergency',
          },
        },
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            ts: Date.now(),
            colonyId,
            action: 'Emergency Backup Manually Activated',
            actor: 'Power House Dispatcher',
            details: 'Battery shifted to emergency discharge mode for vital circuits.',
          },
          ...state.auditTrail,
        ],
      };
    });
    eventBus.emit('storage.activated', { colonyId });
  },

  toggleAutoConsent: (colonyId) => {
    set((state) => ({
      autoConsentMap: {
        ...state.autoConsentMap,
        [colonyId]: !state.autoConsentMap[colonyId],
      },
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          ts: Date.now(),
          colonyId,
          action: 'Auto-Consent Preference Updated',
          actor: 'Colony RWA Administrator',
          details: `Auto-consent is now ${!state.autoConsentMap[colonyId] ? 'ENABLED' : 'DISABLED'}`,
        },
        ...state.auditTrail,
      ],
    }));
  },

  stepBatteryDischarge: (colonyId, dischargeKw, stepSec) => {
    set((state) => {
      const bat = state.batteries[colonyId];
      if (!bat || bat.mode !== 'emergency' && bat.mode !== 'discharging') return state;

      const energyUsedKwh = (dischargeKw * (stepSec / 3600));
      const deltaPct = (energyUsedKwh / bat.capacityKwh) * 100;
      const nextSoc = Math.max(5, bat.socPct - deltaPct);

      return {
        batteries: {
          ...state.batteries,
          [colonyId]: {
            ...bat,
            socPct: parseFloat(nextSoc.toFixed(1)),
          },
        },
      };
    });
  },
}));
