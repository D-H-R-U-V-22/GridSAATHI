import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatPower } from '../../lib/format';
import { formatTime12h } from '../../lib/time';

export interface ChartDataPoint {
  ts: number;
  timeLabel: string;
  isForecast: boolean;
  demandKw: number;
  supplyKw: number;
  renewableKw: number;
  solarKw?: number;
  windKw?: number;
  demandP10?: number;
  demandP90?: number;
  shortfallKw?: number;
}

interface LiveAreaChartProps {
  data: ChartDataPoint[];
  nowTs: number;
  height?: number;
  summaryText?: string;
}

export const LiveAreaChart: React.FC<LiveAreaChartProps> = ({
  data,
  nowTs,
  height = 280,
  summaryText,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center bg-[#F5FAF6] rounded-[12px] border border-[#DDE9E0]">
        <span className="text-xs text-[#5B6B62]">Collecting telemetry readings...</span>
      </div>
    );
  }

  const nowItem = data.find((d) => Math.abs(d.ts - nowTs) < 8 * 60 * 1000) || data[Math.floor(data.length / 2)];
  const nowLabel = nowItem ? nowItem.timeLabel : undefined;

  // Split data into past and forecast for solid vs dashed rendering
  const chartData = data.map((d) => ({
    ...d,
    actualDemand: d.isForecast ? null : d.demandKw,
    forecastDemand: d.isForecast ? d.demandKw : null,
    actualSupply: d.isForecast ? null : d.supplyKw,
    forecastSupply: d.isForecast ? d.supplyKw : null,
  }));

  // Auto-generate summary if not provided
  let calculatedSummary = summaryText;
  if (!calculatedSummary) {
    const peak = [...data].sort((a, b) => b.demandKw - a.demandKw)[0];
    const peakTime = peak ? formatTime12h(peak.ts) : 'evening';
    const peakKw = peak ? formatPower(peak.demandKw) : '';
    calculatedSummary = `Demand peaks at ${peakKw} around ${peakTime}. Renewable generation remains the primary balancing factor.`;
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div style={{ width: '100%', height }} className="select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="renewFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27A163" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#27A163" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="shortfallFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C73E3A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#C73E3A" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines only */}
            <XAxis
              dataKey="timeLabel"
              tickLine={false}
              axisLine={{ stroke: '#DDE9E0' }}
              tick={{ fill: '#5B6B62', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#5B6B62', fontSize: 11 }}
              tickFormatter={(v) => formatPower(v, 0)}
              domain={['auto', 'auto']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="bg-white border border-[#DDE9E0] p-3 rounded-[10px] shadow-floating text-xs">
                      <div className="font-semibold text-[#0C3B2B] mb-1.5 flex items-center justify-between gap-4">
                        <span>{formatTime12h(pt.ts)}</span>
                        {pt.isForecast && (
                          <span className="text-[10px] bg-[#EAF7EE] text-[#13724A] px-1 rounded">Forecast</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 tabular-nums">
                        <div className="flex items-center justify-between gap-4 text-[#0C3B2B]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#0C3B2B]" /> Demand:
                          </span>
                          <span className="font-semibold">{formatPower(pt.demandKw)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[#13724A]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#27A163]" /> Supply:
                          </span>
                          <span className="font-semibold">{formatPower(pt.supplyKw)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[#1B93A1]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#1B93A1]" /> Renewables:
                          </span>
                          <span className="font-medium">{formatPower(pt.renewableKw)}</span>
                        </div>
                        {pt.shortfallKw && pt.shortfallKw > 0 ? (
                          <div className="flex items-center justify-between gap-4 text-[#9E2824] pt-1 border-t border-[#DDE9E0]">
                            <span className="font-semibold">Shortfall:</span>
                            <span className="font-bold">{formatPower(pt.shortfallKw)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Now line */}
            {nowLabel && (
              <ReferenceLine
                x={nowLabel}
                stroke="#07261C"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: 'Now',
                  position: 'insideTopLeft',
                  fill: '#07261C',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Renewable Area fill */}
            <Area
              type="monotone"
              dataKey="renewableKw"
              stroke="#27A163"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#renewFill)"
              isAnimationActive={false}
            />

            {/* Actual Solid Demand */}
            <Line
              type="monotone"
              dataKey="actualDemand"
              stroke="#0C3B2B"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Forecast Dashed Demand */}
            <Line
              type="monotone"
              dataKey="forecastDemand"
              stroke="#0C3B2B"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />

            {/* Supply Line */}
            <Line
              type="monotone"
              dataKey="actualSupply"
              stroke="#27A163"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="forecastSupply"
              stroke="#27A163"
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-[#5B6B62] leading-relaxed italic border-t border-[#DDE9E0]/60 pt-1.5">
        {calculatedSummary}
      </p>
    </div>
  );
};
