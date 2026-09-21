// /src/components/fullscreen/PasXShiftview.tsx

import React from 'react';
import { User, Users, ShieldCheck, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { MachineConfig } from '../../types';

interface PasXShiftviewProps {
  machine: MachineConfig;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const PasXShiftview: React.FC<PasXShiftviewProps> = ({
  machine,
  zoomLevel,
  onZoomIn,
  onZoomOut,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isRunning = machine.status === 'RUNNING';

  return (
    <div className="space-y-3">
      {/* 1. Real-time Status Indicators matching image.png */}
      <div
        className={`p-3.5 rounded-lg border transition-colors ${
          isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
        }`}
      >
        <div className="space-y-2.5">
          {/* Released for Production */}
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#48a43f] shadow-sm shrink-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </span>
            <span className={`text-xs font-semibold tracking-tight ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              Released for Production
            </span>
          </div>

          {/* Machine produces */}
          <div className="flex items-center gap-2.5">
            <span className={`w-3.5 h-3.5 rounded-full shadow-sm shrink-0 flex items-center justify-center ${
              isRunning ? 'bg-[#48a43f] animate-pulse' : 'bg-rose-500'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </span>
            <span className={`text-xs font-semibold tracking-tight ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              Machine produces
            </span>
          </div>

          {/* SCADA Systems */}
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#48a43f] shadow-sm shrink-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </span>
            <span className={`text-xs font-semibold tracking-tight ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              SCADA Systems
            </span>
          </div>
        </div>
      </div>

      {/* 2. Shift & Operator Personnel Box matching image.png */}
      <div
        className={`rounded-lg border overflow-hidden transition-colors ${
          isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
        }`}
      >
        {/* Header: 2014/02/24 - Shift 1 (Shiftview) */}
        <div className={`px-3 py-1.5 border-b font-semibold text-xs ${
          isDark ? 'bg-[#14233c] border-slate-800 text-slate-200' : 'bg-[#e4ebf3] border-[#c9d3df] text-slate-800'
        }`}>
          2014/02/24 - Shift 1 (Shiftview)
        </div>

        {/* 3 Columns with counts */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 p-2 text-center">
          {/* Operator */}
          <div className="px-1 py-2 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <User className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              <span>Operator</span>
            </div>
            <span className={`font-sans font-black text-2xl sm:text-3xl ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              23
            </span>
          </div>

          {/* Administrator */}
          <div className="px-1 py-2 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <Users className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              <span>Administrator</span>
            </div>
            <span className="font-sans font-black text-2xl sm:text-3xl text-slate-400 dark:text-slate-500">
              4
            </span>
          </div>

          {/* Supervisor */}
          <div className="px-1 py-2 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <ShieldCheck className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              <span>Supervisor</span>
            </div>
            <span className="font-sans font-black text-2xl sm:text-3xl text-slate-400 dark:text-slate-500">
              1
            </span>
          </div>
        </div>

        {/* Zoom Controls: + / Strg + and - / Strg - matching image.png */}
        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In Timeline & Trend"
            className={`py-1.5 px-3 flex flex-col items-center justify-center transition-colors cursor-pointer select-none ${
              isDark
                ? 'hover:bg-slate-800 text-slate-200'
                : 'hover:bg-slate-100 text-slate-800 bg-slate-50'
            }`}
          >
            <span className="font-bold text-base leading-none">+</span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">Strg +</span>
          </button>

          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out Timeline & Trend"
            className={`py-1.5 px-3 flex flex-col items-center justify-center transition-colors cursor-pointer select-none ${
              isDark
                ? 'hover:bg-slate-800 text-slate-200'
                : 'hover:bg-slate-100 text-slate-800 bg-slate-50'
            }`}
          >
            <span className="font-bold text-base leading-none">−</span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">Strg -</span>
          </button>
        </div>
      </div>
    </div>
  );
};
