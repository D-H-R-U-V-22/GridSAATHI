import {
  Alert,
  DemandResponseEvent,
  BackupRequest,
  PreCutNotice,
  Outage,
} from '../domain/types';
import { ActiveScenario } from '../data/mock/scenarios';

export type EventMap = {
  'alert.published': Alert;
  'dr.started': DemandResponseEvent;
  'dr.ended': { id: string };
  'storage.requested': BackupRequest;
  'storage.decided': BackupRequest;
  'storage.activated': { colonyId: string };
  'precut.sent': PreCutNotice;
  'precut.consented': PreCutNotice;
  'outage.started': Outage;
  'outage.restored': { id: string };
  'scenario.applied': ActiveScenario;
  'scenario.reset': void;
};

type Listener<K extends keyof EventMap> = (payload: EventMap[K]) => void;

class TypedEventBus {
  private listeners: { [K in keyof EventMap]?: Array<Listener<K>> } = {};

  on<K extends keyof EventMap>(event: K, listener: Listener<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<K>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = (list as Array<Listener<K>>).filter(
      (l) => l !== listener
    ) as any;
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const list = this.listeners[event];
    if (list) {
      list.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`Error in event listener for ${String(event)}:`, e);
        }
      });
    }
  }
}

export const eventBus = new TypedEventBus();
