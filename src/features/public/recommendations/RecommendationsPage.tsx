import React, { useState } from 'react';
import { useSessionStore } from '../../../store/useSessionStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { useGridStore } from '../../../store/useGridStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { useStorageStore } from '../../../store/useStorageStore';
import { useOutageStore } from '../../../store/useOutageStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { formatTime12h } from '../../../lib/time';
import { useNow } from '../../../hooks/useNow';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  BatteryMedium,
  TrendingDown,
  ShieldCheck,
  Building2,
  Home,
  Check,
  ArrowRight,
  Flame,
  CloudRain,
  Wind,
  Bell,
  Sparkles,
} from 'lucide-react';

interface RecommendationItem {
  id: string;
  sourceSignal: 'weather' | 'high_load' | 'demand_response' | 'pre_cut' | 'outage' | 'stable';
  signalTitle: string;
  title: string;
  description: string;
  urgency: 'immediate' | 'advisory' | 'routine';
  targetAudience: 'household' | 'rwa_community';
  estimatedSavingsInr?: number;
  relievedPowerKw?: number;
  actionText: string;
}

export const RecommendationsPage: React.FC = () => {
  const { now } = useNow();
  const { showToast } = useToast();

  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const language = useSessionStore((s) => s.language);
  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedColonyId);

  const alerts = useAlertStore((s) => s.alerts);
  const drEvents = useDemandResponseStore((s) => s.events);
  const preCutNotices = useStorageStore((s) => s.preCutNotices);
  const activeOutages = useOutageStore((s) => s.activeOutages);
  const reading = useGridStore((s) => s.colonyReadings[selectedColonyId]);

  // Track applied recommendations
  const [appliedRecs, setAppliedRecs] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<'all' | 'household' | 'rwa'>('all');

  // Determine active alerts affecting this colony
  const activeAlerts = alerts.filter(
    (a) =>
      a.status === 'active' &&
      (a.scope.level === 'powerhouse' ||
        (a.scope.ids && a.scope.ids.includes(selectedColonyId)))
  );

  const activeDr = drEvents.find((e) => e.status === 'active');
  const activePreCut = preCutNotices.find((n) => n.colonyId === selectedColonyId);
  const activeOutage = activeOutages.find((o) => o.colonyId === selectedColonyId);

  // Generate dynamic solutions based on active power house signals
  const recommendations: RecommendationItem[] = [];

  // 1. If ongoing outage signal
  if (activeOutage) {
    recommendations.push({
      id: 'rec-outage-switches',
      sourceSignal: 'outage',
      signalTitle: 'Grid Electricity Disrupted (Active Outage)',
      title: 'Turn Off High-Draw Wall Switches (AC, Geysers, Heavy Pumps)',
      description: 'Prevents inrush voltage spikes and secondary substation feeder tripping when grid power is restored by the Power House.',
      urgency: 'immediate',
      targetAudience: 'household',
      relievedPowerKw: 2.2,
      actionText: 'Switches Isolated',
    });

    recommendations.push({
      id: 'rec-outage-battery-consent',
      sourceSignal: 'outage',
      signalTitle: 'Grid Electricity Disrupted (Active Outage)',
      title: 'Verify Shared Battery Power to Clinic & Water Lift',
      description: 'Your community battery bank is armed to power drinking water pumps and medical cold chain.',
      urgency: 'immediate',
      targetAudience: 'rwa_community',
      actionText: 'Verified Active',
    });
  }

  // 2. If pre-cut notice signal
  if (activePreCut) {
    recommendations.push({
      id: 'rec-precut-tanks',
      sourceSignal: 'pre_cut',
      signalTitle: `Scheduled Maintenance Cut at ${formatTime12h(activePreCut.cutAt)}`,
      title: 'Pre-Fill Household & Community Water Tanks Now',
      description: `Run water pumps now before the scheduled cut at ${formatTime12h(activePreCut.cutAt)} so reserves are full during the ${activePreCut.expectedMinutes}-minute maintenance window.`,
      urgency: 'immediate',
      targetAudience: 'household',
      estimatedSavingsInr: 45,
      actionText: 'Tanks Filled',
    });

    recommendations.push({
      id: 'rec-precut-fridge',
      sourceSignal: 'pre_cut',
      signalTitle: `Scheduled Maintenance Cut at ${formatTime12h(activePreCut.cutAt)}`,
      title: 'Lower Refrigerator Temperature to 2°C in Advance',
      description: 'Pre-cools food and milk storage, maintaining safe temperatures for up to 4 hours without opening doors during the cut.',
      urgency: 'advisory',
      targetAudience: 'household',
      actionText: 'Pre-Cooled',
    });
  }

  // 3. If Demand Response Event signal
  if (activeDr) {
    recommendations.push({
      id: 'rec-dr-ac',
      sourceSignal: 'demand_response',
      signalTitle: 'Power House Peak Demand Response Active',
      title: 'Set Air Conditioning to 25°C or 26°C with Ceiling Fan',
      description: 'Running AC at 25°C with a fan gives identical comfort while reducing compressor energy draw by 18% to 24%.',
      urgency: 'immediate',
      targetAudience: 'household',
      estimatedSavingsInr: 80,
      relievedPowerKw: 0.8,
      actionText: 'Set to 25°C',
    });

    recommendations.push({
      id: 'rec-dr-washing',
      sourceSignal: 'demand_response',
      signalTitle: 'Power House Peak Demand Response Active',
      title: 'Postpone Washing Machine & Dishwasher by 90 Minutes',
      description: 'Relieves neighborhood feeder lines during the current critical peak stress window requested by the substation.',
      urgency: 'immediate',
      targetAudience: 'household',
      estimatedSavingsInr: 35,
      relievedPowerKw: 1.2,
      actionText: 'Cycle Deferred',
    });

    recommendations.push({
      id: 'rec-dr-rwa-lighting',
      sourceSignal: 'demand_response',
      signalTitle: 'Power House Peak Demand Response Active',
      title: 'Dim Corridor, Stairwell & Perimeter Lights to 50%',
      description: 'Reduces common area electrical overhead during the peak demand response window.',
      urgency: 'immediate',
      targetAudience: 'rwa_community',
      estimatedSavingsInr: 120,
      relievedPowerKw: 3.5,
      actionText: 'Dimmed by 50%',
    });
  }

  // 4. If Weather Alerts (Thunderstorm, Cloud cover, Wind gust)
  const weatherAlert = activeAlerts.find((a) => a.type === 'weather');
  if (weatherAlert) {
    recommendations.push({
      id: 'rec-weather-surge',
      sourceSignal: 'weather',
      signalTitle: weatherAlert.title,
      title: 'Unplug Sensitive Electronics & Inverter Surge Protection',
      description: 'Atmospheric front or high wind gusts can induce lightning line transients. Keep computers and LED TVs disconnected.',
      urgency: 'immediate',
      targetAudience: 'household',
      actionText: 'Unplugged',
    });

    recommendations.push({
      id: 'rec-weather-solar',
      sourceSignal: 'weather',
      signalTitle: weatherAlert.title,
      title: 'Prepare for Reduced Solar PV Inflow',
      description: 'Dense cloud cover is attenuating rooftop solar generation by ~65%. Draw essential power prudently.',
      urgency: 'advisory',
      targetAudience: 'household',
      actionText: 'Understood',
    });
  }

  // 5. If High Load Alerts
  const highLoadAlert = activeAlerts.find((a) => a.type === 'high_load');
  if (highLoadAlert) {
    recommendations.push({
      id: 'rec-highload-pumps',
      sourceSignal: 'high_load',
      signalTitle: highLoadAlert.title,
      title: 'Avoid Running Submersible Water Pumps Simultaneously',
      description: 'Feeder load is currently nearing thermal limits. Society water pumps should operate in staggered 20-minute batches.',
      urgency: 'immediate',
      targetAudience: 'rwa_community',
      relievedPowerKw: 5.0,
      actionText: 'Schedule Staggered',
    });
  }

  // 6. Evergreen Green Solutions (Always applicable for clean power & bill reduction)
  recommendations.push({
    id: 'rec-evergreen-solar-window',
    sourceSignal: 'stable',
    signalTitle: 'Daily Solar Peak Window (11:00 AM – 2:30 PM)',
    title: 'Schedule Heavy Power Tasks During Midday Solar Peak',
    description: 'Local solar arrays produce maximum clean electricity between 11:00 AM and 2:30 PM. Running washing machines or heating water then utilizes 100% clean power.',
    urgency: 'routine',
    targetAudience: 'household',
    estimatedSavingsInr: 60,
    relievedPowerKw: 1.4,
    actionText: 'Schedule Set',
  });

  recommendations.push({
    id: 'rec-evergreen-led',
    sourceSignal: 'stable',
    signalTitle: 'Energy Efficiency Standard',
    title: 'Replace Hallway Fluorescent Tubes with 9W Inverter LEDs',
    description: 'Consumes 60% less energy and continues operating seamlessly on community backup circuits during low-voltage events.',
    urgency: 'routine',
    targetAudience: 'rwa_community',
    estimatedSavingsInr: 250,
    actionText: 'Upgraded',
  });

  // Filter based on audience category
  const filteredRecs = recommendations.filter((r) => {
    if (filterCategory === 'household') return r.targetAudience === 'household';
    if (filterCategory === 'rwa') return r.targetAudience === 'rwa_community';
    return true;
  });

  const handleApply = (id: string, title: string) => {
    setAppliedRecs((prev) => ({ ...prev, [id]: !prev[id] }));
    const isNowApplied = !appliedRecs[id];
    showToast({
      type: isNowApplied ? 'success' : 'info',
      title: isNowApplied ? 'Recommendation Applied' : 'Marked Incomplete',
      message: isNowApplied
        ? `Great job! Your action directly supports ${colony?.name}'s grid stability.`
        : 'Recommendation marked as pending.',
    });
  };

  const totalAppliedCount = Object.values(appliedRecs).filter(Boolean).length;
  const totalRelievedKw = recommendations
    .filter((r) => appliedRecs[r.id] && r.relievedPowerKw)
    .reduce((sum, r) => sum + (r.relievedPowerKw || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <Lightbulb className="w-5 h-5 text-[#27A163]" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
              Recommended Solutions & Action Plan
            </h1>
          </div>
          <p className="text-xs text-[#5B6B62] mt-1">
            Real-time citizen solutions generated from active Power House grid alerts, peak warnings, and weather signals for <strong>{colony?.name}</strong>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex p-1 bg-white border border-[#DDE9E0] rounded-[8px] text-xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 font-semibold rounded-[6px] transition-colors cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-[#EAF7EE] text-[#13724A]'
                : 'text-[#5B6B62] hover:text-[#16241D]'
            }`}
          >
            All Solutions ({recommendations.length})
          </button>
          <button
            onClick={() => setFilterCategory('household')}
            className={`px-3 py-1 font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1 ${
              filterCategory === 'household'
                ? 'bg-[#EAF7EE] text-[#13724A]'
                : 'text-[#5B6B62] hover:text-[#16241D]'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> For Household
          </button>
          <button
            onClick={() => setFilterCategory('rwa')}
            className={`px-3 py-1 font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1 ${
              filterCategory === 'rwa'
                ? 'bg-[#EAF7EE] text-[#13724A]'
                : 'text-[#5B6B62] hover:text-[#16241D]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> For RWA Committee
          </button>
        </div>
      </div>

      {/* Collective Impact Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#5B6B62]">Your Actions Completed</span>
            <p className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
              {totalAppliedCount} <span className="text-xs font-normal text-[#5B6B62]">of {recommendations.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#27A163]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#5B6B62]">Neighborhood Load Relieved</span>
            <p className="text-2xl font-bold font-heading text-[#13724A] tabular-nums mt-0.5">
              {totalRelievedKw.toFixed(1)} <span className="text-xs font-normal">kW</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#13724A]">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#5B6B62]">Colony Grid Health Score</span>
            <p className="text-2xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
              94% <span className="text-xs font-medium text-[#27A163]">Stable</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#27A163]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Grid Trigger Signals Banner */}
      {(activeOutage || activePreCut || activeDr || activeAlerts.length > 0) && (
        <div className="p-4 bg-[#FEFAF2] border border-[#F8D288] rounded-[12px] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#B07B0E]" />
            <span className="text-xs font-bold text-[#785103] uppercase tracking-wider">
              Signals Currently Driving These Recommendations:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {activeOutage && (
              <span className="px-2.5 py-1 bg-[#FCEEED] text-[#9E2824] rounded-[4px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Feeder Outage Active
              </span>
            )}
            {activePreCut && (
              <span className="px-2.5 py-1 bg-[#FEFAF2] text-[#B07B0E] rounded-[4px] font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pre-Cut Notice ({formatTime12h(activePreCut.cutAt)})
              </span>
            )}
            {activeDr && (
              <span className="px-2.5 py-1 bg-[#EAF7EE] text-[#13724A] rounded-[4px] font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Substation Demand Response Requested
              </span>
            )}
            {activeAlerts.map((a) => (
              <span key={a.id} className="px-2.5 py-1 bg-white border border-[#F8D288] text-[#785103] rounded-[4px]">
                {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Solution Cards List */}
      <div className="flex flex-col gap-3">
        {filteredRecs.map((rec) => {
          const isApplied = !!appliedRecs[rec.id];

          return (
            <div
              key={rec.id}
              className={`p-5 rounded-[14px] border transition-all ${
                isApplied
                  ? 'bg-[#F9FCFA] border-[#8ED1A8]/60 shadow-xs'
                  : rec.urgency === 'immediate'
                  ? 'bg-white border-[#ECA3A0] shadow-xs'
                  : 'bg-white border-[#DDE9E0] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  {/* Signal origin badge & audience */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                        rec.urgency === 'immediate'
                          ? 'bg-[#FCEEED] text-[#9E2824]'
                          : rec.urgency === 'advisory'
                          ? 'bg-[#FEFAF2] text-[#B07B0E]'
                          : 'bg-[#EAF7EE] text-[#13724A]'
                      }`}
                    >
                      {rec.urgency === 'immediate' ? 'Urgent Action' : rec.urgency === 'advisory' ? 'Advisory' : 'Best Practice'}
                    </span>

                    <span className="text-[11px] text-[#5B6B62] flex items-center gap-1">
                      Signal: <strong className="text-[#16241D]">{rec.signalTitle}</strong>
                    </span>

                    <span className="text-[11px] text-[#5B6B62] flex items-center gap-1 ml-auto sm:ml-0">
                      {rec.targetAudience === 'household' ? (
                        <span className="flex items-center gap-1 font-medium text-[#0C3B2B]">
                          <Home className="w-3 h-3 text-[#27A163]" /> Household
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-[#1B93A1]">
                          <Building2 className="w-3 h-3 text-[#1B93A1]" /> RWA Society
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Recommendation Title */}
                  <h3 className={`text-base font-bold text-[#0C3B2B] ${isApplied ? 'line-through text-[#5B6B62]' : ''}`}>
                    {rec.title}
                  </h3>

                  <p className="text-xs text-[#5B6B62] mt-1 leading-relaxed">
                    {rec.description}
                  </p>

                  {/* Impact metrics: Money saved & kW relieved */}
                  <div className="flex flex-wrap items-center gap-3 text-xs mt-2.5">
                    {rec.relievedPowerKw && (
                      <span className="text-[#13724A] font-semibold bg-[#EAF7EE] px-2 py-0.5 rounded-[4px] tabular-nums">
                        ⚡ Relieves ~{rec.relievedPowerKw} kW load
                      </span>
                    )}
                    {rec.estimatedSavingsInr && (
                      <span className="text-[#0C3B2B] font-semibold bg-[#F5FAF6] border border-[#DDE9E0] px-2 py-0.5 rounded-[4px] tabular-nums">
                        💰 Saves ~₹{rec.estimatedSavingsInr}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant={isApplied ? 'outline' : rec.urgency === 'immediate' ? 'primary' : 'secondary'}
                    icon={isApplied ? <Check className="w-3.5 h-3.5 text-[#13724A]" /> : undefined}
                    onClick={() => handleApply(rec.id, rec.title)}
                  >
                    {isApplied ? 'Applied ✓' : rec.actionText}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
