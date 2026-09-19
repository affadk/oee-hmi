import React from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DowntimeLossPanelProps {
  totalDowntimeMin: number;
  plannedProdTimeMin: number;
}

export const DowntimeLossPanel: React.FC<DowntimeLossPanelProps> = ({
  totalDowntimeMin,
  plannedProdTimeMin,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pctOfPlanned = ((totalDowntimeMin / plannedProdTimeMin) * 100).toFixed(1);

  const items = [
    { label: 'Breakdown', duration: 21, pct: 50, color: '#ef4444' },
    { label: 'Material Shortage', duration: 12, pct: 29, color: '#f97316' },
    { label: 'Changeover', duration: 9, pct: 21, color: '#eab308' },
    { label: 'Adjustment', duration: 0, pct: 0, color: '#0ea5e9' },
    { label: 'Other', duration: 0, pct: 0, color: '#64748b' },
  ];

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header & Big Metric matching image.png */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Downtime Loss
          </h3>
        </div>

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className={`font-sans font-bold text-base sm:text-lg md:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalDowntimeMin} min
          </span>
          <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ({pctOfPlanned}% of Planned Production Time)
          </span>
        </div>
      </div>

      {/* Progress Bars for each loss */}
      <div className="space-y-1.5 text-xs py-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {/* Label */}
            <span className={`w-28 text-[11px] truncate flex items-center gap-1.5 shrink-0 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>

            {/* Bar */}
            <div className={`flex-1 h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-[#101f38]' : 'bg-slate-100'
            }`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Time & Pct */}
            <div className="w-16 text-right text-[11px] shrink-0 font-medium">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.duration} min</span>{' '}
              <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
