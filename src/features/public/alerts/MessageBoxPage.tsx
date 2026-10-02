import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertStore } from '../../../store/useAlertStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { formatTime12h, formatRelativeTime } from '../../../lib/time';
import { useNow } from '../../../hooks/useNow';
import { MessageSquare, ArrowLeft, CheckCheck, Smartphone } from 'lucide-react';

export const MessageBoxPage: React.FC = () => {
  const navigate = useNavigate();
  const { now } = useNow();
  const selectedColonyId = useSessionStore((s) => s.selectedColonyId);
  const messages = useAlertStore((s) => s.messages);
  const markMessageRead = useAlertStore((s) => s.markMessageRead);
  const markAllMessagesRead = useAlertStore((s) => s.markAllMessagesRead);

  // Filter messages for this colony
  const colonyMessages = messages.filter((m) => m.colonyId === selectedColonyId);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/colony/alerts')}
            className="p-1.5 rounded-[6px] border border-[#DDE9E0] bg-white text-[#5B6B62] hover:text-[#16241D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-heading text-[#0C3B2B]">
              SMS Alert Inbox
            </h1>
            <p className="text-xs text-[#5B6B62]">
              Simulated phone message thread from DISCOM grid dispatch
            </p>
          </div>
        </div>

        {colonyMessages.length > 0 && (
          <button
            onClick={markAllMessagesRead}
            className="text-xs font-semibold text-[#27A163] hover:text-[#13724A] cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Phone Screen Container Simulation */}
      <div className="bg-white rounded-[16px] border border-[#DDE9E0] shadow-sm overflow-hidden flex flex-col">
        {/* SMS Phone Header Bar */}
        <div className="px-5 py-3.5 bg-[#F5FAF6] border-b border-[#DDE9E0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#13724A] flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#27A163]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0C3B2B] tracking-wide">GRIDSAATHI</div>
              <div className="text-[10px] text-[#5B6B62]">Official Power Grid Broadcast Gateway</div>
            </div>
          </div>
          <span className="text-[11px] text-[#5B6B62] tabular-nums">SMS Thread</span>
        </div>

        {/* Message Thread List */}
        <div className="p-5 flex flex-col gap-3 min-h-[360px] bg-[#FAFCF9]">
          {colonyMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center my-auto text-center p-8">
              <MessageSquare className="w-8 h-8 text-[#5B6B62]/40 mb-2" />
              <p className="text-xs text-[#5B6B62]">
                Your SMS inbox is empty. Emergency and intermittency notices published by the Power House will deliver here instantly.
              </p>
            </div>
          ) : (
            colonyMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => markMessageRead(msg.id)}
                className={`relative max-w-[85%] self-start p-3.5 rounded-[12px] border transition-all cursor-pointer ${
                  msg.read
                    ? 'bg-white border-[#DDE9E0] text-[#16241D]'
                    : 'bg-[#EAF7EE] border-[#8ED1A8] text-[#0C3B2B] shadow-xs'
                }`}
              >
                {!msg.read && (
                  <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#27A163] rounded-full border-2 border-white" />
                )}
                <p className="text-xs leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-[#DDE9E0]/50 text-[10px] text-[#5B6B62]">
                  <span className="tabular-nums">{formatTime12h(msg.ts)} ({formatRelativeTime(msg.ts, now)})</span>
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-[#27A163]' : 'text-[#5B6B62]'}`} />
                    Delivered
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
