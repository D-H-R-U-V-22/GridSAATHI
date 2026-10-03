import { create } from 'zustand';
import { UserRole } from '../domain/types';
import { Language } from '../config/i18n';

interface SessionState {
  role: UserRole;
  isPreviewMode: boolean;
  selectedAreaId: string;
  selectedFeederId: string;
  selectedColonyId: string;
  selectedHouseId: string;
  language: Language;
  hasConsentedInSession: boolean;
  setRole: (role: UserRole) => void;
  setPreviewMode: (preview: boolean) => void;
  setSelectedAreaId: (id: string) => void;
  setSelectedFeederId: (id: string) => void;
  setSelectedColonyId: (id: string) => void;
  setSelectedHouseId: (id: string) => void;
  setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = 'gridsaathi_session_v1';

function loadPersistedSession(): Partial<SessionState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore storage issues
  }
  return {};
}

function saveSession(state: Partial<SessionState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore
  }
}

export const useSessionStore = create<SessionState>((set) => {
  const persisted = loadPersistedSession();

  return {
    role: persisted.role || 'operator',
    isPreviewMode: false,
    selectedAreaId: persisted.selectedAreaId || 'area-north',
    selectedFeederId: persisted.selectedFeederId || 'feeder-shanti',
    selectedColonyId: persisted.selectedColonyId || 'colony-shanti-vihar',
    selectedHouseId: persisted.selectedHouseId || 'colony-shanti-vihar-h01',
    language: persisted.language || 'en',
    hasConsentedInSession: false,

    setRole: (role) =>
      set((state) => {
        const next = { ...state, role };
        saveSession({
          role,
          selectedAreaId: next.selectedAreaId,
          selectedFeederId: next.selectedFeederId,
          selectedColonyId: next.selectedColonyId,
          selectedHouseId: next.selectedHouseId,
          language: next.language,
        });
        return next;
      }),

    setPreviewMode: (isPreviewMode) => set({ isPreviewMode }),

    setSelectedAreaId: (selectedAreaId) =>
      set((state) => {
        const next = { ...state, selectedAreaId };
        saveSession(next);
        return next;
      }),

    setSelectedFeederId: (selectedFeederId) =>
      set((state) => {
        const next = { ...state, selectedFeederId };
        saveSession(next);
        return next;
      }),

    setSelectedColonyId: (selectedColonyId) =>
      set((state) => {
        const next = { ...state, selectedColonyId, selectedHouseId: `${selectedColonyId}-h01` };
        saveSession(next);
        return next;
      }),

    setSelectedHouseId: (selectedHouseId) =>
      set((state) => {
        const next = { ...state, selectedHouseId };
        saveSession(next);
        return next;
      }),

    setLanguage: (language) =>
      set((state) => {
        const next = { ...state, language };
        saveSession(next);
        return next;
      }),
  };
});
