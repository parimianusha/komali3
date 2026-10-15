import React from 'react';

interface ConfidenceMeterProps {
  confidence: number | null | undefined;
  showBar?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence,
  showBar = false,
}) => {
  if (confidence === null || confidence === undefined) {
    return (
      <span className="inline-flex items-center text-xs font-mono text-slate-500">
        N/A
      </span>
    );
  }

  const percent = Math.round(confidence * 100);

  let textColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-500/10 border-emerald-500/30';
  let barColor = 'bg-emerald-500';

  if (confidence < 0.6) {
    textColor = 'text-rose-400';
    bgColor = 'bg-rose-500/10 border-rose-500/30';
    barColor = 'bg-rose-500';
  } else if (confidence < 0.85) {
    textColor = 'text-amber-400';
    bgColor = 'bg-amber-500/10 border-amber-500/30';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${bgColor} ${textColor}`}
      >
        {percent}%
      </span>
      {showBar && (
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
};
