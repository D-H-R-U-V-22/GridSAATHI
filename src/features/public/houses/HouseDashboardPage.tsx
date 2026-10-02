import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../store/useSessionStore';
import { useGridStore } from '../../../store/useGridStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { INITIAL_TOPOLOGY, getHousesForColony } from '../../../config/topology';
import { DonutBreakdown, BreakdownSlice } from '../../../components/charts/DonutBreakdown';
import { forecastProvider } from '../../../data/mock/forecastMock';
import { ForecastPoint } from '../../../domain/types';
import { formatPower } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import { useNow } from '../../../hooks/useNow';
import {
  Home,
  CheckCircle2,
  Clock,
  Radio,
  Zap,
  TrendingDown,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

export const HouseDashboardPage: React.FC = () => {
  const { houseId } = useParams<{ houseId?: string }>();
  const navigate = useNavigate();
  const { now } = useNow();
  const { showToast } = useToast();

  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const selectedHouseId = houseId || useSessionStore((s) => s.selectedHouseId);
  const setSelectedHouseId = useSessionStore((s) => s.setSelectedHouseId);
  const language = useSessionStore((s) => s.language);

  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedColonyId);
  const houses = getHousesForColony(selectedColonyId);
  const currentHouse = houses.find((h) => h.id === selectedHouseId) || houses[0];

  const drEvents = useDemandResponseStore((s) => s.events);
  const houseDelayedAppliances = useDemandResponseStore((s) => s.houseDelayedAppliances);
  const toggleHouseAppliance = useDemandResponseStore((s) => s.toggleHouseAppliance);

  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);

  // Active DR event
  const activeDr = drEvents.find((e) => e.status === 'active');
  const delayedList = currentHouse ? houseDelayedAppliances[currentHouse.id] || [] : [];

  useEffect(() => {
    let mounted = true;
    if (currentHouse) {
      forecastProvider.houseUsage(currentHouse.id, 24, now).then((pts) => {
        if (mounted) setForecastPoints(pts);
      });
    }
    return () => {
      mounted = false;
    };
  }, [currentHouse, now]);

  if (!currentHouse) {
    return <div className="p-8 text-center text-xs text-[#5B6B62]">House not found.</div>;
  }

  // Simulated live draw for house
  const liveDrawKw = 2.8;
  const colonyAvgKw = 3.4;

  // Appliance breakdown slices
  const slices: BreakdownSlice[] = [
    { name: 'Air Conditioning', valueKw: 1.4, color: '#0C3B2B' },
    { name: 'Water Heating (Geyser)', valueKw: 0.6, color: '#27A163' },
    { name: 'Water Pump', valueKw: 0.35, color: '#1B93A1' },
    { name: 'Refrigeration', valueKw: 0.25, color: '#E9A820' },
    { name: 'Lighting & Fans', valueKw: 0.2, color: '#8ED1A8' },
  ];

  const handleToggleAppliance = (applianceId: string) => {
    if (!activeDr) return;
    toggleHouseAppliance(currentHouse.id, applianceId, activeDr.id);
    const isNowDelayed = !delayedList.includes(applianceId);
    showToast({
      type: isNowDelayed ? 'success' : 'info',
      title: isNowDelayed ? 'Appliance Deferred' : 'Appliance Reactivated',
      message: isNowDelayed
        ? 'Thank you! Your voluntary reduction supports neighborhood grid stability.'
        : 'Appliance removed from delay queue.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & House Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#27A163]" />
            <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
              {currentHouse.label}
            </h1>
          </div>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            {colony?.name} · Sanctioned Load: <strong className="text-[#16241D] tabular-nums">{currentHouse.sanctionedLoadKw} kW</strong> · Occupants: <strong className="tabular-nums text-[#16241D]">{currentHouse.occupants}</strong>
          </p>
        </div>

        {/* Local House Dropdown Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5B6B62] font-medium">Switch Unit:</span>
          <select
            value={currentHouse.id}
            onChange={(e) => {
              setSelectedHouseId(e.target.value);
              navigate(`/colony/houses/${e.target.value}`);
            }}
            className="text-xs font-semibold text-[#0C3B2B] bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-1.5 focus:outline-none"
          >
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards: Live Draw, vs Colony Avg, Monthly Trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62]">Current House Power Draw</span>
          <div className="my-2">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {liveDrawKw.toFixed(1)} <span className="text-sm font-medium">kW</span>
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            {Math.round((liveDrawKw / currentHouse.sanctionedLoadKw) * 100)}% of sanctioned capacity
          </span>
        </div>

        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5B6B62]">vs. Colony Average</span>
            <TrendingDown className="w-4 h-4 text-[#27A163]" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-heading text-[#13724A] tabular-nums">
              -18% <span className="text-xs font-normal text-[#5B6B62]">lower</span>
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            Neighbourhood average is {colonyAvgKw.toFixed(1)} kW
          </span>
        </div>

        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62]">Estimated Today's Energy</span>
          <div className="my-2">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              21.4 <span className="text-sm font-medium">kWh</span>
            </span>
          </div>
          <span className="text-[11px] text-[#27A163] font-medium">
            On track for green-tier efficiency
          </span>
        </div>
      </div>

      {/* Demand Response Participation Card with Done Ticks */}
      <section className="p-6 bg-white rounded-[16px] border border-[#DDE9E0] flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[#27A163]" />
            <div>
              <h2 className="text-base font-bold text-[#0C3B2B]">
                Active Neighborhood Demand Response Ask
              </h2>
              <p className="text-xs text-[#5B6B62]">
                Mark appliances you agree to postpone during the current peak window
              </p>
            </div>
          </div>
          {activeDr && (
            <span className="text-xs font-bold px-2.5 py-1 bg-[#D6EFDD] text-[#0C3B2B] rounded-[6px]">
              Active Event
            </span>
          )}
        </div>

        {activeDr ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#16241D] p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0]">
              {activeDr.message}
            </p>

            <span className="text-xs font-semibold text-[#0C3B2B] block mt-1">
              Your Deferrable Appliances:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentHouse.appliances
                .filter((app) => app.deferrable)
                .map((app) => {
                  const isDelayed = delayedList.includes(app.id);

                  return (
                    <div
                      key={app.id}
                      onClick={() => handleToggleAppliance(app.id)}
                      className={`p-3 rounded-[8px] border transition-all cursor-pointer flex items-center justify-between ${
                        isDelayed
                          ? 'bg-[#EAF7EE] border-[#8ED1A8] text-[#0C3B2B]'
                          : 'bg-white border-[#DDE9E0] hover:bg-[#F5FAF6]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${
                            isDelayed
                              ? 'bg-[#27A163] border-[#27A163] text-white'
                              : 'border-[#DDE9E0] bg-white'
                          }`}
                        >
                          {isDelayed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{app.name}</div>
                          <div className="text-[10px] text-[#5B6B62]">
                            Draw: ~{app.ratedKw} kW
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold ${
                          isDelayed ? 'text-[#13724A]' : 'text-[#5B6B62]'
                        }`}
                      >
                        {isDelayed ? 'Done ✓' : 'Delay Now'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#5B6B62] p-4 bg-[#F5FAF6] rounded-[8px]">
            No demand curtailment requested for your colony right now. You can run appliances normally.
          </p>
        )}
      </section>

      {/* Appliance Breakdown Donut */}
      <section className="p-6 bg-white rounded-[16px] border border-[#DDE9E0] flex flex-col gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0C3B2B]">
            Appliance Energy Breakdown
          </h2>
          <p className="text-xs text-[#5B6B62]">
            Estimated instantaneous distribution of electricity across household equipment
          </p>
        </div>

        <DonutBreakdown slices={slices} totalKw={liveDrawKw} height={190} />
      </section>

      {/* Load Shifting Tips */}
      <section className="p-5 bg-[#FEFAF2] border border-[#F8D288] rounded-[16px] flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#0C3B2B] flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#E9A820]" /> Load-Shifting Tips for Your Household
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#16241D]">
          <div className="p-3 bg-white/80 rounded-[8px] flex items-start gap-2">
            <span className="font-bold text-[#27A163]">1.</span>
            <span>Run your washing machine between 11:00 am and 2:00 pm when local solar output peaks.</span>
          </div>
          <div className="p-3 bg-white/80 rounded-[8px] flex items-start gap-2">
            <span className="font-bold text-[#27A163]">2.</span>
            <span>Pre-heat water geysers in the morning before the 6:00 pm evening peak hours.</span>
          </div>
          <div className="p-3 bg-white/80 rounded-[8px] flex items-start gap-2">
            <span className="font-bold text-[#27A163]">3.</span>
            <span>Set split inverter ACs to 25°C or higher to reduce cooling draw by ~20%.</span>
          </div>
          <div className="p-3 bg-white/80 rounded-[8px] flex items-start gap-2">
            <span className="font-bold text-[#27A163]">4.</span>
            <span>Fill overhead water tanks during morning solar hours instead of evening peak.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
