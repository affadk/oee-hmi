// /src/presentation/components/fullscreen/AvailabilityLossPanel.tsx

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

interface AvailabilityLossPanelProps {
  totalDowntimeMin: number;
  plannedProdTimeMin: number;
}

export const AvailabilityLossPanel: React.FC<AvailabilityLossPanelProps> = ({
  totalDowntimeMin,
  plannedProdTimeMin,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lossPct = plannedProdTimeMin > 0 ? ((totalDowntimeMin / plannedProdTimeMin) * 100) : 0;
  const availabilityPct = Math.max(0, 100 - lossPct);

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/20 dark:border-slate-700/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Downtime Loss
          </h3>
        </div>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-800/60">
          -{lossPct.toFixed(1)}% Loss
        </span>
      </div>

      {/* Main Metric */}
      <div className="my-1.5 flex items-center justify-between">
        <div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight text-rose-400`}>
            {totalDowntimeMin} <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Unplanned Stop Duration
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-emerald-400">
            {availabilityPct.toFixed(1)}% Avail.
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {plannedProdTimeMin - totalDowntimeMin}m / {plannedProdTimeMin}m
          </div>
        </div>
      </div>

      {/* Visual Loss vs Operating Stack Bar */}
      <div className="space-y-1">
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex p-0.5 border border-slate-700/50">
          <div 
            style={{ width: `${availabilityPct}%` }}
            title={`Operating: ${availabilityPct.toFixed(1)}%`}
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
          />
          <div 
            style={{ width: `${lossPct}%` }}
            title={`Loss: ${lossPct.toFixed(1)}%`}
            className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operating ({availabilityPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Lost Time ({lossPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
