// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/TelemetriTab.tsx
// Tab Telemetri — frame JSON live (compact/pretty) + tabel decoding field.

import React from 'react';
import { Copy, Check } from 'lucide-react';
import type { MqttEdgeTabContext } from '../tabShared';
import { yesNoWord } from '../../../../utils/statusWords';
import { fmtDur } from '../tabShared';

interface TelemetriTabProps {
  ctx: MqttEdgeTabContext;
  isPretty: boolean;
  setIsPretty: (v: boolean) => void;
  copied: boolean;
  handleCopy: (text: string) => void;
  wireTelemetry: string;
  prettyTelemetry: string;
}

export const TelemetriTab: React.FC<TelemetriTabProps> = ({
  ctx,
  isPretty,
  setIsPretty,
  copied,
  handleCopy,
  wireTelemetry,
  prettyTelemetry,
}) => {
  const { t, fsmLabel, topicPrefix, qos, isDark, skins } = ctx;
  const { label, value } = skins;

  const rows: Array<[string, string, string, string]> = [
    ['ts', String(t.ts), 'epoch (s)', new Date(t.ts * 1000).toLocaleString('id-ID')],
    ['st', `${t.st} (${fsmLabel})`, 'enum 0..5', 'Status FSM edge'],
    ['tot / rej', `${t.tot} / ${t.rej}`, 'pcs (u32)', `good ≈ ${t.tot - t.rej}`],
    ['cyc', String(t.cyc), '×10ms', `siklus ${(t.cyc / 100).toFixed(2)}s`],
    ['oee / a / p / q', `${t.oee}/${t.a}/${t.p}/${t.q}`, '×100 %', `${(t.oee / 100).toFixed(2)} / ${(t.a / 100).toFixed(1)} / ${(t.p / 100).toFixed(1)} / ${(t.q / 100).toFixed(1)}`],
    ['run / dt', `${t.run}s / ${t.dt}s`, 'detik', `${fmtDur(t.run)} / ${fmtDur(t.dt)}`],
    ['alm / rpm / tmp', `${t.alm} / ${t.rpm} / ${t.tmp}`, 'code/rpm/×0.1°C', t.alm === 0 ? 'normal' : `alarm ${t.alm}`],
    ['di', `0x${t.di.toString(16).toUpperCase()}`, 'bitmask PC0..5', 'input digital'],
    ['is_buffered', yesNoWord(t.is_buffered), 'bool', t.is_buffered ? 'data tertunda (drain FIFO)' : 'aliran langsung (live stream)'],
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className={`font-mono ${label}`}>Topik <span className="text-blue-500 font-bold">{topicPrefix}/telemetry</span> · QoS {qos} · 1s</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsPretty(!isPretty)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}>
            {isPretty ? 'Wire compact' : 'Pretty JSON'}
          </button>
          <button type="button" onClick={() => handleCopy(isPretty ? prettyTelemetry : wireTelemetry)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${isDark ? 'border-blue-800 text-blue-300' : 'border-blue-300 text-blue-700'}`}>
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} {copied ? 'Disalin' : 'Salin frame'}
          </button>
        </div>
      </div>
      <div className={`p-3.5 rounded-xl border font-mono text-[11px] leading-relaxed overflow-x-auto ${isDark ? 'bg-[#050811] border-slate-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-emerald-300'}`}>
        <pre>{isPretty ? prettyTelemetry : wireTelemetry}</pre>
      </div>
      <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-[#1c3358]' : 'border-slate-200'}`}>
        <table className="w-full text-left font-mono text-[11px]">
          <thead className={`border-b ${isDark ? 'bg-[#080e1c] text-slate-400 border-[#1c3358]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            <tr><th className="p-2 pl-3">Field</th><th className="p-2">Nilai live</th><th className="p-2">Skala</th><th className="p-2 hidden sm:table-cell">Makna</th></tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#1c3358]/60' : 'divide-slate-200'}`}>
            {rows.map(([f, v, s, m]) => (
              <tr key={f}>
                <td className="p-2 pl-3 text-sky-500 font-bold">{f}</td>
                <td className={`p-2 font-bold ${value}`}>{v}</td>
                <td className={`p-2 ${label}`}>{s}</td>
                <td className={`p-2 hidden sm:table-cell ${label}`}>{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
