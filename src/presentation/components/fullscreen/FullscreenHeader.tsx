// /src/presentation/components/fullscreen/FullscreenHeader.tsx

import React from 'react';
import { 
  Factory, 
  Cpu, 
  Box, 
  Clock, 
  User, 
  Maximize, 
  Minimize, 
  Radio, 
  RefreshCw,
  FileText,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { MachineConfig } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';

interface FullscreenHeaderProps {
  machine: MachineConfig;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenMqttModal: () => void;
  isSimulating: boolean;
  useBackend?: boolean;
  onToggleSimulate: () => void;
  onSwitchMachine: (id: string) => void;
  allMachines: MachineConfig[];
}

export const FullscreenHeader: React.FC<FullscreenHeaderProps> = ({
  machine,
  isFullscreen,
  onToggleFullscreen,
  onOpenMqttModal,
  isSimulating,
  useBackend,
  onToggleSimulate,
  onSwitchMachine,
  allMachines,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const workOrder = machine.jobConfig?.workOrder || '—';
  const productName = machine.jobConfig?.productName || machine.currentProduct || '—';
  const operatorName = machine.jobConfig?.operatorName || '—';
  const shiftStart = machine.jobConfig?.shiftStart || '—';
  const shiftEnd = machine.jobConfig?.shiftEnd || '—';
  const shiftLabel = shiftStart === '22:00' || shiftStart === '23:00' ? 'Shift 3' : shiftStart === '15:00' ? 'Shift 2' : shiftStart === '—' ? '—' : 'Shift 1';
  const deviceId = machine.deviceId || machine.id || '—';

  const health = machine.health || {
    tasks_healthy: 0,
    tasks_total: 0,
    heap_free: 0,
    stale_count: 0,
  };
  const isHealthy = (health.stale_count ?? 0) === 0 && (health.tasks_healthy ?? 0) === (health.tasks_total ?? 0);

  return (
    <header className={`px-4 py-2.5 flex items-center justify-between shrink-0 select-none border-b transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200'
    }`}>
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
          isDark
            ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
            : 'bg-blue-50 border-blue-200 text-blue-600'
        }`}>
          <Factory className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-bold text-lg sm:text-xl tracking-tight leading-none ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              OEE Dashboard
            </h1>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${
              isDark ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              ISO 22400
            </span>
          </div>
          <p className={`text-[11px] font-normal mt-0.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Real-Time Edge Telemetry &amp; Line Effectiveness
          </p>
        </div>
      </div>

      {/* Center: Context Metadata Chips (Device, WO, Product, Operator, Shift, Edge Health) */}
      <div className="hidden lg:flex items-center gap-5 xl:gap-7">
        {/* Device Selector */}
        <div className="flex items-center gap-1.5">
          <Cpu className={`w-4 h-4 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="flex flex-col">
            <span className={`text-xs leading-none font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Device ID</span>
            <select
              value={machine.id}
              onChange={(e) => onSwitchMachine(e.target.value)}
              className={`bg-transparent text-xs sm:text-sm font-bold font-mono cursor-pointer hover:text-blue-500 transition-colors focus:outline-none -ml-1 py-0 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {allMachines.map((m) => (
                <option key={m.id} value={m.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {m.deviceId || m.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Work Order */}
        <div className="flex items-center gap-1.5">
          <FileText className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-xs leading-none font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Work Order</span>
            <span className={`text-sm font-semibold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {workOrder}
            </span>
          </div>
        </div>

        {/* Product */}
        <div className="flex items-center gap-1.5">
          <Box className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-xs leading-none font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Product</span>
            <span className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {productName}
            </span>
          </div>
        </div>

        {/* Operator */}
        <div className="flex items-center gap-1.5">
          <User className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-xs leading-none font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operator</span>
            <span className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {operatorName}
            </span>
          </div>
        </div>

        {/* Shift Plan with Dynamic Label & Metadata Time */}
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-xs leading-none font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shift Plan · Live: 01:25</span>
            <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {shiftStart} - {shiftEnd} <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({shiftLabel})</span>
            </span>
          </div>
        </div>

        {/* Edge Health status badge */}
        <div 
          onClick={onOpenMqttModal}
          title={`Heap Free: ${(health.heap_free / 1024).toFixed(0)} KB | Tasks: ${health.tasks_healthy}/${health.tasks_total}`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
            isHealthy
              ? isDark
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : isDark
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
          <span className="text-[11px] font-semibold">
            {isHealthy ? `Edge Healthy (${health.tasks_healthy}/${health.tasks_total})` : 'Degraded Tasks'}
          </span>
        </div>

        {/* Telemetry connection status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          machine.connectionStatus === 'ONLINE'
            ? isDark
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : isDark
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-400'
              : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${machine.connectionStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className="text-xs font-semibold">{machine.connectionStatus || 'ONLINE'}</span>
        </div>
      </div>

      {/* Right: Actions & Fullscreen Button */}
      <div className="flex items-center gap-2">
        {/* MQTT Edge Inspector Button */}
        <button
          onClick={onOpenMqttModal}
          title="STM32H723 MQTT Edge Telemetry Inspector"
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#111f38] hover:bg-[#192f55] border-[#1e3a5f] text-blue-300'
              : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className="hidden sm:inline">Edge Telemetry</span>
        </button>

         {/* Simulation toggle */}
         {!useBackend && (
           <button
             onClick={onToggleSimulate}
             title={isSimulating ? 'Pause live simulation' : 'Start live simulation'}
             className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
               isSimulating
                 ? isDark
                   ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                   : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                 : isDark
                   ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                   : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
             }`}
           >
             <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
             <span className="hidden md:inline">{isSimulating ? 'Live' : 'Paused'}</span>
           </button>
         )}

        {/* Video Fullscreen Trigger Button */}
        <button
          onClick={onToggleFullscreen}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Video Fullscreen Mode (F)'}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
      </div>
    </header>
  );
};

