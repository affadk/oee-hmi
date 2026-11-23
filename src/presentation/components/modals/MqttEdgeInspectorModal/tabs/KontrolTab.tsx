// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/KontrolTab.tsx
// Tab Kontrol — tampilan FSM edge (read-only). HMI tidak mengirim perintah
// aktuasi (RESUME/PAUSE/RESET); aktuasi hanya dari tombol fisik Edge OEE.

import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { MqttEdgeTabContext } from '../tabShared';

interface KontrolTabProps {
  ctx: MqttEdgeTabContext;
}

export const KontrolTab: React.FC<KontrolTabProps> = ({ ctx }) => {
  const { fsmLabel, isDark, skins } = ctx;
  const { panel, label, value } = skins;

  const cards = [
    { icon: <Play className="w-5 h-5 text-emerald-500 mb-2" />, title: 'RESUME', fsm: 'FSM → RUNNING', desc: 'Lanjutkan timer siklus & akumulasi run-time.', cls: isDark ? 'bg-emerald-950/20 border-emerald-900' : 'bg-emerald-50/50 border-emerald-200' },
    { icon: <Pause className="w-5 h-5 text-rose-500 mb-2" />, title: 'PAUSE', fsm: 'FSM → UNPLANNED_DT', desc: 'Hentikan siklus, mulai hitung downtime.', cls: isDark ? 'bg-rose-950/20 border-rose-900' : 'bg-rose-50/50 border-rose-200' },
    { icon: <RotateCcw className="w-5 h-5 text-amber-500 mb-2" />, title: 'RESET_COUNTER', fsm: 'EVENT_BUTTON_RESET', desc: 'Nol-kan counter batch/shift.', cls: isDark ? 'bg-amber-950/20 border-amber-900' : 'bg-amber-50/50 border-amber-200' },
  ];

  return (
    <div className="space-y-4">
      <p className={`text-[11px] font-mono ${label}`}>
        Perintah aktuasi hanya dari tombol fisik Edge OEE — HMI tidak mengirim RESUME/PAUSE/RESET.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.title} className={`p-4 rounded-xl border ${c.cls}`}>
            {c.icon}
            <div className={`font-bold text-xs ${value}`}>{c.title}</div>
            <div className={`text-[10px] font-mono mt-0.5 ${label}`}>{c.fsm}</div>
            <p className={`text-[11px] mt-1 ${label}`}>{c.desc}</p>
          </div>
        ))}
      </div>
      <div className={`p-4 rounded-xl border ${panel}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${value}`}>Alur FSM edge (task_network.c)</h3>
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] font-bold">
          {['READY', 'RUNNING', 'PLANNED_DT', 'UNPLANNED_DT', 'BATCH_FINISHED'].map((s, i, arr) => (
            <React.Fragment key={s}>
              <span className={`px-2 py-1 rounded-lg border ${fsmLabel === s ? 'bg-blue-600 text-white border-blue-600' : isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}>{s}</span>
              {i < arr.length - 1 && <span className={label}>→</span>}
            </React.Fragment>
          ))}
        </div>
        <p className={`text-[11px] mt-2 ${label}`}>Payload perintah memakai pencocokan substring teks lalu diposting ke <code className="font-mono">hQueueSystemEvent[16]</code>. Posisi saat ini: <strong className="text-blue-500">{fsmLabel}</strong>.</p>
      </div>
    </div>
  );
};