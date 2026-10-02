import React, { useEffect, useState } from 'react';
import { useGridStore } from '../../../store/useGridStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { GridSchematic } from '../../../components/grid/GridSchematic';
import { KpiFigure } from '../../../components/shared/KpiFigure';
import { SupplyRibbon, RibbonSegment } from '../../../components/charts/SupplyRibbon';
import { LiveAreaChart, ChartDataPoint } from '../../../components/charts/LiveAreaChart';
import { AlertCard } from '../../../components/shared/AlertCard';
import { formatPower, formatPercent } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import { forecastProvider } from '../../../data/mock/forecastMock';
import { useNow } from '../../../hooks/useNow';
import { Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { now } = useNow();
  const powerHouseReading = useGridStore((s) => s.powerHouseReading);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const alerts = useAlertStore((s) => s.alerts);
  const drEvents = useDemandResponseStore((s) => s.events);

  const [ribbonSegments, setRibbonSegments] = useState<RibbonSegment[]>([]);
  const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);

  // Load 24h forecast points for Ribbon and Chart
  useEffect(() => {
    let mounted = true;
    async function loadForecast() {
      const points = await forecastProvider.demand(
        { level: 'powerhouse', id: 'ph-pragati' },
        24,
        now
      );

      if (!mounted) return;

      const segs: RibbonSegment[] = points.map((p) => ({
        ts: p.ts,
        status: p.status,
        shortfallKw: p.shortfallKw,
      }));
      setRibbonSegments(segs);

      // Prepend simulated past 4 hours to chart points
      const pastPoints: ChartDataPoint[] = [];
      for (let i = 16; i >= 1; i--) {
        const pastTs = now - i * 15 * 60 * 1000;
        const baseDemand = 7100 + Math.sin(pastTs / 300000) * 400;
        const pastRenewable = 4200 + Math.sin(pastTs / 400000) * 350;
        pastPoints.push({
          ts: pastTs,
          timeLabel: formatTime12h(pastTs),
          isForecast: false,
          demandKw: Math.round(baseDemand),
          supplyKw: Math.round(baseDemand),
          renewableKw: Math.round(pastRenewable),
        });
      }

      const futurePoints: ChartDataPoint[] = points.map((p) => ({
        ts: p.ts,
        timeLabel: formatTime12h(p.ts),
        isForecast: true,
        demandKw: p.demandKw,
        supplyKw: p.availableSupplyKw,
        renewableKw: p.renewableKw,
        shortfallKw: p.shortfallKw,
      }));

      setChartPoints([...pastPoints, ...futurePoints]);
    }

    loadForecast();
    return () => {
      mounted = false;
    };
  }, [now]);

  // Derived KPIs
  const totalDemand = powerHouseReading.demandKw;
  const totalSupply = powerHouseReading.supplyKw;
  const renewableKw = powerHouseReading.solarKw + powerHouseReading.windKw;
  const renewableSharePct = totalDemand > 0 ? (renewableKw / totalDemand) * 100 : 0;
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const coloniesAtRisk = Object.values(colonyStatuses).filter(
    (st) => st === 'constrained' || st === 'outage'
  ).length;

  const activeDr = drEvents.find((e) => e.status === 'active');

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          Pragati Substation Dashboard
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          220kV primary distribution bus · Real-time renewable integration and load balancing
        </p>
      </div>

      {/* KPI Figures Row (No icon bubbles, clean tabular figures) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiFigure
          label="Total Demand"
          value={formatPower(totalDemand, 1)}
          trend="up"
          change="+2.4%"
          subtext="vs 1h ago"
        />
        <KpiFigure
          label="Total Supply"
          value={formatPower(totalSupply, 1)}
          subtext="Import + Renewables"
        />
        <KpiFigure
          label="Renewable Share"
          value={formatPercent(renewableSharePct, 0)}
          change={`${formatPower(renewableKw, 0)}`}
          subtext="Solar & Wind"
        />
        <KpiFigure
          label="Grid Import"
          value={formatPower(powerHouseReading.gridImportKw, 1)}
          subtext="Central DISCOM"
        />
        <KpiFigure
          label="Active Alerts"
          value={activeAlerts.length}
          trend={activeAlerts.length > 0 ? 'down' : 'neutral'}
          subtext="Dispatched"
        />
        <KpiFigure
          label="Colonies at Risk"
          value={coloniesAtRisk}
          trend={coloniesAtRisk > 0 ? 'down' : 'neutral'}
          subtext="Constrained/Outage"
        />
      </div>

      {/* Primary Visual: Grid Schematic */}
      <section className="bg-white rounded-[16px] border border-[#DDE9E0] p-5 shadow-sm">
        <GridSchematic />
      </section>

      {/* 24-Hour Supply Ribbon */}
      <section className="bg-white rounded-[12px] border border-[#DDE9E0] p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0C3B2B]">
              24-Hour Supply & Intermittency Outlook
            </h2>
            <p className="text-xs text-[#5B6B62]">
              Predicted supply status with flagged shortfall and load risk windows
            </p>
          </div>
          <button
            onClick={() => navigate('/powerhouse/forecast')}
            className="text-xs font-semibold text-[#27A163] hover:text-[#13724A] cursor-pointer"
          >
            Open Full Forecast →
          </button>
        </div>

        <SupplyRibbon
          segments={ribbonSegments}
          nowTs={now}
          variant="powerhouse"
          onSegmentClick={(seg) => {
            if (seg.status !== 'stable') {
              navigate('/powerhouse/alerts/weather');
            }
          }}
        />
      </section>

      {/* Live Area Chart & Right Context Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main 8 cols: Live Chart */}
        <div className="lg:col-span-8 bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0C3B2B]">
                Live Demand, Supply & Renewable Balancing
              </h2>
              <p className="text-xs text-[#5B6B62]">
                Actual readings (solid) and 15-minute projected horizon (dashed)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#5B6B62]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#0C3B2B]" /> Demand
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#27A163]" /> Supply
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-[#27A163]/20" /> Renewables
              </span>
            </div>
          </div>

          <LiveAreaChart data={chartPoints} nowTs={now} height={290} />
        </div>

        {/* Side 4 cols: Active DR & Recent Alerts */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Active DR Card */}
          <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0C3B2B] flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#27A163]" /> Active Demand Response
              </span>
              {activeDr ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] bg-[#D6EFDD] text-[#0C3B2B]">
                  Active
                </span>
              ) : (
                <span className="text-xs text-[#5B6B62]">None Scheduled</span>
              )}
            </div>

            {activeDr ? (
              <div className="flex flex-col gap-2 text-xs">
                <p className="text-[#16241D] leading-relaxed">{activeDr.message}</p>
                <div className="flex justify-between pt-2 border-t border-[#DDE9E0] text-[#5B6B62]">
                  <span>Target Reduction:</span>
                  <strong className="text-[#0C3B2B] tabular-nums">{formatPower(activeDr.targetReductionKw)}</strong>
                </div>
                <div className="flex justify-between text-[#5B6B62]">
                  <span>Current Shifted:</span>
                  <strong className="text-[#13724A] tabular-nums">{formatPower(activeDr.actualReductionKw)}</strong>
                </div>
                <button
                  onClick={() => navigate('/powerhouse/demand-response')}
                  className="mt-1 text-xs font-semibold text-[#27A163] hover:text-[#13724A] text-left cursor-pointer"
                >
                  View Response Curve & Participation →
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#5B6B62]">
                No active demand curtailment requested. Supply is balancing normally.
              </p>
            )}
          </div>

          {/* Latest Dispatched Alert */}
          <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0C3B2B]">
                Latest Broadcast Alert
              </span>
              <button
                onClick={() => navigate('/powerhouse/alerts/weather')}
                className="text-xs text-[#27A163] hover:text-[#13724A] cursor-pointer"
              >
                All Alerts ({alerts.length})
              </button>
            </div>

            {alerts[0] ? (
              <AlertCard alert={alerts[0]} />
            ) : (
              <p className="text-xs text-[#5B6B62]">No active alerts right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
