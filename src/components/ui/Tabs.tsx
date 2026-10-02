import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-[#DDE9E0] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`cursor-pointer pb-2.5 px-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
              isActive
                ? 'text-[#0C3B2B] font-semibold'
                : 'text-[#5B6B62] hover:text-[#16241D]'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full tabular-nums ${
                  isActive ? 'bg-[#D6EFDD] text-[#0C3B2B]' : 'bg-[#EAF7EE] text-[#5B6B62]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#27A163]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
