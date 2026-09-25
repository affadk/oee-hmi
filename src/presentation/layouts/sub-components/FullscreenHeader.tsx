// /src/presentation/layouts/sub-components/FullscreenHeader.tsx
// Top header bar — machine selector, QR scan, edge I/O, theme toggle, fullscreen.

import React from 'react';
import {
  Maximize2,
  Minimize2,
  QrCode,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import type { MachineConfig } from '../../../domain/index';

export interface FullscreenHeaderProps {
  machine: MachineConfig;
  allMachines: MachineConfig[];
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onSwitchMachine: (id: string) => void;
  onOpenMqttModal: () => void;
  onOpenFormula: (metric: string) => void;
  onViewAllEvents?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onThemeToggle: () => void;
  onOpenQrModal: () => void;
  isDark: boolean;
  useBackend?: boolean;
  health: NonNullable<MachineConfig['health']>;
  isHealthy: boolean;
  heapFreeKb: number;
}

export const FullscreenHeader: React.FC<FullscreenHeaderProps> = ({
  machine,
  allMachines,
  isSimulating,
  onToggleSimulate,
  onSwitchMachine,
  onOpenMqttModal,
  onViewAllEvents,
  isFullscreen,
  onToggleFullscreen,
  onThemeToggle,
  onOpenQrModal,
  isDark,
  useBackend,
  health,
  isHealthy,
  heapFreeKb,
}) => {
  return (
    <header className="bg-[#1a3464] text-white px-[1.2vw] py-[0.8vh] flex items-center justify-between text-[clamp(12px,0.85vw,14px)] font-semibold shadow-md shrink-0 w-full">
      {/* Brand + Mode badge */}
      <div className="flex items-center gap-3">
        <span className="font-bold tracking-wide text-sm sm:text-base">OEE Machine Dashboard</span>
        {useBackend ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">Backend Live</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">Simulation</span>
        )}
      </div>

      {/* Action Controls Toolbar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Machine selector dropdown */}
        <div className="relative inline-block text-slate-900">
          <select
            value={machine.id}
            onChange={(e) => onSwitchMachine(e.target.value)}
            className="bg-white/95 hover:bg-white text-slate-900 font-bold py-1.5 pl-3 pr-7 rounded text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          >
            {allMachines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.line || m.id})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600" />
        </div>

        {/* QR Scanner Trigger */}
        <button
          type="button"
          onClick={onOpenQrModal}
          className="px-2.5 py-1.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          title={useBackend ? 'Scan QR untuk memilih WO antrean' : 'Scan QR Code Batch'}
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden lg:inline font-mono">Scan QR</span>
        </button>

        {/* Edge Telemetry Modal — lane simulasi saja */}
        {!useBackend && (
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

        {/* Live simulation toggle */}
        {!useBackend && (
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
        )}

        {/* Switch to Detailed Audit View */}
        {onViewAllEvents && (
          <button
            type="button"
            onClick={onViewAllEvents}
            className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all cursor-pointer"
            title="Open Detailed Audit View"
          >
            Audit View
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={onThemeToggle}
          className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* MQTT Edge Controller health — tampil bila ada data nyata (sim lane atau G3 backend). */}
        {(!useBackend || (health.tasks_total ?? 0) > 0) && (
          <button
            type="button"
            onClick={onOpenMqttModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-sm transition-all cursor-pointer select-none ml-1 border ${
              isHealthy
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
            }`}
            title={`Edge Health: ${health.tasks_healthy}/${health.tasks_total} Tasks • Heap ${heapFreeKb} KB${health.age_sec != null ? ` • Age ${health.age_sec}s` : ''}`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
            </span>
            <span className="font-bold text-sm tracking-tight">
              Edge: {isHealthy ? 'OK' : 'WARN'}
            </span>
            {/* D3 overview-minimal: badge saja (detail lengkap hanya di Audit). */}
          </button>
        )}
      </div>
    </header>
  );
};
