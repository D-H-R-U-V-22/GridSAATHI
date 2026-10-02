import { create } from 'zustand';
import { Topology, Reading, SupplyStatus } from '../domain/types';
import { INITIAL_TOPOLOGY } from '../config/topology';

export interface GridState {
  topology: Topology;
  powerHouseReading: Reading;
  feederReadings: Record<string, Reading>;
  colonyReadings: Record<string, Reading>;
  history: Reading[]; // power house rolling history for live chart
  overallStatus: SupplyStatus;
  feederStatuses: Record<string, SupplyStatus>;
  colonyStatuses: Record<string, SupplyStatus>;
  simClock: number;
  simSpeed: number; // 1, 10, 60
  lastTickTs: number;
  feederSoftLimits: Record<string, number>; // soft limit kW
  
  // Actions
  setSimSpeed: (speed: number) => void;
  updateTick: (payload: {
    simClock: number;
    powerHouseReading: Reading;
    feederReadings: Record<string, Reading>;
    colonyReadings: Record<string, Reading>;
    overallStatus: SupplyStatus;
    feederStatuses: Record<string, SupplyStatus>;
    colonyStatuses: Record<string, SupplyStatus>;
  }) => void;
  setFeederSoftLimit: (feederId: string, limitKw: number) => void;
}

const initialReading: Reading = {
  ts: Date.now(),
  demandKw: 7240,
  supplyKw: 7240,
  solarKw: 2480,
  windKw: 1820,
  gridImportKw: 2940,
  batteryKw: 0,
  voltageV: 230.2,
  frequencyHz: 50.01,
};

export const useGridStore = create<GridState>((set) => ({
  topology: INITIAL_TOPOLOGY,
  powerHouseReading: initialReading,
  feederReadings: {},
  colonyReadings: {},
  history: [initialReading],
  overallStatus: 'stable',
  feederStatuses: {},
  colonyStatuses: {},
  simClock: Date.now(),
  simSpeed: 1,
  lastTickTs: Date.now(),
  feederSoftLimits: {
    'feeder-kisan': 2100,
    'feeder-shanti': 1950,
    'feeder-mayur': 2300,
    'feeder-nehru': 1900,
  },

  setSimSpeed: (simSpeed) => set({ simSpeed }),

  updateTick: (payload) =>
    set((state) => {
      // Append reading to history, keeping last 30
      const nextHistory = [...state.history, payload.powerHouseReading].slice(-30);
      return {
        simClock: payload.simClock,
        lastTickTs: Date.now(),
        powerHouseReading: payload.powerHouseReading,
        feederReadings: payload.feederReadings,
        colonyReadings: payload.colonyReadings,
        overallStatus: payload.overallStatus,
        feederStatuses: payload.feederStatuses,
        colonyStatuses: payload.colonyStatuses,
        history: nextHistory,
      };
    }),

  setFeederSoftLimit: (feederId, limitKw) =>
    set((state) => ({
      feederSoftLimits: {
        ...state.feederSoftLimits,
        [feederId]: limitKw,
      },
    })),
}));
