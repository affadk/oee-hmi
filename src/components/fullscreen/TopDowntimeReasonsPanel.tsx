import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface DowntimeReasonRow {
  no: number;
  reason: string;
  time: string;
  pct: number;
  color: string;
}

export const TopDowntimeReasonsPanel: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rows: DowntimeReasonRow[] = [
    { no: 1, reason: 'Breakdown', time: '21 min', pct: 50, color: '#ef4444' },
    { no: 2, reason: 'Material Shortage', time: '12 min', pct: 29, color: '#f97316' },
    { no: 3, reason: 'Changeover', time: '9 min', pct: 21, color: '#eab308' },
    { no: 4, reason: 'Adjustment', time: '3 min', pct: 7, color: '#0284c7' },
    { no: 5, reason: 'Other', time: '2 min', pct: 5, color: '#64748b' },
  ];

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 pb-1">
        <span className="text-amber-400 text-xs">⭐</span>
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Top 5 Downtime Reasons
        </h3>
      </div>

      {/* Table matching image.png */}
      <div className="overflow-x-auto flex-1 flex flex-col justify-center">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`text-[10px] font-medium border-b ${
              isDark ? 'text-slate-400 border-[#162744]' : 'text-slate-500 border-slate-200'
            }`}>
              <th className="pb-1 pl-1 w-6">No</th>
              <th className="pb-1">Reason</th>
              <th className="pb-1 text-right pr-2">Time</th>
              <th className="pb-1 text-right pr-2 w-10">%</th>
              <th className="pb-1 w-24 sm:w-28"></th>
            </tr>
          </thead>
          <tbody className={`divide-y font-sans ${
            isDark ? 'divide-[#162744]/40' : 'divide-slate-100'
          }`}>
            {rows.map((r) => (
              <tr key={r.no} className={`transition-colors ${
                isDark ? 'hover:bg-[#101f38]/40' : 'hover:bg-slate-50'
              }`}>
                <td className={`py-1.5 pl-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.no}</td>
                <td className={`py-1.5 font-medium text-[11px] truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{r.reason}</td>
                <td className={`py-1.5 text-right pr-2 font-semibold text-[11px] whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {r.time}
                </td>
                <td className={`py-1.5 text-right pr-2 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.pct}%</td>
                <td className="py-1.5 pr-1">
                  <div className={`h-2 rounded-full overflow-hidden w-full ${isDark ? 'bg-[#101f38]' : 'bg-slate-100'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
