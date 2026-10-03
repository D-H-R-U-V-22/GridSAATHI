/**
 * Realtime Client Abstraction for GridSaathi
 * Connects Power House Portal and Public Colony Portal across browser tabs.
 */

export interface RealtimeMessage<T = unknown> {
  topic: string;
  payload: T;
  timestamp: string;
  sender: 'powerhouse' | 'public' | 'simulator';
}

export interface RealtimeClient {
  publish<T>(topic: string, payload: T): void;
  subscribe<T>(topic: string, handler: (payload: T) => void): () => void;
}

export class MockRealtimeClient implements RealtimeClient {
  private channel: BroadcastChannel | null = null;
  private subscribers: Map<string, Set<(payload: unknown) => void>> = new Map();
  private storageKey = 'gs.realtime.bus.v1';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('gridsaathi_realtime_bus');
        this.channel.onmessage = (event: MessageEvent<RealtimeMessage>) => {
          this.dispatch(event.data.topic, event.data.payload);
        };
      } catch {
        this.channel = null;
      }
    }

    // Fallback: window storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const msg: RealtimeMessage = JSON.parse(e.newValue);
            this.dispatch(msg.topic, msg.payload);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  publish<T>(topic: string, payload: T): void {
    const msg: RealtimeMessage<T> = {
      topic,
      payload,
      timestamp: new Date().toISOString(),
      sender: 'powerhouse',
    };

    // 1. Send to BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {
        // fallback
      }
    }

    // 2. Storage event fallback for older/restricted iframes
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(msg));
      } catch {
        // ignore
      }
    }

    // 3. Local dispatch within same window
    this.dispatch(topic, payload);
  }

  subscribe<T>(topic: string, handler: (payload: T) => void): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    const set = this.subscribers.get(topic)!;
    set.add(handler as (p: unknown) => void);

    return () => {
      set.delete(handler as (p: unknown) => void);
      if (set.size === 0) {
        this.subscribers.delete(topic);
      }
    };
  }

  private dispatch(topic: string, payload: unknown) {
    // Exact match
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(payload);
        } catch (err) {
          console.error('[RealtimeClient] Error in handler:', err);
        }
      });
    }

    // Wildcard global listeners
    const globalHandlers = this.subscribers.get('*');
    if (globalHandlers) {
      globalHandlers.forEach((h) => {
        try {
          h(payload);
        } catch (err) {
          console.error('[RealtimeClient] Error in global handler:', err);
        }
      });
    }
  }
}

export const realtimeClient: RealtimeClient = new MockRealtimeClient();
