// /src/components/fullscreen/TimeSummaryPanel.tsx

import React from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CalculatedOeeMetrics } from '../../types';

interface TimeSummaryPanelProps {
  metrics?: CalculatedOeeMetrics;
  shiftDurationMin?: number;
  plannedStopMin?: number;
  plannedProdTimeMin?: number;
  runTimeMin?: number;
  unplannedDowntimeMin?: number;
}

export const TimeSummaryPanel: React.FC<TimeSummaryPanelProps> = ({
  metrics,
  shiftDurationMin = 480,
  plannedStopMin,
  plannedProdTimeMin,
  runTimeMin,
  unplannedDowntimeMin,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Extract live metrics with fallback to standard shift values from reference
  const shiftDuration = shiftDurationMin;
  const plannedProdTime = metrics?.plannedProductionTimeMin ?? plannedProdTimeMin ?? 420;
  const plannedStop = plannedStopMin ?? Math.max(0, shiftDuration - plannedProdTime);
  const runTime = metrics?.runTimeMin ?? runTimeMin ?? 378;
  const downtime = metrics?.downtimeMin ?? unplannedDowntimeMin ?? 42;

  const rows = [
    {
      id: 'shift-duration',
      label: 'Shift Duration',
      value: shiftDuration,
      unit: 'min',
      icon: (
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <line x1="12" y1="6" x2="12" y2="13" />
          <line x1="12" y1="13" x2="8.5" y2="16.5" />
          <line x1="12" y1="13" x2="15.5" y2="16.5" />
        </svg>
      ),
    },
    {
      id: 'planned-stop',
      label: 'Planned Stop (Break/Other)',
      value: plannedStop,
      unit: 'min',
      icon: (
        <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <line x1="10" y1="9" x2="10" y2="15" />
          <line x1="14" y1="9" x2="14" y2="15" />
        </svg>
      ),
    },
    {
      id: 'planned-prod-time',
      label: 'Planned Production Time',
      value: plannedProdTime,
      unit: 'min',
      icon: (
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="7 4.5 19 12 7 19.5 7 4.5" />
        </svg>
      ),
    },
    {
      id: 'run-time',
      label: 'Run Time',
      value: runTime,
      unit: 'min',
      icon: (
        <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.5l6.5 3.5v6c0 4.5-3 8.5-6.5 9.5-3.5-1-6.5-5-6.5-9.5V6L12 2.5z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'downtime',
      label: 'Downtime',
      value: downtime,
      unit: 'min',
      icon: (
        <svg className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <polyline points="12 6.5 12 12 8 12" />
        </svg>
      ),
    },
  ];

  return (
    <div
      id="time-summary-panel"
      className={`p-[clamp(8px,1vh,12px)] rounded-xl border shadow-sm flex flex-col justify-between overflow-hidden min-h-0 h-full transition-colors ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header — gap & font relatif — min 13px */}
      <div className="flex items-center gap-2 pb-[0.8vh] mb-[0.4vh] shrink-0">
        <Clock className={`w-4 h-4 stroke-[2.2] ${isDark ? 'text-slate-200' : 'text-[#1e293b]'}`} />
        <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-[#0f172a]'}`}>Time Summary</h3>
      </div>

      {/* Rows — padding & font relatif vh/vw, flex-1 — labels min 12px, values min 14px */}
      <div className="flex-1 min-h-0 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between py-[0.7vh] first:pt-[0.3vh] last:pb-[0.3vh] min-h-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">{row.icon}</span>
              <span className={`text-xs font-semibold tracking-tight truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.label}</span>
            </div>
            <div className="flex items-baseline gap-1 font-sans shrink-0">
              <span className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.value}</span>
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{row.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
