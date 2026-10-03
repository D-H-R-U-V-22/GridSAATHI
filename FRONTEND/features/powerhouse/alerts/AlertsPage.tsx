import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { AlertComposer } from '../../../components/shared/AlertComposer';
import { AlertCard } from '../../../components/shared/AlertCard';
import { useAlertStore } from '../../../store/useAlertStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { weatherSim } from '../../../data/mock/weatherMock';
import { useGridStore } from '../../../store/useGridStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { formatPower } from '../../../lib/format';
import { Cloud, Wind, Sun, Droplets, Zap, Wrench, Check, Sparkles, Send } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { RecommendationsFeed } from '../../ph/RecommendationsFeed';
import { DispatchLogTable } from '../../ph/DispatchLogTable';

export const AlertsPage: React.FC = () => {
  const { tab = 'weather' } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const alerts = useAlertStore((s) => s.alerts);
  const drafts = useAlertStore((s) => s.drafts);
  const publishAlert = useAlertStore((s) => s.publishAlert);
  const deleteDraft = useAlertStore((s) => s.deleteDraft);
  const feederReadings = useGridStore((s) => s.feederReadings);
  const simClock = useGridStore((s) => s.simClock);
  const language = useSessionStore((s) => s.language);

  const weather = weatherSim.getSnapshot(simClock);

  const tabList = [
    {
      id: 'weather',
      label: language === 'hi' ? 'मौसम व सौर उतार-चढ़ाव' : 'Weather & Intermittency',
      count: drafts.filter((d) => d.type === 'weather').length,
    },
    {
      id: 'high-load',
      label: language === 'hi' ? 'अधिक लोड व ओवरलोड' : 'High Load & Overload',
      count: drafts.filter((d) => d.type === 'high_load').length,
    },
    {
      id: 'recommendations',
      label: language === 'hi' ? 'एमएल अनुशंसाएं' : 'ML Recommendations',
    },
    {
      id: 'dispatch',
      label: language === 'hi' ? 'फोन डिलीवरी लॉग' : 'Phone Dispatch Log',
    },
    {
      id: 'system',
      label: language === 'hi' ? 'सिस्टम व रखरखाव' : 'System & Maintenance',
      count: drafts.filter((d) => d.type === 'maintenance' || d.type === 'system').length,
    },
  ];

  const handleTabChange = (t: string) => {
    navigate(`/powerhouse/alerts/${t}`);
  };

  const handlePublishDraft = (draft: any) => {
    publishAlert(draft);
    deleteDraft(draft.id);
    showToast({
      type: 'success',
      title: 'Draft Published',
      message: `${draft.title} is now active across public feeds and SMS.`,
    });
  };

  // Filter published alerts by active tab category
  const filteredAlerts = alerts.filter((a) => {
    if (tab === 'weather') return a.type === 'weather';
    if (tab === 'high-load') return a.type === 'high_load' || a.type === 'demand_response';
    return a.type === 'maintenance' || a.type === 'system' || a.type === 'outage';
  });

  // Filter drafts by tab
  const tabDrafts = drafts.filter((d) => {
    if (tab === 'weather') return d.type === 'weather';
    if (tab === 'high-load') return d.type === 'high_load';
    return d.type === 'maintenance' || d.type === 'system';
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          {language === 'hi' ? 'अलर्ट, चेतावनियां एवं नागरिक प्रसारण' : 'Alerts, Warnings & Citizen Broadcasts'}
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          {language === 'hi'
            ? 'ऑटो-ड्राफ्टेड सीमा अलर्ट और कॉलोनियों को लक्षित मल्टी-चैनल घोषणाएं'
            : 'Auto-drafted threshold alerts and targeted multi-channel announcements to colonies'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabList} activeTab={tab} onChange={handleTabChange} />

      {/* Tab: ML Recommendations */}
      {tab === 'recommendations' && <RecommendationsFeed />}

      {/* Tab: Phone Dispatch Log */}
      {tab === 'dispatch' && <DispatchLogTable />}

      {/* Tab 1: Weather & Intermittency Snapshot */}
      {tab === 'weather' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#FEF7E6] text-[#B07B0E]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Cloud Cover</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {Math.round(weather.cloudCoverPct)}%
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#F2F7FD] text-[#1B93A1]">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Wind Speed</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {weather.windSpeedMs.toFixed(1)} <span className="text-xs font-normal">m/s</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#FEFAF2] text-[#E9A820]">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Solar UV Index</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {weather.uvIndex}
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#EAF7EE] text-[#13724A]">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Temperature</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {weather.tempC.toFixed(1)}°C
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: High Load Snapshot */}
      {tab === 'high-load' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INITIAL_TOPOLOGY.feeders.slice(0, 4).map((f) => {
            const r = feederReadings[f.id];
            const loadKw = r ? r.demandKw : f.capacityKw * 0.5;
            const pct = Math.round((loadKw / f.capacityKw) * 100);

            return (
              <div key={f.id} className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0C3B2B] truncate">{f.name}</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      pct > 90 ? 'text-[#C73E3A]' : pct >= 80 ? 'text-[#E9A820]' : 'text-[#27A163]'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      pct > 90 ? 'bg-[#C73E3A]' : pct >= 80 ? 'bg-[#E9A820]' : 'bg-[#27A163]'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#5B6B62]">
                  <span>Load: {formatPower(loadKw)}</span>
                  <span>Cap: {formatPower(f.capacityKw)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-Drafted Alerts Section */}
      {tabDrafts.length > 0 && (
        <div className="bg-[#FEFAF2] border border-[#F8D288] rounded-[12px] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#785103] uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#E9A820]" /> Auto-Drafted Alerts Awaiting Operator Review ({tabDrafts.length})
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {tabDrafts.map((draft) => (
              <div
                key={draft.id}
                className="p-3.5 bg-white border border-[#F8D288] rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#0C3B2B]">{draft.title}</h4>
                  <p className="text-xs text-[#5B6B62] mt-0.5">{draft.body}</p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => handlePublishDraft(draft)}
                  >
                    Approve & Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDraft(draft.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Composer */}
      <AlertComposer
        initialType={
          tab === 'weather'
            ? 'weather'
            : tab === 'high-load'
            ? 'high_load'
            : 'maintenance'
        }
      />

      {/* Published Alerts Feed */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-[#0C3B2B]">
          Active & Published Announcements ({filteredAlerts.length})
        </h3>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B62] bg-white rounded-[12px] border border-dashed border-[#DDE9E0]">
            No alerts currently published in this category. Weather and load triggers will appear here automatically when thresholds are crossed.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
};
