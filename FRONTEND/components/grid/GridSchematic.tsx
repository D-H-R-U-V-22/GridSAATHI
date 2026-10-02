import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { INITIAL_TOPOLOGY } from '../../config/topology';
import { useGridStore } from '../../store/useGridStore';
import { useStorageStore } from '../../store/useStorageStore';
import { Drawer } from '../ui/Drawer';
import { StatusPill } from '../ui/StatusPill';
import { formatPower, formatVoltage, formatFrequency } from '../../lib/format';
import { calculateBatteryMinutesRemaining } from '../../domain/selectors';
import { Sun, Wind, Battery as BatteryIcon, Zap, Home } from 'lucide-react';

interface SelectedNodeInfo {
  type: 'powerhouse' | 'feeder' | 'colony';
  id: string;
  name: string;
}

export const GridSchematic: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const powerHouseReading = useGridStore((s) => s.powerHouseReading);
  const feederReadings = useGridStore((s) => s.feederReadings);
  const colonyReadings = useGridStore((s) => s.colonyReadings);
  const overallStatus = useGridStore((s) => s.overallStatus);
  const feederStatuses = useGridStore((s) => s.feederStatuses);
  const colonyStatuses = useGridStore((s) => s.colonyStatuses);
  const batteries = useStorageStore((s) => s.batteries);

  const getStatusStroke = (status?: string) => {
    switch (status) {
      case 'outage':
        return '#C73E3A';
      case 'constrained':
        return '#E2702B';
      case 'watch':
        return '#E9A820';
      case 'stable':
      default:
        return '#27A163';
    }
  };

  // Node coordinates inside 1000x560 SVG
  // Power House at (100, 280)
  const phX = 90;
  const phY = 280;

  // 8 Feeders arranged vertically in two groups or staggered along column X=360
  const feederCoords: Record<string, { x: number; y: number }> = {
    'feeder-kisan': { x: 380, y: 70 },
    'feeder-shanti': { x: 380, y: 130 },
    'feeder-mayur': { x: 380, y: 195 },
    'feeder-nehru': { x: 380, y: 260 },
    'feeder-surya': { x: 380, y: 325 },
    'feeder-indira': { x: 380, y: 390 },
    'feeder-rajiv': { x: 380, y: 455 },
    'feeder-greenvalley': { x: 380, y: 515 },
  };

  // 12 Colonies arranged along X=780
  const colonyCoords: Record<string, { x: number; y: number }> = {
    'colony-kisan-4': { x: 780, y: 50 },
    'colony-adarsh': { x: 780, y: 90 },
    'colony-shanti-vihar': { x: 780, y: 130 },
    'colony-mayur-a': { x: 780, y: 175 },
    'colony-mayur-b': { x: 780, y: 215 },
    'colony-nehru-east': { x: 780, y: 260 },
    'colony-surya-c': { x: 780, y: 305 },
    'colony-panchsheel': { x: 780, y: 345 },
    'colony-indira-vikas': { x: 780, y: 390 },
    'colony-saraswati': { x: 780, y: 435 },
    'colony-rajiv-awas': { x: 780, y: 475 },
    'colony-green-valley': { x: 780, y: 515 },
  };

  // Inspect drawer data
  const renderDrawerDetails = () => {
    if (!selectedNode) return null;

    if (selectedNode.type === 'powerhouse') {
      return (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex items-center justify-between p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0]">
            <span className="text-xs text-[#5B6B62]">Grid Condition</span>
            <StatusPill status={overallStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Total Demand</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
                {formatPower(powerHouseReading.demandKw)}
              </p>
            </div>
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Total Supply</span>
              <p className="text-xl font-bold font-heading text-[#13724A] tabular-nums mt-0.5">
                {formatPower(powerHouseReading.supplyKw)}
              </p>
            </div>
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Solar Inflow</span>
              <p className="text-lg font-bold font-heading text-[#B07B0E] tabular-nums mt-0.5">
                {formatPower(powerHouseReading.solarKw)}
              </p>
            </div>
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Wind Inflow</span>
              <p className="text-lg font-bold font-heading text-[#1B93A1] tabular-nums mt-0.5">
                {formatPower(powerHouseReading.windKw)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-[#F5FAF6] rounded-[8px]">
            <div className="flex justify-between text-xs text-[#5B6B62]">
              <span>Bus Voltage:</span>
              <strong className="text-[#16241D] tabular-nums">{formatVoltage(powerHouseReading.voltageV)}</strong>
            </div>
            <div className="flex justify-between text-xs text-[#5B6B62]">
              <span>Frequency:</span>
              <strong className="text-[#16241D] tabular-nums">{formatFrequency(powerHouseReading.frequencyHz)}</strong>
            </div>
            <div className="flex justify-between text-xs text-[#5B6B62]">
              <span>Grid Import Allocation:</span>
              <strong className="text-[#16241D] tabular-nums">{formatPower(powerHouseReading.gridImportKw)}</strong>
            </div>
          </div>
        </div>
      );
    }

    if (selectedNode.type === 'feeder') {
      const feeder = INITIAL_TOPOLOGY.feeders.find((f) => f.id === selectedNode.id);
      const reading = feederReadings[selectedNode.id];
      const status = feederStatuses[selectedNode.id] || 'stable';
      const loadPct = feeder && reading ? Math.round((reading.demandKw / feeder.capacityKw) * 100) : 0;

      return (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex items-center justify-between p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0]">
            <span className="text-xs text-[#5B6B62]">Feeder Status</span>
            <StatusPill status={status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Live Load</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
                {reading ? formatPower(reading.demandKw) : '—'}
              </p>
            </div>
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Rated Capacity</span>
              <p className="text-xl font-bold font-heading text-[#5B6B62] tabular-nums mt-0.5">
                {feeder ? formatPower(feeder.capacityKw) : '—'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white border border-[#DDE9E0] rounded-[8px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#5B6B62]">Capacity Utilisation</span>
              <span className="font-semibold text-[#0C3B2B] tabular-nums">{loadPct}%</span>
            </div>
            <div className="w-full h-2 bg-[#EAF7EE] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  loadPct > 90 ? 'bg-[#C73E3A]' : loadPct >= 80 ? 'bg-[#E9A820]' : 'bg-[#27A163]'
                }`}
                style={{ width: `${Math.min(100, loadPct)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-[#F5FAF6] rounded-[8px]">
            <div className="flex justify-between text-xs text-[#5B6B62]">
              <span>Solar Distributed:</span>
              <strong className="text-[#B07B0E] tabular-nums">{reading ? formatPower(reading.solarKw) : '0 kW'}</strong>
            </div>
            <div className="flex justify-between text-xs text-[#5B6B62]">
              <span>Wind Distributed:</span>
              <strong className="text-[#1B93A1] tabular-nums">{reading ? formatPower(reading.windKw) : '0 kW'}</strong>
            </div>
            <div className="flex justify-between text-xs text-[#5B6B62]">
              <span>Fed Colonies:</span>
              <strong className="text-[#16241D] tabular-nums">{feeder?.colonyIds.length || 0}</strong>
            </div>
          </div>
        </div>
      );
    }

    if (selectedNode.type === 'colony') {
      const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedNode.id);
      const reading = colonyReadings[selectedNode.id];
      const status = colonyStatuses[selectedNode.id] || 'stable';
      const battery = batteries[selectedNode.id];
      const backupMins = calculateBatteryMinutesRemaining(battery, reading?.demandKw ? reading.demandKw * 0.2 : 20);

      return (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex items-center justify-between p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0]">
            <span className="text-xs text-[#5B6B62]">Colony Status</span>
            <StatusPill status={status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Current Demand</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
                {reading ? formatPower(reading.demandKw) : '—'}
              </p>
            </div>
            <div className="p-3 border border-[#DDE9E0] rounded-[8px]">
              <span className="text-xs text-[#5B6B62]">Households</span>
              <p className="text-xl font-bold font-heading text-[#13724A] tabular-nums mt-0.5">
                {colony?.houseCount || 0}
              </p>
            </div>
          </div>

          {/* Battery Status */}
          {battery && (
            <div className="p-3.5 bg-white border border-[#DDE9E0] rounded-[8px] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0C3B2B] flex items-center gap-1.5">
                  <BatteryIcon className="w-4 h-4 text-[#27A163]" /> Community Battery
                </span>
                <span className="text-xs font-bold text-[#13724A] tabular-nums">{battery.socPct}% SoC</span>
              </div>
              <div className="w-full h-2 bg-[#EAF7EE] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#27A163] transition-all"
                  style={{ width: `${battery.socPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#5B6B62] pt-1">
                <span>Backup Runtime:</span>
                <strong className="text-[#0C3B2B] tabular-nums">{backupMins} minutes</strong>
              </div>
              <div className="flex justify-between text-xs text-[#5B6B62]">
                <span>Operating Mode:</span>
                <strong className="capitalize text-[#16241D]">{battery.mode}</strong>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 p-3 bg-[#F5FAF6] rounded-[8px] text-xs">
            <div className="flex justify-between text-[#5B6B62]">
              <span>Auto-Consent Pre-Cut:</span>
              <strong className={colony?.autoConsentBackup ? 'text-[#27A163]' : 'text-[#5B6B62]'}>
                {colony?.autoConsentBackup ? 'Enabled' : 'Disabled'}
              </strong>
            </div>
            <div className="flex justify-between text-[#5B6B62]">
              <span>Local Solar Share:</span>
              <strong className="text-[#B07B0E] tabular-nums">{reading ? formatPower(reading.solarKw) : '0 kW'}</strong>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full relative bg-[#F5FAF6] rounded-[20px] border border-[#DDE9E0] p-4 overflow-hidden">
      {/* Schematic Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2">
        <div>
          <h3 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#27A163]" /> Live Distribution Topology Schematic
          </h3>
          <p className="text-xs text-[#5B6B62]">
            Interactive grid flow from 220kV Pragati Substation to local colony micro-clusters
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#5B6B62]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#27A163] bg-white" /> Stable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#E9A820] bg-white" /> Watch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#E2702B] bg-white" /> Constrained
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#C73E3A] bg-white" /> Outage
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 980 570"
          className="w-full h-auto min-w-[760px] select-none"
          role="img"
          aria-label="Grid distribution schematic diagram"
        >
          {/* Subtle Gridlines / Background Accents */}
          <line x1="380" y1="20" x2="380" y2="550" stroke="#DDE9E0" strokeDasharray="3 3" opacity={0.6} />
          <line x1="780" y1="20" x2="780" y2="550" stroke="#DDE9E0" strokeDasharray="3 3" opacity={0.6} />

          {/* Lines: Power House -> Feeders */}
          {INITIAL_TOPOLOGY.feeders.map((feeder) => {
            const fPos = feederCoords[feeder.id];
            if (!fPos) return null;
            const reading = feederReadings[feeder.id];
            const loadPct = reading ? (reading.demandKw / feeder.capacityKw) * 100 : 50;
            const strokeWidth = 1.5 + (loadPct / 100) * 2.5;
            const status = feederStatuses[feeder.id];
            const isOutage = status === 'outage';

            return (
              <g key={`line-ph-${feeder.id}`}>
                {/* Static Path */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  d={`M ${phX + 45} ${phY} C ${(phX + fPos.x) / 2} ${phY}, ${(phX + fPos.x) / 2} ${fPos.y}, ${fPos.x - 30} ${fPos.y}`}
                  fill="none"
                  stroke="#0C3B2B"
                  strokeOpacity={isOutage ? 0.2 : 0.4}
                  strokeWidth={strokeWidth}
                />
                {/* Animated Flow Dashes */}
                {!isOutage && (
                  <path
                    d={`M ${phX + 45} ${phY} C ${(phX + fPos.x) / 2} ${phY}, ${(phX + fPos.x) / 2} ${fPos.y}, ${fPos.x - 30} ${fPos.y}`}
                    fill="none"
                    stroke="#27A163"
                    strokeWidth={1.5}
                    strokeDasharray="4 8"
                    className="animate-flow"
                  />
                )}
              </g>
            );
          })}

          {/* Lines: Feeders -> Colonies */}
          {INITIAL_TOPOLOGY.feeders.flatMap((feeder) => {
            const fPos = feederCoords[feeder.id];
            if (!fPos) return [];

            return feeder.colonyIds.map((cId) => {
              const cPos = colonyCoords[cId];
              if (!cPos) return null;
              const status = colonyStatuses[cId];
              const isOutage = status === 'outage';

              return (
                <g key={`line-f-${cId}`}>
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                    d={`M ${fPos.x + 35} ${fPos.y} C ${(fPos.x + cPos.x) / 2} ${fPos.y}, ${(fPos.x + cPos.x) / 2} ${cPos.y}, ${cPos.x - 24} ${cPos.y}`}
                    fill="none"
                    stroke="#0C3B2B"
                    strokeOpacity={isOutage ? 0.2 : 0.35}
                    strokeWidth={1.5}
                  />
                  {!isOutage && (
                    <path
                      d={`M ${fPos.x + 35} ${fPos.y} C ${(fPos.x + cPos.x) / 2} ${fPos.y}, ${(fPos.x + cPos.x) / 2} ${cPos.y}, ${cPos.x - 24} ${cPos.y}`}
                      fill="none"
                      stroke="#27A163"
                      strokeWidth={1.2}
                      strokeDasharray="3 7"
                      className="animate-flow"
                    />
                  )}
                </g>
              );
            });
          })}

          {/* Power House Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() =>
              setSelectedNode({
                type: 'powerhouse',
                id: INITIAL_TOPOLOGY.powerHouse.id,
                name: INITIAL_TOPOLOGY.powerHouse.name,
              })
            }
          >
            {/* Outline Box */}
            <rect
              x={phX - 45}
              y={phY - 45}
              width={90}
              height={90}
              rx={12}
              fill="#FFFFFF"
              stroke={getStatusStroke(overallStatus)}
              strokeWidth={2.5}
            />
            {/* Substation icon / label */}
            <text x={phX} y={phY - 14} textAnchor="middle" fill="#0C3B2B" fontSize={18} fontWeight="bold">
              ⚡ 220kV
            </text>
            <text x={phX} y={phY + 8} textAnchor="middle" fill="#0C3B2B" fontSize={11} fontWeight={600}>
              Pragati PH
            </text>
            <text x={phX} y={phY + 24} textAnchor="middle" fill="#5B6B62" fontSize={10} className="tabular-nums">
              {formatPower(powerHouseReading.demandKw, 0)}
            </text>
          </g>

          {/* Feeder Nodes */}
          {INITIAL_TOPOLOGY.feeders.map((feeder) => {
            const pos = feederCoords[feeder.id];
            if (!pos) return null;
            const status = feederStatuses[feeder.id] || 'stable';
            const reading = feederReadings[feeder.id];
            const hasSolar = feeder.name.includes('Solar') || feeder.name.includes('Kisan');
            const hasWind = feeder.name.includes('Wind') || feeder.name.includes('Valley');

            return (
              <g
                key={feeder.id}
                className="cursor-pointer transition-transform hover:scale-[1.03]"
                onClick={() =>
                  setSelectedNode({
                    type: 'feeder',
                    id: feeder.id,
                    name: feeder.name,
                  })
                }
              >
                <rect
                  x={pos.x - 35}
                  y={pos.y - 18}
                  width={70}
                  height={36}
                  rx={6}
                  fill="#FFFFFF"
                  stroke={getStatusStroke(status)}
                  strokeWidth={2}
                />
                <text x={pos.x} y={pos.y - 2} textAnchor="middle" fill="#0C3B2B" fontSize={10} fontWeight={600}>
                  {feeder.name.split(' ')[0]} Fdr
                </text>
                <text x={pos.x} y={pos.y + 11} textAnchor="middle" fill="#5B6B62" fontSize={9} className="tabular-nums">
                  {reading ? formatPower(reading.demandKw, 0) : '—'}
                </text>

                {/* Renewable icons where applicable */}
                {hasSolar && (
                  <circle cx={pos.x - 30} cy={pos.y - 14} r={6} fill="#FEF7E6" stroke="#E9A820" strokeWidth={1} />
                )}
                {hasWind && (
                  <circle cx={pos.x + 30} cy={pos.y - 14} r={6} fill="#F2F7FD" stroke="#1B93A1" strokeWidth={1} />
                )}
              </g>
            );
          })}

          {/* Colony Nodes: Thin house-outline glyphs */}
          {INITIAL_TOPOLOGY.colonies.map((colony) => {
            const pos = colonyCoords[colony.id];
            if (!pos) return null;
            const status = colonyStatuses[colony.id] || 'stable';
            const reading = colonyReadings[colony.id];
            const strokeColor = getStatusStroke(status);

            return (
              <g
                key={colony.id}
                className="cursor-pointer transition-transform hover:scale-[1.04]"
                onClick={() =>
                  setSelectedNode({
                    type: 'colony',
                    id: colony.id,
                    name: colony.name,
                  })
                }
              >
                {/* House Glyphs */}
                <path
                  d={`M ${pos.x - 14} ${pos.y + 6} L ${pos.x - 14} ${pos.y - 4} L ${pos.x} ${pos.y - 14} L ${pos.x + 14} ${pos.y - 4} L ${pos.x + 14} ${pos.y + 6} Z`}
                  fill="#FFFFFF"
                  stroke={strokeColor}
                  strokeWidth={2}
                />
                {/* Door / Window notch */}
                <rect x={pos.x - 3} y={pos.y} width={6} height={6} fill={strokeColor} opacity={0.3} />

                {/* Colony Label */}
                <text x={pos.x + 22} y={pos.y - 1} fill="#0C3B2B" fontSize={11} fontWeight={500}>
                  {colony.name}
                </text>
                <text x={pos.x + 22} y={pos.y + 11} fill="#5B6B62" fontSize={9.5} className="tabular-nums">
                  {reading ? formatPower(reading.demandKw, 0) : '—'} · {colony.houseCount} houses
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side Details Drawer */}
      <Drawer
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name || ''}
        subtitle={
          selectedNode?.type === 'powerhouse'
            ? 'Grid Main Distribution Node'
            : selectedNode?.type === 'feeder'
            ? '11kV Feeder Line'
            : 'Neighbourhood Colony Cluster'
        }
      >
        {renderDrawerDetails()}
      </Drawer>
    </div>
  );
};
