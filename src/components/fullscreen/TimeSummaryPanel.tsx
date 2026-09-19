import React from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TimeSummaryPanelProps {
  shiftDurationMin: number;
  plannedStopMin: number;
  plannedProdTimeMin: number;
  runTimeMin: number;
  unplannedDowntimeMin: number;
}

export const TimeSummaryPanel: React.FC<TimeSummaryPanelProps> = ({
  shiftDurationMin,
  plannedStopMin,
  plannedProdTimeMin,
  runTimeMin,
  unplannedDowntimeMin,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 pb-1">
        <Clock className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Time Summary
        </h3>
      </div>

      {/* List items matching image.png */}
      <div className="space-y-1 text-xs flex-1 flex flex-col justify-center">
        {/* Shift Duration */}
        <div className="flex items-center justify-between py-0.5">
          <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center shrink-0 ${
              isDark ? 'border-slate-500' : 'border-slate-400'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`}></span>
            </span>
            Shift Duration
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {shiftDurationMin} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>min</span>
          </span>
        </div>

        {/* Planned Stop */}
        <div className="flex items-center justify-between py-0.5">
          <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center shrink-0 ${
              isDark ? 'border-slate-500' : 'border-slate-400'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`}></span>
            </span>
            Planned Stop (Break/Other)
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {plannedStopMin} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>min</span>
          </span>
        </div>

        {/* Planned Production Time */}
        <div className="flex items-center justify-between py-0.5">
          <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2.5 h-2.5 rounded-full border border-blue-500 flex items-center justify-center shrink-0">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
            </span>
            Planned Production Time
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {plannedProdTimeMin} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>min</span>
          </span>
        </div>

        {/* Run Time */}
        <div className="flex items-center justify-between py-0.5">
          <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 flex items-center justify-center shrink-0">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            </span>
            Run Time
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {runTimeMin} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>min</span>
          </span>
        </div>

        {/* Downtime */}
        <div className="flex items-center justify-between py-0.5">
          <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2.5 h-2.5 rounded-full border border-rose-500 flex items-center justify-center shrink-0">
              <span className="w-1 h-1 rounded-full bg-rose-500"></span>
            </span>
            Downtime (Unplanned)
          </span>
          <span className="font-semibold text-rose-500">
            {unplannedDowntimeMin} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>min</span>
          </span>
        </div>
      </div>
    </div>
  );
};
