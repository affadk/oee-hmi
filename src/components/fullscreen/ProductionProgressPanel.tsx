// /src/presentation/components/fullscreen/ProductionProgressPanel.tsx

import React from 'react';
import { Target, CheckCircle2, AlertOctagon, TrendingUp, Layers } from 'lucide-react';
import { MachineConfig } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ProductionProgressPanelProps {
  machine: MachineConfig;
}

export const ProductionProgressPanel: React.FC<ProductionProgressPanelProps> = ({ machine }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const targetQty = machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 1000;
  const totalCount = machine.telemetry?.tot ?? machine.totalCount ?? 945;
  const rejectCount = machine.telemetry?.rej ?? machine.rejectCount ?? 41;
  const goodCount = Math.max(0, totalCount - rejectCount);
  const achievementPct = targetQty > 0 ? ((totalCount / targetQty) * 100) : 0;
  const goodPct = totalCount > 0 ? ((goodCount / totalCount) * 100) : 0;

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/20 dark:border-slate-700/40">
        <div className="flex items-center gap-2">
          <Target className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Shift Production Progress
          </h3>
        </div>
        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
          achievementPct >= 90
            ? isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800'
            : isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-amber-100 text-amber-800'
        }`}>
          {achievementPct.toFixed(1)}% Achieved
        </span>
      </div>

      {/* Main Target vs Actual Metric Comparison */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {/* Target */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-[#101e38] border-[#1b345f]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target Qty</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {targetQty.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
        </div>

        {/* Actual Total */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-[#0f2d24] border-emerald-800/60' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>Actual Output</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 my-1">
        <div className="flex justify-between text-[11px] font-mono">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Progress: {totalCount} / {targetQty} pcs
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {Math.max(0, targetQty - totalCount)} pcs remaining
          </span>
        </div>
        <div className="w-full h-3.5 rounded-full bg-slate-800/40 dark:bg-slate-800 overflow-hidden flex p-0.5 border border-slate-700/50">
          <div 
            style={{ width: `${Math.min(100, achievementPct)}%` }} 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* Secondary Quick Metrics (Good vs Reject) */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/20 dark:border-slate-700/40 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Good:</span>
          <span className="font-mono font-black text-lg sm:text-xl text-emerald-400">{goodCount.toLocaleString()}</span>
          <span className="text-xs text-slate-400 font-mono font-semibold">({goodPct.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
          <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Reject:</span>
          <span className="font-mono font-black text-lg sm:text-xl text-rose-400">{rejectCount.toLocaleString()}</span>
          <span className="text-xs text-slate-400 font-mono font-semibold">({(100 - goodPct).toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};
