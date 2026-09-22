// /src/components/AlarmsZone.tsx — style OEE Shift Overview

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MachineAlarmEvent } from '../../domain/index';
import { useTheme } from '../providers/ThemeProvider';

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
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
      case 'Material':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'Quality':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'Speed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default:
        return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: MachineAlarmEvent['status']) => {
    switch (status) {
      case 'Waiting Maintenance':
        return 'bg-rose-600/20 text-rose-500 border border-rose-500/40 animate-pulse';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/40';
      case 'Resolved':
        return 'bg-[#48a43f]/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40';
      case 'Acknowledged':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/40';
    }
  };

  return (
    <section
      id="last-events-alarms-zone"
      className={`min-w-0 max-w-full rounded-xl border p-[clamp(8px,1vh,14px)] shadow-sm transition-colors ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Events & Alarm Log
          </h2>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border font-semibold ${
            isDark ? 'bg-[#132238] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {alarms.length} incidents
          </span>
        </div>
        <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          ISO 22400 Incident Audit
        </div>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b font-mono uppercase audit-micro tracking-wider ${isDark ? 'border-slate-800 text-slate-400' : 'border-[#c9d3df] text-slate-500'}`}>
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
          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {alarms.map((alm) => (
              <tr key={alm.id} className={`transition-colors ${isDark ? 'hover:bg-[#132238]' : 'hover:bg-[#eef2f7]'}`}>
                <td className={`py-2.5 pl-2 font-mono whitespace-nowrap font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{alm.timestamp}</td>
                <td className="py-2.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded audit-micro font-bold border ${getAlarmBadge(alm.type)}`}>{alm.type}</span>
                </td>
                <td className={`py-2.5 font-mono font-bold whitespace-nowrap ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{alm.machineId}</td>
                <td className="py-2.5 font-mono font-bold whitespace-nowrap text-rose-500">{alm.durationMinutes} min</td>
                <td className={`py-2.5 font-semibold max-w-md truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{alm.description}</td>
                <td className="py-2.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded audit-micro font-bold ${getStatusBadge(alm.status)}`}>{alm.status}</span>
                </td>
                <td className={`py-2.5 whitespace-nowrap font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{alm.operator}</td>
                <td className="py-2.5 text-right pr-2 whitespace-nowrap">
                  {alm.status !== 'Resolved' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {alm.status === 'Waiting Maintenance' && (
                        <button
                          onClick={() => onAcknowledgeAlarm(alm.id)}
                          className="px-2 py-0.5 rounded audit-micro font-bold border bg-[#1a3464] hover:opacity-90 text-white border-[#1a3464] transition-all cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => onResolveAlarm(alm.id)}
                        className="px-2 py-0.5 rounded audit-micro font-bold border bg-[#48a43f] hover:brightness-110 text-white border-[#48a43f] transition-all cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <span className={`audit-micro font-mono flex items-center justify-end gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
