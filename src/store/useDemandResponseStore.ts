import { create } from 'zustand';
import { DemandResponseEvent } from '../domain/types';
import { eventBus } from './eventBus';
import { INITIAL_TOPOLOGY } from '../config/topology';

interface DemandResponseState {
  events: DemandResponseEvent[];
  houseDelayedAppliances: Record<string, string[]>; // houseId -> applianceIds delayed
  startEvent: (event: Omit<DemandResponseEvent, 'id' | 'actualReductionKw' | 'participation'>) => DemandResponseEvent;
  endEvent: (id: string) => void;
  toggleHouseAppliance: (houseId: string, applianceId: string, eventId: string) => void;
  updateLiveActualReduction: (eventId: string, actualKw: number) => void;
}

const initialEvent: DemandResponseEvent = {
  id: 'dr-event-1',
  scope: { level: 'area', ids: ['area-north'] },
  startsAt: Date.now() - 15 * 60 * 1000,
  endsAt: Date.now() + 105 * 60 * 1000,
  severity: 'strong_request',
  targetReductionKw: 450,
  actualReductionKw: 310,
  avoidAppliances: ['1.5 Ton Split AC', 'Storage Geyser (25L)', 'Submersible Water Pump', 'Front Load Washing Machine'],
  message: 'Renewable intermittency peak: please postpone running ACs, geysers, and water pumps until 8:30 pm.',
  status: 'active',
  participation: {
    'colony-shanti-vihar': { houses: 32, responded: 24 },
    'colony-kisan-4': { houses: 28, responded: 19 },
    'colony-adarsh': { houses: 22, responded: 16 },
  },
};

export const useDemandResponseStore = create<DemandResponseState>((set) => ({
  events: [initialEvent],
  houseDelayedAppliances: {
    'colony-shanti-vihar-h01': ['app-geyser', 'app-wm'],
  },

  startEvent: (eventData) => {
    const eventId = `dr-${Date.now()}`;
    const participation: Record<string, { houses: number; responded: number }> = {};

    let colonies = INITIAL_TOPOLOGY.colonies;
    if (eventData.scope.level === 'colony') {
      colonies = colonies.filter((c) => eventData.scope.ids.includes(c.id));
    } else if (eventData.scope.level === 'feeder') {
      colonies = colonies.filter((c) => eventData.scope.ids.includes(c.feederId));
    } else if (eventData.scope.level === 'area') {
      colonies = colonies.filter((c) => eventData.scope.ids.includes(c.areaId));
    }

    colonies.forEach((c) => {
      participation[c.id] = { houses: c.houseCount, responded: Math.floor(c.houseCount * 0.45) };
    });

    const newEvent: DemandResponseEvent = {
      ...eventData,
      id: eventId,
      actualReductionKw: Math.round(eventData.targetReductionKw * 0.4),
      participation,
    };

    set((state) => ({
      events: [newEvent, ...state.events],
    }));

    eventBus.emit('dr.started', newEvent);
    return newEvent;
  },

  endEvent: (id) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, status: 'completed' } : e)),
    }));
    eventBus.emit('dr.ended', { id });
  },

  toggleHouseAppliance: (houseId, applianceId, eventId) => {
    set((state) => {
      const current = state.houseDelayedAppliances[houseId] || [];
      const exists = current.includes(applianceId);
      const next = exists ? current.filter((id) => id !== applianceId) : [...current, applianceId];

      // Update participation count
      const colonyId = houseId.split('-h')[0];
      const updatedEvents = state.events.map((ev) => {
        if (ev.id === eventId && ev.participation[colonyId]) {
          const delta = exists ? -1 : 1;
          const currentResponded = ev.participation[colonyId].responded;
          const newResponded = Math.max(0, Math.min(ev.participation[colonyId].houses, currentResponded + delta));
          return {
            ...ev,
            actualReductionKw: Math.min(ev.targetReductionKw * 1.1, ev.actualReductionKw + (exists ? -1.8 : 1.8)),
            participation: {
              ...ev.participation,
              [colonyId]: {
                ...ev.participation[colonyId],
                responded: newResponded,
              },
            },
          };
        }
        return ev;
      });

      return {
        houseDelayedAppliances: {
          ...state.houseDelayedAppliances,
          [houseId]: next,
        },
        events: updatedEvents,
      };
    });
  },

  updateLiveActualReduction: (eventId, actualKw) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, actualReductionKw: actualKw } : e)),
    }));
  },
}));
