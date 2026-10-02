import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertStore } from '../../../store/useAlertStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { AlertCard } from '../../../components/shared/AlertCard';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { MessageSquare, Bell } from 'lucide-react';

export const PublicAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedColonyId);
  const alerts = useAlertStore((s) => s.alerts);
  const messages = useAlertStore((s) => s.messages);

  const unreadSmsCount = messages.filter(
    (m) => m.colonyId === selectedColonyId && !m.read
  ).length;

  const [filterType, setFilterType] = useState<string>('all');

  // Filter alerts relevant to this colony
  const colonyAlerts = alerts.filter((a) => {
    const isRelevant =
      a.scope.level === 'powerhouse' ||
      (a.scope.level === 'colony' && a.scope.ids.includes(selectedColonyId)) ||
      (a.scope.level === 'area' && colony && a.scope.ids.includes(colony.areaId));

    if (!isRelevant) return false;
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
            Neighborhood Notices & Alerts
          </h1>
          <p className="text-xs text-[#5B6B62] mt-1">
            Real-time broadcast feed from the Power House dispatch console
          </p>
        </div>

        {/* Link to SMS phone inbox */}
        <button
          onClick={() => navigate('/colony/messages')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DDE9E0] hover:border-[#27A163] rounded-[6px] text-xs font-semibold text-[#0C3B2B] shadow-xs cursor-pointer transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-[#27A163]" />
          <span>Open Phone SMS Inbox</span>
          {unreadSmsCount > 0 && (
            <span className="text-[10px] bg-[#C73E3A] text-white px-1.5 py-0.2 rounded-full font-bold tabular-nums">
              {unreadSmsCount} new
            </span>
          )}
        </button>
      </div>

      {/* Filter Segmented Control */}
      <SegmentedControl
        options={[
          { value: 'all', label: 'All Notices' },
          { value: 'weather', label: 'Weather / Solar' },
          { value: 'demand_response', label: 'Demand Response' },
          { value: 'high_load', label: 'High Load' },
          { value: 'maintenance', label: 'Maintenance' },
        ]}
        value={filterType}
        onChange={setFilterType}
        size="sm"
      />

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        {colonyAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B62] bg-white border border-dashed border-[#DDE9E0] rounded-[12px]">
            No alerts match this filter. Supply conditions are currently stable.
          </div>
        ) : (
          colonyAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} isPublic={true} />
          ))
        )}
      </div>
    </div>
  );
};
