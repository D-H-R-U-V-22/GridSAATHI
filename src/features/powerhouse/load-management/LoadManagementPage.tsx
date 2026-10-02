import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { INITIAL_TOPOLOGY, getHousesForColony } from '../../../config/topology';
import { useGridStore } from '../../../store/useGridStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { Button } from '../../../components/ui/Button';
import { StatusPill } from '../../../components/ui/StatusPill';
import { formatPower } from '../../../lib/format';
import { Radio, ArrowLeft, ArrowUpRight, ArrowDownRight, Sliders, Zap } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

export const LoadManagementPage: React.FC = () => {
  const { feederId } = useParams<{ feederId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const feederReadings = useGridStore((s) => s.feederReadings);
  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const feederStatuses = useGridStore((s) => s.feederStatuses);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const feederSoftLimits = useGridStore((s) => s.feederSoftLimits);
  const setFeederSoftLimit = useGridStore((s) => s.setFeederSoftLimit);
  const startEvent = useDemandResponseStore((s) => s.startEvent);

  const [editingLimitFeederId, setEditingLimitFeederId] = useState<string | null>(null);
  const [softLimitInput, setSoftLimitInput] = useState<string>('2000');

  // Handle suggestion one-click DR dispatch
  const handleQuickDr = (colonyId: string, reductionKw: number) => {
    const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === colonyId);
    startEvent({
      scope: { level: 'colony', ids: [colonyId] },
      startsAt: Date.now(),
      endsAt: Date.now() + 2 * 60 * 60 * 1000,
      severity: 'strong_request',
      targetReductionKw: reductionKw,
      avoidAppliances: ['1.5 Ton Split AC', 'Storage Geyser (25L)', 'Submersible Water Pump'],
      message: `DISCOM load alert: ${colony?.name || 'Your colony'} is asked to shed ${reductionKw} kW for 2 hours.`,
      status: 'active',
    });
    showToast({
      type: 'success',
      title: 'Demand Response Dispatched',
      message: `Targeting ${reductionKw} kW reduction in ${colony?.name}.`,
    });
  };

  // If viewing a specific feeder drilldown:
  if (feederId) {
    const selectedFeeder = INITIAL_TOPOLOGY.feeders.find((f) => f.id === feederId);
    if (!selectedFeeder) {
      return (
        <div className="p-8 text-center text-xs text-[#5B6B62]">
          Feeder not found.{' '}
          <button onClick={() => navigate('/powerhouse/load')} className="text-[#27A163] font-semibold">
            Return to all feeders
          </button>
        </div>
      );
    }

    const fReading = feederReadings[selectedFeeder.id];
    const fStatus = feederStatuses[selectedFeeder.id] || 'stable';
    const fLoadKw = fReading ? fReading.demandKw : selectedFeeder.capacityKw * 0.5;
    const fLoadPct = Math.round((fLoadKw / selectedFeeder.capacityKw) * 100);

    const colonies = INITIAL_TOPOLOGY.colonies.filter((c) =>
      selectedFeeder.colonyIds.includes(c.id)
    );

    // Mock aggregate house load ranking for first colony
    const firstColonyHouses = colonies[0] ? getHousesForColony(colonies[0].id).slice(0, 10) : [];

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/powerhouse/load')}
          >
            All Feeders
          </Button>
          <div>
            <h1 className="text-xl font-bold font-heading text-[#0C3B2B]">
              {selectedFeeder.name} Drill-Down
            </h1>
            <p className="text-xs text-[#5B6B62]">
              Feeder telemetry, child colony distributions, and household load aggregation
            </p>
          </div>
        </div>

        {/* Feeder Top KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px]">
            <span className="text-xs text-[#5B6B62]">Operational Status</span>
            <div className="mt-1">
              <StatusPill status={fStatus} />
            </div>
          </div>
          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px]">
            <span className="text-xs text-[#5B6B62]">Current Load</span>
            <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
              {formatPower(fLoadKw)}
            </p>
          </div>
          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px]">
            <span className="text-xs text-[#5B6B62]">Capacity Utilisation</span>
            <p className="text-xl font-bold font-heading text-[#13724A] tabular-nums mt-0.5">
              {fLoadPct}% of {formatPower(selectedFeeder.capacityKw)}
            </p>
          </div>
          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px]">
            <span className="text-xs text-[#5B6B62]">Soft Shedding Limit</span>
            <p className="text-xl font-bold font-heading text-[#B07B0E] tabular-nums mt-0.5">
              {formatPower(feederSoftLimits[selectedFeeder.id] || selectedFeeder.capacityKw * 0.9)}
            </p>
          </div>
        </div>

        {/* Colonies fed by this feeder */}
        <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5">
          <h2 className="text-sm font-semibold text-[#0C3B2B] mb-3">
            Child Colonies Fed by {selectedFeeder.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#DDE9E0] text-[#5B6B62]">
                <tr>
                  <th className="py-2.5 font-medium">Colony Name</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium text-right">Households</th>
                  <th className="py-2.5 font-medium text-right">Live Load</th>
                  <th className="py-2.5 font-medium text-right">Local Solar</th>
                  <th className="py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE9E0]/60">
                {colonies.map((c) => {
                  const cRead = colonyReadings[c.id];
                  const cSt = colonyStatuses[c.id] || 'stable';
                  const dKw = cRead ? cRead.demandKw : 120;
                  const sKw = cRead ? cRead.solarKw : 35;

                  return (
                    <tr key={c.id} className="hover:bg-[#F5FAF6] transition-colors">
                      <td className="py-3 font-semibold text-[#0C3B2B]">{c.name}</td>
                      <td className="py-3">
                        <StatusPill status={cSt} size="sm" />
                      </td>
                      <td className="py-3 text-right tabular-nums">{c.houseCount}</td>
                      <td className="py-3 text-right font-medium tabular-nums text-[#0C3B2B]">
                        {formatPower(dKw)}
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums text-[#B07B0E]">
                        {formatPower(sKw)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleQuickDr(c.id, Math.round(dKw * 0.25))}
                          className="text-xs font-semibold text-[#27A163] hover:text-[#13724A] cursor-pointer"
                        >
                          Request DR
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anonymised Household Load Ranking */}
        <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0C3B2B]">
                Anonymised High-Load Household Aggregation ({colonies[0]?.name || 'Feeder'})
              </h2>
              <p className="text-xs text-[#5B6B62]">
                Ranked by instantaneous power draw to identify heavy residential loads
              </p>
            </div>
            <span className="text-[11px] text-[#5B6B62] bg-[#F5FAF6] px-2.5 py-1 rounded-[6px] border border-[#DDE9E0]">
              Privacy Protected (Unit Identifiers Masked)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#DDE9E0] text-[#5B6B62]">
                <tr>
                  <th className="py-2.5 font-medium">Rank</th>
                  <th className="py-2.5 font-medium">Masked Household</th>
                  <th className="py-2.5 font-medium text-right">Sanctioned Load</th>
                  <th className="py-2.5 font-medium text-right">Current Draw</th>
                  <th className="py-2.5 font-medium text-right">Utilisation</th>
                  <th className="py-2.5 font-medium">Active Heavy Appliances</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE9E0]/60">
                {firstColonyHouses.map((h, idx) => {
                  const liveDraw = 2.4 + ((idx * 7) % 5) * 0.8;
                  const util = Math.round((liveDraw / h.sanctionedLoadKw) * 100);

                  return (
                    <tr key={h.id} className="hover:bg-[#F5FAF6]">
                      <td className="py-2.5 tabular-nums text-[#5B6B62]">#{idx + 1}</td>
                      <td className="py-2.5 font-medium text-[#0C3B2B]">{h.label}</td>
                      <td className="py-2.5 text-right tabular-nums">{h.sanctionedLoadKw} kW</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-[#0C3B2B]">
                        {liveDraw.toFixed(1)} kW
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span
                          className={`font-medium ${
                            util > 85 ? 'text-[#C73E3A]' : util >= 70 ? 'text-[#E9A820]' : 'text-[#27A163]'
                          }`}
                        >
                          {util}%
                        </span>
                      </td>
                      <td className="py-2.5 text-[#5B6B62] truncate max-w-xs">
                        {h.appliances.filter((a) => a.heavy).map((a) => a.name).slice(0, 2).join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // All Feeders Main Overview
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          Smart Feeder Load Management
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          Feeder-level telemetry, automated overload alerts, soft-limit shedding, and rapid DR triggers
        </p>
      </div>

      {/* Suggestions / Opportunities Panel */}
      <div className="p-4 bg-[#EAF7EE] border border-[#8ED1A8] rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#27A163] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xs font-bold text-[#0C3B2B] uppercase tracking-wide">
              Smart Curtailment Suggestion
            </h2>
            <p className="text-xs text-[#16241D] mt-0.5">
              Shifting <strong>320 kW</strong> in <strong>Kisan Nagar Feeder</strong> will avoid predicted evening transformer stress.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={<Radio className="w-3.5 h-3.5" />}
          onClick={() => handleQuickDr('colony-kisan-4', 320)}
        >
          Dispatch DR Now
        </Button>
      </div>

      {/* Main Feeders Table & Heat-map */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0C3B2B]">
              Distribution Feeder Status Matrix
            </h2>
            <p className="text-xs text-[#5B6B62]">
              Live telemetry and capacity utilization across all 8 feeders
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDE9E0] text-[#5B6B62]">
              <tr>
                <th className="py-3 font-medium">Feeder Name</th>
                <th className="py-3 font-medium">Zone</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium text-right">Live Load</th>
                <th className="py-3 font-medium text-right">Capacity</th>
                <th className="py-3 font-medium text-center w-36">Utilisation Bar</th>
                <th className="py-3 font-medium text-right">Soft Limit</th>
                <th className="py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE9E0]/60">
              {INITIAL_TOPOLOGY.feeders.map((f) => {
                const r = feederReadings[f.id];
                const status = feederStatuses[f.id] || 'stable';
                const loadKw = r ? r.demandKw : f.capacityKw * 0.45;
                const loadPct = Math.round((loadKw / f.capacityKw) * 100);
                const softLimit = feederSoftLimits[f.id] || f.capacityKw * 0.9;
                const area = INITIAL_TOPOLOGY.areas.find((a) => a.id === f.areaId);

                return (
                  <tr key={f.id} className="hover:bg-[#F5FAF6] transition-colors">
                    <td className="py-3 font-semibold text-[#0C3B2B]">
                      <button
                        onClick={() => navigate(`/powerhouse/load/${f.id}`)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {f.name}
                      </button>
                    </td>
                    <td className="py-3 text-[#5B6B62]">{area?.name}</td>
                    <td className="py-3">
                      <StatusPill status={status} size="sm" />
                    </td>
                    <td className="py-3 text-right font-medium text-[#0C3B2B] tabular-nums">
                      {formatPower(loadKw)}
                    </td>
                    <td className="py-3 text-right text-[#5B6B62] tabular-nums">
                      {formatPower(f.capacityKw)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#EAF7EE] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              loadPct > 90
                                ? 'bg-[#C73E3A]'
                                : loadPct >= 80
                                ? 'bg-[#E9A820]'
                                : 'bg-[#27A163]'
                            }`}
                            style={{ width: `${Math.min(100, loadPct)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums w-8 text-right">
                          {loadPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {editingLimitFeederId === f.id ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={softLimitInput}
                            onChange={(e) => setSoftLimitInput(e.target.value)}
                            className="w-16 text-xs p-1 border rounded"
                          />
                          <button
                            onClick={() => {
                              setFeederSoftLimit(f.id, parseFloat(softLimitInput));
                              setEditingLimitFeederId(null);
                            }}
                            className="text-[#27A163] font-bold"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLimitFeederId(f.id);
                            setSoftLimitInput(softLimit.toString());
                          }}
                          className="text-[#5B6B62] hover:text-[#0C3B2B] underline decoration-dotted"
                          title="Click to adjust soft limit"
                        >
                          {formatPower(softLimit)}
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/powerhouse/load/${f.id}`)}
                      >
                        Drill Down →
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
