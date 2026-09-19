import React from 'react';
import { 
  Activity, 
  Clock, 
  Power, 
  AlertCircle, 
  Wrench, 
  Coffee,
  ArrowRight
} from 'lucide-react';
import { MachineConfig, CalculatedOeeMetrics, MachineStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

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

  const getStatusBadge = (status: MachineStatus) => {
    switch (status) {
      case 'RUNNING':
        return {
          bg: isDark 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'RUNNING',
          icon: <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        };
      case 'DOWN':
        return {
          bg: isDark 
            ? 'bg-rose-950/80 text-rose-300 border-rose-600' 
            : 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-500',
          label: 'DOWN',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
        };
      case 'IDLE':
        return {
          bg: isDark 
            ? 'bg-amber-950/80 text-amber-300 border-amber-600' 
            : 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          label: 'IDLE',
          icon: <Clock className="w-3.5 h-3.5 text-amber-500" />
        };
      case 'SETUP':
        return {
          bg: isDark 
            ? 'bg-blue-950/80 text-blue-300 border-blue-600' 
            : 'bg-blue-50 text-blue-700 border-blue-300',
          dot: 'bg-blue-500',
          label: 'SETUP',
          icon: <Wrench className="w-3.5 h-3.5 text-blue-500" />
        };
      case 'PLANNED_STOP':
        return {
          bg: isDark 
            ? 'bg-slate-800 text-slate-300 border-slate-600' 
            : 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          label: 'PLANNED STOP',
          icon: <Coffee className="w-3.5 h-3.5 text-slate-500" />
        };
    }
  };

  const currentBadge = getStatusBadge(machine.status);

  return (
    <section id="machine-status-and-time-zone" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT: Machine Status Real-Time (6 Cols) */}
      <div className={`lg:col-span-6 rounded-xl border p-4 transition-colors flex flex-col justify-between ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Power className="w-4 h-4 text-emerald-500" />
              Machine / Production Floor Status
            </h2>
            
            {/* Status changer buttons for operator testing */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className={`mr-1 hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Set Status:</span>
              {(['RUNNING', 'IDLE', 'DOWN', 'SETUP'] as MachineStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateMachineStatus(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                    machine.status === st
                      ? isDark ? 'bg-slate-700 text-white border-slate-500 shadow-inner' : 'bg-slate-800 text-white border-slate-900'
                      : isDark ? 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Active Machine Live Banner */}
          <div className={`border rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className={`w-4 h-4 rounded-full block ${currentBadge.dot} ${machine.status === 'RUNNING' ? 'animate-ping opacity-75' : ''}`}></span>
                <span className={`w-4 h-4 rounded-full block absolute top-0 left-0 ${currentBadge.dot}`}></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentBadge.bg} flex items-center gap-1`}>
                    {currentBadge.icon}
                    {currentBadge.label}
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{machine.statusSince}</span>
                </div>
                <div className={`font-semibold text-sm mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {machine.name} <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({machine.id})</span>
                </div>
              </div>
            </div>

            <div className={`text-right sm:border-l sm:pl-4 ${isDark ? 'sm:border-slate-700/60' : 'sm:border-slate-200'}`}>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Output Rate</div>
              <div className={`text-lg font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {machine.actualHourlyRate} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs/hr</span>
              </div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Actual Cycle: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.actualCycleTimeSec}s</strong>
              </div>
            </div>
          </div>

          {/* Product and Batch Spec */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Product:</span>
              <span className={`font-semibold block truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.currentProduct}</span>
              <span className={`text-[10px] truncate block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{machine.productDescription}</span>
            </div>
            <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Production Line & Area:</span>
              <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.line}</span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{machine.area}</span>
            </div>
          </div>
        </div>

        {/* Multi-Machine Quick Floor Strip */}
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className={`text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Plant Floor Machine Overview</span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Click to switch machine</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allMachines.map((m) => {
              const b = getStatusBadge(m.status);
              const isSelected = m.id === machine.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMachine(m.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected
                      ? isDark 
                        ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500/50' 
                        : 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                      : isDark 
                        ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{m.id}</span>
                    <span className={`w-2 h-2 rounded-full ${b.dot}`}></span>
                  </div>
                  <div className={`text-[10px] mt-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.status}</div>
                  <div className={`text-xs font-mono font-semibold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target: {m.targetOee}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Production Time Hierarchy & Decomposition (6 Cols) */}
      <div className={`lg:col-span-6 rounded-xl border p-4 transition-colors flex flex-col justify-between ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Clock className="w-4 h-4 text-amber-500" />
              Production Time Decomposition (ISO 22400)
            </h2>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Shift Duration: {machine.shiftDurationMinutes} min
            </span>
          </div>

          {/* Time Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shift Duration</span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{machine.shiftDurationMinutes} min</span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total scheduled shift</span>
            </div>

            <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Planned Downtime</span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{machine.plannedDowntimeMinutes} min</span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Breaks & planned stop</span>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isDark 
                ? 'bg-blue-950/20 border-blue-500/30' 
                : 'bg-blue-50/80 border-blue-200'
            }`}>
              <span className={`block text-[11px] ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Planned Production</span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{metrics.plannedProductionTimeMin} min</span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-blue-400/70' : 'text-blue-600'}`}>Shift - Planned Stops</span>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isDark 
                ? 'bg-rose-950/20 border-rose-500/30' 
                : 'bg-rose-50/80 border-rose-200'
            }`}>
              <span className={`block text-[11px] ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>Unplanned Downtime</span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>{metrics.downtimeMin} min</span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-rose-400/70' : 'text-rose-600'}`}>Breakdowns & pauses</span>
            </div>

            <div className={`p-2.5 rounded-lg border sm:col-span-2 ${
              isDark 
                ? 'bg-emerald-950/20 border-emerald-500/30' 
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <span className={`block text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Operating Run Time</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{metrics.runTimeMin} min</span>
                <span className={`text-xs font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  ({((metrics.runTimeMin / metrics.plannedProductionTimeMin) * 100).toFixed(1)}% availability)
                </span>
              </div>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                Net productive running duration
              </span>
            </div>
          </div>

          {/* Visual Time Waterfall Bar */}
          <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className={`flex items-center justify-between text-[11px] mb-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Time Distribution Waterfall</span>
              <span>100% = {machine.shiftDurationMinutes} min</span>
            </div>
            
            <div className={`h-3.5 w-full rounded-md overflow-hidden flex shadow-inner ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              {/* Run time (Emerald) */}
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 relative group"
                style={{ width: `${(metrics.runTimeMin / machine.shiftDurationMinutes) * 100}%` }}
                title={`Run Time: ${metrics.runTimeMin} min (${((metrics.runTimeMin / machine.shiftDurationMinutes) * 100).toFixed(1)}%)`}
              />
              {/* Unplanned Downtime (Rose) */}
              <div 
                className="bg-rose-500 h-full transition-all duration-500 relative group"
                style={{ width: `${(metrics.downtimeMin / machine.shiftDurationMinutes) * 100}%` }}
                title={`Unplanned Downtime: ${metrics.downtimeMin} min (${((metrics.downtimeMin / machine.shiftDurationMinutes) * 100).toFixed(1)}%)`}
              />
              {/* Planned Downtime (Slate) */}
              <div 
                className={isDark ? 'bg-slate-600 h-full transition-all duration-500 relative group' : 'bg-slate-400 h-full transition-all duration-500 relative group'}
                style={{ width: `${(machine.plannedDowntimeMinutes / machine.shiftDurationMinutes) * 100}%` }}
                title={`Planned Downtime: ${machine.plannedDowntimeMinutes} min (${((machine.plannedDowntimeMinutes / machine.shiftDurationMinutes) * 100).toFixed(1)}%)`}
              />
            </div>

            {/* Legend for Time Cascade */}
            <div className={`flex items-center justify-between flex-wrap gap-2 text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                Run Time ({metrics.runTimeMin}m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                Unplanned Downtime ({metrics.downtimeMin}m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`}></span>
                Planned Breaks ({machine.plannedDowntimeMinutes}m)
              </span>
            </div>
          </div>
        </div>

        {/* Tree Diagram reference from prompt */}
        <div className={`mt-3 p-2.5 rounded border text-[11px] font-mono flex items-center justify-between ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <span>Shift ({machine.shiftDurationMinutes}m)</span>
            <ArrowRight className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={isDark ? 'text-blue-400' : 'text-blue-600 font-semibold'}>Planned Prod ({metrics.plannedProductionTimeMin}m)</span>
            <ArrowRight className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-600 font-semibold'}>Run ({metrics.runTimeMin}m)</span>
          </div>
          <span className={`font-mono font-semibold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>Loss: {metrics.downtimeMin}m</span>
        </div>
      </div>
    </section>
  );
};
