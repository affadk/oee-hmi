// /src/components/MachineStatusZone.tsx — style OEE Shift Overview

import React from 'react';
import { Activity, Clock, AlertCircle, Wrench, Coffee } from 'lucide-react';
import { MachineConfig, CalculatedOeeMetrics, MachineStatus } from '../../domain/index';
import { useTheme } from '../providers/ThemeProvider';

interface MachineStatusZoneProps {
  machine: MachineConfig;
  allMachines: MachineConfig[];
  metrics: CalculatedOeeMetrics;
  onSelectMachine: (id: string) => void;
  onUpdateMachineStatus: (status: MachineStatus) => void;
}

export const MachineStatusZone: React.FC<MachineStatusZoneProps> = ({
  machine,
  allMachines,
  metrics,
  onSelectMachine,
  onUpdateMachineStatus,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getStatusMeta = (status: MachineStatus) => {
    switch (status) {
      case 'RUNNING':
        return { dot: 'bg-[#48a43f]', label: 'RUNNING', icon: <Activity className="w-3.5 h-3.5 text-emerald-500" /> };
      case 'DOWN':
        return { dot: 'bg-rose-600', label: 'DOWN', icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> };
      case 'IDLE':
        return { dot: 'bg-amber-500', label: 'IDLE', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> };
      case 'SETUP':
        return { dot: 'bg-blue-500', label: 'SETUP', icon: <Wrench className="w-3.5 h-3.5 text-blue-500" /> };
      default:
        return { dot: 'bg-slate-400', label: 'PLANNED STOP', icon: <Coffee className="w-3.5 h-3.5 text-slate-500" /> };
    }
  };

  const currentBadge = getStatusMeta(machine.status);
  const cardClass = `lg:col-span-6 min-w-0 rounded-xl border p-[clamp(8px,1vh,14px)] shadow-sm transition-colors flex flex-col justify-between ${
    isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
  }`;
  const innerClass = `rounded-lg border p-2.5 min-w-0 ${isDark ? 'bg-[#132238] border-slate-800' : 'bg-[#eef2f7] border-[#c9d3df]'}`;

  return (
    <section id="machine-status-and-time-zone" className="grid grid-cols-1 lg:grid-cols-12 gap-[1vh] lg:gap-[0.9vw] min-w-0 max-w-full">
      {/* LEFT: Machine Status */}
      <div className={cardClass}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Machine Status</h2>
            <div className="flex flex-wrap items-center gap-1 audit-caption font-mono">
              <span className={`mr-1 hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Set:</span>
              {(['RUNNING', 'IDLE', 'DOWN', 'SETUP'] as MachineStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateMachineStatus(st)}
                  className={`px-2 py-0.5 rounded audit-micro font-bold border transition-all cursor-pointer ${
                    machine.status === st
                      ? 'bg-[#1a3464] text-white border-[#1a3464]'
                      : isDark ? 'bg-[#132238] text-slate-400 border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className={`${innerClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className={`w-4 h-4 rounded-full block ${currentBadge.dot} ${machine.status === 'RUNNING' ? 'animate-ping opacity-75' : ''}`}></span>
                <span className={`w-4 h-4 rounded-full block absolute top-0 left-0 ${currentBadge.dot}`}></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {currentBadge.icon}
                    {currentBadge.label}
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{machine.statusSince}</span>
                </div>
                <div className={`font-bold text-sm mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {machine.name} <span className={`font-mono font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({machine.id})</span>
                </div>
              </div>
            </div>
            <div className={`text-right sm:border-l sm:pl-4 ${isDark ? 'sm:border-slate-700' : 'sm:border-slate-200'}`}>
              <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Output Rate</div>
              <div className="audit-value font-mono font-black text-emerald-500">
                {machine.actualHourlyRate} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs/hr</span>
              </div>
              <div className={`audit-caption font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cycle: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.actualCycleTimeSec}s</strong>
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className={innerClass}>
              <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Product</span>
              <span className={`font-bold block truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{machine.currentProduct}</span>
              <span className={`audit-caption font-mono truncate block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{machine.productDescription}</span>
            </div>
            <div className={innerClass}>
              <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Line & Area</span>
              <span className={`font-bold block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{machine.line}</span>
              <span className={`audit-caption font-mono block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{machine.area}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className={`text-xs font-semibold mb-2 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Floor Overview</span>
            <span className="audit-caption font-mono">Click to switch</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allMachines.map((m) => {
              const b = getStatusMeta(m.status);
              const isSelected = m.id === machine.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMachine(m.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a3464] border-[#1a3464] text-white shadow-md'
                      : isDark ? 'bg-[#132238] border-slate-800 hover:border-slate-600' : 'bg-[#eef2f7] border-[#c9d3df] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs font-mono ${isSelected ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>{m.id}</span>
                    <span className={`w-2 h-2 rounded-full ${b.dot}`}></span>
                  </div>
                  <div className={`audit-micro font-mono mt-1 ${isSelected ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.status}</div>
                  <div className={`text-xs font-mono font-bold mt-0.5 ${isSelected ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target: {m.targetOee}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Time Decomposition */}
      <div className={cardClass}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Production Time (ISO 22400)</h2>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shift: {machine.shiftDurationMinutes} min</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Shift Duration', value: machine.shiftDurationMinutes, sub: 'Total scheduled', accent: '' },
              { label: 'Planned Stop', value: machine.plannedDowntimeMinutes, sub: 'Breaks & PM', accent: '' },
              { label: 'Planned Prod', value: metrics.plannedProductionTimeMin, sub: 'Shift − Planned', accent: 'text-blue-600 dark:text-blue-400' },
              { label: 'Downtime', value: metrics.downtimeMin, sub: 'Unplanned', accent: 'text-rose-600 dark:text-rose-400' },
              { label: 'Run Time', value: metrics.runTimeMin, sub: `${((metrics.runTimeMin / metrics.plannedProductionTimeMin) * 100).toFixed(1)}% avail`, accent: 'text-emerald-600 dark:text-emerald-400' },
            ].map((r) => (
              <div key={r.label} className={`${innerClass} ${r.label === 'Run Time' ? 'sm:col-span-2' : ''}`}>
                <span className={`block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.label}</span>
                <span className={`audit-value font-black font-mono ${r.accent || (isDark ? 'text-white' : 'text-slate-900')}`}>{r.value} <span className="text-xs font-normal">min</span></span>
                <span className={`audit-micro font-mono block mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{r.sub}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className={`flex flex-wrap items-center justify-between gap-1 audit-caption font-mono mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Time Distribution</span>
              <span>100% = {machine.shiftDurationMinutes} min</span>
            </div>
            <div className={`h-3 w-full rounded-md overflow-hidden flex shadow-inner ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="bg-[#48a43f] h-full" style={{ width: `${(metrics.runTimeMin / machine.shiftDurationMinutes) * 100}%` }} title={`Run: ${metrics.runTimeMin}m`} />
              <div className="bg-rose-600 h-full" style={{ width: `${(metrics.downtimeMin / machine.shiftDurationMinutes) * 100}%` }} title={`Down: ${metrics.downtimeMin}m`} />
              <div className={`${isDark ? 'bg-slate-600' : 'bg-slate-400'} h-full`} style={{ width: `${(machine.plannedDowntimeMinutes / machine.shiftDurationMinutes) * 100}%` }} title={`Planned: ${machine.plannedDowntimeMinutes}m`} />
            </div>
            <div className={`flex items-center gap-4 flex-wrap audit-caption font-semibold mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#48a43f]"></span>Run ({metrics.runTimeMin}m)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-rose-600"></span>Down ({metrics.downtimeMin}m)</span>
              <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-xs ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`}></span>Planned ({machine.plannedDowntimeMinutes}m)</span>
            </div>
          </div>
        </div>

        <div className={`mt-3 px-2.5 py-1.5 rounded-lg border audit-caption font-mono flex flex-wrap items-center justify-between gap-1 ${isDark ? 'bg-[#132238] border-slate-800 text-slate-400' : 'bg-[#eef2f7] border-[#c9d3df] text-slate-600'}`}>
          <span className="min-w-0 break-words">Shift ({machine.shiftDurationMinutes}m) → Planned ({metrics.plannedProductionTimeMin}m) → Run ({metrics.runTimeMin}m)</span>
          <span className="font-bold text-rose-500 shrink-0">Loss: {metrics.downtimeMin}m</span>
        </div>
      </div>
    </section>
  );
};
