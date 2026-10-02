import React from 'react';
import { Alert } from '../../domain/types';
import { getSeverityStyle } from '../../domain/status';
import { formatTime12h, formatRelativeTime } from '../../lib/time';
import { useNow } from '../../hooks/useNow';
import { CloudSun, Zap, Wrench, ShieldAlert, Radio, BatteryCharging } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onActionClick?: () => void;
  actionLabel?: string;
  isPublic?: boolean;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onActionClick,
  actionLabel,
  isPublic = false,
  className = '',
}) => {
  const { now } = useNow();
  const severityStyle = getSeverityStyle(alert.severity);

  const getIcon = () => {
    switch (alert.type) {
      case 'weather':
        return <CloudSun className="w-4 h-4 text-[#B07B0E]" strokeWidth={1.75} />;
      case 'high_load':
        return <Zap className="w-4 h-4 text-[#B34E14]" strokeWidth={1.75} />;
      case 'maintenance':
      case 'system':
        return <Wrench className="w-4 h-4 text-[#205499]" strokeWidth={1.75} />;
      case 'demand_response':
        return <Radio className="w-4 h-4 text-[#13724A]" strokeWidth={1.75} />;
      case 'storage':
        return <BatteryCharging className="w-4 h-4 text-[#13724A]" strokeWidth={1.75} />;
      case 'outage':
      default:
        return <ShieldAlert className="w-4 h-4 text-[#9E2824]" strokeWidth={1.75} />;
    }
  };

  const publishedTime = alert.publishedAt ? formatRelativeTime(alert.publishedAt, now) : 'recently';
  const windowTime = `${formatTime12h(alert.startsAt)}${
    alert.endsAt ? ` – ${formatTime12h(alert.endsAt)}` : ''
  }`;

  return (
    <div
      className={`p-4 bg-white rounded-[12px] border border-[#DDE9E0] ${severityStyle.border} flex flex-col gap-2 transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="text-sm font-semibold text-[#0C3B2B] leading-tight">{alert.title}</h4>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[4px] uppercase tracking-wide ${severityStyle.badge}`}>
          {alert.severity}
        </span>
      </div>

      <p className="text-xs text-[#16241D] leading-relaxed">{alert.body}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DDE9E0]/60 text-[11px] text-[#5B6B62]">
        <div className="flex items-center gap-2">
          <span>Window: <strong className="text-[#16241D] tabular-nums">{windowTime}</strong></span>
          {!isPublic && (
            <>
              <span aria-hidden="true">·</span>
              <span>Scope: <strong className="capitalize text-[#16241D]">{alert.scope.level}</strong></span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Published {publishedTime}</span>
          {actionLabel && onActionClick && (
            <button
              onClick={onActionClick}
              className="text-xs font-semibold text-[#27A163] hover:text-[#13724A] cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
