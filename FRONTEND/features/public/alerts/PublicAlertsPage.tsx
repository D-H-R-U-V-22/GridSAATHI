import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertStore } from '../../../store/useAlertStore';
import { useLocationStore } from '../../../store/useLocationStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useStorageStore } from '../../../store/useStorageStore';
import { useOutageStore } from '../../../store/useOutageStore';
import { AlertCard } from '../../../components/shared/AlertCard';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { formatTime12h } from '../../../lib/time';
import {
  MessageSquare,
  Bell,
  BatteryMedium,
  CheckCircle2,
  Clock,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const PublicAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const language = useSessionStore((s) => s.language);
  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const currentArea = useLocationStore((s) => s.currentArea);
  const currentColony = useLocationStore((s) => s.currentColony);

  const alerts = useAlertStore((s) => s.alerts);
  const messages = useAlertStore((s) => s.messages);
  const preCutNotices = useStorageStore((s) => s.preCutNotices);
  const batteries = useStorageStore((s) => s.batteries);
  const activeOutages = useOutageStore((s) => s.activeOutages);

  const [activeTab, setActiveTab] = useState<string>('all');

  const unreadSmsCount = messages.filter(
    (m) => m.colonyId === selectedColonyId && !m.read
  ).length;

  // Filter alerts relevant to this area/colony
  const colonyAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const isRelevant =
        a.scope.level === 'powerhouse' ||
        (a.scope.level === 'colony' && a.scope.ids.includes(selectedColonyId)) ||
        (a.scope.level === 'area' && a.scope.ids.includes(currentArea.id));

      if (!isRelevant) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'weather') return a.type === 'weather';
      if (activeTab === 'high_load') return a.type === 'high_load' || a.type === 'demand_response';
      if (activeTab === 'power_cuts') return a.type === 'outage' || a.type === 'storage';
      if (activeTab === 'maintenance') return a.type === 'maintenance';
      return true;
    });
  }, [alerts, selectedColonyId, currentArea.id, activeTab]);

  const activePreCut = preCutNotices.find((n) => n.colonyId === selectedColonyId);
  const currentBattery = batteries[selectedColonyId];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <Bell className="w-5 h-5 text-[#27A163]" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
              {language === 'hi' ? 'ग्रिड अलर्ट व स्थानीय सूचनाएं' : 'Neighbourhood Notices & Alerts'}
            </h1>
          </div>
          <p className="text-xs text-[#5B6B62] mt-1">
            Real-time broadcast stream issued directly by <strong>{currentArea.name[language === 'hi' ? 'hi' : 'en']}</strong> dispatch console
          </p>
        </div>

        {/* Link to SMS phone inbox */}
        <button
          onClick={() => navigate('/colony/messages')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DDE9E0] hover:border-[#27A163] rounded-[6px] text-xs font-semibold text-[#0C3B2B] shadow-xs cursor-pointer transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-[#27A163]" />
          <span>{language === 'hi' ? 'एसएमएस इनबॉक्स' : 'Open Phone SMS Inbox'}</span>
          {unreadSmsCount > 0 && (
            <span className="text-[10px] bg-[#C73E3A] text-white px-1.5 py-0.2 rounded-full font-bold tabular-nums">
              {unreadSmsCount} new
            </span>
          )}
        </button>
      </div>

      {/* 5 Specific Tabs per specification: All · Weather · High load · Power cuts & backup · Maintenance */}
      <SegmentedControl
        options={[
          { value: 'all', label: language === 'hi' ? 'सभी सूचनाएं' : 'All Notices' },
          { value: 'weather', label: language === 'hi' ? 'मौसम व सौर' : 'Weather' },
          { value: 'high_load', label: language === 'hi' ? 'पीक लोड / DR' : 'High Load' },
          { value: 'power_cuts', label: language === 'hi' ? 'कटौती व बैकअप' : 'Power Cuts & Backup' },
          { value: 'maintenance', label: language === 'hi' ? 'रखरखाव कार्य' : 'Maintenance' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        size="sm"
      />

      {/* Backup Status & History Card (visible on Power cuts & backup tab or when outage is active) */}
      {(activeTab === 'power_cuts' || activeTab === 'all') && (
        <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#DDE9E0]/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
                <BatteryMedium className="w-4 h-4 text-[#27A163]" />
              </span>
              <h2 className="text-sm font-bold text-[#0C3B2B]">
                {language === 'hi' ? 'सामुदायिक बैटरी बैकअप व कटौती इतिहास' : 'Community Battery Backup & Outage Log'}
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#13724A] bg-[#EAF7EE] px-2 py-0.5 rounded-[4px] tabular-nums">
              {currentBattery ? `${currentBattery.socPct}% Armed` : '84% Armed'}
            </span>
          </div>

          {activePreCut && (
            <div className="p-3.5 bg-[#FEFAF2] border border-[#F8D288] rounded-[10px] flex items-start gap-2.5 text-xs text-[#785103]">
              <Clock className="w-4 h-4 text-[#B07B0E] shrink-0 mt-0.5" />
              <div>
                <strong>Scheduled Pre-Cut Maintenance:</strong> Cut starts at {formatTime12h(activePreCut.cutAt)}. Expected duration: {activePreCut.expectedMinutes} mins.
              </div>
            </div>
          )}

          {/* Backup History Table */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#DDE9E0] text-[11px] text-[#5B6B62] font-semibold">
                  <th className="pb-2">Event Date</th>
                  <th className="pb-2">Incident / Maintenance Type</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Backup Powered</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE9E0]/50 text-[#16241D]">
                <tr>
                  <td className="py-2.5 font-medium tabular-nums">Today, 11:20 AM</td>
                  <td className="py-2.5">33kV Substation Isolator Servicing</td>
                  <td className="py-2.5 tabular-nums">42 mins</td>
                  <td className="py-2.5 text-[#13724A]">Drinking water pump, Primary Clinic</td>
                  <td className="py-2.5 text-right font-semibold text-[#27A163]">Restored ✓</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium tabular-nums">Yesterday, 04:15 PM</td>
                  <td className="py-2.5">Transient Feeder Jumper Flashover</td>
                  <td className="py-2.5 tabular-nums">18 mins</td>
                  <td className="py-2.5 text-[#13724A]">Staircase lighting & lift circuit</td>
                  <td className="py-2.5 text-right font-semibold text-[#27A163]">Restored ✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        {colonyAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B62] bg-white border border-dashed border-[#DDE9E0] rounded-[12px]">
            {language === 'hi'
              ? 'इस श्रेणी में कोई सक्रिय अलर्ट नहीं है। विद्युत आपूर्ति सामान्य है।'
              : 'No alerts match this filter. Supply conditions are currently stable.'}
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
