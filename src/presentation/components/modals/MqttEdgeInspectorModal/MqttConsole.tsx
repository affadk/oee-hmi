// /src/presentation/components/modals/MqttEdgeInspectorModal/MqttConsole.tsx
// Console MQTT — log TX/RX/SYS live di bagian bawah modal.

import React from 'react';
import { Terminal } from 'lucide-react';
import type { ConsoleLine } from './tabShared';

interface MqttConsoleProps {
  consoleLog: ConsoleLine[];
  onClear: () => void;
  isDark: boolean;
}

export const MqttConsole: React.FC<MqttConsoleProps> = ({ consoleLog, onClear, isDark }) => {
  return (
    <div className={`border-t shrink-0 ${isDark ? 'border-[#162744] bg-[#050811]' : 'border-slate-200 bg-slate-900'}`}>
      <div className="flex items-center gap-2 px-3 pt-2">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Console MQTT</span>
        <span className="text-[10px] font-mono text-slate-500">{consoleLog.length} baris</span>
        <button type="button" onClick={onClear} className="ml-auto text-[10px] font-mono text-slate-500 hover:text-slate-300">bersihkan</button>
      </div>
      <div className="px-3 py-2 h-20 overflow-y-auto font-mono text-[11px] leading-relaxed" aria-live="polite">
        {consoleLog.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-slate-600 shrink-0">{l.ts}</span>
            <span className={`font-bold shrink-0 ${l.kind === 'TX' ? 'text-sky-400' : l.kind === 'RX' ? 'text-emerald-400' : 'text-slate-500'}`}>{l.kind}</span>
            <span className="text-slate-300 break-all">{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
