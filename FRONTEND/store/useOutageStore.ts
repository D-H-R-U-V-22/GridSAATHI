import { create } from 'zustand';
import { Outage } from '../domain/types';
import { eventBus } from './eventBus';

interface OutageState {
  activeOutages: Outage[];
  pastOutages: Outage[];
  triggerOutage: (colonyId: string, feederId: string, cause: Outage['cause'], etaMinutes?: number) => Outage;
  restoreOutage: (outageId: string) => void;
  getOutageForColony: (colonyId: string) => Outage | undefined;
}

const initialPastOutages: Outage[] = [
  {
    id: 'out-past-1',
    colonyId: 'colony-shanti-vihar',
    feederId: 'feeder-shanti',
    startedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    restoredAt: Date.now() - 4 * 24 * 60 * 60 * 1000 + 42 * 60 * 1000,
    cause: 'fault',
  },
  {
    id: 'out-past-2',
    colonyId: 'colony-shanti-vihar',
    feederId: 'feeder-shanti',
    startedAt: Date.now() - 11 * 24 * 60 * 60 * 1000,
    restoredAt: Date.now() - 11 * 24 * 60 * 60 * 1000 + 58 * 60 * 1000,
    cause: 'weather',
  },
  {
    id: 'out-past-3',
    colonyId: 'colony-kisan-4',
    feederId: 'feeder-kisan',
    startedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    restoredAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000,
    cause: 'load_shedding',
  },
];

export const useOutageStore = create<OutageState>((set, get) => ({
  activeOutages: [],
  pastOutages: initialPastOutages,

  triggerOutage: (colonyId, feederId, cause, etaMinutes = 45) => {
    const id = `outage-${Date.now()}`;
    const newOutage: Outage = {
      id,
      colonyId,
      feederId,
      startedAt: Date.now(),
      etaAt: Date.now() + etaMinutes * 60 * 1000,
      cause,
    };

    set((state) => ({
      activeOutages: [newOutage, ...state.activeOutages.filter((o) => o.colonyId !== colonyId)],
    }));

    eventBus.emit('outage.started', newOutage);
    return newOutage;
  },

  restoreOutage: (outageId) => {
    set((state) => {
      const target = state.activeOutages.find((o) => o.id === outageId);
      if (!target) return state;

      const restored: Outage = {
        ...target,
        restoredAt: Date.now(),
      };

      return {
        activeOutages: state.activeOutages.filter((o) => o.id !== outageId),
        pastOutages: [restored, ...state.pastOutages],
      };
    });

    eventBus.emit('outage.restored', { id: outageId });
  },

  getOutageForColony: (colonyId) => {
    return get().activeOutages.find((o) => o.colonyId === colonyId);
  },
}));
