import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../store/useSessionStore';
import { useGridStore } from '../../../store/useGridStore';
import { useStorageStore } from '../../../store/useStorageStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { useOutageStore } from '../../../store/useOutageStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { getPublicHeadline, getStatusColor } from '../../../domain/status';
import { SupplyRibbon, RibbonSegment } from '../../../components/charts/SupplyRibbon';
import { AlertCard } from '../../../components/shared/AlertCard';
import { formatPower } from '../../../lib/format';
import { forecastProvider } from '../../../data/mock/forecastMock';
import { useNow } from '../../../hooks/useNow';
import { calculateBatteryMinutesRemaining } from '../../../domain/selectors';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ZapOff,
  BatteryMedium,
  Radio,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { now } = useNow();

  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const language = useSessionStore((s) => s.language);
  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedColonyId);

  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const batteries = useStorageStore((s) => s.batteries);
  const alerts = useAlertStore((s) => s.alerts);
  const drEvents = useDemandResponseStore((s) => s.events);
  const getOutageForColony = useOutageStore((s) => s.getOutageForColony);

  const [ribbonSegments, setRibbonSegments] = useState<RibbonSegment[]>([]);

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
        (e.scope.level === 'area' && colony && e.scope.ids.includes(colony.areaId)) ||
        (e.scope.level === 'colony' && e.scope.ids.includes(selectedColonyId)))
  );

  useEffect(() => {
    let mounted = true;
    async function loadOutlook() {
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
      }
    }
    loadOutlook();
    return () => {
      mounted = false;
    };
  }, [selectedColonyId, now]);

  const headline = getPublicHeadline(effectiveStatus, language);
  const statusColor = getStatusColor(effectiveStatus);

  const statusIcon = {
    stable: <CheckCircle2 className="w-8 h-8 text-[#27A163]" />,
    watch: <AlertTriangle className="w-8 h-8 text-[#E9A820]" />,
    constrained: <AlertCircle className="w-8 h-8 text-[#E2702B]" />,
    outage: <ZapOff className="w-8 h-8 text-[#C73E3A]" />,
  }[effectiveStatus];

  // Latest 3 relevant alerts
  const colonyAlerts = alerts
    .filter(
      (a) =>
        a.scope.level === 'powerhouse' ||
        (a.scope.level === 'colony' && a.scope.ids.includes(selectedColonyId)) ||
        (a.scope.level === 'area' && colony && a.scope.ids.includes(colony.areaId))
    )
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* 20px Radius Signature Public Status Headline Panel */}
      <section
        className={`p-6 sm:p-8 rounded-[20px] border ${statusColor.borderClass} ${statusColor.bgClass} flex flex-col gap-4 shadow-sm`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white rounded-[12px] shadow-xs shrink-0">
              {statusIcon}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#5B6B62] uppercase tracking-wider">
                {colony?.name}
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold font-heading text-[#0C3B2B] tracking-tight mt-1 text-balance">
                {headline}
              </h1>
            </div>
          </div>
        </div>

        {/* 24-Hour Public Status Ribbon (Status Only, 36px, plain text below) */}
        <div className="pt-2 border-t border-[#DDE9E0]/60">
          <span className="text-xs font-semibold text-[#5B6B62] block mb-2">
            {language === 'hi' ? 'अगले 24 घंटे की आपूर्ति स्थिति' : 'Next 24 Hours Supply Outlook'}
          </span>
          <SupplyRibbon
            segments={ribbonSegments}
            nowTs={now}
            variant="public"
          />
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
            onClick={() => navigate(`/colony/houses/${useSessionStore.getState().selectedHouseId}`)}
            className="text-xs font-semibold text-[#13724A] hover:underline self-end sm:self-center shrink-0 cursor-pointer"
          >
            Check your appliances →
          </button>
        </div>
      )}

      {/* Now Metric Tiles: Usage, Battery, Ask */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Colony Current Usage */}
        <div className="p-5 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] font-medium">Colony Current Usage</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {reading ? formatPower(reading.demandKw) : '—'}
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            Across {colony?.houseCount || 30} households
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
              {battery ? `${battery.socPct}%` : '80%'}
            </span>
            <span className="text-xs font-semibold text-[#5B6B62] tabular-nums">
              (~{batteryMins} mins backup)
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62] truncate">
            Powers: Water pump, stair lights, clinics
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
              {reading ? formatPower(reading.solarKw) : '—'}
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            From local rooftop & feeder solar
          </span>
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0C3B2B]">
            {language === 'hi' ? 'नवीनतम सूचनाएं' : 'Latest Neighborhood Announcements'}
          </h2>
          <button
            onClick={() => navigate('/colony/alerts')}
            className="text-xs font-semibold text-[#27A163] hover:text-[#13724A] flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {colonyAlerts.length === 0 ? (
          <p className="text-xs text-[#5B6B62] p-6 text-center bg-white rounded-[12px] border border-dashed border-[#DDE9E0]">
            No active alerts right now. Power supply is healthy.
          </p>
        ) : (
          colonyAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} isPublic={true} />
          ))
        )}
      </div>
    </div>
  );
};
