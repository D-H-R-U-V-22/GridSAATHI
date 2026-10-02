import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[12px] border border-dashed border-[#DDE9E0]">
      <div className="w-12 h-12 rounded-full bg-[#EAF7EE] text-[#13724A] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-[#0C3B2B]">{title}</h4>
      <p className="text-xs text-[#5B6B62] max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
