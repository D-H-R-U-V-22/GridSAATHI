import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none rounded-[6px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#13724A] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[44px]',
  }[size];

  const variantClasses = {
    primary: 'bg-[#27A163] text-white hover:bg-[#13724A] shadow-sm active:translate-y-[0.5px]',
    secondary: 'bg-[#EAF7EE] text-[#0C3B2B] hover:bg-[#D6EFDD] active:bg-[#C2E4CD]',
    outline: 'bg-white text-[#16241D] border border-[#DDE9E0] hover:bg-[#F5FAF6] hover:border-[#8ED1A8]',
    destructive: 'bg-[#C73E3A] text-white hover:bg-[#A82E2B] shadow-sm',
    ghost: 'text-[#16241D] hover:bg-[#EAF7EE] hover:text-[#0C3B2B]',
  }[variant];

  return (
    <button
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
