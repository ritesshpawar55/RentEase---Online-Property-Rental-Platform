import React from 'react';
import { Home } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No Data Available',
  description = 'There is currently nothing here to show. Try refreshing or coming back later.',
  icon: Icon = Home,
  actionText,
  onActionClick,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-white/10 rounded-2xl bg-surface-raised/10 ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-text-secondary mb-4 border border-white/5 shadow-inner">
        <Icon size={24} className="text-text-secondary" />
      </div>
      <h3 className="font-display font-semibold text-text-primary text-base mb-1.5">
        {title}
      </h3>
      <p className="text-text-secondary text-xs max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onActionClick && (
        <Button onClick={onActionClick} size="sm" variant="outline">
          {actionText}
        </Button>
      )}
    </div>
  );
}
