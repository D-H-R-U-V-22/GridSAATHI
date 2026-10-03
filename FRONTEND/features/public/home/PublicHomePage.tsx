import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../store/useSessionStore';
import { useLocationStore } from '../../../store/useLocationStore';
import { useGridStore } from '../../../store/useGridStore';
import { useStorageStore } from '../../../store/useStorageStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { useOutageStore } from '../../../store/useOutageStore';
import { getPublicHeadline, getStatusColor } from '../../../domain/status';
import { formatPower } from '../../../lib/format';
import { calculateBatteryMinutesRemaining } from '../../../domain/selectors';
import { CarbonImpactSection } from './CarbonImpactSection';
import { AnnouncementsCarousel } from './AnnouncementsCarousel';
import { PublicColonyMapCard } from '../../../components/maps/PublicColonyMapCard';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ZapOff,
  BatteryMedium,
  Radio,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();

  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const language = useSessionStore((s) => s.language);

  const currentArea = useLocationStore((s) => s.currentArea);
  const currentColony = useLocationStore((s) => s.currentColony);

  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const batteries = useStorageStore((s) => s.batteries);
  const alerts = useAlertStore((s) => s.alerts);
  const drEvents = useDemandResponseStore((s) => s.events);
  const getOutageForColony = useOutageStore((s) => s.getOutageForColony);

  const reading = colonyReadings[selectedColonyId];
  const colonyStatus = colonyStatuses[selectedColonyId] || 'stable';
  const battery = batteries[selectedColonyId];
  const batteryMins = calculateBatteryMinutesRemaining(
    battery,
    reading?.demandKw ? reading.demandKw * 0.2 : 20
  );

  const hasOutage = !!getOutageForColony(selectedColonyId);
  const effectiveStatus = hasOutage ? 'outage' : colonyStatus;

  // Active demand-response ask for this colony
  const activeDr = drEvents.find(
    (e) =>
      e.status === 'active' &&
      (e.scope.level === 'powerhouse' ||
        (e.scope.level === 'area' && e.scope.ids.includes(currentArea.id)) ||
        (e.scope.level === 'colony' && e.scope.ids.includes(selectedColonyId)))
  );

  // Scoped alerts: only alerts targeting this powerhouse area or colony
  const colonyAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (a.status !== 'active') return false;
      if (a.scope.level === 'powerhouse') {
        // Match legacy or current area id
        return (
          a.scope.ids.includes(currentArea.id) ||
          a.scope.ids.includes(currentArea.legacyAreaId) ||
          a.scope.ids.includes('ph-pragati')
        );
      }
      if (a.scope.level === 'colony') {
        return a.scope.ids.includes(selectedColonyId);
      }
      if (a.scope.level === 'area') {
        return a.scope.ids.includes(currentArea.id);
      }
      return true;
    });
  }, [alerts, currentArea, selectedColonyId]);

  const headline = getPublicHeadline(effectiveStatus, language);
  const statusColor = getStatusColor(effectiveStatus);

  const statusIcon = {
    stable: <CheckCircle2 className="w-7 h-7 text-[#27A163]" />,
    watch: <AlertTriangle className="w-7 h-7 text-[#E9A820]" />,
    constrained: <AlertCircle className="w-7 h-7 text-[#E2702B]" />,
    outage: <ZapOff className="w-7 h-7 text-[#C73E3A]" />,
  }[effectiveStatus];

  // Derive compact advisory subline from live alert state
  const topActiveAlert = colonyAlerts[0];
  const advisoryLine = topActiveAlert
    ? `${topActiveAlert.title} · Active advisory window`
    : effectiveStatus === 'stable'
    ? 'All 11kV distribution feeders energized and operating within nominal frequency (50.0 Hz).'
    : 'Substation dispatchers are managing line balancing.';

  return (
    <div className="flex flex-col gap-6">
      {/* 20px Radius Signature Public Status Headline Panel (Green Bar Removed) */}
      <section
        className={`p-5 sm:p-7 rounded-[20px] border ${statusColor.borderClass} ${statusColor.bgClass} flex flex-col gap-3 shadow-sm`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white rounded-[12px] shadow-xs shrink-0">
              {statusIcon}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#5B6B62] uppercase tracking-wider">
                {currentColony.name[language === 'hi' ? 'hi' : 'en']} · {currentArea.name[language === 'hi' ? 'hi' : 'en']}
              </span>
              <h1 className="text-xl sm:text-3xl font-bold font-heading text-[#0C3B2B] tracking-tight mt-0.5 text-balance">
                {headline}
              </h1>
            </div>
          </div>
        </div>

        {/* Compact Live Advisory Line underneath headline */}
        <div className="pt-2 border-t border-[#DDE9E0]/50 flex items-center justify-between text-xs text-[#5B6B62]">
          <span className="flex items-center gap-1.5 font-medium text-[#0C3B2B] truncate">
            <Clock className="w-3.5 h-3.5 text-[#13724A] shrink-0" />
            <span className="truncate">{advisoryLine}</span>
          </span>
          <span className="text-[11px] text-[#13724A] font-semibold shrink-0 ml-2">
            {colonyAlerts.length} active {colonyAlerts.length === 1 ? 'alert' : 'alerts'}
          </span>
        </div>
      </section>

      {/* Active Demand Response Ask Banner if present */}
      {activeDr && (
        <div className="p-4 bg-[#FEFAF2] border border-[#F8D288] rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-[#B07B0E] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-[#785103] uppercase tracking-wide">
                Active Neighborhood Energy Saving Ask
              </h2>
              <p className="text-xs text-[#16241D] mt-0.5">{activeDr.message}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/colony/recommendations')}
            className="text-xs font-semibold text-[#13724A] hover:underline self-end sm:self-center shrink-0 cursor-pointer"
          >
            Recommended actions →
          </button>
        </div>
      )}

      {/* Now Metric Tiles: Usage, Battery, Inflow */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Colony Current Usage */}
        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] font-medium">Colony Current Usage</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {reading ? formatPower(reading.demandKw) : '142 kW'}
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            Across {currentColony.houseCount} households
          </span>
        </div>

        {/* Community Battery Level */}
        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5B6B62] font-medium">Community Battery</span>
            <BatteryMedium className="w-4 h-4 text-[#27A163]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#13724A] tabular-nums">
              {battery ? `${battery.socPct}%` : '84%'}
            </span>
            <span className="text-xs font-semibold text-[#5B6B62] tabular-nums">
              (~{batteryMins} mins backup)
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62] truncate">
            Armed for: Drinking water lift, clinics, streetlights
          </span>
        </div>

        {/* Local Solar Support */}
        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5B6B62] font-medium">Clean Energy Inflow</span>
            <ShieldCheck className="w-4 h-4 text-[#27A163]" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#B07B0E] tabular-nums">
              {reading ? formatPower(reading.solarKw) : '86 kW'}
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            From local rooftop & feeder solar
          </span>
        </div>
      </div>

      {/* Neighbourhood Google Maps Viewport */}
      <PublicColonyMapCard />

      {/* Carbon Impact Section (India-specific CEA Baseline Calculations) */}
      <CarbonImpactSection
        currentCleanKw={reading?.solarKw || 86}
        currentDemandKw={reading?.demandKw || 142}
      />

      {/* Latest Neighbourhood Announcements Carousel */}
      <AnnouncementsCarousel alerts={colonyAlerts} />
    </div>
  );
};
