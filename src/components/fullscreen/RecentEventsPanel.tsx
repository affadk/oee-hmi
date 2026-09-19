import React from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface EventItem {
  time: string;
  type: 'Downtime' | 'Production' | 'Quality' | 'Info';
  machine: string;
  description: string;
}

export const RecentEventsPanel: React.FC<{ onViewAll?: () => void }> = ({ onViewAll }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const events: EventItem[] = [
    { time: '14:28', type: 'Downtime', machine: 'MC-01', description: 'Breakdown - Conveyor Jam' },
    { time: '13:56', type: 'Production', machine: 'MC-01', description: 'Production Resumed' },
    { time: '12:45', type: 'Quality', machine: 'MC-01', description: 'Reject - Surface Defect (12 pcs)' },
    { time: '11:20', type: 'Downtime', machine: 'MC-01', description: 'Material Shortage' },
    { time: '10:12', type: 'Info', machine: 'MC-01', description: 'Changeover Completed' },
  ];

  const getTypeBadge = (type: EventItem['type']) => {
    switch (type) {
      case 'Downtime':
        return (
          <span className="flex items-center gap-1 text-rose-500 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Downtime
          </span>
        );
      case 'Production':
        return (
          <span className="flex items-center gap-1 text-emerald-500 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Production
          </span>
        );
      case 'Quality':
        return (
          <span className="flex items-center gap-1 text-amber-500 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Quality
          </span>
        );
      case 'Info':
        return (
          <span className="flex items-center gap-1 text-sky-500 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Info
          </span>
        );
    }
  };

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1 pb-1">
        <div className="flex items-center gap-2">
          <Bell className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Recent Events
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-500 hover:text-blue-400 transition-colors font-medium cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Table matching image.png */}
      <div className="overflow-x-auto flex-1 flex flex-col justify-center">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`text-[10px] font-medium border-b ${
              isDark ? 'text-slate-400 border-[#162744]' : 'text-slate-500 border-slate-200'
            }`}>
              <th className="pb-1 pl-1 w-14">Time</th>
              <th className="pb-1 w-24">Type</th>
              <th className="pb-1 w-16">Machine</th>
              <th className="pb-1">Description</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-sans ${
            isDark ? 'divide-[#162744]/40' : 'divide-slate-100'
          }`}>
            {events.map((e, idx) => (
              <tr key={idx} className={`transition-colors ${
                isDark ? 'hover:bg-[#101f38]/40' : 'hover:bg-slate-50'
              }`}>
                <td className={`py-1.5 pl-1 font-mono text-[11px] whitespace-nowrap ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {e.time}
                </td>
                <td className="py-1.5 whitespace-nowrap">{getTypeBadge(e.type)}</td>
                <td className={`py-1.5 font-mono font-medium text-[11px] whitespace-nowrap ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {e.machine}
                </td>
                <td className={`py-1.5 text-[11px] truncate max-w-[180px] ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  {e.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
