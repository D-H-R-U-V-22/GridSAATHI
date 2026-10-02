import { create } from 'zustand';
import { Alert, Message } from '../domain/types';
import { eventBus } from './eventBus';
import { INITIAL_TOPOLOGY } from '../config/topology';

interface AlertState {
  alerts: Alert[];
  drafts: Alert[];
  messages: Message[];
  bannerAlert: Alert | null;
  publishAlert: (draft: Omit<Alert, 'id' | 'createdAt'>) => Alert;
  createDraft: (draft: Omit<Alert, 'id' | 'createdAt'>) => Alert;
  updateDraft: (id: string, patch: Partial<Alert>) => void;
  deleteDraft: (id: string) => void;
  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: () => void;
  clearBanner: () => void;
}

const initialAlerts: Alert[] = [
  {
    id: 'alert-init-1',
    type: 'weather',
    severity: 'advisory',
    title: 'Predicted Cloud Cover: Solar Feeder Dip',
    body: 'Scattered clouds predicted between 1:30 pm and 4:00 pm. Solar output will drop by ~40%. Please plan heavy appliance use accordingly.',
    bodyHi: 'दोपहर 1:30 से 4:00 के बीच घने बादलों के कारण सौर ऊर्जा 40% घटेगी।',
    scope: { level: 'powerhouse', ids: ['ph-pragati'] },
    startsAt: Date.now() - 30 * 60 * 1000,
    endsAt: Date.now() + 150 * 60 * 1000,
    source: 'operator',
    status: 'active',
    channels: ['app', 'sms', 'banner'],
    createdAt: Date.now() - 35 * 60 * 1000,
    publishedAt: Date.now() - 30 * 60 * 1000,
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

export const useAlertStore = create<AlertState>((set) => ({
  alerts: initialAlerts,
  drafts: [],
  messages: initialMessages,
  bannerAlert: null,

  publishAlert: (draft) => {
    const alertId = `alert-${Date.now()}`;
    const newAlert: Alert = {
      ...draft,
      id: alertId,
      status: 'active',
      createdAt: Date.now(),
      publishedAt: Date.now(),
    };

    // Determine which colonies are covered
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

    set((state) => ({
      alerts: [newAlert, ...state.alerts],
      drafts: state.drafts.filter((d) => d.title !== draft.title),
      messages: [...newMessages, ...state.messages],
      bannerAlert: newAlert.channels.includes('banner') ? newAlert : state.bannerAlert,
    }));

    eventBus.emit('alert.published', newAlert);
    return newAlert;
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
}));
