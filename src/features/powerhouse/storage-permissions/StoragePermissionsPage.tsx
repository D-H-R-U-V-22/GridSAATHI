import React, { useState } from 'react';
import { useStorageStore } from '../../../store/useStorageStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { Button } from '../../../components/ui/Button';
import { formatEnergy, formatPower } from '../../../lib/format';
import { formatTime12h, formatRemainingTime } from '../../../lib/time';
import { useNow } from '../../../hooks/useNow';
import { Battery, BatteryCharging, ShieldAlert, Check, X, Bell, History } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

export const StoragePermissionsPage: React.FC = () => {
  const { now } = useNow();
  const { showToast } = useToast();

  const batteries = useStorageStore((s) => s.batteries);
  const backupRequests = useStorageStore((s) => s.backupRequests);
  const preCutNotices = useStorageStore((s) => s.preCutNotices);
  const auditTrail = useStorageStore((s) => s.auditTrail);
  const decideBackup = useStorageStore((s) => s.decideBackup);
  const sendPreCutNotice = useStorageStore((s) => s.sendPreCutNotice);
  const activateEmergencyBackup = useStorageStore((s) => s.activateEmergencyBackup);

  const [preCutColonyId, setPreCutColonyId] = useState('colony-shanti-vihar');
  const [preCutMinutes, setPreCutMinutes] = useState('45');
  const [preCutReason, setPreCutReason] = useState('Planned 11kV transformer servicing and phase balancing');

  const handleSendPreCut = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(preCutMinutes, 10);
    sendPreCutNotice({
      colonyId: preCutColonyId,
      cutAt: Date.now() + mins * 60 * 1000,
      expectedMinutes: 60,
      reason: preCutReason,
      consent: 'waiting',
      backupActivated: false,
    });
    showToast({
      type: 'success',
      title: 'Pre-Cut Notice Dispatched',
      message: `Countdown sent to colony. Awaiting consent or auto-activation.`,
    });
  };

  const handleApprove = (requestId: string, colonyId: string) => {
    decideBackup(requestId, 'approve', 90);
    showToast({
      type: 'success',
      title: 'Emergency Backup Approved',
      message: `Granted 90 minutes of vital circuit discharge for ${colonyId}.`,
    });
  };

  const handleDeny = (requestId: string) => {
    decideBackup(requestId, 'deny');
    showToast({
      type: 'error',
      title: 'Backup Request Denied',
      message: 'Grid capacity reserve constraints.',
    });
  };

  const pendingRequests = backupRequests.filter((r) => r.status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          Shared Storage Permissions & Pre-Cut Coordination
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          Monitor community battery banks, authorize emergency backup requests, and issue pre-cut blackout notices
        </p>
      </div>

      {/* Pending Blackout Backup Requests (Action Inbox) */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#C73E3A]" /> Blackout Emergency Backup Requests ({pendingRequests.length})
          </h2>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-xs text-[#5B6B62] p-4 bg-[#F5FAF6] rounded-[8px]">
            No pending community battery authorization requests. Colonies experiencing outages can submit requests directly from their portal.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingRequests.map((req) => {
              const c = INITIAL_TOPOLOGY.colonies.find((item) => item.id === req.colonyId);
              const bat = batteries[req.colonyId];

              return (
                <div
                  key={req.id}
                  className="p-4 bg-[#FEF7F2] border border-[#F5AC7B] rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-xs font-bold text-[#0C3B2B]">
                      {c?.name} · Blackout Backup Requested
                    </h3>
                    <p className="text-xs text-[#5B6B62] mt-0.5">
                      Reason: <strong className="capitalize text-[#16241D]">{req.reason.replace('_', ' ')}</strong> · Battery SoC: <strong className="text-[#13724A]">{bat?.socPct}%</strong> ({formatEnergy(bat?.capacityKwh || 120)})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Check className="w-4 h-4" />}
                      onClick={() => handleApprove(req.id, req.colonyId)}
                    >
                      Approve (90m)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<X className="w-4 h-4" />}
                      onClick={() => handleDeny(req.id)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Cut Workflow Dispatch Form */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#27A163]" /> Dispatch Pre-Cut Blackout Notice
          </h2>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            Warn a colony prior to planned load shedding so their community battery can automatically prepare vital circuits
          </p>
        </div>

        <form onSubmit={handleSendPreCut} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Target Colony</label>
            <select
              value={preCutColonyId}
              onChange={(e) => setPreCutColonyId(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
            >
              {INITIAL_TOPOLOGY.colonies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.autoConsentBackup ? '(Auto-Consent ON)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Scheduled Cut In (Mins)</label>
            <input
              type="number"
              value={preCutMinutes}
              onChange={(e) => setPreCutMinutes(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
              placeholder="45"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Reason for Curtailment</label>
            <input
              type="text"
              value={preCutReason}
              onChange={(e) => setPreCutReason(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
              placeholder="e.g. Substation maintenance"
            />
          </div>

          <Button type="submit" variant="primary">
            Send Pre-Cut Notice
          </Button>
        </form>

        {/* Active Pre-Cut Notices */}
        {preCutNotices.length > 0 && (
          <div className="pt-3 border-t border-[#DDE9E0]/60 flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#5B6B62]">Active Pre-Cut Windows</span>
            {preCutNotices.map((n) => {
              const c = INITIAL_TOPOLOGY.colonies.find((col) => col.id === n.colonyId);
              return (
                <div
                  key={n.id}
                  className="p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0] flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <strong className="text-[#0C3B2B]">{c?.name}</strong>: Scheduled cut in{' '}
                    <strong className="tabular-nums">{formatRemainingTime(n.cutAt, now)}</strong> ({formatTime12h(n.cutAt)})
                    <span className="text-[#5B6B62] ml-2">[{n.reason}]</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#13724A] capitalize">
                      Consent: {n.consent.replace('_', ' ')}
                    </span>
                    {!n.backupActivated ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => activateEmergencyBackup(n.colonyId)}
                      >
                        Activate Backup
                      </Button>
                    ) : (
                      <span className="text-xs text-[#27A163] font-bold">✓ Backup Armed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Community Battery Fleet Table */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-[#0C3B2B] mb-3">
          Neighborhood Community Battery Fleet (12 Colonies)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDE9E0] text-[#5B6B62]">
              <tr>
                <th className="py-2.5 font-medium">Colony Bank</th>
                <th className="py-2.5 font-medium">Capacity</th>
                <th className="py-2.5 font-medium">State of Charge (SoC)</th>
                <th className="py-2.5 font-medium">Battery Health</th>
                <th className="py-2.5 font-medium">Current Mode</th>
                <th className="py-2.5 font-medium">Vital Circuits Powered</th>
                <th className="py-2.5 font-medium text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE9E0]/60">
              {INITIAL_TOPOLOGY.colonies.map((c) => {
                const bat = batteries[c.id];
                if (!bat) return null;

                return (
                  <tr key={c.id} className="hover:bg-[#F5FAF6] transition-colors">
                    <td className="py-3 font-semibold text-[#0C3B2B]">{c.name}</td>
                    <td className="py-3 tabular-nums text-[#5B6B62]">{formatEnergy(bat.capacityKwh)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[#EAF7EE] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              bat.socPct < 25 ? 'bg-[#C73E3A]' : 'bg-[#27A163]'
                            }`}
                            style={{ width: `${bat.socPct}%` }}
                          />
                        </div>
                        <span className="font-semibold tabular-nums text-[#0C3B2B]">
                          {bat.socPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 tabular-nums text-[#13724A] font-medium">{bat.healthPct}%</td>
                    <td className="py-3">
                      <span
                        className={`capitalize font-semibold px-2 py-0.5 rounded-[4px] text-[11px] ${
                          bat.mode === 'emergency'
                            ? 'bg-[#FCEEED] text-[#9E2824]'
                            : bat.mode === 'charging'
                            ? 'bg-[#EAF7EE] text-[#13724A]'
                            : 'bg-[#F5FAF6] text-[#5B6B62]'
                        }`}
                      >
                        {bat.mode}
                      </span>
                    </td>
                    <td className="py-3 text-[#5B6B62] truncate max-w-xs">
                      {bat.circuits.slice(0, 2).join(', ')}...
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant={bat.mode === 'emergency' ? 'outline' : 'secondary'}
                        onClick={() => activateEmergencyBackup(c.id)}
                        disabled={bat.mode === 'emergency'}
                      >
                        {bat.mode === 'emergency' ? 'Armed' : 'Activate Backup'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5">
        <h2 className="text-sm font-semibold text-[#0C3B2B] mb-2 flex items-center gap-2">
          <History className="w-4 h-4 text-[#5B6B62]" /> Storage & Pre-Cut Audit Trail
        </h2>
        <div className="divide-y divide-[#DDE9E0]/60 text-xs">
          {auditTrail.slice(0, 6).map((entry) => (
            <div key={entry.id} className="py-2.5 flex items-center justify-between">
              <div>
                <strong className="text-[#0C3B2B]">{entry.action}</strong>
                <span className="text-[#5B6B62] ml-2">by {entry.actor} ({entry.details})</span>
              </div>
              <span className="text-[#5B6B62] tabular-nums">{formatTime12h(entry.ts)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
