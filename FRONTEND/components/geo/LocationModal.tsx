import React, { useState } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { useSessionStore } from '../../store/useSessionStore';
import { ALL_AREAS } from '../../lib/geo/locate';
import { Button } from '../ui/Button';
import {
  MapPin,
  Navigation,
  Check,
  X,
  ShieldCheck,
  Building,
  Info,
  ChevronRight,
} from 'lucide-react';

export const LocationModal: React.FC = () => {
  const isModalOpen = useLocationStore((s) => s.isModalOpen);
  const setModalOpen = useLocationStore((s) => s.setModalOpen);
  const detectLocation = useLocationStore((s) => s.detectLocation);
  const setManualSelection = useLocationStore((s) => s.setManualSelection);
  const selectedAreaId = useLocationStore((s) => s.selectedAreaId);
  const selectedColonyId = useLocationStore((s) => s.selectedColonyId);
  const isDetecting = useLocationStore((s) => s.isDetecting);
  const detectedLocation = useLocationStore((s) => s.detectedLocation);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const language = useSessionStore((s) => s.language);

  // Manual selection states
  const [manualAreaId, setManualAreaId] = useState(selectedAreaId);
  const [manualColonyId, setManualColonyId] = useState(selectedColonyId);
  const [activeTab, setActiveTab] = useState<'detect' | 'manual'>('detect');

  if (!isModalOpen) return null;

  const currentManualArea = ALL_AREAS.find((a) => a.id === manualAreaId) || ALL_AREAS[0];

  const handleDetect = async () => {
    const success = await detectLocation();
    if (success) {
      setTimeout(() => setModalOpen(false), 900);
    }
  };

  const handleSaveManual = () => {
    setManualSelection(manualAreaId, manualColonyId);
    setModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#DDE9E0] rounded-[16px] max-w-[520px] w-full shadow-floating overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DDE9E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <MapPin className="w-4 h-4 text-[#27A163]" />
            </span>
            <div>
              <h3 className="text-base font-bold font-heading text-[#0C3B2B]">
                {language === 'hi' ? 'स्थान व क्षेत्र चयन' : 'Service Area & Colony Location'}
              </h3>
              <p className="text-xs text-[#5B6B62]">
                {language === 'hi'
                  ? 'सटीक ग्रिड अलर्ट और फीडर लोड के लिए अपना क्षेत्र चुनें'
                  : 'Area-specific grid alerts, solar outlook & feeder telemetry'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="p-1 text-[#5B6B62] hover:text-[#16241D] rounded-[6px] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 pb-0 flex border-b border-[#DDE9E0] bg-[#F5FAF6] text-xs">
          <button
            onClick={() => setActiveTab('detect')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'detect'
                ? 'border-[#27A163] text-[#0C3B2B]'
                : 'border-transparent text-[#5B6B62]'
            }`}
          >
            {language === 'hi' ? 'ऑटो-डिटेक्ट (GPS)' : 'Auto-Detect (GPS)'}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-[#27A163] text-[#0C3B2B]'
                : 'border-transparent text-[#5B6B62]'
            }`}
          >
            {language === 'hi' ? 'मैन्युअल चयन' : 'Manual Selector'}
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          {activeTab === 'detect' ? (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-[#EAF7EE]/60 border border-[#DDE9E0] rounded-[10px] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#13724A] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#0C3B2B] leading-relaxed">
                  <strong>Privacy first (DPDP Act 2023 compliant):</strong> We test your coordinates against local distribution feeder boundary polygons. We never track movement or upload your raw GPS coordinates to external servers.
                </div>
              </div>

              {detectedLocation && (
                <div className="p-3 bg-[#F5FAF6] border border-[#27A163]/40 rounded-[10px] flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#13724A] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Location Resolved
                  </span>
                  <div className="text-xs text-[#0C3B2B] font-semibold">
                    {detectedLocation.colony.name[language === 'hi' ? 'hi' : 'en']}
                  </div>
                  <div className="text-[11px] text-[#5B6B62]">
                    Substation: {detectedLocation.area.name[language === 'hi' ? 'hi' : 'en']} ({detectedLocation.area.district[language === 'hi' ? 'hi' : 'en']})
                  </div>
                  {!detectedLocation.isInsidePolygon && (
                    <span className="text-[10px] text-[#B07B0E] bg-[#FEFAF2] px-2 py-0.5 rounded mt-1">
                      Matched to nearest service area ({detectedLocation.distanceKm} km away)
                    </span>
                  )}
                </div>
              )}

              {permissionStatus === 'denied' && (
                <div className="p-3 bg-[#FCEEED] border border-[#ECA3A0] rounded-[10px] text-[#9E2824] text-[11px]">
                  GPS permission was blocked or timed out. Please choose your area manually from the tab above.
                </div>
              )}

              <Button
                variant="primary"
                icon={<Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />}
                onClick={handleDetect}
                disabled={isDetecting}
                className="w-full justify-center py-2.5"
              >
                {isDetecting
                  ? language === 'hi'
                    ? 'स्थान खोजा जा रहा है...'
                    : 'Locating & matching boundary...'
                  : language === 'hi'
                  ? 'जीपीएस द्वारा स्थान पहचानें'
                  : 'Detect My Location'}
              </Button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className="text-center text-[11px] text-[#13724A] hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'या सूची में से खुद चुनें →' : 'Or select your colony from list →'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#0C3B2B] mb-1">
                  1. State & Power House Substation
                </label>
                <select
                  value={manualAreaId}
                  onChange={(e) => {
                    const newAreaId = e.target.value;
                    setManualAreaId(newAreaId);
                    const newArea = ALL_AREAS.find((a) => a.id === newAreaId);
                    if (newArea && newArea.colonies[0]) {
                      setManualColonyId(newArea.colonies[0].id);
                    }
                  }}
                  className="w-full text-xs font-semibold text-[#0C3B2B] bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {ALL_AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name[language === 'hi' ? 'hi' : 'en']} — {a.state[language === 'hi' ? 'hi' : 'en']}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0C3B2B] mb-1">
                  2. Colony / Feeder Cluster
                </label>
                <select
                  value={manualColonyId}
                  onChange={(e) => setManualColonyId(e.target.value)}
                  className="w-full text-xs font-semibold text-[#0C3B2B] bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {currentManualArea.colonies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[language === 'hi' ? 'hi' : 'en']} ({c.houseCount} households)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={handleSaveManual}
                >
                  {language === 'hi' ? 'यह क्षेत्र लागू करें' : 'Apply Area Selection'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
