import { create } from 'zustand';
import {
  ALL_AREAS,
  PowerHouseAreaEntity,
  GeoResolutionResult,
  resolveCoordinatesToArea,
  getBrowserPosition,
} from '../lib/geo/locate';

const STORAGE_KEY = 'gs.location.v1';

interface LocationState {
  selectedAreaId: string;
  selectedColonyId: string;
  detectedLocation: GeoResolutionResult | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isDetecting: boolean;
  isManual: boolean;
  isModalOpen: boolean;

  // Computed getters
  currentArea: PowerHouseAreaEntity;
  currentColony: PowerHouseAreaEntity['colonies'][0];

  // Actions
  setModalOpen: (open: boolean) => void;
  detectLocation: () => Promise<boolean>;
  setAreaId: (areaId: string) => void;
  setColonyId: (colonyId: string) => void;
  setManualSelection: (areaId: string, colonyId: string) => void;
}

function loadPersistedLocation(): { areaId: string; colonyId: string; isManual: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.areaId && ALL_AREAS.some((a) => a.id === parsed.areaId)) {
        const area = ALL_AREAS.find((a) => a.id === parsed.areaId)!;
        const validColony = area.colonies.some((c) => c.id === parsed.colonyId)
          ? parsed.colonyId
          : area.colonies[0]?.id || 'colony-shanti-vihar';
        return { areaId: parsed.areaId, colonyId: validColony, isManual: !!parsed.isManual };
      }
    }
  } catch {
    // ignore
  }
  // Default to Lucknow Central (Pragati Substation)
  return {
    areaId: ALL_AREAS[0].id,
    colonyId: ALL_AREAS[0].colonies[0].id,
    isManual: false,
  };
}

const initial = loadPersistedLocation();

export const useLocationStore = create<LocationState>((set, get) => ({
  selectedAreaId: initial.areaId,
  selectedColonyId: initial.colonyId,
  detectedLocation: null,
  permissionStatus: 'prompt',
  isDetecting: false,
  isManual: initial.isManual,
  isModalOpen: false,

  get currentArea() {
    const area = ALL_AREAS.find((a) => a.id === get().selectedAreaId);
    return area || ALL_AREAS[0];
  },

  get currentColony() {
    const area = get().currentArea;
    const colony = area.colonies.find((c) => c.id === get().selectedColonyId);
    return colony || area.colonies[0];
  },

  setModalOpen: (open: boolean) => set({ isModalOpen: open }),

  detectLocation: async () => {
    set({ isDetecting: true });
    try {
      const coords = await getBrowserPosition();
      const res = await resolveCoordinatesToArea(coords.lat, coords.lng);

      set({
        detectedLocation: res,
        selectedAreaId: res.area.id,
        selectedColonyId: res.colony.id,
        permissionStatus: 'granted',
        isDetecting: false,
        isManual: false,
      });

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          areaId: res.area.id,
          colonyId: res.colony.id,
          isManual: false,
        })
      );
      return true;
    } catch {
      set({
        permissionStatus: 'denied',
        isDetecting: false,
      });
      return false;
    }
  },

  setAreaId: (areaId: string) => {
    const area = ALL_AREAS.find((a) => a.id === areaId) || ALL_AREAS[0];
    const colonyId = area.colonies[0]?.id || '';
    set({
      selectedAreaId: area.id,
      selectedColonyId: colonyId,
      isManual: true,
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ areaId: area.id, colonyId, isManual: true })
    );
  },

  setColonyId: (colonyId: string) => {
    const { selectedAreaId } = get();
    set({ selectedColonyId: colonyId, isManual: true });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ areaId: selectedAreaId, colonyId, isManual: true })
    );
  },

  setManualSelection: (areaId: string, colonyId: string) => {
    set({
      selectedAreaId: areaId,
      selectedColonyId: colonyId,
      isManual: true,
      isModalOpen: false,
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ areaId, colonyId, isManual: true })
    );
  },
}));
