import React from 'react';
import Spinner from './Spinner';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-base focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-primary hover:bg-brand-primary/90 text-text-primary border border-brand-primary/20 shadow-lg shadow-brand-primary/20',
    secondary: 'bg-brand-secondary hover:bg-brand-secondary/90 text-text-primary border border-brand-secondary/20 shadow-lg shadow-brand-secondary/20',
    accent: 'bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/40 shadow-sm shadow-brand-accent/5',
    outline: 'bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-text-primary',
    danger: 'bg-danger/20 hover:bg-danger/30 text-text-primary border border-danger/40 shadow-lg shadow-danger/10',
    ghost: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4.5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
  };

  const widthStyle = fullWidth ? 'w-full flex' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-1.5 text-current" />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </button>
  );
}
