import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full divide-y divide-slate-800/60 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 py-4 px-6">
          <div className="w-5 h-5 bg-slate-800 rounded"></div>
          <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-3 bg-slate-800/60 rounded w-1/4"></div>
          </div>
          <div className="w-24 h-6 bg-slate-800 rounded-full"></div>
          <div className="w-20 h-6 bg-slate-800 rounded-md"></div>
          <div className="w-20 h-4 bg-slate-800/70 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-24 h-4 bg-slate-800 rounded"></div>
        <div className="w-8 h-8 bg-slate-800 rounded-xl"></div>
      </div>
      <div className="w-32 h-8 bg-slate-800 rounded"></div>
      <div className="w-48 h-3 bg-slate-800/60 rounded"></div>
    </div>
  );
};
