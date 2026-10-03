import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Bell,
  Lightbulb,
  MessageSquare,
  SlidersHorizontal,
  Zap,
  Settings,
  ArrowLeft,
  Eye,
  Globe,
} from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useAlertStore } from '../../store/useAlertStore';
import { useLocationStore } from '../../store/useLocationStore';
import { LocationChip } from '../geo/LocationChip';
import { LocationModal } from '../geo/LocationModal';
import { NotificationPreferencesDrawer } from '../../features/public/preferences/NotificationPreferencesDrawer';
import { VoiceAssistantWidget } from '../ai/VoiceAssistantWidget';
import { ScenarioLab } from '../../dev/ScenarioLab';

export const PublicShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const isPreviewMode = useSessionStore((s) => s.isPreviewMode);
  const setPreviewMode = useSessionStore((s) => s.setPreviewMode);
  const setRole = useSessionStore((s) => s.setRole);

  const selectedColonyId = useLocationStore((s) => s.selectedColonyId);
  const currentColony = useLocationStore((s) => s.currentColony);
  const currentArea = useLocationStore((s) => s.currentArea);

  const messages = useAlertStore((s) => s.messages);
  const unreadMessagesCount = messages.filter(
    (m) => m.colonyId === selectedColonyId && !m.read
  ).length;

  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isPrefOpen, setIsPrefOpen] = useState(false);

  // Strictly 3 tabs: Home · Alerts · Solutions per section 7.2
  const tabs = [
    { to: '/colony', label: language === 'hi' ? 'मुख्य पृष्ठ' : 'Home', icon: <Home className="w-5 h-5" /> },
    { to: '/colony/alerts', label: language === 'hi' ? 'अलर्ट व सूचनाएं' : 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { to: '/colony/recommendations', label: language === 'hi' ? 'सलाह व समाधान' : 'Solutions', icon: <Lightbulb className="w-5 h-5" /> },
  ];

  const handleExitPreview = () => {
    setPreviewMode(false);
    setRole('operator');
    navigate('/powerhouse');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAF6] text-[#16241D]">
      {/* Persistent Operator Preview Banner when in preview mode */}
      {isPreviewMode && (
        <div className="bg-[#FEFAF2] border-b border-[#F8D288] px-4 py-2 text-xs text-[#785103] flex items-center justify-between z-30 sticky top-0 shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="p-1 rounded bg-[#FBE8BA] text-[#785103]">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Operator Preview Mode:</strong> Viewing Public Portal for{' '}
              <u>{currentColony.name[language === 'hi' ? 'hi' : 'en']}</u> (Read-Only)
            </span>
          </div>
          <button
            onClick={handleExitPreview}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0C3B2B] text-white rounded-[6px] font-semibold hover:bg-[#13724A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Power House</span>
          </button>
        </div>
      )}

      {/* Top Bar (Brand, LocationChip, Language Toggle, Notification Preferences, Messages) */}
      <header className="bg-white border-b border-[#DDE9E0] sticky top-0 z-20">
        <div className="max-w-[960px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand & Area Location Chip */}
          <div className="flex items-center gap-2.5 min-w-0">
            <a href="/colony" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 rounded-[8px] bg-[#EAF7EE] text-[#13724A] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 text-[#27A163]" />
              </span>
              <span className="text-base font-bold font-heading text-[#0C3B2B] hidden sm:inline">
                {language === 'hi' ? 'ग्रिडसाथी' : 'GridSaathi'}
              </span>
            </a>

            {/* Geolocation / Area Selector Chip */}
            <LocationChip />
          </div>

          {/* Right actions: Language toggle, Phone Notification Settings, SMS inbox */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0C3B2B] bg-[#EAF7EE] hover:bg-[#D6EFDD] border border-[#DDE9E0] rounded-[6px] transition-colors cursor-pointer"
              title="Toggle Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[#27A163]" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Notification Preferences Drawer Trigger */}
            <button
              onClick={() => setIsPrefOpen(true)}
              className="p-2 rounded-[6px] text-[#5B6B62] hover:text-[#0C3B2B] hover:bg-[#F5FAF6] transition-colors cursor-pointer"
              title="Phone Notification Settings"
              aria-label="Phone Alerts Settings"
            >
              <Settings className="w-5 h-5" strokeWidth={1.75} />
            </button>

            {/* Message Box (SMS phone thread) */}
            <button
              onClick={() => navigate('/colony/messages')}
              className="relative p-2 rounded-[6px] text-[#5B6B62] hover:text-[#16241D] hover:bg-[#F5FAF6] transition-colors cursor-pointer"
              aria-label="SMS Messages"
            >
              <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#C73E3A] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Scenario Lab Trigger */}
            <button
              onClick={() => setIsLabOpen(true)}
              className="p-2 rounded-[6px] text-[#5B6B62] hover:text-[#16241D] hover:bg-[#F5FAF6] transition-colors cursor-pointer"
              title="Demo Scenario Lab"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sub-Nav Tab Bar (Home · Alerts · Solutions) */}
      <div className="bg-white border-b border-[#DDE9E0] hidden md:block">
        <div className="max-w-[960px] mx-auto px-4 flex items-center gap-8 h-11 text-xs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/colony'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 h-full border-b-2 font-medium transition-colors ${
                  isActive
                    ? 'border-[#27A163] text-[#0C3B2B] font-semibold'
                    : 'border-transparent text-[#5B6B62] hover:text-[#16241D]'
                }`
              }
            >
              {React.cloneElement(tab.icon, { className: 'w-4 h-4' })}
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Container (Centered 960px column) */}
      <div className="flex-1 max-w-[960px] w-full mx-auto px-4 py-6 mb-20 md:mb-8">
        <Outlet />
      </div>

      {/* Mobile Bottom Tab Bar (Height >= 56px, touch targets >= 44px) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#DDE9E0] flex items-center justify-around z-30 md:hidden select-none">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/colony'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full min-h-[44px] gap-1 transition-colors ${
                isActive ? 'text-[#13724A] font-semibold' : 'text-[#5B6B62]'
              }`
            }
          >
            {tab.icon}
            <span className="text-[11px] leading-none">{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Modals & Drawers */}
      <LocationModal />
      <NotificationPreferencesDrawer isOpen={isPrefOpen} onClose={() => setIsPrefOpen(false)} />
      <VoiceAssistantWidget />
      <ScenarioLab isOpen={isLabOpen} onClose={() => setIsLabOpen(false)} />
    </div>
  );
};
