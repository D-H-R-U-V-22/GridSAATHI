import React, { useState } from 'react';
import { SupplyStatus } from '../../domain/types';
import { formatTime12h } from '../../lib/time';

export interface RibbonSegment {
  ts: number;
  status: SupplyStatus;
  shortfallKw?: number;
}

interface SupplyRibbonProps {
  segments: RibbonSegment[];
  nowTs: number;
  variant?: 'powerhouse' | 'public';
  onSegmentClick?: (segment: RibbonSegment) => void;
  className?: string;
}

export const SupplyRibbon: React.FC<SupplyRibbonProps> = ({
  segments,
  nowTs,
  variant = 'powerhouse',
  onSegmentClick,
  className = '',
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<RibbonSegment | null>(null);

  if (!segments || segments.length === 0) {
    return <div className="h-9 bg-[#EAF7EE] rounded-[6px] animate-pulse" />;
  }

  const startTs = segments[0].ts;
  const endTs = segments[segments.length - 1].ts;
  const duration = Math.max(1, endTs - startTs);
  const nowPosPct = Math.max(0, Math.min(100, ((nowTs - startTs) / duration) * 100));

  // Determine summary sentence for public view
  let publicSentence = 'Power is expected to remain steady for the next 24 hours.';
  const hasOutage = segments.some((s) => s.status === 'outage');
  const constrainedSeg = segments.find((s) => s.status === 'constrained');
  const watchSeg = segments.find((s) => s.status === 'watch');

  if (hasOutage) {
    publicSentence = 'Outage ongoing in parts of the network — emergency restoration active.';
  } else if (constrainedSeg) {
    const startStr = formatTime12h(constrainedSeg.ts);
    publicSentence = `Supply is expected to be tight around ${startStr} — please postpone running heavy appliances.`;
  } else if (watchSeg) {
    const startStr = formatTime12h(watchSeg.ts);
    publicSentence = `Supply may dip around ${startStr} due to lower renewable generation.`;
  }

  const heightClass = variant === 'powerhouse' ? 'h-14' : 'h-9';

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {/* Ribbon Bar Container */}
      <div
        className={`relative w-full ${heightClass} rounded-[6px] overflow-hidden border border-[#DDE9E0] flex bg-white select-none`}
        role="region"
        aria-label="24-Hour Supply Ribbon"
      >
        {/* SVG Patterns for Color-blind Accessibility */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <pattern id="pattern-watch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#B07B0E" strokeWidth="1.5" strokeOpacity="0.4" />
            </pattern>
            <pattern id="pattern-constrained" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0,6 l6,-6 M-1,1 l2,-2 M5,7 l2,-2" stroke="#B34E14" strokeWidth="2" strokeOpacity="0.5" />
            </pattern>
            <pattern id="pattern-outage" width="6" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="6" y2="6" stroke="#9E2824" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="6" y1="0" x2="0" y2="6" stroke="#9E2824" strokeWidth="2" strokeOpacity="0.6" />
            </pattern>
          </defs>
        </svg>

        {/* Segments */}
        {segments.map((seg, idx) => {
          const bgMap = {
            stable: 'bg-[#27A163]',
            watch: 'bg-[#E9A820]',
            constrained: 'bg-[#E2702B]',
            outage: 'bg-[#C73E3A]',
          }[seg.status];

          return (
            <div
              key={idx}
              onClick={() => onSegmentClick && onSegmentClick(seg)}
              onMouseEnter={() => setHoveredSegment(seg)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`flex-1 relative transition-opacity hover:opacity-90 ${
                onSegmentClick ? 'cursor-pointer' : ''
              } ${bgMap}`}
            >
              {seg.status === 'watch' && (
                <div className="absolute inset-0 bg-[url(#pattern-watch)] pointer-events-none" />
              )}
              {seg.status === 'constrained' && (
                <div className="absolute inset-0 bg-[url(#pattern-constrained)] pointer-events-none" />
              )}
              {seg.status === 'outage' && (
                <div className="absolute inset-0 bg-[url(#pattern-outage)] pointer-events-none" />
              )}

              {/* In Power House variant: show faint shortfall area if any */}
              {variant === 'powerhouse' && seg.shortfallKw && seg.shortfallKw > 0 ? (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-black/25 pointer-events-none"
                  style={{
                    height: `${Math.min(100, (seg.shortfallKw / 800) * 100)}%`,
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* "Now" Marker line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#07261C] z-10 pointer-events-none shadow-sm"
          style={{ left: `${nowPosPct}%` }}
        >
          <div className="absolute -top-5 -translate-x-1/2 bg-[#0C3B2B] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-[3px] tabular-nums whitespace-nowrap">
            Now
          </div>
        </div>
      </div>

      {/* Hover Tooltip Details or Public Description */}
      {variant === 'powerhouse' ? (
        <div className="flex items-center justify-between text-xs text-[#5B6B62] pt-0.5">
          <div className="flex items-center gap-4">
            <span className="tabular-nums font-medium text-[#16241D]">
              {hoveredSegment ? formatTime12h(hoveredSegment.ts) : 'Hover a segment to inspect status'}
            </span>
            {hoveredSegment && (
              <span className="capitalize font-semibold text-[#0C3B2B]">
                Status: {hoveredSegment.status}
                {hoveredSegment.shortfallKw && hoveredSegment.shortfallKw > 0
                  ? ` (Shortfall: ${Math.round(hoveredSegment.shortfallKw)} kW)`
                  : ''}
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#27A163]" /> Stable
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E9A820]" /> Watch
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2702B]" /> Constrained
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C73E3A]" /> Outage
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#5B6B62] leading-relaxed pt-0.5">{publicSentence}</p>
      )}
    </div>
  );
};
