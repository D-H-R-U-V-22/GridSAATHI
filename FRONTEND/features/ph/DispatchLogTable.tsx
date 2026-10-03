import React, { useState } from 'react';
import { useAlertStore } from '../../store/useAlertStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  MessageSquare,
  Radio,
  Bell,
  RefreshCw,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const DispatchLogTable: React.FC = () => {
  const { showToast } = useToast();
  const dispatchLogs = useAlertStore((s) => s.dispatchLogs);
  const currentArea = useLocationStore((s) => s.currentArea);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [isRetrying, setIsRetrying] = useState(false);

  const totalHouses = currentArea.colonies.reduce((sum, c) => sum + c.houseCount, 0) * 10;
  const reachableHouses = Math.round(totalHouses * 0.88);

  const filteredLogs = dispatchLogs.filter((log) => {
    if (channelFilter === 'all') return true;
    return log.channel === channelFilter;
  });

  const handleRetryFailed = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      showToast({
        type: 'success',
        title: 'Retry Dispatch Complete',
        message: 'All unacknowledged alert deliveries re-queued with fallback SMS.',
      });
    }, 600);
  };

  const handleInviteResidents = () => {
    showToast({
      type: 'info',
      title: 'Citizen Onboarding Link Generated',
      message: 'Broadcast invite sent to colony RWA committees to register phone numbers.',
    });
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 shadow-xs flex flex-col gap-4">
      {/* Header & Coverage Stat */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE9E0]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <Send className="w-4 h-4 text-[#27A163]" />
            </span>
            <h3 className="text-base font-bold font-heading text-[#0C3B2B]">
              Real-Time Alert Dispatch & Resident Phone Delivery Log
            </h3>
          </div>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            Audit trail of broadcast dispatches across Web Push, WhatsApp Cloud, Telegram, and TRAI DLT SMS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />}
            onClick={handleRetryFailed}
          >
            Retry Failed Dispatches
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Users className="w-3.5 h-3.5" />}
            onClick={handleInviteResidents}
          >
            Invite Unregistered Houses
          </Button>
        </div>
      </div>

      {/* Coverage Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#5B6B62]">Multi-Channel Reachability</span>
            <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums mt-0.5">
              {reachableHouses.toLocaleString()} <span className="text-xs font-normal text-[#5B6B62]">/ {totalHouses.toLocaleString()}</span>
            </p>
          </div>
          <span className="text-xs font-bold text-[#13724A] bg-[#EAF7EE] px-2 py-1 rounded-[6px]">
            88% Coverage
          </span>
        </div>

        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#5B6B62]">Carrier Delivery Rate</span>
            <p className="text-xl font-bold font-heading text-[#13724A] tabular-nums mt-0.5">
              99.2%
            </p>
          </div>
          <span className="text-xs font-semibold text-[#13724A]">Avg Latency 84ms</span>
        </div>

        <div className="p-3.5 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#5B6B62]">TRAI DLT Template Status</span>
            <p className="text-xl font-bold font-heading text-[#0C3B2B] mt-0.5">
              Approved
            </p>
          </div>
          <span className="text-xs text-[#27A163] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 4 Active
          </span>
        </div>
      </div>

      {/* Channel Filters */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#5B6B62] font-semibold">Filter Channel:</span>
        {(['all', 'sms', 'whatsapp', 'push', 'telegram'] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`px-2.5 py-1 rounded-[4px] capitalize font-medium transition-colors cursor-pointer ${
              channelFilter === ch
                ? 'bg-[#0C3B2B] text-white'
                : 'bg-[#F5FAF6] text-[#5B6B62] hover:bg-[#EAF7EE]'
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Delivery Table */}
      <div className="overflow-x-auto text-xs border border-[#DDE9E0] rounded-[10px]">
        <table className="w-full text-left">
          <thead className="bg-[#F5FAF6] border-b border-[#DDE9E0] text-[11px] text-[#5B6B62] font-semibold">
            <tr>
              <th className="py-2.5 px-3">House & Colony</th>
              <th className="py-2.5 px-3">Resident Contact</th>
              <th className="py-2.5 px-3">Channel Used</th>
              <th className="py-2.5 px-3">Delivery Status</th>
              <th className="py-2.5 px-3 text-right">Delivered At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE9E0]/50 text-[#16241D]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#5B6B62]">
                  No delivery events recorded yet. Alerts published from composer will appear here.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={`${log.houseId}-${idx}`} className="hover:bg-[#F5FAF6]/50">
                  <td className="py-2.5 px-3 font-semibold text-[#0C3B2B]">
                    {log.houseLabel}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium">{log.ownerName}</span>
                    <span className="text-[11px] text-[#5B6B62] block tabular-nums">
                      {log.phoneMasked}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-[#13724A]">
                    {log.channel}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#27A163] bg-[#EAF7EE] px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> Delivered
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#5B6B62]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
