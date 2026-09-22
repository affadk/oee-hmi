// /src/components/ProductionZone.tsx — style OEE Shift Overview

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { CalculatedOeeMetrics, MachineConfig } from '../types';
import { formatNumber } from '../utils/oeeMath';
import { useTheme } from '../context/ThemeContext';

interface ProductionZoneProps {
  metrics: CalculatedOeeMetrics;
  machine: MachineConfig;
}

export const ProductionZone: React.FC<ProductionZoneProps> = ({ metrics, machine }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const goodRatio = machine.totalCount > 0 ? (machine.goodCount / machine.totalCount) * 100 : 0;
  const rejectRatio = machine.totalCount > 0 ? (machine.rejectCount / machine.totalCount) * 100 : 0;
  const cycleTimeDelta = Number((machine.actualCycleTimeSec - machine.idealCycleTimeSec).toFixed(1));

  const tileClass = `rounded-lg p-3 border transition-colors ${
    isDark ? 'bg-[#132238] border-slate-800' : 'bg-[#eef2f7] border-[#c9d3df]'
  }`;

  return (
    <section
      id="production-kpi-zone"
      className={`rounded-xl border p-[clamp(8px,1vh,14px)] shadow-sm transition-colors ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-[1vh] mb-[0.6vh] border-b border-slate-200 dark:border-slate-800">
        <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          Production Output & Speed
        </h2>
        <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Product: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.currentProduct.split(' ')[0]}</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            Yield {goodRatio.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className={tileClass}>
          <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target Plan</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(machine.targetCount)}</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Shift quota</div>
        </div>

        <div className={tileClass}>
          <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actual Total</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-black font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(machine.totalCount)}</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Stroke counter</div>
        </div>

        <div className={`rounded-lg p-3 border ${isDark ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50 border-emerald-300/60'}`}>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Good Output</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-sans text-emerald-600 dark:text-emerald-400">{formatNumber(machine.goodCount)}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">pcs</span>
          </div>
          <div className="text-xs font-mono font-bold mt-1 text-emerald-600 dark:text-emerald-400">{goodRatio.toFixed(1)}% of total</div>
        </div>

        <div className={`rounded-lg p-3 border ${isDark ? 'bg-rose-950/30 border-rose-800/50' : 'bg-rose-50 border-rose-300/60'}`}>
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Reject / Defect</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-sans text-rose-600 dark:text-rose-400">{formatNumber(machine.rejectCount)}</span>
            <span className="text-xs text-rose-600/70 dark:text-rose-400/70">pcs</span>
          </div>
          <div className="text-xs font-mono font-bold mt-1 text-rose-600 dark:text-rose-400">{rejectRatio.toFixed(1)}% reject</div>
        </div>

        <div className={tileClass}>
          <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Achievement</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-amber-500">{metrics.achievementPct}%</span>
          </div>
          <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, metrics.achievementPct)}%` }} />
          </div>
        </div>

        <div className={tileClass}>
          <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cycle Time</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400">{machine.actualCycleTimeSec}s</span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ ideal {machine.idealCycleTimeSec}s</span>
          </div>
          <div className={`text-[11px] font-mono mt-1 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Rate: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.actualHourlyRate}/h</strong></span>
            <span className={cycleTimeDelta <= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
              {cycleTimeDelta > 0 ? `+${cycleTimeDelta}s` : `${cycleTimeDelta}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Ratio bar ala Shift Overview: #48a43f + rose-600 */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className={`flex items-center gap-4 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#48a43f]"></span>
            Good ({formatNumber(machine.goodCount)} pcs)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600"></span>
            Reject ({formatNumber(machine.rejectCount)} pcs)
          </span>
        </div>
        <div className="w-full sm:w-80 flex items-center gap-2">
          <div className={`h-[10px] w-full rounded-md overflow-hidden flex shadow-inner ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="bg-[#48a43f] h-full transition-all duration-500" style={{ width: `${goodRatio}%` }} />
            <div className="bg-rose-600 h-full transition-all duration-500" style={{ width: `${rejectRatio}%` }} />
          </div>
          <span className={`font-mono text-[11px] font-bold whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {goodRatio.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="hidden">
        <HelpCircle className="w-4 h-4" />
      </div>
    </section>
  );
};
