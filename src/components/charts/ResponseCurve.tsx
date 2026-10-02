import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatPower } from '../../lib/format';

interface ResponseCurveProps {
  targetReductionKw: number;
  actualReductionKw: number;
  height?: number;
}

export const ResponseCurve: React.FC<ResponseCurveProps> = ({
  targetReductionKw,
  actualReductionKw,
  height = 200,
}) => {
  // Generate 8 time sample points leading up to now
  const points = [
    { t: '-30m', actual: Math.round(targetReductionKw * 0.15) },
    { t: '-20m', actual: Math.round(targetReductionKw * 0.38) },
    { t: '-15m', actual: Math.round(targetReductionKw * 0.52) },
    { t: '-10m', actual: Math.round(targetReductionKw * 0.65) },
    { t: '-5m', actual: Math.round(actualReductionKw * 0.85) },
    { t: 'Now', actual: Math.round(actualReductionKw) },
  ];

  return (
    <div className="w-full flex flex-col gap-2">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="drFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27A163" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#27A163" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tickLine={false} tick={{ fill: '#5B6B62', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#5B6B62', fontSize: 11 }}
              tickFormatter={(v) => formatPower(v, 0)}
              domain={[0, Math.max(targetReductionKw * 1.25, actualReductionKw * 1.2)]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#DDE9E0] p-2 rounded-[8px] shadow-floating text-xs">
                      <div className="text-[#5B6B62]">{pt.t}</div>
                      <div className="font-semibold text-[#13724A]">
                        Shifted: {formatPower(pt.actual)}
                      </div>
                      <div className="text-[#5B6B62]">
                        Target: {formatPower(targetReductionKw)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={targetReductionKw}
              stroke="#E2702B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Target: ${formatPower(targetReductionKw)}`,
                position: 'top',
                fill: '#B34E14',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#27A163"
              strokeWidth={2}
              fill="url(#drFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-xs text-[#5B6B62] pt-1 border-t border-[#DDE9E0]/60">
        <span>Current Reduction: <strong className="text-[#13724A] tabular-nums font-semibold">{formatPower(actualReductionKw)}</strong></span>
        <span>Target: <strong className="text-[#B34E14] tabular-nums font-semibold">{formatPower(targetReductionKw)}</strong></span>
        <span>Achievement: <strong className="text-[#0C3B2B] tabular-nums font-semibold">{Math.round((actualReductionKw / Math.max(1, targetReductionKw)) * 100)}%</strong></span>
      </div>
    </div>
  );
};
