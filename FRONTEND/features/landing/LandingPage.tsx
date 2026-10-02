import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/useSessionStore';
import { Zap, ShieldCheck, Home, ArrowRight, BarChart3, BatteryCharging } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const setRole = useSessionStore((s) => s.setRole);

  const handleSelectPortal = (role: 'operator' | 'public') => {
    setRole(role);
    navigate(role === 'operator' ? '/powerhouse' : '/colony');
  };

  return (
    <div className="min-h-screen bg-[#F5FAF6] text-[#16241D] flex flex-col justify-between selection:bg-[#D6EFDD] selection:text-[#0C3B2B]">
      {/* Top Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#DDE9E0] bg-white">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-[#EAF7EE] text-[#13724A] flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 text-[#27A163]" />
          </span>
          <span className="text-lg font-bold font-heading text-[#0C3B2B] tracking-tight">
            GridSaathi
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#5B6B62]">
          <span>Grid Reliability & Renewable Intermittency</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        {/* Anti-slop: clean kicker without pill box */}
        <span className="text-xs text-[#13724A] font-semibold tracking-wide uppercase mb-3">
          Neighborhood-Scale Energy Flexibility
        </span>

        <h1 className="text-3xl sm:text-5xl font-bold font-heading text-[#0C3B2B] tracking-tight max-w-2xl text-balance leading-tight">
          Making clean power dependable, neighbourhood by neighbourhood.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-[#5B6B62] max-w-xl leading-relaxed">
          Bridging renewable intermittency gaps through predictive forecasting, smart feeder load management, demand response, and shared community batteries.
        </p>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-10">
          {/* Card 1: Power House Portal */}
          <div
            onClick={() => handleSelectPortal('operator')}
            className="p-8 bg-white border border-[#DDE9E0] rounded-[16px] text-left hover:border-[#27A163] hover:shadow-floating transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-[10px] bg-[#EAF7EE] text-[#13724A] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-bold font-heading text-[#0C3B2B]">
                Power House Portal
              </h2>
              <p className="text-xs text-[#5B6B62] mt-2 leading-relaxed">
                For substation and DISCOM operators. Real-time SVG distribution schematic, 24-hour shortfall prediction, high-load feeder shedding, and demand response dispatch.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE9E0] flex items-center justify-between text-xs font-semibold text-[#13724A]">
              <span>Sign In as Operator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Public & Colony Portal */}
          <div
            onClick={() => handleSelectPortal('public')}
            className="p-8 bg-white border border-[#DDE9E0] rounded-[16px] text-left hover:border-[#27A163] hover:shadow-floating transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-[10px] bg-[#EAF7EE] text-[#13724A] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Home className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-bold font-heading text-[#0C3B2B]">
                Public & Colony Portal
              </h2>
              <p className="text-xs text-[#5B6B62] mt-2 leading-relaxed">
                For residents and RWA committees. Plain-language supply status ribbon, local community battery backup requests during blackouts, and household appliance load-shifting.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE9E0] flex items-center justify-between text-xs font-semibold text-[#13724A]">
              <span>Enter Colony Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 text-left w-full border-t border-[#DDE9E0] pt-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0C3B2B]">
              <Zap className="w-4 h-4 text-[#27A163]" /> Real-Time Intermittency Sync
            </div>
            <p className="text-xs text-[#5B6B62] mt-1.5 leading-relaxed">
              Every 2 seconds, simulated solar and wind fluctuations sync instantly across operator consoles and resident phones.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0C3B2B]">
              <BatteryCharging className="w-4 h-4 text-[#27A163]" /> Shared Storage Autonomy
            </div>
            <p className="text-xs text-[#5B6B62] mt-1.5 leading-relaxed">
              Neighborhood batteries maintain vital water pumps, clinic refrigeration, and stairwell lights through permissioned pre-cut agreements.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0C3B2B]">
              <ShieldCheck className="w-4 h-4 text-[#27A163]" /> DISCOM Load Coordination
            </div>
            <p className="text-xs text-[#5B6B62] mt-1.5 leading-relaxed">
              Targeted evening demand response signals reduce peak feeder overload without imposing broad rolling blackouts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#DDE9E0] text-center text-xs text-[#5B6B62] bg-white">
        <span>GridSaathi · Sustainable Urban and Peri-Urban Electricity Resilience</span>
      </footer>
    </div>
  );
};
