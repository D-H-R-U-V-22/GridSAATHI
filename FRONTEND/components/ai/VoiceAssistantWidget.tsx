import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store/useSessionStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useGridStore } from '../../store/useGridStore';
import { useStorageStore } from '../../store/useStorageStore';
import { useAlertStore } from '../../store/useAlertStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  buildPublicVoiceBriefing,
  buildPowerHouseVoiceBriefing,
  speechController,
  VoiceBriefingData,
} from '../../lib/ai/voiceAssistant';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  X,
  Radio,
  ChevronRight,
  Headphones,
  Globe,
} from 'lucide-react';

export const VoiceAssistantWidget: React.FC = () => {
  const location = useLocation();
  const { t, language, setLanguage, toggleLanguage } = useTranslation();

  const selectedColonyId = useLocationStore((s) => s.selectedColonyId);
  const currentColony = useLocationStore((s) => s.currentColony);
  const currentArea = useLocationStore((s) => s.currentArea);

  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const powerHouseReading = useGridStore((s) => s.powerHouseReading);
  const batteries = useStorageStore((s) => s.batteries);
  const alerts = useAlertStore((s) => s.alerts);

  const isPowerHouse = location.pathname.startsWith('/powerhouse');

  const [isOpen, setIsOpen] = useState(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const prevLanguageRef = useRef(language);

  useEffect(() => {
    speechController.setStateCallback((st) => setPlaybackState(st));
    return () => {
      speechController.stop();
    };
  }, []);

  // Construct context-aware briefing data
  const briefing: VoiceBriefingData = useMemo(() => {
    if (isPowerHouse) {
      return buildPowerHouseVoiceBriefing({
        area: currentArea,
        currentDemandKw: powerHouseReading.demandKw || 12400,
        solarKw: powerHouseReading.solarKw || 3800,
        windKw: powerHouseReading.windKw || 2100,
        activeAlertsCount: alerts.filter((a) => a.status === 'active').length,
        feeders: currentArea.feeders,
        language,
      });
    }

    // Public Colony Portal briefing
    const reading = colonyReadings[selectedColonyId];
    const status = colonyStatuses[selectedColonyId] || 'stable';
    const battery = batteries[selectedColonyId];

    const colonyAlerts = alerts.filter(
      (a) =>
        a.status === 'active' &&
        (a.scope.level === 'powerhouse' ||
          (a.scope.level === 'colony' && a.scope.ids.includes(selectedColonyId)) ||
          (a.scope.level === 'area' && a.scope.ids.includes(currentArea.id)))
    );

    return buildPublicVoiceBriefing({
      colonyName: currentColony.name[language === 'hi' ? 'hi' : 'en'],
      areaName: currentArea.name[language === 'hi' ? 'hi' : 'en'],
      status,
      demandKw: reading?.demandKw || 140,
      solarKw: reading?.solarKw || 82,
      batterySoc: battery?.socPct || 84,
      batteryMins: 110,
      alerts: colonyAlerts,
      language,
    });
  }, [
    isPowerHouse,
    currentArea,
    currentColony,
    selectedColonyId,
    colonyReadings,
    colonyStatuses,
    powerHouseReading,
    batteries,
    alerts,
    language,
  ]);

  // Seamlessly switch voice language during live speech if language changes
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      prevLanguageRef.current = language;
      if (playbackState === 'playing') {
        speechController.speak(briefing.fullScript, language);
      }
    }
  }, [language, briefing, playbackState]);

  const handleTogglePlay = () => {
    if (playbackState === 'playing') {
      speechController.pause();
    } else if (playbackState === 'paused') {
      speechController.resume();
    } else {
      speechController.speak(briefing.fullScript, language);
    }
  };

  const handleStop = () => {
    speechController.stop();
    setPlaybackState('idle');
  };

  const handlePlaySection = (secIndex: number) => {
    setActiveSectionIndex(secIndex);
    const sec = briefing.sections[secIndex];
    if (sec) {
      speechController.speak(sec.text, language);
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 select-none">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-floating border transition-all cursor-pointer ${
            playbackState === 'playing'
              ? 'bg-[#0C3B2B] text-white border-[#27A163] ring-2 ring-[#27A163]/40'
              : 'bg-white text-[#0C3B2B] border-[#DDE9E0] hover:border-[#27A163] hover:shadow-md'
          }`}
          aria-label="AI Voice Briefing"
        >
          {playbackState === 'playing' ? (
            <div className="flex items-center gap-1 h-3.5">
              <span className="w-1 bg-[#27A163] rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
              <span className="w-1 bg-[#27A163] rounded-full animate-bounce h-3.5" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-[#27A163] rounded-full animate-bounce h-2.5" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <span className="p-1 rounded-full bg-[#EAF7EE] text-[#13724A]">
              <Headphones className="w-3.5 h-3.5 text-[#27A163]" />
            </span>
          )}

          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold tracking-tight leading-none flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#27A163]" />
              {playbackState === 'playing'
                ? language === 'hi' ? 'लाइव आवाज चालू है' : 'Reciting Live...'
                : language === 'hi' ? 'एआई वॉइस बुलेटिन' : 'AI Voice Assistant'}
            </span>
            <span className="text-[9px] text-[#5B6B62] leading-none mt-0.5">
              {isPowerHouse ? (language === 'hi' ? 'सबस्टेशन टेलीमेट्री' : 'Power House Telemetry') : (language === 'hi' ? 'मोहल्ला ग्रिड अलर्ट' : 'Neighbourhood Alerts')}
            </span>
          </div>
        </button>
      </div>

      {/* Recitation Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DDE9E0] rounded-[18px] max-w-[540px] w-full shadow-floating overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-[#DDE9E0] flex items-center justify-between bg-[#F5FAF6]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-[8px] bg-white text-[#13724A] shadow-2xs border border-[#DDE9E0]">
                  <Volume2 className="w-5 h-5 text-[#27A163]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EAF7EE] text-[#13724A]">
                      {isPowerHouse ? (language === 'hi' ? 'पावर हाउस डिस्पैच' : 'DISCOM Dispatch Feed') : (language === 'hi' ? 'नागरिक सूचना' : 'Resident Notice Audio')}
                    </span>
                    <span className="text-[11px] text-[#5B6B62] font-semibold">
                      {language === 'hi' ? 'हिंदी ऑडियो' : 'English Audio'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-heading text-[#0C3B2B] mt-0.5">
                    {briefing.headline}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switcher inside Voice Assistant */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0C3B2B] bg-white hover:bg-[#EAF7EE] border border-[#DDE9E0] rounded-[6px] transition-colors cursor-pointer"
                  title="Switch Language / भाषा बदलें"
                >
                  <Globe className="w-3 h-3 text-[#27A163]" />
                  <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#5B6B62] hover:text-[#16241D] rounded-[6px] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Playback Controls Strip */}
            <div className="px-5 py-3.5 bg-white border-b border-[#DDE9E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="flex items-center gap-2 px-4 py-2 bg-[#27A163] hover:bg-[#13724A] text-white rounded-[8px] font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {playbackState === 'playing' ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>{t('pauseVoice')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>{t('reciteAll')}</span>
                    </>
                  )}
                </button>

                {playbackState !== 'idle' && (
                  <button
                    onClick={handleStop}
                    className="p-2 bg-[#F5FAF6] hover:bg-[#FCEEED] text-[#C73E3A] rounded-[8px] border border-[#DDE9E0] transition-colors cursor-pointer"
                    title={t('stopVoice')}
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>

              {/* Status pill */}
              <div className="text-xs text-[#5B6B62] flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${playbackState === 'playing' ? 'text-[#27A163] animate-pulse' : 'text-[#5B6B62]'}`} />
                <span>
                  {playbackState === 'playing' ? t('voiceReciting') : t('voiceReady')}
                </span>
              </div>
            </div>

            {/* Script Breakdown / Sections */}
            <div className="p-5 overflow-y-auto flex flex-col gap-3 text-xs flex-1">
              <span className="text-[11px] font-semibold text-[#5B6B62] uppercase tracking-wider block">
                {t('briefingSections')}
              </span>

              {briefing.sections.map((section, idx) => (
                <div
                  key={idx}
                  onClick={() => handlePlaySection(idx)}
                  className={`p-3.5 rounded-[10px] border transition-all cursor-pointer ${
                    activeSectionIndex === idx && playbackState === 'playing'
                      ? 'bg-[#EAF7EE] border-[#8ED1A8] shadow-xs'
                      : 'bg-[#F5FAF6] border-[#DDE9E0] hover:bg-white hover:border-[#8ED1A8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#0C3B2B] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27A163]" />
                      {section.title}
                    </span>
                    <span className="text-[10px] text-[#13724A] font-semibold flex items-center gap-0.5">
                      {language === 'hi' ? 'सुने' : 'Play'} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[#16241D] leading-relaxed text-[11.5px]">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-[#DDE9E0] bg-[#F5FAF6] flex items-center justify-between text-[11px] text-[#5B6B62]">
              <span>GridSaathi Natural Speech Synthesis (hi-IN / en-IN)</span>
              <button
                onClick={() => setIsOpen(false)}
                className="font-bold text-[#13724A] hover:underline cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
