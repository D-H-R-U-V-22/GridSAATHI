import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface BreakdownSlice {
  name: string;
  valueKw: number;
  color: string;
}

interface DonutBreakdownProps {
  slices: BreakdownSlice[];
  totalKw: number;
  height?: number;
}

export const DonutBreakdown: React.FC<DonutBreakdownProps> = ({
  slices,
  totalKw,
  height = 180,
}) => {
  return (
    <div className="flex items-center gap-4 w-full">
      <div style={{ width: height, height }} className="shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="valueKw"
              innerRadius={height * 0.32}
              outerRadius={height * 0.44}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {slices.map((slice, index) => (
                <Cell key={`cell-${index}`} fill={slice.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as BreakdownSlice;
                  return (
                    <div className="bg-white border border-[#DDE9E0] p-2 rounded-[6px] shadow-floating text-xs">
                      <div className="font-semibold text-[#0C3B2B]">{data.name}</div>
                      <div className="text-[#5B6B62] tabular-nums">
                        {data.valueKw.toFixed(1)} kW (
                        {Math.round((data.valueKw / Math.max(0.1, totalKw)) * 100)}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-[#5B6B62] leading-tight">Total</span>
          <span className="text-sm font-bold text-[#0C3B2B] tabular-nums">
            {totalKw.toFixed(1)} <span className="text-[10px] font-normal">kW</span>
          </span>
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 flex flex-col gap-1.5 text-xs min-w-0">
        {slices.map((s, idx) => (
          <div key={idx} className="flex items-center justify-between text-[#16241D]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="tabular-nums font-medium text-[#5B6B62] ml-2 shrink-0">
              {Math.round((s.valueKw / Math.max(0.1, totalKw)) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
