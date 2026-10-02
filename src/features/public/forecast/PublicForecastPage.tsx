import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useSessionStore } from '../../../store/useSessionStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { SupplyRibbon, RibbonSegment } from '../../../components/charts/SupplyRibbon';
import { forecastProvider } from '../../../data/mock/forecastMock';
import { useNow } from '../../../hooks/useNow';
import { formatTime12h } from '../../../lib/time';
import { Sparkles, Sun, CheckCircle2, Clock } from 'lucide-react';

interface ColonyUsagePoint {
  timeLabel: string;
  todayKw: number;
  usualKw: number;
}

export const PublicForecastPage: React.FC = () => {
  const { now } = useNow();
  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const language = useSessionStore((s) => s.language);
  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedColonyId);

  const [ribbonSegments, setRibbonSegments] = useState<RibbonSegment[]>([]);
  const [usagePoints, setUsagePoints] = useState<ColonyUsagePoint[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const pts = await forecastProvider.demand(
        { level: 'colony', id: selectedColonyId },
        24,
        now
      );

      if (mounted) {
        setRibbonSegments(
          pts.map((p) => ({
            ts: p.ts,
            status: p.status,
          }))
        );

        // Map into colony usage points (Today vs Usual)
        const usage: ColonyUsagePoint[] = pts.map((p) => ({
          timeLabel: formatTime12h(p.ts),
          todayKw: Math.round(p.demandKw),
          usualKw: Math.round(p.demandKw * 0.95 + Math.sin(p.ts / 600000) * 8),
        }));
        setUsagePoints(usage);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [selectedColonyId, now]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          {language === 'hi' ? 'बिजली का अनुमान व उपयोग योजना' : 'Neighborhood Supply Outlook & Usage'}
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          {language === 'hi'
            ? 'आपके मोहल्ले की आपूर्ति स्थिति और भारी उपकरण चलाने के सबसे अनुकूल समय'
            : 'Clear status forecast and recommended hours to run washing machines, pumps, and geysers'}
        </p>
      </div>

      {/* Part 1: Supply Outlook (STATUS ONLY, NO MW GRAPHS) */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0C3B2B]">
              24-Hour Grid Supply Outlook
            </h2>
            <p className="text-xs text-[#5B6B62]">
              Status outlook simplified for households
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-[#13724A] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#27A163]" /> Steady
            </span>
            <span className="flex items-center gap-1 text-[#B07B0E] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E9A820]" /> Watch
            </span>
            <span className="flex items-center gap-1 text-[#B34E14] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2702B]" /> Avoid Heavy Load
            </span>
          </div>
        </div>

        <SupplyRibbon
          segments={ribbonSegments}
          nowTs={now}
          variant="public"
        />
      </section>

      {/* Recommended Best Hours for Heavy Appliances */}
      <section className="p-5 bg-[#EAF7EE] border border-[#8ED1A8] rounded-[12px] flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-[8px] bg-white text-[#13724A] shrink-0 mt-0.5">
            <Sun className="w-5 h-5 text-[#E9A820]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0C3B2B] flex items-center gap-1.5">
              Best Hours for Heavy Appliances Today
            </h2>
            <p className="text-xs text-[#16241D] mt-1 leading-relaxed">
              Solar generation peaks between <strong>10:30 am and 2:30 pm</strong>. Running washing machines, geysers, and water pumps during these green hours keeps electricity reliable and lowers grid strain.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#8ED1A8]/60 text-xs">
          <div className="p-2.5 bg-white/80 rounded-[8px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#27A163] shrink-0" />
            <div>
              <strong>10:30 am – 2:30 pm</strong>
              <div className="text-[11px] text-[#5B6B62]">Prime solar surplus hours</div>
            </div>
          </div>
          <div className="p-2.5 bg-white/80 rounded-[8px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#27A163] shrink-0" />
            <div>
              <strong>11:00 pm – 5:00 am</strong>
              <div className="text-[11px] text-[#5B6B62]">Off-peak night base load</div>
            </div>
          </div>
          <div className="p-2.5 bg-[#FEFAF2] border border-[#F8D288] rounded-[8px] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E2702B] shrink-0" />
            <div>
              <strong className="text-[#B34E14]">6:30 pm – 9:30 pm</strong>
              <div className="text-[11px] text-[#7A320A]">Evening peak — please avoid</div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 2: Colony Usage Forecast (Their own consumption curve: Today vs Usual) */}
      <section className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0C3B2B]">
              {colony?.name} Energy Consumption Pattern
            </h2>
            <p className="text-xs text-[#5B6B62]">
              Predicted aggregate neighborhood consumption today vs. usual historical average
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#5B6B62]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0C3B2B]" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#27A163] border-t border-dashed" /> Usual Day
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={usagePoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="timeLabel" tickLine={false} tick={{ fill: '#5B6B62', fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#5B6B62', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as ColonyUsagePoint;
                    return (
                      <div className="bg-white border border-[#DDE9E0] p-2.5 rounded-[8px] shadow-floating text-xs">
                        <div className="font-semibold text-[#0C3B2B] mb-1">{pt.timeLabel}</div>
                        <div className="flex flex-col gap-0.5 tabular-nums">
                          <div>Today: <strong>{pt.todayKw} kW</strong></div>
                          <div className="text-[#5B6B62]">Usual: {pt.usualKw} kW</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="usualKw"
                stroke="#27A163"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="todayKw"
                stroke="#0C3B2B"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
