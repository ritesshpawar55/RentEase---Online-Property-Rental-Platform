import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  required = false,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label className="text-xs font-semibold text-text-secondary select-none">
          {label} {required && <span className="text-brand-secondary">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-text-muted pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-surface-raised/40 hover:bg-surface-raised/60 focus:bg-surface-raised/80 text-text-primary placeholder:text-text-muted text-sm font-sans px-4 py-2.5 rounded-xl border border-white/5 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-200 ${
            Icon ? 'pl-11' : ''
          } ${
            error ? 'border-danger/60 focus:border-danger focus:ring-danger' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs font-medium text-danger/90 pl-1 mt-0.5 animate-pulse">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
