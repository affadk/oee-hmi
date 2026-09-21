// /src/presentation/components/fullscreen/TopDowntimeReasonsPanel.tsx

import React, { useState } from 'react';
import { AlertCircle, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DowntimeReasonItem } from '../../domain/entities/Machine';

interface TopDowntimeReasonsPanelProps {
  reasons?: DowntimeReasonItem[];
}

const DEFAULT_REASONS: Array<DowntimeReasonItem & { count?: number; color?: string }> = [
  { id: '1', label: 'Sensor Fault', category: 'Sensor', durationMinutes: 18, type: 'UNPLANNED', count: 2, color: '#f43f5e' },
  { id: '2', label: 'Feeder Jam', category: 'Mechanical', durationMinutes: 12, type: 'UNPLANNED', count: 3, color: '#fb923c' },
  { id: '3', label: 'Material Shortage', category: 'Material', durationMinutes: 8, type: 'UNPLANNED', count: 1, color: '#eab308' },
  { id: '4', label: 'Die Calibration', category: 'Setup', durationMinutes: 4, type: 'UNPLANNED', count: 1, color: '#38bdf8' },
  { id: '5', label: 'Meal & Rest Break', category: 'Planned', durationMinutes: 45, type: 'PLANNED', count: 1, color: '#3b82f6' },
];

export const TopDowntimeReasonsPanel: React.FC<TopDowntimeReasonsPanelProps> = ({ reasons }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filterMode, setFilterMode] = useState<'UNPLANNED' | 'PLANNED' | 'ALL'>('UNPLANNED');

  const sourceItems = (reasons && reasons.length > 0) ? reasons : DEFAULT_REASONS;

  const filteredItems = sourceItems.filter(item => {
    const isPlanned = item.type === 'PLANNED' || item.category === 'Planned';
    if (filterMode === 'UNPLANNED') return !isPlanned;
    if (filterMode === 'PLANNED') return isPlanned;
    return true;
  });

  const totalFilteredMin = filteredItems.reduce((acc, r) => acc + r.durationMinutes, 0);

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/20 dark:border-slate-700/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Downtime Breakdown
          </h3>
        </div>

        {/* Quick Filter Switcher */}
        <div className={`flex items-center p-0.5 rounded border text-[10px] ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'
        }`}>
          <button
            type="button"
            onClick={() => setFilterMode('UNPLANNED')}
            className={`px-1.5 py-0.5 rounded font-medium transition-all ${
              filterMode === 'UNPLANNED'
                ? 'bg-rose-500 text-white font-bold'
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            Unplanned
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('PLANNED')}
            className={`px-1.5 py-0.5 rounded font-medium transition-all ${
              filterMode === 'PLANNED'
                ? 'bg-blue-600 text-white font-bold'
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            Planned
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-1.5 py-0.5 rounded font-medium transition-all ${
              filterMode === 'ALL'
                ? (isDark ? 'bg-slate-700 text-white font-bold' : 'bg-slate-200 text-slate-900 font-bold')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Ranked List with percentage bars */}
      <div className="space-y-1.5 my-1 flex-1 flex flex-col justify-around">
        {filteredItems.length === 0 ? (
          <div className="text-center text-[11px] text-slate-500 py-2">
            Tidak ada item downtime
          </div>
        ) : (
          filteredItems.slice(0, 4).map((item, idx) => {
            const pct = totalFilteredMin > 0 ? (item.durationMinutes / totalFilteredMin) * 100 : 0;
            const isPlanned = item.type === 'PLANNED' || item.category === 'Planned';
            return (
              <div key={item.id || item.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium flex items-center gap-1.5 truncate max-w-[70%] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                    <span className="truncate">{item.label}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold shrink-0 border ${
                      isPlanned
                        ? (isDark ? 'bg-blue-950 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-300')
                        : (isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-700 border-rose-300')
                    }`}>
                      {isPlanned ? 'Plan' : 'Unplan'}
                    </span>
                  </span>
                  <span className={`font-mono font-bold ${isPlanned ? 'text-blue-400' : 'text-rose-400'}`}>
                    {item.durationMinutes} <span className="text-[10px] font-normal text-slate-400">min</span>
                  </span>
                </div>

                {/* Mini progress track */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div 
                    style={{ width: `${pct}%` }} 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPlanned ? 'bg-gradient-to-r from-blue-600 to-sky-400' : 'bg-gradient-to-r from-rose-600 to-amber-500'
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={`text-[10px] pt-1 border-t flex justify-between items-center ${
        isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span>{filterMode === 'UNPLANNED' ? '⚠️ Mempengaruhi Avail. OEE' : filterMode === 'PLANNED' ? 'ℹ️ Dikecualikan dari Avail. OEE' : 'Total Planned & Unplanned'}</span>
        <span className="font-mono font-bold">{totalFilteredMin} min</span>
      </div>
    </div>
  );
};

