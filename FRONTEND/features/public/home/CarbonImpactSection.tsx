import React, { useState } from 'react';
import { useLocationStore } from '../../../store/useLocationStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { calculateCarbonImpact, INDIA_GRID_EF_KG_PER_KWH } from '../../../lib/carbon';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from 'recharts';
import {
  Leaf,
  TreeDeciduous,
  Gauge,
  Sparkles,
  Info,
  TrendingDown,
} from 'lucide-react';

interface CarbonImpactSectionProps {
  currentCleanKw: number;
  currentDemandKw: number;
}

export const CarbonImpactSection: React.FC<CarbonImpactSectionProps> = ({
  currentCleanKw,
  currentDemandKw,
}) => {
  const language = useSessionStore((s) => s.language);
  const currentColony = useLocationStore((s) => s.currentColony);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Multipliers for period toggle
  const multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

  // Base colony consumption metrics (~32 households draw ~1,100 kWh/day)
  const baseCleanKwh = (currentColony.houseCount * 18.5 + currentCleanKw * 2.5) * multiplier;
  const baseGridKwh = (currentColony.houseCount * 14.2) * multiplier;

  const carbon = calculateCarbonImpact(
    baseGridKwh,
    baseCleanKwh,
    currentCleanKw,
    currentDemandKw
  );

  return (
    <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE9E0]/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
            <Leaf className="w-5 h-5 text-[#27A163]" />
          </span>
          <div>
            <h2 className="text-base font-bold font-heading text-[#0C3B2B]">
              {language === 'hi' ? 'कार्बन प्रभाव व स्वच्छ ऊर्जा' : 'Neighbourhood Carbon Impact'}
            </h2>
            <p className="text-xs text-[#5B6B62]">
              {language === 'hi'
                ? 'सीईए (CEA) राष्ट्रीय उत्सर्जन दर (0.716 kg CO₂/kWh) पर आधारित'
                : 'Directly avoided emissions via rooftop solar & shared community battery'}
            </p>
          </div>
        </div>

        {/* Period Pills */}
        <div className="inline-flex p-1 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 font-semibold rounded-[4px] capitalize transition-colors cursor-pointer ${
                period === p
                  ? 'bg-white text-[#0C3B2B] shadow-xs'
                  : 'text-[#5B6B62] hover:text-[#16241D]'
              }`}
            >
              {language === 'hi'
                ? p === 'daily'
                  ? 'आज'
                  : p === 'weekly'
                  ? 'सप्ताह'
                  : 'महीना'
                : p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Avoided Emissions */}
        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5 text-[#13724A]" /> Emissions Avoided
          </span>
          <div className="my-1">
            <span className="text-2xl font-bold font-heading text-[#13724A] tabular-nums">
              {carbon.emissionsAvoidedTodayKg.toLocaleString()}
            </span>
            <span className="text-xs text-[#5B6B62] ml-1">kg CO₂</span>
          </div>
          <span className="text-[10px] text-[#13724A] font-semibold">
            via local solar & batteries
          </span>
        </div>

        {/* Grid Import Emissions */}
        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] font-medium">
            Grid Import Emissions
          </span>
          <div className="my-1">
            <span className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {carbon.emissionsTodayKg.toLocaleString()}
            </span>
            <span className="text-xs text-[#5B6B62] ml-1">kg CO₂</span>
          </div>
          <span className="text-[10px] text-[#5B6B62]">
            Thermal coal baseload mix
          </span>
        </div>

        {/* Live Carbon Intensity */}
        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1 font-medium">
            <Gauge className="w-3.5 h-3.5 text-[#1B93A1]" /> Live Carbon Intensity
          </span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {carbon.liveCarbonIntensityGPerKwh}
            </span>
            <span className="text-xs text-[#5B6B62]">g CO₂/kWh</span>
          </div>
          <span className="text-[10px] text-[#27A163] font-semibold">
            {carbon.cleanSharePct}% Clean Share Right Now
          </span>
        </div>

        {/* Tree Equivalency */}
        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B62] flex items-center gap-1 font-medium">
            <TreeDeciduous className="w-3.5 h-3.5 text-[#27A163]" /> Ecological Impact
          </span>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              ≈ {carbon.treesDailyEquivalent.toLocaleString()}
            </span>
            <span className="text-xs text-[#5B6B62]">trees</span>
          </div>
          <span className="text-[10px] text-[#13724A] font-semibold">
            Daily CO₂ absorption equivalent
          </span>
        </div>
      </div>

      {/* 24-Hour Carbon Intensity Sparkline */}
      <div className="pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[#5B6B62]">
          <span className="font-semibold text-[#0C3B2B]">
            24-Hour Carbon Intensity Profile (g CO₂ / kWh)
          </span>
          <span className="text-[11px] text-[#13724A]">
            Green dip corresponds to midday rooftop solar peak
          </span>
        </div>

        <div style={{ width: '100%', height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={carbon.historySparkline}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#27A163" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#27A163" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#5B6B62', fontSize: 10 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    return (
                      <div className="bg-white border border-[#DDE9E0] p-2 rounded-[6px] shadow-floating text-[11px] tabular-nums">
                        <strong className="text-[#0C3B2B] block">{pt.hour}</strong>
                        <span className="text-[#13724A]">
                          Intensity: {pt.intensity} g CO₂/kWh
                        </span>
                        <span className="text-[#5B6B62] block">
                          Avoided: ~{pt.avoidedKg} kg CO₂
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="intensity"
                stroke="#27A163"
                strokeWidth={1.75}
                fill="url(#carbonGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Info note */}
      <div className="pt-2 border-t border-[#DDE9E0]/60 flex items-center justify-between text-[11px] text-[#5B6B62]">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#13724A]" />
          Formula: kWh × {INDIA_GRID_EF_KG_PER_KWH} kg/kWh (CEA Indian Grid Baseline Database v19).
        </span>
        <span className="hidden sm:inline">Updated per 2s simulator tick</span>
      </div>
    </div>
  );
};
