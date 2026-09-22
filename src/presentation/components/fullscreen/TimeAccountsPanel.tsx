// /src/components/fullscreen/TimeAccountsPanel.tsx

import React from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import { CalculatedOeeMetrics, MachineConfig } from '../../../domain/index';

interface TimeAccountsPanelProps {
  metrics: CalculatedOeeMetrics;
  machine?: MachineConfig;
}

export const TimeAccountsPanel: React.FC<TimeAccountsPanelProps> = ({ metrics, machine }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const plannedTimeMin = metrics.plannedProductionTimeMin || 420;
  const runTimeMin = metrics.runTimeMin || 378;
  const downtimeMin = metrics.downtimeMin || 42;

  // Format hours and minutes helper
  const formatHm = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const shiftStart = machine?.jobConfig?.shiftStart || '22:00';
  const shiftEnd = machine?.jobConfig?.shiftEnd || '08:00';
  const shiftLabel = shiftStart === '22:00' || shiftStart === '23:00' ? 'Shift 3' : shiftStart === '15:00' ? 'Shift 2' : 'Shift 1';

  return (
    <div
      id="time-accounts-panel"
      className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Time Accounts
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
          {shiftLabel} · {shiftStart} - {shiftEnd}
        </span>
      </div>

      {/* Account Items List */}
      <div className="space-y-1.5 text-xs font-mono flex-1 flex flex-col justify-center">
        {/* Active: 03:39 [green bar] */}
        <div className="flex items-center justify-between gap-3">
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Active</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-slate-900'}`}>03:39</span>
            <div className="w-12 sm:w-16 h-2.5 rounded-xs bg-[#48a43f]" title="Active operating time" />
          </div>
        </div>

        {/* Undefined: 00:00 */}
        <div className="flex items-center justify-between gap-3">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Undefined</span>
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-800'}>00:00</span>
            <div className="w-12 sm:w-16 h-2.5 rounded-xs opacity-0" />
          </div>
        </div>

        {/* Breakdown: 00:28 [red bar] */}
        <div className="flex items-center justify-between gap-3">
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Breakdown</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-600 dark:text-rose-400">00:28</span>
            <div className="w-12 sm:w-16 h-2.5 rounded-xs bg-[#dc2626]" title="Machine breakdown" />
          </div>
        </div>

        {/* Waiting: 00:14 [yellow bar] */}
        <div className="flex items-center justify-between gap-3">
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Waiting</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-400">00:14</span>
            <div className="w-12 sm:w-16 h-2.5 rounded-xs bg-[#eab308]" title="Waiting time" />
          </div>
        </div>

        {/* Changeover: 01:48 [yellow bar] */}
        <div className="flex items-center justify-between gap-3">
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Changeover</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-400">01:48</span>
            <div className="w-12 sm:w-16 h-2.5 rounded-xs bg-[#eab308]" title="Changeover time" />
          </div>
        </div>

        {/* Staffed time */}
        <div className={`pt-1.5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Staffed time</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>06:35</span>
            <div className="w-12 sm:w-16 h-2.5 rounded-xs bg-slate-500" title="Total staffed time" />
          </div>
        </div>
      </div>

      {/* Live Calculated Summary Footer */}
      <div className={`mt-2.5 pt-2 border-t text-[11px] flex justify-between font-mono ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span>Plan: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatHm(plannedTimeMin)}</strong></span>
        <span>Run: <strong className="text-emerald-600 dark:text-emerald-400">{formatHm(runTimeMin)}</strong></span>
        <span>Down: <strong className="text-rose-600 dark:text-rose-400">{formatHm(downtimeMin)}</strong></span>
      </div>
    </div>
  );
};
