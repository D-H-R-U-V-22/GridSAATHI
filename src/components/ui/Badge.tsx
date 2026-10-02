import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'green' | 'amber' | 'red' | 'blue';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const styles = {
    neutral: 'bg-[#F5FAF6] text-[#5B6B62] border-[#DDE9E0]',
    green: 'bg-[#EAF7EE] text-[#13724A] border-[#8ED1A8]',
    amber: 'bg-[#FEF7E6] text-[#B07B0E] border-[#F8D288]',
    red: 'bg-[#FCEEED] text-[#9E2824] border-[#ECA3A0]',
    blue: 'bg-[#F2F7FD] text-[#205499] border-[#B9D5F8]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-[6px] border ${styles} ${className} whitespace-nowrap`}
    >
      {children}
    </span>
  );
};
