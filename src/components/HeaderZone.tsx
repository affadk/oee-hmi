// /src/components/HeaderZone.tsx — Detailed Audit header mengikuti style OEE Shift Overview
// Top navy bar #1a3464 + Sub-header #0d1728 / #e8edf4, kartu timestamp + status Active/Down

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  PlusCircle,
  HelpCircle,
  Radio,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { MachineConfig, CalculatedOeeMetrics, MachineStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderZoneProps {
  currentMachine: MachineConfig;
  allMachines: MachineConfig[];
  metrics: CalculatedOeeMetrics;
  selectedPlant: string;
  selectedLine: string;
  selectedShift: string;
  selectedDate: string;
  isSimulating: boolean;
  onSelectMachine: (id: string) => void;
  onSelectLine: (line: string) => void;
  onSelectShift: (shift: string) => void;
  onToggleSimulate: () => void;
  onOpenLogModal: () => void;
  onOpenHelpModal: () => void;
  onOpenMqttModal?: () => void;
  onUpdateMachineStatus?: (status: MachineStatus) => void;
  teepEnabled: boolean;
  onToggleTeep: () => void;
}

export const HeaderZone: React.FC<HeaderZoneProps> = ({
  currentMachine,
  allMachines,
  selectedLine,
  selectedShift,
  isSimulating,
  onSelectMachine,
  onSelectLine,
  onSelectShift,
  onToggleSimulate,
  onOpenLogModal,
  onOpenHelpModal,
  onOpenMqttModal,
  onUpdateMachineStatus,
  teepEnabled,
  onToggleTeep,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Live wall-clock untuk timestamp sub-header
  const [headerNow, setHeaderNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setHeaderNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const headerDate = headerNow.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const headerTime = [headerNow.getHours(), headerNow.getMinutes(), headerNow.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');

  const machineName = currentMachine.name || 'Mesin Blister (CP400)';
  const machineLine = currentMachine.line || 'Line Mediseal 01';
  const productName = currentMachine.currentProduct || currentMachine.jobConfig?.productName || 'Sodium Tablets 500mg';
  const targetCycleTimeSec = currentMachine.idealCycleTimeSec || currentMachine.jobConfig?.standardCycleTimeSec || 9.0;
  const operatorName = currentMachine.jobConfig?.operatorName || 'Budi Santoso';
  const operatorId = currentMachine.jobConfig?.operatorId || 'OP-104';
  const shiftStart = currentMachine.jobConfig?.shiftStart || '22:00';
  const shiftEnd = currentMachine.jobConfig?.shiftEnd || '08:00';
  const breakTimeWindow = currentMachine.jobConfig?.breakTimeWindow || '02:00 - 03:00';
  const plannedBreakMin = currentMachine.jobConfig?.plannedBreakMin ?? 60;
  const shiftNumber = shiftStart === '22:00' || shiftStart === '23:00' ? 'Shift 3' : shiftStart === '15:00' ? 'Shift 2' : 'Shift 1';
  const theoreticalHourlyOutput = targetCycleTimeSec > 0 ? Math.round(3600 / targetCycleTimeSec) : 400;

  const health = currentMachine.health || { tasks_healthy: 6, tasks_total: 6, heap_free: 184320, stale_count: 0 } as any;
  const isHealthy = (health.stale_count ?? 0) === 0;
  const heapFreeKb = Math.round((health.heap_free || 184320) / 1024);

  const isRunning = currentMachine.status === 'RUNNING';

  return (
    <div className="w-full shrink-0 select-none">
      {/* 1. TOP HEADER — solid navy ala Shift Overview */}
      <header className="bg-[#1a3464] text-white px-[1.2vw] py-[0.8vh] flex items-center justify-between text-[clamp(12px,0.85vw,14px)] font-semibold shadow-md w-full">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wide text-sm sm:text-base">OEE Machine Dashboard</span>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded font-mono text-xs bg-white/10 border border-white/20 text-white/80">
            Detailed Audit
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Machine selector */}
          <div className="relative inline-block text-slate-900">
            <select
              value={currentMachine.id}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="bg-white/95 hover:bg-white text-slate-900 font-bold py-1.5 pl-3 pr-7 rounded text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
              aria-label="Select Machine"
            >
              {allMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.line || m.id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600" />
          </div>

          {/* Line selector */}
          <div className="relative hidden md:inline-block text-slate-900">
            <select
              value={selectedLine}
              onChange={(e) => onSelectLine(e.target.value)}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 pl-3 pr-7 rounded text-sm appearance-none cursor-pointer focus:outline-none border border-white/20"
              aria-label="Select Production Line"
            >
              <option value="Line 1" className="bg-white text-slate-900">Line 1</option>
              <option value="Line Mediseal 01" className="bg-white text-slate-900">Line Mediseal 01</option>
              <option value="LINE-01" className="bg-white text-slate-900">LINE-01</option>
              <option value="LINE-02" className="bg-white text-slate-900">LINE-02</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/70" />
          </div>

          {/* Shift selector */}
          <div className="relative hidden md:inline-block text-slate-900">
            <select
              value={selectedShift}
              onChange={(e) => onSelectShift(e.target.value)}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 pl-3 pr-7 rounded text-sm appearance-none cursor-pointer focus:outline-none border border-white/20"
              aria-label="Select Shift"
            >
              <option value="Shift 1" className="bg-white text-slate-900">Shift 1</option>
              <option value="Shift 2" className="bg-white text-slate-900">Shift 2</option>
              <option value="Shift 3" className="bg-white text-slate-900">Shift 3</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/70" />
          </div>

          {/* Log Event */}
          <button
            type="button"
            onClick={onOpenLogModal}
            className="px-2.5 py-1.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Log Downtime / Defect"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden lg:inline font-mono">Log Event</span>
          </button>

          {/* Edge I/O */}
          {onOpenMqttModal && (
            <button
              type="button"
              onClick={onOpenMqttModal}
              className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Edge Telemetry Hardware Inspector"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline font-mono">Edge I/O</span>
            </button>
          )}

          {/* Formula Help */}
          <button
            type="button"
            onClick={onOpenHelpModal}
            className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="View OEE Standards & Formulas"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden lg:inline font-mono">Formula</span>
          </button>

          {/* TEEP */}
          <button
            type="button"
            onClick={onToggleTeep}
            className={`px-2.5 py-1.5 rounded font-mono text-sm font-semibold border transition-all cursor-pointer ${
              teepEnabled
                ? 'bg-purple-500/30 border-purple-400/50 text-purple-100'
                : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/20'
            }`}
            title="Toggle TEEP"
          >
            TEEP:{teepEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Sim toggle */}
          <button
            type="button"
            onClick={onToggleSimulate}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isSimulating ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={isSimulating ? 'Pause simulation' : 'Resume simulation'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>

          {/* Edge health */}
          <button
            type="button"
            onClick={onOpenMqttModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-sm transition-all cursor-pointer select-none ml-1 border ${
              isHealthy
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
            }`}
            title={`Edge Health: ${health.tasks_healthy}/${health.tasks_total} Tasks • Heap ${heapFreeKb} KB`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>
            <span className="font-bold text-sm tracking-tight">Edge: {isHealthy ? 'OK' : 'WARN'}</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-HEADER — ala Shift Overview */}
      <section
        className={`w-full px-[1.2vw] py-[1vh] border-b transition-colors ${
          isDark ? 'bg-[#0d1728] border-slate-800' : 'bg-[#e8edf4] border-[#c4cbd5]'
        }`}
      >
        <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-6">
          <div className="flex items-center gap-2.5 shrink-0 min-w-[180px]">
            <div className="flex flex-col">
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {machineName}
              </h1>
              <span className={`text-sm sm:text-base font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {machineLine}
              </span>
            </div>
          </div>

          <div className="w-full xl:w-fit grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2 text-sm">
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Product</span>
              <strong className={`text-lg font-extrabold truncate mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={productName}>{productName}</strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cycle Time</span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{targetCycleTimeSec}s</strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operator</span>
              <strong className={`text-lg font-extrabold truncate mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{operatorName}</strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shift</span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{operatorId} · {shiftNumber}</strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mulai</span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{shiftStart}</strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Selesai</span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{shiftEnd}</strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Istirahat</span>
              <strong className="font-mono text-lg font-extrabold mt-1 text-amber-600 dark:text-amber-400" title={`Jam Istirahat: ${breakTimeWindow} (${plannedBreakMin} menit)`}>
                {breakTimeWindow ? `${breakTimeWindow} (${plannedBreakMin}m)` : `${plannedBreakMin}m`}
              </strong>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target Rate</span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{theoreticalHourlyOutput} pcs/h</strong>
            </div>
          </div>

          <div className="flex items-stretch gap-2.5 shrink-0">
            <div className={`flex flex-col items-center justify-center leading-none shrink-0 px-4 py-2 rounded-md border shadow-sm select-none ${
              isDark ? 'bg-[#0f1b2e] border-slate-700' : 'bg-white border-slate-300'
            }`} title={`${headerDate} ${headerTime}`}>
              <span className={`font-mono font-black tabular-nums tracking-tight text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{headerTime}</span>
              <span className={`font-mono text-xs font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{headerDate}</span>
            </div>
            <div
              onClick={() => onUpdateMachineStatus?.(isRunning ? 'DOWN' : 'RUNNING')}
              className={`w-[112px] px-4 py-2 rounded-md shadow-sm flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-102 shrink-0 select-none ${
                isRunning ? 'bg-[#48a43f] text-white' : 'bg-rose-600 text-white'
              }`}
              title={`Status: ${isRunning ? 'Active / Running' : 'Down / Stopped'}. Klik untuk mengubah status.`}
            >
              <span className="text-xl sm:text-2xl font-black leading-tight tracking-wide">{isRunning ? 'Active' : 'Down'}</span>
              <span className="text-sm font-semibold leading-none opacity-90">{isRunning ? 'Running' : 'Stopped'}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
