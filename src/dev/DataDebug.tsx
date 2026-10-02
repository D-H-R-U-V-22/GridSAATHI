import React from 'react';
import { useGridStore } from '../store/useGridStore';
import { useAlertStore } from '../store/useAlertStore';
import { useStorageStore } from '../store/useStorageStore';
import { useDemandResponseStore } from '../store/useDemandResponseStore';
import { useOutageStore } from '../store/useOutageStore';
import { scenarioManager } from '../data/mock/scenarios';
import { formatTime12h } from '../lib/time';

export const DataDebug: React.FC = () => {
  const simClock = useGridStore((s) => s.simClock);
  const powerHouseReading = useGridStore((s) => s.powerHouseReading);
  const feederReadings = useGridStore((s) => s.feederReadings);
  const alerts = useAlertStore((s) => s.alerts);
  const drafts = useAlertStore((s) => s.drafts);
  const batteries = useStorageStore((s) => s.batteries);
  const drEvents = useDemandResponseStore((s) => s.events);
  const outages = useOutageStore((s) => s.activeOutages);

  return (
    <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6 text-xs bg-[#F5FAF6] min-h-screen">
      <div>
        <h1 className="text-xl font-bold font-heading text-[#0C3B2B]">
          Data Layer & Simulator Debug (/dev/data)
        </h1>
        <p className="text-[#5B6B62] mt-0.5">
          Simulated Clock: <strong className="text-[#0C3B2B]">{formatTime12h(simClock)}</strong> ({simClock})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Power House Reading */}
        <div className="p-4 bg-white rounded-[8px] border border-[#DDE9E0]">
          <h2 className="font-bold text-[#0C3B2B] mb-2">Power House Live Telemetry</h2>
          <pre className="p-3 bg-[#F5FAF6] rounded font-mono text-[11px] overflow-auto max-h-48">
            {JSON.stringify(powerHouseReading, null, 2)}
          </pre>
        </div>

        {/* Active Scenarios */}
        <div className="p-4 bg-white rounded-[8px] border border-[#DDE9E0]">
          <h2 className="font-bold text-[#0C3B2B] mb-2">Active Scenarios ({scenarioManager.getAll().length})</h2>
          <pre className="p-3 bg-[#F5FAF6] rounded font-mono text-[11px] overflow-auto max-h-48">
            {JSON.stringify(scenarioManager.getAll(), null, 2)}
          </pre>
        </div>

        {/* Alerts & Drafts */}
        <div className="p-4 bg-white rounded-[8px] border border-[#DDE9E0]">
          <h2 className="font-bold text-[#0C3B2B] mb-2">Published Alerts ({alerts.length}) & Drafts ({drafts.length})</h2>
          <pre className="p-3 bg-[#F5FAF6] rounded font-mono text-[11px] overflow-auto max-h-48">
            {JSON.stringify({ alerts, drafts }, null, 2)}
          </pre>
        </div>

        {/* Demand Response Events */}
        <div className="p-4 bg-white rounded-[8px] border border-[#DDE9E0]">
          <h2 className="font-bold text-[#0C3B2B] mb-2">Demand Response Events ({drEvents.length})</h2>
          <pre className="p-3 bg-[#F5FAF6] rounded font-mono text-[11px] overflow-auto max-h-48">
            {JSON.stringify(drEvents, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
