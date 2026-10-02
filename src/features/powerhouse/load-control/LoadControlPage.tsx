import React, { useState } from 'react';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { useGridStore } from '../../../store/useGridStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { formatPower } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import { useToast } from '../../../components/ui/Toast';
import {
  Activity,
  AlertTriangle,
  Zap,
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  TrendingUp,
  Send,
  Building2,
  DollarSign,
  Leaf,
} from 'lucide-react';

interface ColonyBenchmarkItem {
  colonyId: string;
  colonyName: string;
  feederName: string;
  houseCount: number;
  baselineDailyUnitsKwh: number; // average daily units
  baselineHourlyUnitsKwh: number; // expected units per hour
  liveHourlyDrawKw: number;
  deviationPct: number;
  isWasting: boolean;
  wasteDiagnosis: string;
  softCapKw: number;
}

export const LoadControlPage: React.FC = () => {
  const { showToast } = useToast();
  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const publishAlert = useAlertStore((s) => s.publishAlert);

  // Optimization toggles
  const [voltVarOptimization, setVoltVarOptimization] = useState<boolean>(true);
  const [autoShedWastage, setAutoShedWastage] = useState<boolean>(true);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');

  // Per-colony soft cap adjustments state
  const [colonySoftCaps, setColonySoftCaps] = useState<Record<string, number>>({
    'colony-shanti-vihar': 180,
    'colony-kisan-4': 160,
    'colony-mayur-a': 220,
    'colony-mayur-b': 210,
    'colony-nehru-east': 175,
    'colony-surya-c': 150,
  });

  // Calculate benchmarks and live deviations across all colonies
  const benchmarks: ColonyBenchmarkItem[] = INITIAL_TOPOLOGY.colonies.map((c, idx) => {
    const reading = colonyReadings[c.id];
    // Baseline calculation: avg 12-14 units per household per day
    const avgUnitsPerHouse = 12.5;
    const baselineDailyUnits = Math.round(c.houseCount * avgUnitsPerHouse);
    const baselineHourlyKw = (baselineDailyUnits / 24) * 1.6; // peak-normalized

    const liveKw = reading ? reading.demandKw : baselineHourlyKw * 1.05;
    const diffKw = liveKw - baselineHourlyKw;
    const deviationPct = Math.round((diffKw / baselineHourlyKw) * 100);

    const isWasting = deviationPct >= 18;

    const diagnoses = [
      'Unattended municipal water pumps running during afternoon off-cycle',
      'Unmetered commercial refrigeration left active with doors unsealed',
      'Phase imbalance due to single-phase overload on feeder drop',
      'HVAC chiller compressors running without temperature cut-off',
    ];

    const softCap = colonySoftCaps[c.id] || Math.round(baselineHourlyKw * 1.25);

    return {
      colonyId: c.id,
      colonyName: c.name,
      feederName: INITIAL_TOPOLOGY.feeders.find((f) => f.id === c.feederId)?.name || '11kV Feeder',
      houseCount: c.houseCount,
      baselineDailyUnitsKwh: baselineDailyUnits,
      baselineHourlyUnitsKwh: Math.round(baselineHourlyKw),
      liveHourlyDrawKw: Math.round(liveKw),
      deviationPct,
      isWasting,
      wasteDiagnosis: diagnoses[idx % diagnoses.length],
      softCapKw: softCap,
    };
  });

  // Filter colonies
  const filteredBenchmarks = selectedAreaFilter === 'all'
    ? benchmarks
    : benchmarks.filter((b) => {
        const c = INITIAL_TOPOLOGY.colonies.find((col) => col.id === b.colonyId);
        return c?.areaId === selectedAreaFilter;
      });

  const wastingColonies = benchmarks.filter((b) => b.isWasting);

  // Financial and environmental calculations
  const totalExcessKw = wastingColonies.reduce(
    (acc, c) => acc + Math.max(0, c.liveHourlyDrawKw - c.baselineHourlyUnitsKwh),
    0
  );
  const dailyUnitsWasted = Math.round(totalExcessKw * 8); // 8 peak hours
  const financialLossInr = Math.round(dailyUnitsWasted * 7.85); // ₹7.85 per unit commercial cost
  const co2AvertedKg = Math.round(dailyUnitsWasted * 0.82);

  const handleDispatchWastageWarning = (b: ColonyBenchmarkItem) => {
    publishAlert({
      type: 'high_load',
      severity: 'warning',
      title: `Excess Electricity Consumption Alert: ${b.colonyName}`,
      body: `Your colony is currently drawing ${b.liveHourlyDrawKw} kW (+${b.deviationPct}% above the 7-day average baseline). Suspected: ${b.wasteDiagnosis}. Please inspect communal loads.`,
      scope: { level: 'colony', ids: [b.colonyId] },
      startsAt: Date.now(),
      endsAt: Date.now() + 2 * 60 * 60 * 1000,
      source: 'operator',
      status: 'active',
      channels: ['app', 'sms', 'banner'],
    });

    showToast({
      type: 'success',
      title: 'Wastage Warning Broadcasted',
      message: `SMS and resident notification dispatched to ${b.colonyName}.`,
    });
  };

  const handleApplySoftCap = (colonyId: string, capKw: number) => {
    setColonySoftCaps((prev) => ({
      ...prev,
      [colonyId]: capKw,
    }));
    showToast({
      type: 'success',
      title: 'Soft Peak Cap Applied',
      message: `Feeder soft threshold locked at ${formatPower(capKw)} to curb runaway wastage.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <SlidersHorizontal className="w-5 h-5 text-[#27A163]" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
              Area Load Throttling & Electricity Waste Prevention
            </h1>
          </div>
          <p className="text-xs text-[#5B6B62] mt-1">
            Real-time consumption benchmarking, unit deviation calculation, and automated waste surge detection
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4 bg-white p-2.5 rounded-[10px] border border-[#DDE9E0] text-xs">
          <Switch
            checked={voltVarOptimization}
            onChange={setVoltVarOptimization}
            label="Volt-VAR Optimization (VVO)"
            description="Reduces line loss by 3.8%"
          />
          <span className="h-6 w-[1px] bg-[#DDE9E0]" />
          <Switch
            checked={autoShedWastage}
            onChange={setAutoShedWastage}
            label="Auto-Shed Waste Protocol"
            description="Limits abnormal surges >30%"
          />
        </div>
      </div>

      {/* Financial & Environmental Waste Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E2702B]" /> Colonies Under Waste Alert
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#9E2824] tabular-nums">
              {wastingColonies.length}
            </span>
            <span className="text-xs text-[#5B6B62] ml-1.5">of {benchmarks.length} colonies</span>
          </div>
          <span className="text-[11px] text-[#C73E3A] font-medium">
            Drawing &gt;18% above 7-day baseline
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0C3B2B]" /> Instantaneous Waste Draw
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {formatPower(totalExcessKw)}
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62] tabular-nums">
            Approx. {dailyUnitsWasted} units (kWh) per day
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#27A163]" /> Potential Financial Loss
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#13724A] tabular-nums">
              ₹{financialLossInr.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[#5B6B62] ml-1">/ day</span>
          </div>
          <span className="text-[11px] text-[#27A163] font-medium">
            Based on ₹7.85/unit average tariff
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#27A163]" /> Avoidable Carbon Footprint
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {co2AvertedKg} <span className="text-xs font-normal">kg CO₂</span>
            </span>
          </div>
          <span className="text-[11px] text-[#13724A] font-medium">
            Coal thermal offset potential
          </span>
        </div>
      </div>

      {/* Critical Wastage Surges Alert Banner */}
      {wastingColonies.length > 0 && (
        <div className="p-5 bg-[#FEFAF2] border border-[#F8D288] rounded-[16px] flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#785103] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#E2702B]" /> Active Abnormal Consumption Alerts ({wastingColonies.length} Areas)
            </h2>
            <span className="text-[11px] text-[#785103]">
              Automated anomaly detection comparing instantaneous load vs historical baseline units
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {wastingColonies.map((wc) => (
              <div
                key={wc.colonyId}
                className="p-3.5 bg-white border border-[#F8D288] rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-[#0C3B2B]">{wc.colonyName}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FCEEED] text-[#9E2824] tabular-nums">
                      +{wc.deviationPct}% OVER BENCHMARK
                    </span>
                    <span className="text-xs text-[#5B6B62]">
                      ({wc.feederName})
                    </span>
                  </div>
                  <p className="text-xs text-[#16241D] mt-1">
                    Live Draw: <strong className="tabular-nums text-[#0C3B2B]">{formatPower(wc.liveHourlyDrawKw)}</strong> (Expected: {formatPower(wc.baselineHourlyUnitsKwh)}). 
                    <span className="text-[#9E2824] font-medium ml-1">Suspected Cause: {wc.wasteDiagnosis}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Send className="w-3.5 h-3.5" />}
                    onClick={() => handleDispatchWastageWarning(wc)}
                  >
                    Send Wastage Warning
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApplySoftCap(wc.colonyId, Math.round(wc.baselineHourlyUnitsKwh * 1.1))}
                  >
                    Throttle Peak to {Math.round(wc.baselineHourlyUnitsKwh * 1.1)} kW
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Colony Unit Accounting & Load Throttling Matrix */}
      <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0C3B2B]">
              Colony Unit Consumption Accounting & Soft-Cap Throttler
            </h2>
            <p className="text-xs text-[#5B6B62]">
              Benchmarked average daily units (kWh), current draw, wastage deviation %, and soft power caps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5B6B62]">Filter Zone:</span>
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Service Areas</option>
              {INITIAL_TOPOLOGY.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Accounting Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDE9E0] text-[#5B6B62]">
              <tr>
                <th className="py-3 font-medium">Colony Name</th>
                <th className="py-3 font-medium text-right">Households</th>
                <th className="py-3 font-medium text-right">Daily Baseline Units</th>
                <th className="py-3 font-medium text-right">Hourly Expected</th>
                <th className="py-3 font-medium text-right">Live Draw</th>
                <th className="py-3 font-medium text-right">Surge / Deviation</th>
                <th className="py-3 font-medium text-center w-36">Throttler Soft Cap</th>
                <th className="py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE9E0]/60">
              {filteredBenchmarks.map((b) => (
                <tr key={b.colonyId} className="hover:bg-[#F5FAF6] transition-colors">
                  <td className="py-3">
                    <div className="font-semibold text-[#0C3B2B]">{b.colonyName}</div>
                    <div className="text-[10px] text-[#5B6B62]">{b.feederName}</div>
                  </td>
                  <td className="py-3 text-right tabular-nums">{b.houseCount}</td>
                  <td className="py-3 text-right tabular-nums text-[#5B6B62]">
                    {b.baselineDailyUnitsKwh} <span className="text-[10px]">kWh</span>
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-[#16241D]">
                    {formatPower(b.baselineHourlyUnitsKwh)}
                  </td>
                  <td className="py-3 text-right tabular-nums font-bold text-[#0C3B2B]">
                    {formatPower(b.liveHourlyDrawKw)}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    <span
                      className={`inline-flex items-center font-bold px-2 py-0.5 rounded-[4px] text-[11px] ${
                        b.isWasting
                          ? 'bg-[#FCEEED] text-[#9E2824]'
                          : b.deviationPct > 8
                          ? 'bg-[#FEFAF2] text-[#B07B0E]'
                          : 'bg-[#EAF7EE] text-[#13724A]'
                      }`}
                    >
                      {b.deviationPct >= 0 ? `+${b.deviationPct}%` : `${b.deviationPct}%`}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#5B6B62]">Cap:</span>
                        <strong className="text-[#0C3B2B] tabular-nums">{b.softCapKw} kW</strong>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="350"
                        step="10"
                        value={b.softCapKw}
                        onChange={(e) => handleApplySoftCap(b.colonyId, parseInt(e.target.value, 10))}
                        className="w-full accent-[#27A163] cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant={b.isWasting ? 'primary' : 'outline'}
                      onClick={() => handleDispatchWastageWarning(b)}
                    >
                      {b.isWasting ? 'Alert Waste' : 'Notify'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
