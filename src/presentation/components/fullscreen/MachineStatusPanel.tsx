import React from 'react';
import { MachineConfig } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';

interface MachineStatusPanelProps {
  machine: MachineConfig;
}

export const MachineStatusPanel: React.FC<MachineStatusPanelProps> = ({ machine }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header with Title & Live Status Pill matching image.png */}
      <div className="flex items-center justify-between mb-1 pb-1">
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Machine Status
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
          isDark
            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Running
        </span>
      </div>

      {/* Content: Graphic on Left, Specs on Right */}
      <div className="flex items-center justify-between gap-3 flex-1 py-1">
        {/* Machine Icon / Graphic */}
        <div className={`w-20 h-16 sm:w-24 sm:h-18 flex items-center justify-center p-1.5 rounded-lg border shrink-0 ${
          isDark
            ? 'bg-[#070c18] border-[#14233c] text-slate-300'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <svg viewBox="0 0 100 70" className="w-full h-full" fill="none" stroke="currentColor">
            {/* Base Machine Chassis */}
            <rect x="10" y="20" width="80" height="42" rx="3" strokeWidth="2.5" fill={isDark ? '#0d1b33' : '#e2e8f0'} />
            <rect x="25" y="8" width="50" height="14" rx="2" strokeWidth="2" fill={isDark ? '#132442' : '#cbd5e1'} />
            {/* Press Ram / Stamping Tool */}
            <rect x="42" y="22" width="16" height="20" rx="1" fill="#38bdf8" strokeWidth="1" />
            <rect x="36" y="42" width="28" height="6" rx="1" fill="#0284c7" strokeWidth="1" />
            {/* Control Panel / Screen */}
            <rect x="16" y="26" width="16" height="14" rx="1" fill="#0369a1" strokeWidth="1" />
            <circle cx="20" cy="30" r="1.5" fill="#38bdf8" />
            <circle cx="26" cy="30" r="1.5" fill="#10b981" />
            {/* Coil Feeder Roller */}
            <circle cx="75" cy="36" r="6" strokeWidth="1.5" fill={isDark ? '#1e293b' : '#94a3b8'} />
            <circle cx="75" cy="36" r="2" fill="#38bdf8" />
            {/* Ground support feet */}
            <rect x="14" y="62" width="12" height="4" fill={isDark ? '#334155' : '#64748b'} />
            <rect x="74" y="62" width="12" height="4" fill={isDark ? '#334155' : '#64748b'} />
          </svg>
        </div>

        {/* Specs List */}
        <div className="flex-1 space-y-1.5 text-xs">
          <div>
            <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Product</span>
            <span className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {machine.currentProduct}
            </span>
          </div>

          <div>
            <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Cycle Time</span>
            <span className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {machine.actualCycleTimeSec.toFixed(1)} sec
            </span>
          </div>

          <div>
            <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Rate</span>
            <span className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {machine.actualHourlyRate} pcs/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
