import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Clock, 
  Calendar, 
  Layers, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCw, 
  PlusCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { MachineConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderZoneProps {
  currentMachine: MachineConfig;
  allMachines: MachineConfig[];
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
  teepEnabled: boolean;
  onToggleTeep: () => void;
}

export const HeaderZone: React.FC<HeaderZoneProps> = ({
  currentMachine,
  allMachines,
  selectedPlant,
  selectedLine,
  selectedShift,
  selectedDate,
  isSimulating,
  onSelectMachine,
  onSelectLine,
  onSelectShift,
  onToggleSimulate,
  onOpenLogModal,
  onOpenHelpModal,
  teepEnabled,
  onToggleTeep,
}) => {
  const [pulseCount, setPulseCount] = useState(1);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className={`w-full border-b sticky top-0 z-30 shadow-md transition-colors ${
      isDark ? 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-slate-100' : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-900'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-2.5">
        {/* Tier 1: System Branding, Real-Time Telemetry & Action Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Left: Branding & Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-blue-600/20 border border-blue-500/40 p-2 rounded-lg flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5 animate-pulse text-blue-400" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  OEE AUDIT DASHBOARD
                </h1>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  ISO 22400 / TPM COMPLIANT
                </span>

                {/* Real-time Telemetry Indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${
                  isDark 
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>PLC / IoT ONLINE</span>
                  <span className={`text-[10px] ml-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Modbus TCP • 100ms</span>
                </div>
              </div>
              <p className={`text-xs mt-0.5 hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Manufacturing floor operational performance: Availability × Performance × Quality
              </p>
            </div>
          </div>

          {/* Right: Actions & Tools */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
            {/* Live simulation toggle */}
            <button
              id="btn-toggle-simulation"
              onClick={onToggleSimulate}
              title={isSimulating ? "Pause live simulation" : "Start live simulation"}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isSimulating 
                  ? isDark
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900/80'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isSimulating ? 'SIM RUNNING' : 'SIM PAUSED'}</span>
            </button>

            {/* Quick Log Downtime / Defect Button */}
            <button
              id="btn-open-log-modal"
              onClick={onOpenLogModal}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Event</span>
            </button>

            {/* Formula Help & Standards */}
            <button
              id="btn-open-help-modal"
              onClick={onOpenHelpModal}
              title="View OEE Standards & Mathematical Formulas"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Formula Help</span>
            </button>

            {/* TEEP Toggle */}
            <button
              id="btn-toggle-teep"
              onClick={onToggleTeep}
              title="Toggle TEEP (Total Effective Equipment Productivity)"
              className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-colors cursor-pointer ${
                teepEnabled
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              TEEP: {teepEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Tier 2: Manufacturing Context & Hierarchy Filter Strip (ISA-95 Enterprise > Line > Machine > Shift) */}
        <div className={`rounded-xl border p-2 flex flex-wrap items-center justify-between gap-2.5 text-xs transition-colors ${
          isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Hierarchy Selectors Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Plant */}
            <div className={`rounded-lg px-2.5 py-1 flex items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Plant:</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedPlant}</span>
            </div>

            <span className={`hidden sm:inline text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>

            {/* Line Filter */}
            <div className={`rounded-lg px-2.5 py-1 flex items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Line:</span>
              <select
                id="line-select"
                aria-label="Select Production Line"
                value={selectedLine}
                onChange={(e) => onSelectLine(e.target.value)}
                className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                <option value="LINE-01" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}>LINE-01 (Press Shop)</option>
                <option value="LINE-02" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}>LINE-02 (Precision Milling)</option>
              </select>
            </div>

            <span className={`hidden sm:inline text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>

            {/* Machine Filter */}
            <div className={`rounded-lg px-2.5 py-1 flex items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Machine:</span>
              <select
                id="machine-select"
                aria-label="Select Machine"
                value={currentMachine.id}
                onChange={(e) => onSelectMachine(e.target.value)}
                className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                {allMachines.map((m) => (
                  <option key={m.id} value={m.id} className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}>
                    {m.id} - {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <span className={`hidden sm:inline text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>

            {/* Shift */}
            <div className={`rounded-lg px-2.5 py-1 flex items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Shift:</span>
              <select
                id="shift-select"
                aria-label="Select Shift"
                value={selectedShift}
                onChange={(e) => onSelectShift(e.target.value)}
                className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${
                  isDark ? 'text-amber-300' : 'text-amber-600'
                }`}
              >
                <option value="Shift 1" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}>Shift 1 (07:00 - 15:00)</option>
                <option value="Shift 2" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}>Shift 2 (15:00 - 23:00)</option>
                <option value="Shift 3" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}>Shift 3 (23:00 - 07:00)</option>
              </select>
            </div>

            {/* Date */}
            <div className={`rounded-lg px-2.5 py-1 flex items-center gap-1.5 border ${
              isDark ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedDate}</span>
            </div>
          </div>

          {/* Active Work Order & Product Context Preview */}
          <div className="flex items-center gap-3 text-xs ml-auto">
            <div className="flex items-center gap-1.5">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Product:</span>
              <span className={`font-semibold truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {currentMachine.currentProduct}
              </span>
            </div>
            <span className={`hidden md:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</span>
            <div className="hidden md:flex items-center gap-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Target OEE:</span>
              <span className={`font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {currentMachine.targetOee}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
