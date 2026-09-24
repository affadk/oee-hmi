// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/KesehatanTab.tsx
// Tab Kesehatan — heap, tasks, event flags, tabel stale task, dump JSON health.

import React from 'react';
import type { MqttEdgeTabContext } from '../tabShared';

interface KesehatanTabProps {
  ctx: MqttEdgeTabContext;
}

export const KesehatanTab: React.FC<KesehatanTabProps> = ({ ctx }) => {
  const { h, isDark, skins } = ctx;
  const { card, label, value } = skins;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-3.5 rounded-xl border ${card}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>Heap bebas</div>
          <div className={`font-mono font-extrabold text-lg ${value}`}>{h.heap_free.toLocaleString('id-ID')} B</div>
          <div className={`h-1.5 rounded-full mt-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (h.heap_free / 262144) * 100)}%` }} />
          </div>
        </div>
        <div className={`p-3.5 rounded-xl border ${card}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>Tasks sehat</div>
          <div className={`font-mono font-extrabold text-lg ${value}`}>{h.tasks_healthy}/{h.tasks_total}</div>
          <div className={`text-[11px] font-mono ${h.stale_count ? 'text-amber-500' : 'text-emerald-500'}`}>{h.stale_count} stale</div>
        </div>
        <div className={`p-3.5 rounded-xl border ${card}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>Event flags</div>
          <div className={`font-mono font-extrabold text-lg ${value}`}>0x{h.event_flags.toString(16).toUpperCase().padStart(4, '0')}</div>
          <div className={`text-[11px] font-mono ${label}`}>periode 5s</div>
        </div>
      </div>
      <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-[#1c3358]' : 'border-slate-200'}`}>
        <table className="w-full text-left font-mono text-[11px]">
          <thead className={`${isDark ? 'bg-[#080e1c] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
            <tr><th className="p-2 pl-3">Task</th><th className="p-2">Age</th><th className="p-2">State</th></tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#1c3358]/60' : 'divide-slate-200'}`}>
            {h.stale_tasks.length === 0 && <tr><td colSpan={3} className={`p-3 text-center ${label}`}>Semua task FreeRTOS sehat — tidak ada stale task.</td></tr>}
            {h.stale_tasks.map((s) => (
              <tr key={s.name}>
                <td className="p-2 pl-3 font-bold text-sky-500">{s.name}</td>
                <td className={`p-2 ${value}`}>{s.age_ms.toLocaleString('id-ID')} ms</td>
                <td className={`p-2 font-bold ${s.alive ? 'text-emerald-500' : 'text-rose-500'}`}>{s.alive ? '● ALIVE' : '● STALE'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`p-3 rounded-xl border font-mono text-[11px] overflow-x-auto ${isDark ? 'bg-[#050811] border-slate-800 text-amber-300' : 'bg-slate-900 border-slate-800 text-amber-300'}`}>
        <pre>{JSON.stringify(h, null, 2)}</pre>
      </div>
    </div>
  );
};
