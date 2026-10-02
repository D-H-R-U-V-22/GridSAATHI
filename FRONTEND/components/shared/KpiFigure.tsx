import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiFigureProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
  className?: string;
}

export const KpiFigure: React.FC<KpiFigureProps> = ({
  label,
  value,
  unit,
  change,
  trend = 'neutral',
  subtext,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-white rounded-[12px] border border-[#DDE9E0] flex flex-col justify-between ${className}`}>
      <span className="text-xs text-[#5B6B62] font-medium leading-tight">{label}</span>

      <div className="flex items-baseline gap-1.5 my-1.5">
        <span className="text-2xl lg:text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-[#5B6B62]">{unit}</span>}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#5B6B62]">
        {change && (
          <span
            className={`inline-flex items-center font-semibold tabular-nums ${
              trend === 'up'
                ? 'text-[#27A163]'
                : trend === 'down'
                ? 'text-[#C73E3A]'
                : 'text-[#5B6B62]'
            }`}
          >
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </span>
        )}
        {subtext && <span className="truncate">{subtext}</span>}
      </div>
    </div>
  );
};
