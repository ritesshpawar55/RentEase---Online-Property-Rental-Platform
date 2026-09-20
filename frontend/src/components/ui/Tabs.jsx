import React from 'react';

/**
 * Premium glassmorphic tabs component.
 */
export default function Tabs({ 
  tabs, 
  activeTab, 
  onChange, 
  className = '' 
}) {
  return (
    <div className={`flex p-1 bg-white/5 border border-white/5 rounded-xl ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 uppercase tracking-wider select-none ${
              isActive
                ? 'bg-brand-primary text-text-primary shadow-lg shadow-brand-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
