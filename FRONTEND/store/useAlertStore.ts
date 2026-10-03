import { create } from 'zustand';
import { Alert, Message } from '../domain/types';
import { eventBus } from './eventBus';
import { INITIAL_TOPOLOGY } from '../config/topology';
import { realtimeClient } from '../lib/realtime/RealtimeClient';
import { HouseDeliveryState } from '../types/alert';
import { notificationService } from '../lib/notify/NotificationService';

const ALERTS_STORAGE_KEY = 'gs.alerts.v2';
const DISPATCH_STORAGE_KEY = 'gs.dispatch_log.v1';

interface AlertState {
  alerts: Alert[];
  drafts: Alert[];
  messages: Message[];
  bannerAlert: Alert | null;
  dispatchLogs: HouseDeliveryState[];
  publishAlert: (draft: Omit<Alert, 'id' | 'createdAt'>) => Alert;
  createDraft: (draft: Omit<Alert, 'id' | 'createdAt'>) => Alert;
  updateDraft: (id: string, patch: Partial<Alert>) => void;
  deleteDraft: (id: string) => void;
  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: () => void;
  clearBanner: () => void;
  resolveAlert: (alertId: string) => void;
}

const initialAlerts: Alert[] = [
  {
    id: 'alert-init-1',
    type: 'weather',
    severity: 'advisory',
    title: 'Predicted Cloud Cover: Solar Feeder Dip',
    body: 'Scattered clouds predicted between 1:30 pm and 4:00 pm. Solar output will drop by ~40%. Please plan heavy appliance use accordingly.',
    bodyHi: 'दोपहर 1:30 से 4:00 के बीच घने बादलों के कारण सौर ऊर्जा 40% घटेगी। भारी उपकरणों का उपयोग आगे बढ़ाएं।',
    scope: { level: 'powerhouse', ids: ['ph-pragati', 'area-lucknow-central'] },
    startsAt: Date.now() - 30 * 60 * 1000,
    endsAt: Date.now() + 150 * 60 * 1000,
    source: 'operator',
    status: 'active',
    channels: ['app', 'sms', 'banner'],
    createdAt: Date.now() - 35 * 60 * 1000,
    publishedAt: Date.now() - 30 * 60 * 1000,
  },
  {
    id: 'alert-init-2',
    type: 'high_load',
    severity: 'warning',
    title: 'Peak Evening Load Advisory',
    body: '11kV feeder lines are operating at 86% thermal capacity. Please set AC temperature to 25°C or higher with fans.',
    bodyHi: '11kV फीडर पर 86% लोड। कृपया एसी का तापमान 25°C या उससे ऊपर रखें।',
    scope: { level: 'powerhouse', ids: ['ph-pragati', 'area-lucknow-central'] },
    startsAt: Date.now() - 10 * 60 * 1000,
    endsAt: Date.now() + 180 * 60 * 1000,
    source: 'operator',
    status: 'active',
    channels: ['app', 'sms'],
    createdAt: Date.now() - 15 * 60 * 1000,
    publishedAt: Date.now() - 10 * 60 * 1000,
  },
];

const initialMessages: Message[] = [
  {
    id: 'msg-init-1',
    alertId: 'alert-init-1',
    colonyId: 'colony-shanti-vihar',
    text: '[GRIDSAATHI] Advisory: Solar dip expected 1:30–4:00 pm due to cloud cover. Shift washing machine & geyser usage if possible.',
    ts: Date.now() - 30 * 60 * 1000,
    read: false,
    channel: 'sms',
  },
  {
    id: 'msg-init-2',
    alertId: 'alert-init-1',
    colonyId: 'colony-kisan-4',
    text: '[GRIDSAATHI] Advisory: Solar dip expected 1:30–4:00 pm due to cloud cover. Shift washing machine & geyser usage if possible.',
    ts: Date.now() - 30 * 60 * 1000,
    read: true,
    channel: 'sms',
  },
];

function loadPersistedAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (raw) {
      const parsed: Alert[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return initialAlerts;
}

function loadPersistedLogs(): HouseDeliveryState[] {
  try {
    const raw = localStorage.getItem(DISPATCH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export const useAlertStore = create<AlertState>((set, get) => {
  const loadedAlerts = loadPersistedAlerts();
  const loadedLogs = loadPersistedLogs();

  // Listen to cross-tab realtime events
  if (typeof window !== 'undefined') {
    realtimeClient.subscribe<Alert>('gridsaathi_alert', (incomingAlert) => {
      const current = get().alerts;
      if (!current.some((a) => a.id === incomingAlert.id)) {
        const updated = [incomingAlert, ...current];
        set({
          alerts: updated,
          bannerAlert: incomingAlert.channels.includes('banner') ? incomingAlert : get().bannerAlert,
        });
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
        eventBus.emit('alert.published', incomingAlert);
      }
    });

    realtimeClient.subscribe<{ alertId: string }>('gridsaathi_alert_resolve', ({ alertId }) => {
      const updated = get().alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'resolved' as const } : a
      );
      set({ alerts: updated });
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    });
  }

  return {
    alerts: loadedAlerts,
    drafts: [],
    messages: initialMessages,
    bannerAlert: loadedAlerts.find((a) => a.status === 'active' && a.channels.includes('banner')) || null,
    dispatchLogs: loadedLogs,

    publishAlert: (draft) => {
      const alertId = `alert-${Date.now()}`;
      const newAlert: Alert = {
        ...draft,
        id: alertId,
        status: 'active',
        createdAt: Date.now(),
        publishedAt: Date.now(),
      };

      // Determine covered colonies
      let targetColonyIds: string[] = [];
      if (newAlert.scope.level === 'colony') {
        targetColonyIds = newAlert.scope.ids;
      } else if (newAlert.scope.level === 'feeder') {
        targetColonyIds = INITIAL_TOPOLOGY.colonies
          .filter((c) => newAlert.scope.ids.includes(c.feederId))
          .map((c) => c.id);
      } else if (newAlert.scope.level === 'area') {
        targetColonyIds = INITIAL_TOPOLOGY.colonies
          .filter((c) => newAlert.scope.ids.includes(c.areaId))
          .map((c) => c.id);
      } else {
        targetColonyIds = INITIAL_TOPOLOGY.colonies.map((c) => c.id);
      }

      const newMessages: Message[] = targetColonyIds.map((cid, idx) => ({
        id: `msg-${Date.now()}-${idx}`,
        alertId: newAlert.id,
        colonyId: cid,
        text: `[GRIDSAATHI] ${newAlert.title}: ${newAlert.body}`,
        ts: Date.now(),
        read: false,
        channel: 'sms',
      }));

      // Generate demo house delivery logs for dispatch table
      const sampleDeliveryLogs: HouseDeliveryState[] = targetColonyIds.slice(0, 3).flatMap((cid) => {
        const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === cid);
        return [
          {
            houseId: `h-${cid}-1`,
            houseLabel: `${colony?.name || 'Colony'} #101`,
            ownerName: 'R. K. Sharma',
            phoneMasked: '+91 98*** ***12',
            channel: newAlert.severity === 'critical' ? 'sms' : 'push',
            status: 'delivered',
            timestamp: new Date().toISOString(),
          },
          {
            houseId: `h-${cid}-2`,
            houseLabel: `${colony?.name || 'Colony'} #102`,
            ownerName: 'Priya Verma',
            phoneMasked: '+91 94*** ***88',
            channel: 'whatsapp',
            status: 'delivered',
            timestamp: new Date().toISOString(),
          },
          {
            houseId: `h-${cid}-3`,
            houseLabel: `${colony?.name || 'Colony'} #103`,
            ownerName: 'Amit Saxena',
            phoneMasked: '+91 99*** ***45',
            channel: 'telegram',
            status: 'delivered',
            timestamp: new Date().toISOString(),
          },
        ];
      });

      const updatedAlerts = [newAlert, ...get().alerts];
      const updatedLogs = [...sampleDeliveryLogs, ...get().dispatchLogs].slice(0, 100);

      set((state) => ({
        alerts: updatedAlerts,
        drafts: state.drafts.filter((d) => d.title !== draft.title),
        messages: [...newMessages, ...state.messages],
        bannerAlert: newAlert.channels.includes('banner') ? newAlert : state.bannerAlert,
        dispatchLogs: updatedLogs,
      }));

      // Broadcast across tabs via RealtimeClient
      realtimeClient.publish('gridsaathi_alert', newAlert);

      // Persist to storage
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(updatedLogs));

      eventBus.emit('alert.published', newAlert);
      return newAlert;
    },

    resolveAlert: (alertId) => {
      const updated = get().alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'resolved' as const } : a
      );
      set({
        alerts: updated,
        bannerAlert: get().bannerAlert?.id === alertId ? null : get().bannerAlert,
      });
      realtimeClient.publish('gridsaathi_alert_resolve', { alertId });
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    },

    createDraft: (draft) => {
      const newDraft: Alert = {
        ...draft,
        id: `draft-${Date.now()}`,
        status: 'draft',
        createdAt: Date.now(),
      };
      set((state) => ({ drafts: [newDraft, ...state.drafts] }));
      return newDraft;
    },

    updateDraft: (id, patch) => {
      set((state) => ({
        drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      }));
    },

    deleteDraft: (id) => {
      set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== id),
      }));
    },

    markMessageRead: (messageId) => {
      set((state) => ({
        messages: state.messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
      }));
    },

    markAllMessagesRead: () => {
      set((state) => ({
        messages: state.messages.map((m) => ({ ...m, read: true })),
      }));
    },

    clearBanner: () => {
      set({ bannerAlert: null });
    },
  };
});
