import React from 'react';
import { 
  Factory, 
  Settings, 
  Box, 
  Clock, 
  Calendar, 
  Maximize, 
  Minimize, 
  Radio, 
  RefreshCw
} from 'lucide-react';
import { MachineConfig } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface FullscreenHeaderProps {
  machine: MachineConfig;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenMqttModal: () => void;
  isSimulating: boolean;
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
  onToggleSimulate,
  onSwitchMachine,
  allMachines,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
          <h1 className={`font-bold text-lg sm:text-xl tracking-tight leading-none ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            OEE Dashboard
          </h1>
          <p className={`text-[11px] font-normal mt-0.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Overall Equipment Effectiveness
          </p>
        </div>
      </div>

      {/* Center: Context Metadata Chips matching image.png */}
      <div className="hidden lg:flex items-center gap-6 xl:gap-8">
        {/* Plant */}
        <div className="flex flex-col">
          <span className={`text-[10px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Plant</span>
          <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {machine.plant}
          </span>
        </div>

        {/* Line */}
        <div className="flex flex-col">
          <span className={`text-[10px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Line</span>
          <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {machine.line}
          </span>
        </div>

        {/* Machine */}
        <div className="flex items-center gap-2">
          <Settings className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-[10px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Machine</span>
            <select
              value={machine.id}
              onChange={(e) => onSwitchMachine(e.target.value)}
              className={`bg-transparent text-xs sm:text-sm font-semibold cursor-pointer hover:text-blue-500 transition-colors focus:outline-none -ml-1 py-0 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {allMachines.map((m) => (
                <option key={m.id} value={m.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {m.id} ({m.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product */}
        <div className="flex items-center gap-2">
          <Box className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-[10px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Product</span>
            <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {machine.currentProduct}
            </span>
          </div>
        </div>

        {/* Shift */}
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-[10px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shift</span>
            <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Shift 1 <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>(08:00 - 16:00)</span>
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className={`text-[10px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date</span>
            <div className={`text-xs sm:text-sm font-semibold mt-0.5 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>18 Sep 2026</span>
              <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>14:32</span>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          isDark
            ? 'bg-emerald-950/40 border-emerald-800/60'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className={`text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Online</span>
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
          <span className="hidden sm:inline">MQTT Edge</span>
        </button>

        {/* Simulation toggle */}
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

        {/* Video Fullscreen Trigger Button */}
        <button
          onClick={onToggleFullscreen}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Video Fullscreen Mode (F)'}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      </div>
    </header>
  );
};
