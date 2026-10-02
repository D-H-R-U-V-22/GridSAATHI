import React, { useEffect } from 'react';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { scenarioManager } from '../data/mock/scenarios';
import { useGridStore } from '../store/useGridStore';
import { useToast } from '../components/ui/Toast';
import { weatherSim } from '../data/mock/weatherMock';
import { Cloud, Wind, Flame, AlertOctagon, Wrench, RotateCcw, FastForward } from 'lucide-react';

interface ScenarioLabProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const simSpeed = useGridStore((s) => s.simSpeed);
  const setSimSpeed = useGridStore((s) => s.setSimSpeed);

  // Shortcut Shift+L listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        // Toggle handled outside or emit
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerCloudCover = () => {
    scenarioManager.applyScenario({
      type: 'cloudCover',
      label: 'Dense Cloud Cover',
      description: 'Solar generation drops 70% across all solar-tied feeders',
      appliedAt: Date.now(),
    });
    weatherSim.setCloudCover(88);
    showToast({
      type: 'warning',
      title: 'Cloud Cover Scenario Active',
      message: 'Solar output dropped by 70%. Auto-draft alert evaluated.',
    });
  };

  const triggerWindLull = () => {
    scenarioManager.applyScenario({
      type: 'windLull',
      label: 'Wind Generation Lull',
      description: 'Wind speed falls below 2.2 m/s',
      appliedAt: Date.now(),
    });
    weatherSim.setWindSpeed(2.1);
    showToast({
      type: 'warning',
      title: 'Wind Lull Scenario Active',
      message: 'Wind turbines slowed. Renewable inflow constrained.',
    });
  };

  const triggerHeatWave = () => {
    scenarioManager.applyScenario({
      type: 'heatWave',
      label: 'Heatwave Demand Surge',
      description: 'Temp reaches 42°C, evening peak surge +25%',
      appliedAt: Date.now(),
    });
    weatherSim.setTemp(42);
    showToast({
      type: 'warning',
      title: 'Heatwave Scenario Active',
      message: 'Cooling demand surged across all feeders.',
    });
  };

  const triggerFeederFault = () => {
    scenarioManager.applyScenario({
      type: 'feederFault',
      label: 'Feeder Fault Outage',
      description: 'Shanti Vihar 11kV Feeder tripped, 45m restoration ETA',
      appliedAt: Date.now(),
      targetId: 'feeder-shanti',
    });
    showToast({
      type: 'error',
      title: 'Feeder Fault Simulated',
      message: 'Shanti Vihar Colony transitioned to Outage mode. Emergency backup available.',
    });
  };

  const triggerMaintenance = () => {
    scenarioManager.applyScenario({
      type: 'plannedMaintenance',
      label: 'Planned Substation Servicing',
      description: 'North Sector transformer maintenance',
      appliedAt: Date.now(),
      targetId: 'area-north',
    });
    showToast({
      type: 'info',
      title: 'Maintenance Scenario Scheduled',
      message: 'Scheduled outage window posted to public ribbon.',
    });
  };

  const handleReset = () => {
    scenarioManager.reset();
    weatherSim.reset();
    showToast({
      type: 'success',
      title: 'Scenarios Reset to Normal',
      message: 'Grid operates at nominal baseline conditions.',
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Scenario Lab"
      subtitle="Simulate real-world grid intermittency scenarios live"
    >
      <div className="flex flex-col gap-6 text-sm">
        {/* Speed multiplier control */}
        <div className="flex flex-col gap-2 p-3.5 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0]">
          <span className="text-xs font-semibold text-[#0C3B2B] flex items-center gap-1.5">
            <FastForward className="w-4 h-4 text-[#27A163]" /> Simulation Clock Speed
          </span>
          <p className="text-xs text-[#5B6B62]">
            Accelerate the 2-second simulation tick to observe 24-hour cycles rapidly:
          </p>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[1, 10, 60].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`py-1.5 px-3 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-[#27A163] text-white border-[#27A163]'
                    : 'bg-white text-[#16241D] border-[#DDE9E0] hover:bg-[#EAF7EE]'
                }`}
              >
                {spd}× Realtime
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios triggers */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-[#5B6B62] uppercase tracking-wider">
            Intermittency & Grid Events
          </span>

          <button
            onClick={triggerCloudCover}
            className="flex items-start gap-3 p-3 bg-white border border-[#DDE9E0] rounded-[8px] hover:border-[#8ED1A8] hover:bg-[#F5FAF6] text-left transition-colors cursor-pointer"
          >
            <Cloud className="w-5 h-5 text-[#B07B0E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#0C3B2B]">1. Dense Cloud Cover</h4>
              <p className="text-xs text-[#5B6B62] mt-0.5">
                Solar drops 70%. Triggers auto-drafted weather advisory and shortfall window.
              </p>
            </div>
          </button>

          <button
            onClick={triggerWindLull}
            className="flex items-start gap-3 p-3 bg-white border border-[#DDE9E0] rounded-[8px] hover:border-[#8ED1A8] hover:bg-[#F5FAF6] text-left transition-colors cursor-pointer"
          >
            <Wind className="w-5 h-5 text-[#1B93A1] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#0C3B2B]">2. Wind Generation Lull</h4>
              <p className="text-xs text-[#5B6B62] mt-0.5">
                Wind speed falls to 2.1 m/s. Peri-urban hybrid feeders lose wind share.
              </p>
            </div>
          </button>

          <button
            onClick={triggerHeatWave}
            className="flex items-start gap-3 p-3 bg-white border border-[#DDE9E0] rounded-[8px] hover:border-[#8ED1A8] hover:bg-[#F5FAF6] text-left transition-colors cursor-pointer"
          >
            <Flame className="w-5 h-5 text-[#E2702B] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#0C3B2B]">3. Heatwave Evening Peak</h4>
              <p className="text-xs text-[#5B6B62] mt-0.5">
                42°C surge pushes AC cooling load by 25%, testing DR capability.
              </p>
            </div>
          </button>

          <button
            onClick={triggerFeederFault}
            className="flex items-start gap-3 p-3 bg-white border border-[#DDE9E0] rounded-[8px] hover:border-[#ECA3A0] hover:bg-[#FDF5F5] text-left transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-5 h-5 text-[#C73E3A] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#9E2824]">4. 11kV Feeder Trip / Outage</h4>
              <p className="text-xs text-[#5B6B62] mt-0.5">
                Cuts power to Shanti Vihar Colony. Tests backup request & discharge flow.
              </p>
            </div>
          </button>

          <button
            onClick={triggerMaintenance}
            className="flex items-start gap-3 p-3 bg-white border border-[#DDE9E0] rounded-[8px] hover:border-[#8ED1A8] hover:bg-[#F5FAF6] text-left transition-colors cursor-pointer"
          >
            <Wrench className="w-5 h-5 text-[#205499] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#0C3B2B]">5. Planned Pre-Cut Maintenance</h4>
              <p className="text-xs text-[#5B6B62] mt-0.5">
                Demonstrates pre-cut notice, colony consent countdown, and pre-activation.
              </p>
            </div>
          </button>
        </div>

        {/* Reset button */}
        <div className="pt-2 border-t border-[#DDE9E0]">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Scenarios</span>
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
