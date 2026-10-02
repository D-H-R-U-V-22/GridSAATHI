import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  label,
  value,
  onChange,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-medium text-[#5B6B62]">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none bg-white border border-[#DDE9E0] text-sm text-[#16241D] rounded-[6px] px-3 py-2 pr-8 focus:outline-none focus:border-[#27A163] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B62] pointer-events-none" />
      </div>
    </div>
  );
};
