// /src/presentation/components/fullscreen/RecentEventsPanel.tsx

import React from 'react';
import { History, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

interface EventItem {
  time: string;
  type: 'alarm' | 'downtime' | 'system' | 'quality';
  message: string;
  duration?: string;
  status: 'active' | 'resolved' | 'info';
}

const EVENTS: EventItem[] = [
  { time: '14:15', type: 'alarm', message: 'Sensor E-04 Calibrated', duration: '4m', status: 'resolved' },
  { time: '13:42', type: 'downtime', message: 'Feeder Jam Cleared', duration: '12m', status: 'resolved' },
  { time: '11:20', type: 'downtime', message: 'Optical Sensor Fault', duration: '18m', status: 'resolved' },
  { time: '09:10', type: 'downtime', message: 'Material Reel Restock', duration: '8m', status: 'resolved' },
  { time: '06:00', type: 'system', message: 'Shift 1 Initialized (STM32)', status: 'info' },
];

interface RecentEventsPanelProps {
  onViewAll?: () => void;
}

export const RecentEventsPanel: React.FC<RecentEventsPanelProps> = ({ onViewAll }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/20 dark:border-slate-700/40">
        <div className="flex items-center gap-2">
          <History className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Shift Event Stream
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
        >
          View Audit Log
        </button>
      </div>

      {/* Events Table / Stream */}
      <div className="space-y-1.5 my-1 flex-1 overflow-y-auto max-h-[140px] pr-1">
        {EVENTS.map((evt, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
              isDark ? 'bg-[#0f1b30] hover:bg-[#15243e]' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-[10px] text-slate-400 shrink-0">{evt.time}</span>
              {evt.type === 'downtime' && <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
              {evt.type === 'alarm' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {evt.type === 'system' && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              <span className={`truncate font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {evt.message}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {evt.duration && (
                <span className="text-[10px] font-mono text-rose-400 font-bold">
                  {evt.duration}
                </span>
              )}
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                evt.status === 'resolved'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                  : 'bg-blue-950/70 text-blue-400 border border-blue-800/60'
              }`}>
                {evt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
