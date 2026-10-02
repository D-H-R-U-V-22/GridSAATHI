import React from 'react';
import { SupplyStatus } from '../../domain/types';
import { CheckCircle2, AlertTriangle, AlertCircle, ZapOff } from 'lucide-react';

interface StatusPillProps {
  status: SupplyStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    stable: {
      label: 'Stable',
      bg: 'bg-[#EAF7EE]',
      text: 'text-[#13724A]',
      border: 'border-[#8ED1A8]',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.75} />,
    },
    watch: {
      label: 'Watch',
      bg: 'bg-[#FEF7E6]',
      text: 'text-[#B07B0E]',
      border: 'border-[#F8D288]',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.75} />,
    },
    constrained: {
      label: 'Constrained',
      bg: 'bg-[#FDF1E9]',
      text: 'text-[#B34E14]',
      border: 'border-[#F5AC7B]',
      icon: <AlertCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.75} />,
    },
    outage: {
      label: 'Outage',
      bg: 'bg-[#FCEEED]',
      text: 'text-[#9E2824]',
      border: 'border-[#ECA3A0]',
      icon: <ZapOff className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.75} />,
    },
  }[status];

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1.5' : 'text-sm px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[6px] border ${config.bg} ${config.text} ${config.border} ${sizeClasses} whitespace-nowrap`}
    >
      {showIcon && <span className="shrink-0">{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
