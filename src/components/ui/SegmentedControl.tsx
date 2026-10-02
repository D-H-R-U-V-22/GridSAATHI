import React from 'react';

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1 bg-[#F5FAF6] border border-[#DDE9E0] rounded-[6px] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer font-medium transition-all rounded-[4px] whitespace-nowrap ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${
              isSelected
                ? 'bg-white text-[#0C3B2B] shadow-sm font-semibold'
                : 'text-[#5B6B62] hover:text-[#16241D]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
