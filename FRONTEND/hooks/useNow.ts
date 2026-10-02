import { useGridStore } from '../store/useGridStore';

export function useNow() {
  const simClock = useGridStore((s) => s.simClock);
  const lastTickTs = useGridStore((s) => s.lastTickTs);
  const diffSec = Math.max(0, Math.floor((Date.now() - lastTickTs) / 1000));

  return {
    now: simClock,
    lastUpdatedSecondsAgo: diffSec,
  };
}
