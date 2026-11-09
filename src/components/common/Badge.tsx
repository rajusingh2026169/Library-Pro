import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-500/10',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60 ring-amber-500/10',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-rose-500/10',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 ring-indigo-500/10',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60 ring-blue-500/10',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60 ring-purple-500/10',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ring-1 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};
