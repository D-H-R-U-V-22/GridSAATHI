import React from 'react';
import { useNow } from '../../hooks/useNow';

export const LastUpdated: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lastUpdatedSecondsAgo } = useNow();

  return (
    <div className={`flex items-center gap-2 text-xs text-[#5B6B62] select-none ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27A163] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27A163]" />
      </span>
      <span className="tabular-nums">
        Last updated {lastUpdatedSecondsAgo}s ago
      </span>
    </div>
  );
};
