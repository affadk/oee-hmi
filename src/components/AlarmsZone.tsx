import React from 'react';
import { 
  BellRing, 
  CheckCircle2
} from 'lucide-react';
import { MachineAlarmEvent } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AlarmsZoneProps {
  alarms: MachineAlarmEvent[];
  onAcknowledgeAlarm: (alarmId: string) => void;
  onResolveAlarm: (alarmId: string) => void;
}

export const AlarmsZone: React.FC<AlarmsZoneProps> = ({
  alarms,
  onAcknowledgeAlarm,
  onResolveAlarm,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getAlarmBadge = (type: MachineAlarmEvent['type']) => {
    switch (type) {
      case 'Breakdown':
        return isDark 
          ? 'bg-rose-950/80 text-rose-300 border-rose-700' 
          : 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Material':
        return isDark 
          ? 'bg-amber-950/80 text-amber-300 border-amber-700' 
          : 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Quality':
        return isDark 
          ? 'bg-purple-950/80 text-purple-300 border-purple-700' 
          : 'bg-purple-50 text-purple-700 border-purple-300';
      case 'Speed':
        return isDark 
          ? 'bg-blue-950/80 text-blue-300 border-blue-700' 
          : 'bg-blue-50 text-blue-700 border-blue-300';
      default:
        return isDark 
          ? 'bg-slate-800 text-slate-300 border-slate-700' 
          : 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadge = (status: MachineAlarmEvent['status']) => {
    switch (status) {
      case 'Waiting Maintenance':
        return isDark 
          ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 animate-pulse' 
          : 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse';
      case 'In Progress':
        return isDark 
          ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40' 
          : 'bg-amber-100 text-amber-700 border border-amber-300';
      case 'Resolved':
        return isDark 
          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' 
          : 'bg-emerald-100 text-emerald-700 border border-emerald-300';
      case 'Acknowledged':
        return isDark 
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' 
          : 'bg-blue-100 text-blue-700 border border-blue-300';
    }
  };

  return (
    <section 
      id="last-events-alarms-zone" 
      className={`rounded-xl border p-4 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-rose-500 animate-bounce" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Last Events & Real-time Alarm Log
          </h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
            isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {alarms.length} incidents logged
          </span>
        </div>
        <div className={`text-xs font-mono hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          ISO 22400 Incident Audit
        </div>
      </div>

      {/* Alarms Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b font-mono uppercase text-[10px] tracking-wider ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <th className="pb-2 pl-2">Time</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Machine</th>
              <th className="pb-2">Duration</th>
              <th className="pb-2">Description & Root Cause</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Operator / Tech</th>
              <th className="pb-2 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
            {alarms.map((alm) => (
              <tr key={alm.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                {/* Time */}
                <td className={`py-2.5 pl-2 font-mono whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {alm.timestamp}
                </td>

                {/* Type */}
                <td className="py-2.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getAlarmBadge(alm.type)}`}>
                    {alm.type}
                  </span>
                </td>

                {/* Machine */}
                <td className={`py-2.5 font-mono font-bold whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {alm.machineId}
                </td>

                {/* Duration */}
                <td className={`py-2.5 font-mono font-semibold whitespace-nowrap ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                  {alm.durationMinutes} min
                </td>

                {/* Description */}
                <td className={`py-2.5 font-medium max-w-md truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {alm.description}
                </td>

                {/* Status */}
                <td className="py-2.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusBadge(alm.status)}`}>
                    {alm.status}
                  </span>
                </td>

                {/* Operator */}
                <td className={`py-2.5 whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {alm.operator}
                </td>

                {/* Action */}
                <td className="py-2.5 text-right pr-2 whitespace-nowrap">
                  {alm.status !== 'Resolved' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {alm.status === 'Waiting Maintenance' && (
                        <button
                          onClick={() => onAcknowledgeAlarm(alm.id)}
                          className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                            isDark 
                              ? 'bg-blue-900/60 hover:bg-blue-800 text-blue-200 border-blue-700' 
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                          }`}
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => onResolveAlarm(alm.id)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                          isDark 
                            ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-700' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] flex items-center justify-end gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Closed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
