import React from 'react';
import { NodeLevel } from '../../domain/types';
import { INITIAL_TOPOLOGY } from '../../config/topology';

export interface ScopeValue {
  level: NodeLevel;
  id: string;
}

interface ScopePickerProps {
  value: ScopeValue;
  onChange: (value: ScopeValue) => void;
  className?: string;
}

export const ScopePicker: React.FC<ScopePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={`${value.level}:${value.id}`}
        onChange={(e) => {
          const [level, id] = e.target.value.split(':') as [NodeLevel, string];
          onChange({ level, id });
        }}
        className="text-xs font-medium text-[#0C3B2B] bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-[#27A163] cursor-pointer"
      >
        <optgroup label="Grid Level">
          <option value="powerhouse:ph-pragati">Whole Power House (All Areas)</option>
        </optgroup>
        <optgroup label="Areas">
          {INITIAL_TOPOLOGY.areas.map((a) => (
            <option key={a.id} value={`area:${a.id}`}>
              Area: {a.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Feeders">
          {INITIAL_TOPOLOGY.feeders.map((f) => (
            <option key={f.id} value={`feeder:${f.id}`}>
              Feeder: {f.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Colonies">
          {INITIAL_TOPOLOGY.colonies.map((c) => (
            <option key={c.id} value={`colony:${c.id}`}>
              Colony: {c.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};
