// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/KontrolTab.tsx
// Tab Kontrol — kartu perintah FSM (RESUME/PAUSE/RESET) + alur FSM edge.

import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { MqttEdgeTabContext } from '../tabShared';

interface KontrolTabProps {
  ctx: MqttEdgeTabContext;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
}

export const KontrolTab: React.FC<KontrolTabProps> = ({ ctx, confirmReset, setConfirmReset }) => {
  const { fsmLabel, sendCmd, isDark, skins } = ctx;
  const { panel, label, value } = skins;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button type="button" onClick={() => sendCmd('RESUME')} className={`p-4 rounded-xl border text-left transition-all ${isDark ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800' : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300'}`}>
          <Play className="w-5 h-5 text-emerald-500 mb-2" />
          <div className={`font-bold text-xs ${value}`}>RESUME</div>
          <div className={`text-[10px] font-mono mt-0.5 ${label}`}>FSM → RUNNING</div>
          <p className={`text-[11px] mt-1 ${label}`}>Lanjutkan timer siklus & akumulasi run-time.</p>
        </button>
        <button type="button" onClick={() => sendCmd('PAUSE')} className={`p-4 rounded-xl border text-left transition-all ${isDark ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800' : 'bg-rose-50 hover:bg-rose-100 border-rose-300'}`}>
          <Pause className="w-5 h-5 text-rose-500 mb-2" />
          <div className={`font-bold text-xs ${value}`}>PAUSE</div>
          <div className={`text-[10px] font-mono mt-0.5 ${label}`}>FSM → UNPLANNED_DT</div>
          <p className={`text-[11px] mt-1 ${label}`}>Hentikan siklus, mulai hitung downtime.</p>
        </button>
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-950/30 border-amber-800' : 'bg-amber-50 border-amber-300'}`}>
          <RotateCcw className="w-5 h-5 text-amber-500 mb-2" />
          <div className={`font-bold text-xs ${value}`}>RESET_COUNTER</div>
          <div className={`text-[10px] font-mono mt-0.5 ${label}`}>EVENT_BUTTON_RESET</div>
          <label className="flex items-center gap-1.5 mt-2 text-[11px] cursor-pointer">
            <input type="checkbox" checked={confirmReset} onChange={(e) => setConfirmReset(e.target.checked)} className="w-3.5 h-3.5 accent-amber-600" />
            <span className={label}>Saya paham counter dinolkan</span>
          </label>
          <button type="button" onClick={() => confirmReset && sendCmd('RESET_COUNTER')} disabled={!confirmReset} className="mt-2 w-full px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-[11px] font-bold">
            Kirim reset
          </button>
        </div>
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
