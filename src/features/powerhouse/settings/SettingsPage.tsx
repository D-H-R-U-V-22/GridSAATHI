import React, { useState } from 'react';
import { THRESHOLDS } from '../../../config/thresholds';
import { ALERT_TEMPLATES } from '../../../config/alertTemplates';
import { Button } from '../../../components/ui/Button';
import { useSessionStore } from '../../../store/useSessionStore';
import { useToast } from '../../../components/ui/Toast';
import { Settings, Shield, Sliders, Languages, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);

  const [cloudCoverThresh, setCloudCoverThresh] = useState(THRESHOLDS.weather.highCloudCoverPct.toString());
  const [windLullThresh, setWindLullThresh] = useState(THRESHOLDS.weather.lowWindSpeedMs.toString());
  const [feederConstrainedThresh, setFeederConstrainedThresh] = useState(THRESHOLDS.load.feederConstrainedPct.toString());

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Thresholds Updated',
      message: 'Autonomous auto-draft trigger criteria saved.',
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          System Settings & Threshold Configurations
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          Tune operational parameters for automated threshold alerting and multi-lingual citizen communications
        </p>
      </div>

      {/* Threshold Configuration Form */}
      <form onSubmit={handleSaveThresholds} className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#27A163]" /> Autonomous Alert Trigger Thresholds
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">
              Cloud Cover Trigger (% Overcast)
            </label>
            <input
              type="number"
              value={cloudCoverThresh}
              onChange={(e) => setCloudCoverThresh(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
            <span className="text-[11px] text-[#5B6B62] mt-1 block">Default: 65%</span>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">
              Wind Lull Trigger (Speed &lt; m/s)
            </label>
            <input
              type="number"
              step="0.1"
              value={windLullThresh}
              onChange={(e) => setWindLullThresh(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
            <span className="text-[11px] text-[#5B6B62] mt-1 block">Default: 3.5 m/s</span>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">
              Feeder Overload Trigger (% Capacity)
            </label>
            <input
              type="number"
              value={feederConstrainedThresh}
              onChange={(e) => setFeederConstrainedThresh(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
            <span className="text-[11px] text-[#5B6B62] mt-1 block">Default: 90%</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="primary" type="submit">
            Save Threshold Settings
          </Button>
        </div>
      </form>

      {/* Language Preference */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#27A163]" /> Regional Language Interface
        </h2>
        <p className="text-xs text-[#5B6B62]">
          Toggle primary language across notification broadcasts and citizen views.
        </p>

        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer ${
              language === 'en'
                ? 'bg-[#27A163] text-white border-[#27A163]'
                : 'bg-white text-[#16241D] border-[#DDE9E0] hover:bg-[#F5FAF6]'
            }`}
          >
            English (EN)
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer ${
              language === 'hi'
                ? 'bg-[#27A163] text-white border-[#27A163]'
                : 'bg-white text-[#16241D] border-[#DDE9E0] hover:bg-[#F5FAF6]'
            }`}
          >
            हिंदी (Devanagari)
          </button>
        </div>
      </div>

      {/* Standard Notification Templates */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#27A163]" /> Standard DISCOM Templates ({ALERT_TEMPLATES.length})
        </h2>
        <div className="divide-y divide-[#DDE9E0]/60 text-xs">
          {ALERT_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="py-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <strong className="text-[#0C3B2B]">{tpl.titleEn}</strong>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-[#F5FAF6] rounded text-[#5B6B62]">
                  {tpl.type}
                </span>
              </div>
              <p className="text-[#5B6B62] leading-relaxed">{tpl.bodyEn}</p>
              <p className="text-[#13724A] text-[11px] font-hindi">{tpl.bodyHi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
