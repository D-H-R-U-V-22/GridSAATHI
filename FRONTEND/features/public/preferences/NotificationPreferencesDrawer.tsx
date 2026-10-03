import React, { useState } from 'react';
import { useSessionStore } from '../../../store/useSessionStore';
import { useLocationStore } from '../../../store/useLocationStore';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import {
  X,
  Bell,
  Smartphone,
  ShieldCheck,
  Check,
  Send,
  Trash2,
  Lock,
  MessageSquare,
  Radio,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface NotificationPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREF_STORAGE_KEY = 'gs.resident_phone.v1';

export const NotificationPreferencesDrawer: React.FC<NotificationPreferencesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const language = useSessionStore((s) => s.language);
  const currentColony = useLocationStore((s) => s.currentColony);

  // Stored registration state
  const [phoneNumber, setPhoneNumber] = useState(() => {
    try {
      const saved = localStorage.getItem(PREF_STORAGE_KEY);
      return saved ? JSON.parse(saved).phone || '' : '';
    } catch {
      return '';
    }
  });

  const [isVerified, setIsVerified] = useState(() => {
    try {
      const saved = localStorage.getItem(PREF_STORAGE_KEY);
      return saved ? !!JSON.parse(saved).isVerified : false;
    } catch {
      return false;
    }
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(true);

  // Channels
  const [channels, setChannels] = useState({
    push: true,
    whatsapp: true,
    telegram: false,
    sms: true,
  });

  const [severityFilter, setSeverityFilter] = useState<'all' | 'warning_critical'>('warning_critical');
  const [quietHours, setQuietHours] = useState(true);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      showToast({
        type: 'error',
        title: 'Invalid Phone Number',
        message: 'Please enter a valid 10-digit Indian mobile number.',
      });
      return;
    }
    setOtpSent(true);
    showToast({
      type: 'info',
      title: 'Verification Code Sent',
      message: `Mock OTP sent to +91 ${cleaned.slice(-10)}. (Enter 1234 to verify)`,
    });
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim().length >= 4) {
      setIsVerified(true);
      setOtpSent(false);
      localStorage.setItem(
        PREF_STORAGE_KEY,
        JSON.stringify({
          phone: phoneNumber,
          isVerified: true,
          channels,
          severityFilter,
          quietHours,
        })
      );
      showToast({
        type: 'success',
        title: 'Mobile Verified Successfully',
        message: 'You will now receive urgent grid outage & solar dip advisories on this phone.',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter the 4-digit code (e.g. 1234).',
      });
    }
  };

  const handleSendTestAlert = () => {
    showToast({
      type: 'info',
      title: '🔔 [Test Alert Sent]',
      message: `[GridSaathi] Test alert delivered to +91 ${phoneNumber.slice(-4) || '9876'}. Response time: 42ms.`,
    });
  };

  const handleUnsubscribe = () => {
    setPhoneNumber('');
    setIsVerified(false);
    setOtpSent(false);
    setOtpCode('');
    localStorage.removeItem(PREF_STORAGE_KEY);
    showToast({
      type: 'info',
      title: 'Phone Unregistered',
      message: 'Your phone number and notification preferences have been removed.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-[440px] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#DDE9E0]">
        {/* Header */}
        <div className="p-5 border-b border-[#DDE9E0] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-[8px] bg-[#EAF7EE] text-[#13724A]">
              <Smartphone className="w-5 h-5 text-[#27A163]" />
            </span>
            <div>
              <h2 className="text-base font-bold font-heading text-[#0C3B2B]">
                {language === 'hi' ? 'फोन अलर्ट व सूचनाएं' : 'Phone Alert Settings'}
              </h2>
              <p className="text-[11px] text-[#5B6B62]">
                {currentColony.name[language === 'hi' ? 'hi' : 'en']} · Multi-Channel Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5B6B62] hover:text-[#16241D] rounded-[6px] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex flex-col gap-5 text-xs flex-1">
          {/* Phone Registration Section */}
          <div className="p-4 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[12px] flex flex-col gap-3">
            <span className="font-bold text-[#0C3B2B] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#13724A]" />
              {language === 'hi' ? 'मोबाइल नंबर सत्यापन' : 'Registered Mobile Number'}
            </span>

            {isVerified ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-[8px] border border-[#8ED1A8]">
                <div>
                  <span className="text-[10px] text-[#13724A] font-bold uppercase tracking-wider block">
                    Verified for Outage Alerts
                  </span>
                  <span className="text-sm font-bold font-heading text-[#0C3B2B] tabular-nums">
                    +91 {phoneNumber.slice(0, 2)}*** ***{phoneNumber.slice(-2)}
                  </span>
                </div>
                <span className="px-2 py-1 bg-[#EAF7EE] text-[#13724A] text-[10px] font-bold rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-2 bg-white border border-[#DDE9E0] rounded-[6px] text-xs font-semibold text-[#5B6B62]">
                    +91 (India)
                  </span>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-xs font-semibold text-[#0C3B2B] focus:outline-none focus:border-[#27A163]"
                    maxLength={10}
                  />
                </div>

                {!otpSent ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSendOtp}
                    className="w-full justify-center"
                  >
                    Send Verification OTP
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 pt-1 border-t border-[#DDE9E0]">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter 4-digit OTP (1234)"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="flex-1 bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-xs font-bold text-center tracking-widest text-[#0C3B2B]"
                        maxLength={6}
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleVerifyOtp}
                      >
                        Verify
                      </Button>
                    </div>
                    <span className="text-[10px] text-[#5B6B62]">
                      Demo test code: <strong>1234</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* DPDP Consent */}
            <label className="flex items-start gap-2 pt-1 text-[11px] text-[#5B6B62] cursor-pointer">
              <input
                type="checkbox"
                checked={dpdpConsent}
                onChange={(e) => setDpdpConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#27A163] focus:ring-0"
              />
              <span>
                <strong>DPDP Act 2023 Consent:</strong> I agree to receive essential grid reliability, scheduled power cut, and emergency demand response advisories. Data is not shared with third parties.
              </span>
            </label>
          </div>

          {/* Delivery Channels */}
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-[#0C3B2B]">
              Preferred Notification Channels
            </span>

            <div className="grid grid-cols-2 gap-2">
              <label className="p-3 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[8px] flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 font-medium text-[#0C3B2B]">
                  <Bell className="w-3.5 h-3.5 text-[#13724A]" /> In-App & Push
                </span>
                <input
                  type="checkbox"
                  checked={channels.push}
                  onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                  className="rounded text-[#27A163] focus:ring-0"
                />
              </label>

              <label className="p-3 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[8px] flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 font-medium text-[#0C3B2B]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#27A163]" /> WhatsApp
                </span>
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                  className="rounded text-[#27A163] focus:ring-0"
                />
              </label>

              <label className="p-3 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[8px] flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 font-medium text-[#0C3B2B]">
                  <Radio className="w-3.5 h-3.5 text-[#1B93A1]" /> Telegram Bot
                </span>
                <input
                  type="checkbox"
                  checked={channels.telegram}
                  onChange={(e) => setChannels({ ...channels, telegram: e.target.checked })}
                  className="rounded text-[#27A163] focus:ring-0"
                />
              </label>

              <label className="p-3 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[8px] flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 font-medium text-[#0C3B2B]">
                  <Smartphone className="w-3.5 h-3.5 text-[#B07B0E]" /> SMS (DLT)
                </span>
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                  className="rounded text-[#27A163] focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Severity & Quiet Hours */}
          <div className="flex flex-col gap-3 p-3.5 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[10px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#0C3B2B] block">Quiet Hours (10 PM – 6 AM)</span>
                <span className="text-[10px] text-[#5B6B62]">
                  Suppresses non-urgent advisories; critical outages will still alert.
                </span>
              </div>
              <input
                type="checkbox"
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
                className="rounded text-[#27A163] focus:ring-0"
              />
            </div>

            <div className="pt-2 border-t border-[#DDE9E0] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#0C3B2B] block">Alert Threshold</span>
                <span className="text-[10px] text-[#5B6B62]">
                  Only notify when grid stress is elevated.
                </span>
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="text-xs bg-white border border-[#DDE9E0] rounded-[4px] px-2 py-1 font-semibold text-[#0C3B2B]"
              >
                <option value="all">All Alerts</option>
                <option value="warning_critical">Warning & Critical Only</option>
              </select>
            </div>
          </div>

          {/* Test Alert Button */}
          {isVerified && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Send className="w-3 h-3 text-[#13724A]" />}
                onClick={handleSendTestAlert}
                className="flex-1 justify-center"
              >
                Send Test Notification
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5 text-[#C73E3A]" />}
                onClick={handleUnsubscribe}
                title="Unsubscribe phone"
              >
                Unsubscribe
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDE9E0] bg-[#F5FAF6] flex items-center justify-between text-[11px] text-[#5B6B62]">
          <span>TRAI DLT Entity #11071689234</span>
          <button
            onClick={onClose}
            className="font-bold text-[#13724A] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
