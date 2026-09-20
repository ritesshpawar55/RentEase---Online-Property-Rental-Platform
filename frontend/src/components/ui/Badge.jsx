import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const variants = {
    info: 'bg-white/5 text-text-secondary border border-white/5',
    primary: 'bg-brand-primary/10 text-text-primary border border-brand-primary/30',
    secondary: 'bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30',
    accent: 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30',
    success: 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30',
    warning: 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30',
    danger: 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30',
    
    // AI Specific
    'fair-deal': 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/40 font-semibold shadow-md shadow-[#22c55e]/5',
    'great-value': 'bg-brand-primary/20 text-brand-accent border border-brand-primary/40 font-semibold shadow-md shadow-brand-primary/10',
    'above-market': 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/40 font-semibold shadow-md shadow-[#ef4444]/5',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.75 rounded-full text-[11px] font-sans font-medium tracking-wide uppercase select-none ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
