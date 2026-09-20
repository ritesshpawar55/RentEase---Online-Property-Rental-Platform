import React from 'react';

export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card bg-surface-raised/30 border border-white/5 p-5 rounded-2xl animate-pulse flex flex-col space-y-4 ${className}`}>
      {/* Photo skeleton */}
      <div className="w-full h-44 bg-white/5 rounded-xl relative overflow-hidden">
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
      </div>

      {/* Title & Info */}
      <div className="space-y-3">
        <div className="h-4.5 bg-white/5 rounded-lg w-4/5"></div>
        <div className="h-3 bg-white/5 rounded-lg w-2/5"></div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5"></div>

      {/* Row Specs */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-4 bg-white/5 rounded-lg w-1/4"></div>
        <div className="h-4 bg-white/5 rounded-lg w-1/4"></div>
      </div>
    </div>
  );
}
