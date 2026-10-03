import React from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { useSessionStore } from '../../store/useSessionStore';
import { MapPin, ChevronDown } from 'lucide-react';

interface LocationChipProps {
  compact?: boolean;
}

export const LocationChip: React.FC<LocationChipProps> = ({ compact = false }) => {
  const currentArea = useLocationStore((s) => s.currentArea);
  const currentColony = useLocationStore((s) => s.currentColony);
  const setModalOpen = useLocationStore((s) => s.setModalOpen);
  const language = useSessionStore((s) => s.language);

  return (
    <button
      onClick={() => setModalOpen(true)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F5FAF6] hover:bg-[#EAF7EE] border border-[#DDE9E0] hover:border-[#8ED1A8] rounded-[6px] text-xs font-semibold text-[#0C3B2B] transition-colors cursor-pointer max-w-[200px] sm:max-w-[260px] truncate"
      title="Change Service Area / Colony Location"
    >
      <MapPin className="w-3.5 h-3.5 text-[#27A163] shrink-0" />
      <span className="truncate">
        {compact
          ? currentColony.name[language === 'hi' ? 'hi' : 'en']
          : `${currentColony.name[language === 'hi' ? 'hi' : 'en']} · ${currentArea.district[language === 'hi' ? 'hi' : 'en']}`}
      </span>
      <ChevronDown className="w-3 h-3 text-[#5B6B62] shrink-0" />
    </button>
  );
};
