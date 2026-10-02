import React, { useState } from 'react';
import { useStorageStore } from '../../../store/useStorageStore';
import { useOutageStore } from '../../../store/useOutageStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useGridStore } from '../../../store/useGridStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { formatEnergy, formatPower } from '../../../lib/format';
import { formatTime12h, formatRemainingTime } from '../../../lib/time';
import { useNow } from '../../../hooks/useNow';
import { calculateBatteryMinutesRemaining } from '../../../domain/selectors';
import {
  BatteryMedium,
  ShieldAlert,
  ZapOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

export const PublicStoragePage: React.FC = () => {
  const { now } = useNow();
  const { showToast } = useToast();

  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const colony = INITIAL_TOPOLOGY.colonies.find((c) => c.id === selectedColonyId);

  const batteries = useStorageStore((s) => s.batteries);
  const backupRequests = useStorageStore((s) => s.backupRequests);
  const preCutNotices = useStorageStore((s) => s.preCutNotices);
  const autoConsentMap = useStorageStore((s) => s.autoConsentMap);
  const toggleAutoConsent = useStorageStore((s) => s.toggleAutoConsent);
  const requestBackup = useStorageStore((s) => s.requestBackup);
  const respondPreCut = useStorageStore((s) => s.respondPreCut);

  const activeOutages = useOutageStore((s) => s.activeOutages);
  const pastOutages = useOutageStore((s) => s.pastOutages);

  const reading = useGridStore((s) => s.colonyReadings[selectedColonyId]);
  const battery = batteries[selectedColonyId];
  const batteryMins = calculateBatteryMinutesRemaining(
    battery,
    reading?.demandKw ? reading.demandKw * 0.2 : 20
  );

  const activeOutage = activeOutages.find((o) => o.colonyId === selectedColonyId);
  const isAutoConsent = !!autoConsentMap[selectedColonyId];

  // Check if there is an active pre-cut notice for this colony
  const activePreCut = preCutNotices.find((n) => n.colonyId === selectedColonyId);

  // Check if there is an active request
  const myRequest = backupRequests.find(
    (r) => r.colonyId === selectedColonyId && (r.status === 'pending' || r.status === 'approved')
  );

  const [requestReason, setRequestReason] = useState<'blackout' | 'pre_cut' | 'other'>('blackout');

  const handleSendBackupRequest = () => {
    requestBackup(selectedColonyId, requestReason);
    showToast({
      type: 'success',
      title: 'Emergency Backup Requested',
      message: 'Transmission dispatched to Power House operator for permission authorization.',
    });
  };

  const handleConsentPreCut = (consent: 'consented' | 'declined') => {
    if (activePreCut) {
      respondPreCut(activePreCut.id, consent);
      showToast({
        type: consent === 'consented' ? 'success' : 'info',
        title: consent === 'consented' ? 'Backup Consent Granted' : 'Backup Declined',
        message: 'Power House operator notified of colony response.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          Community Battery Storage & Blackout Coordination
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          Local energy autonomy for vital circuits during grid outages and planned maintenance
        </p>
      </div>

      {/* Outage Banner if currently in an outage */}
      {activeOutage && (
        <div className="p-5 bg-[#FCEEED] border border-[#ECA3A0] rounded-[16px] flex flex-col gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <ZapOff className="w-6 h-6 text-[#9E2824] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#9E2824] uppercase tracking-wide">
                Power Outage Ongoing in {colony?.name}
              </span>
              <h2 className="text-xl font-bold text-[#0C3B2B] mt-0.5">
                Grid Electricity Disrupted
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6B62] mt-2">
                <span>
                  Cause: <strong className="capitalize text-[#16241D]">{activeOutage.cause.replace('_', ' ')}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Duration so far: <strong className="tabular-nums text-[#16241D]">{Math.floor((now - activeOutage.startedAt) / 60000)} mins</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Expected Return (ETA): <strong className="text-[#13724A] tabular-nums font-semibold">
                    {activeOutage.etaAt ? formatTime12h(activeOutage.etaAt) : 'Evaluating'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Pre-Cut Notice with Countdown */}
      {activePreCut && (
        <div className="p-5 bg-[#FEFAF2] border border-[#F8D288] rounded-[16px] flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#B07B0E] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#785103] uppercase tracking-wider">
                  Upcoming Planned Power Cut Notice
                </span>
                <h3 className="text-base font-bold text-[#0C3B2B] mt-0.5">
                  Scheduled shut-off in {formatRemainingTime(activePreCut.cutAt, now)} ({formatTime12h(activePreCut.cutAt)})
                </h3>
                <p className="text-xs text-[#5B6B62] mt-1 leading-relaxed">
                  Reason: {activePreCut.reason}. The Power House is requesting permission to switch your community battery into emergency discharge mode.
                </p>
              </div>
            </div>

            {/* Consent action or status */}
            <div className="self-end sm:self-center shrink-0">
              {activePreCut.consent === 'waiting' ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="primary" onClick={() => handleConsentPreCut('consented')}>
                    Allow Backup Now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleConsentPreCut('declined')}>
                    Decline
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-bold text-[#13724A] bg-[#D6EFDD] px-3 py-1.5 rounded-[6px]">
                  ✓ {activePreCut.consent === 'auto_consented' ? 'Auto-Consented' : 'Consent Confirmed'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Battery State of Charge & Circuits Card */}
      <section className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[10px] bg-[#EAF7EE] text-[#13724A]">
              <BatteryMedium className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0C3B2B]">
                {colony?.name} Community Battery Bank
              </h2>
              <p className="text-xs text-[#5B6B62]">
                Shared {formatEnergy(battery?.capacityKwh || 160)} LiFePO4 energy storage system
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-[6px] capitalize ${
              battery?.mode === 'emergency'
                ? 'bg-[#FCEEED] text-[#9E2824]'
                : battery?.mode === 'discharging'
                ? 'bg-[#FEFAF2] text-[#B07B0E]'
                : 'bg-[#EAF7EE] text-[#13724A]'
            }`}
          >
            Mode: {battery?.mode || 'Idle'}
          </span>
        </div>

        {/* Battery Gauge */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {battery ? battery.socPct : 80}%{' '}
              <span className="text-xs font-medium text-[#5B6B62]">State of Charge</span>
            </span>
            <span className="text-sm font-semibold text-[#13724A] tabular-nums">
              Est. ~{batteryMins} minutes backup remaining
            </span>
          </div>

          <div className="w-full h-3 bg-[#EAF7EE] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                (battery?.socPct || 80) < 25 ? 'bg-[#C73E3A]' : 'bg-[#27A163]'
              }`}
              style={{ width: `${battery?.socPct || 80}%` }}
            />
          </div>
        </div>

        {/* Vital Circuits Powered List */}
        <div className="p-4 bg-[#F5FAF6] rounded-[10px] border border-[#DDE9E0]">
          <span className="text-xs font-semibold text-[#0C3B2B] block mb-2">
            Protected Circuits Powered by this Battery Bank:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#16241D]">
            {(battery?.circuits || [
              'Submersible community water pump',
              'Stairwell and street lights',
              'Cold chain & community clinic medicines',
              'Telecom repeater & Wi-Fi mesh',
            ]).map((circ, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#27A163] shrink-0" />
                <span>{circ}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Consent Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-[#DDE9E0]">
          <div>
            <span className="text-xs font-semibold text-[#0C3B2B] block">
              Automated Pre-Cut Consent
            </span>
            <p className="text-xs text-[#5B6B62]">
              Grant standing permission to the DISCOM to arm emergency battery backup automatically prior to cuts.
            </p>
          </div>
          <Switch
            checked={isAutoConsent}
            onChange={() => toggleAutoConsent(selectedColonyId)}
          />
        </div>
      </section>

      {/* Emergency Backup Request Action Panel */}
      <section className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0C3B2B] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#27A163]" /> Request Emergency Battery Backup
          </h2>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            If grid power has cut without prior notice, submit an emergency backup authorization request to the Power House
          </p>
        </div>

        {myRequest ? (
          <div className="p-4 bg-[#EAF7EE] border border-[#8ED1A8] rounded-[10px] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#13724A] uppercase tracking-wide">
                Backup Request: {myRequest.status.toUpperCase()}
              </span>
              <p className="text-xs text-[#0C3B2B] mt-0.5">
                {myRequest.status === 'pending'
                  ? 'Your request is in queue with the Power House dispatcher.'
                  : `Approved by operator for up to ${myRequest.maxMinutes || 90} minutes.`}
              </p>
            </div>
            <span className="text-xs text-[#13724A] font-semibold tabular-nums">
              Submitted {formatTime12h(myRequest.requestedAt)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value as any)}
              className="text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 flex-1"
            >
              <option value="blackout">Immediate Blackout / Sudden Grid Loss</option>
              <option value="pre_cut">Preparing for Scheduled Local Maintenance</option>
              <option value="other">Vital Medical Equipment Emergency</option>
            </select>
            <Button
              variant="primary"
              icon={<Send className="w-4 h-4" />}
              onClick={handleSendBackupRequest}
            >
              Send Request to Power House
            </Button>
          </div>
        )}
      </section>

      {/* Last 30 Days Outage History */}
      <section className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <History className="w-4 h-4 text-[#5B6B62]" /> Last 30 Days Outage Log ({colony?.name})
        </h2>
        <div className="divide-y divide-[#DDE9E0]/60 text-xs">
          {pastOutages.map((po) => {
            const durationMins = po.restoredAt
              ? Math.round((po.restoredAt - po.startedAt) / 60000)
              : 40;
            return (
              <div key={po.id} className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-[#0C3B2B] capitalize">
                    {po.cause.replace('_', ' ')} incident
                  </strong>
                  <span className="text-[#5B6B62] ml-2">
                    Duration: <strong className="tabular-nums">{durationMins} minutes</strong>
                  </span>
                </div>
                <span className="text-[#5B6B62] tabular-nums">{formatTime12h(po.startedAt)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
