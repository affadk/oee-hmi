// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/RingkasanTab.tsx
// Tab Ringkasan — status FSM, OEE live, counter, health, job aktif, aksi cepat.

import React from 'react';
import { Activity, PlugZap, Factory, HeartPulse, Radio } from 'lucide-react';
import type { MqttEdgeTabContext, TabKey } from '../tabShared';
import { fmtDur } from '../tabShared';

interface RingkasanTabProps {
  ctx: MqttEdgeTabContext;
  setActiveTab: (key: TabKey) => void;
}

export const RingkasanTab: React.FC<RingkasanTabProps> = ({ ctx, setActiveTab }) => {
  const { t, h, fsmLabel, skins } = ctx;
  const { card, label, value } = skins;

  const stats = [
    { icon: Activity, t: 'Status FSM', v: fsmLabel, s: `st=${t.st} · alm=${t.alm}`, c: t.st === 2 ? 'text-emerald-500' : t.st === 4 ? 'text-rose-500' : 'text-amber-500' },
    { icon: PlugZap, t: 'OEE Live (edge)', v: `${(t.oee / 100).toFixed(2)}%`, s: `A ${(t.a / 100).toFixed(1)} · P ${(t.p / 100).toFixed(1)} · Q ${(t.q / 100).toFixed(1)}`, c: 'text-violet-500' },
    { icon: Factory, t: 'Counter', v: `${t.tot.toLocaleString('id-ID')} pcs`, s: `reject ${t.rej} · cyc ${(t.cyc / 100).toFixed(2)}s`, c: 'text-sky-500' },
    { icon: HeartPulse, t: 'Edge Health', v: `${h.tasks_healthy}/${h.tasks_total}`, s: `heap ${(h.heap_free / 1024).toFixed(0)} KB · stale ${h.stale_count}`, c: h.stale_count ? 'text-amber-500' : 'text-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.t} className={`p-3.5 rounded-xl border ${card}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <s.icon className={`w-4 h-4 ${s.c}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>{s.t}</span>
            </div>
            <div className={`text-lg font-extrabold font-mono ${value}`}>{s.v}</div>
            <div className={`text-[11px] font-mono ${label}`}>{s.s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`p-4 rounded-xl border ${card}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${value}`}>Job aktif di edge</h3>
            <button type="button" onClick={() => setActiveTab('PRODUKSI')} className="text-[11px] font-bold text-purple-500 hover:underline">Ubah →</button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {[
              ['Work Order', ctx.machine.jobConfig?.workOrder],
              ['Produk', ctx.machine.jobConfig?.productName],
              ['Operator', `${ctx.machine.jobConfig?.operatorName} (${ctx.machine.jobConfig?.operatorId})`],
              ['Target', `${(ctx.machine.jobConfig?.targetQuantity ?? 0).toLocaleString('id-ID')} pcs`],
              ['Std cycle', `${ctx.machine.jobConfig?.standardCycleTimeSec ?? 0}s`],
              ['Shift', `${ctx.machine.jobConfig?.shiftStart ?? '—'}–${ctx.machine.jobConfig?.shiftEnd ?? '—'}`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${label}`}>{k}</div>
                <div className={`font-mono font-semibold truncate ${value}`} title={String(v)}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${card}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${value}`}>Aksi cepat</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveTab('TELEMETRI')} className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${ctx.isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}><Radio className="w-3.5 h-3.5" /> Lihat frame</button>
            <button type="button" onClick={() => setActiveTab('KESEHATAN')} className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${ctx.isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}><HeartPulse className="w-3.5 h-3.5" /> Diagnostik</button>
          </div>
          <p className={`mt-2.5 text-[11px] leading-relaxed ${label}`}>
            Run {fmtDur(t.run)} · Downtime {fmtDur(t.dt)} · Suhu {(t.tmp / 10).toFixed(1)}°C · RPM {t.rpm} · DI 0x{t.di.toString(16).toUpperCase().padStart(2, '0')}
          </p>
        </div>
      </div>
    </div>
  );
};
