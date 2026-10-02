import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Bell,
  BatteryMedium,
  Building2,
  ArrowRightLeft,
  MessageSquare,
  SlidersHorizontal,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useAlertStore } from '../../store/useAlertStore';
import { INITIAL_TOPOLOGY, getHousesForColony } from '../../config/topology';
import { ScenarioLab } from '../../dev/ScenarioLab';

export const PublicShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const setSelectedColonyId = useSessionStore((s) => s.setSelectedColonyId);
  const selectedHouseId = useSessionStore((s) => s.selectedHouseId);
  const setSelectedHouseId = useSessionStore((s) => s.setSelectedHouseId);
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const setRole = useSessionStore((s) => s.setRole);

  const messages = useAlertStore((s) => s.messages);
  const unreadMessagesCount = messages.filter(
    (m) => m.colonyId === selectedColonyId && !m.read
  ).length;

  const [isLabOpen, setIsLabOpen] = useState(false);

  const houses = getHousesForColony(selectedColonyId);

  const tabs = [
    { to: '/colony', label: language === 'hi' ? 'होम' : 'Home', icon: <Home className="w-5 h-5" /> },
    { to: '/colony/forecast', label: language === 'hi' ? 'अनुमान' : 'Forecast', icon: <TrendingUp className="w-5 h-5" /> },
    { to: '/colony/alerts', label: language === 'hi' ? 'अलर्ट' : 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { to: '/colony/recommendations', label: language === 'hi' ? 'समाधान' : 'Solutions', icon: <Lightbulb className="w-5 h-5" /> },
    { to: '/colony/storage', label: language === 'hi' ? 'बैकअप' : 'Backup', icon: <BatteryMedium className="w-5 h-5" /> },
    { to: `/colony/houses/${selectedHouseId}`, label: language === 'hi' ? 'मेरा घर' : 'My House', icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAF6] text-[#16241D]">
      {/* Top Bar (Colony Picker, House Switcher, Language Toggle, Bell) */}
      <header className="bg-white border-b border-[#DDE9E0] sticky top-0 z-20">
        <div className="max-w-[960px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand & Colony Selection */}
          <div className="flex items-center gap-2.5 min-w-0">
            <a href="/colony" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 rounded-[8px] bg-[#EAF7EE] text-[#13724A] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 text-[#27A163]" />
              </span>
              <span className="text-base font-bold font-heading text-[#0C3B2B] hidden sm:inline">
                {language === 'hi' ? 'ग्रिडसाथी' : 'GridSaathi'}
              </span>
            </a>

            {/* Colony Picker Dropdown */}
            <select
              value={selectedColonyId}
              onChange={(e) => setSelectedColonyId(e.target.value)}
              className="text-xs font-semibold text-[#0C3B2B] bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] px-2.5 py-1.5 focus:outline-none max-w-[150px] sm:max-w-[190px] truncate cursor-pointer"
            >
              {INITIAL_TOPOLOGY.colonies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right actions: House Switcher, SMS inbox, Lang toggle, Portal switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* House Switcher */}
            <select
              value={selectedHouseId}
              onChange={(e) => {
                setSelectedHouseId(e.target.value);
                if (location.pathname.includes('/houses')) {
                  navigate(`/colony/houses/${e.target.value}`);
                }
              }}
              className="text-xs text-[#16241D] bg-white border border-[#DDE9E0] rounded-[6px] px-2 py-1.5 focus:outline-none hidden md:inline-block cursor-pointer"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>

            {/* Language toggle button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 text-xs font-semibold text-[#0C3B2B] bg-[#EAF7EE] hover:bg-[#D6EFDD] rounded-[6px] transition-colors cursor-pointer"
              title="Toggle Language"
            >
              {language === 'en' ? 'हिंदी' : 'English'}
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

            {/* Switch to Operator */}
            <button
              onClick={() => {
                setRole('operator');
                navigate('/powerhouse');
              }}
              className="text-xs text-[#5B6B62] hover:text-[#0C3B2B] p-2 hover:bg-[#F5FAF6] rounded-[6px] transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Power House</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sub-Nav Tab Bar */}
      <div className="bg-white border-b border-[#DDE9E0] hidden md:block">
        <div className="max-w-[960px] mx-auto px-4 flex items-center gap-6 h-11 text-xs">
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

      {/* Scenario Lab Drawer */}
      <ScenarioLab isOpen={isLabOpen} onClose={() => setIsLabOpen(false)} />
    </div>
  );
};
