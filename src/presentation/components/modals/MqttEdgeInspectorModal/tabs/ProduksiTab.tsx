// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/ProduksiTab.tsx
// Tab Produksi — work order & produk, operator & shift, preview payload SET_JOB_CONFIG.

import React from 'react';
import { ShieldCheck, Clock, Copy, Check, Send, AlertTriangle } from 'lucide-react';
import type { MqttEdgeTabContext } from '../tabShared';
import { Field, TextInput, fmtDur } from '../tabShared';

interface ProduksiTabProps {
  ctx: MqttEdgeTabContext;
  wo: string;
  setWo: (v: string) => void;
  productId: string;
  setProductId: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  operatorId: string;
  setOperatorId: (v: string) => void;
  operatorName: string;
  setOperatorName: (v: string) => void;
  stdCycle: number;
  setStdCycle: (v: number) => void;
  targetQty: number;
  setTargetQty: (v: number) => void;
  shiftStart: string;
  setShiftStart: (v: string) => void;
  shiftEnd: string;
  setShiftEnd: (v: string) => void;
  breakMin: number;
  setBreakMin: (v: number) => void;
  plannedOperatingSec: number;
  jobPayload: string;
  jobDirty: boolean;
  jobValid: boolean;
  copied: boolean;
  handleCopy: (text: string) => void;
  publishJob: () => void;
  onResetDraft: () => void;
}

export const ProduksiTab: React.FC<ProduksiTabProps> = ({
  ctx,
  wo,
  setWo,
  productId,
  setProductId,
  productName,
  setProductName,
  operatorId,
  setOperatorId,
  operatorName,
  setOperatorName,
  stdCycle,
  setStdCycle,
  targetQty,
  setTargetQty,
  shiftStart,
  setShiftStart,
  shiftEnd,
  setShiftEnd,
  breakMin,
  setBreakMin,
  plannedOperatingSec,
  jobPayload,
  jobDirty,
  jobValid,
  copied,
  handleCopy,
  publishJob,
  onResetDraft,
}) => {
  const { machine, t, topicPrefix, isDark, skins } = ctx;
  const { card, panel, label, value, inputCls } = skins;

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border flex items-start gap-2.5 ${jobDirty ? (isDark ? 'bg-amber-950/40 border-amber-800' : 'bg-amber-50 border-amber-300') : panel}`}>
        <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${jobDirty ? 'text-amber-500' : 'text-emerald-500'}`} />
        <div className="text-xs">
          <div className={`font-bold ${value}`}>{jobDirty ? 'Ada perubahan belum dipublish ke edge' : 'Edge sinkron dengan job aktif'}</div>
          <p className={label}>Publish menulis 8 parameter ke <code className="font-mono">/cfg/job.bin</code> + CRC32, lalu edge menjawab di <code className="font-mono">{topicPrefix}/ack</code> dengan transaction_id yang sama.</p>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${card}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${value}`}>Work order & produk</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field labelText="Work Order *" labelCls={label} node={<TextInput val={wo} set={setWo} extra="Contoh: WO-2026-0920-01" inputCls={inputCls} />} />
          <Field labelText="Target qty (pcs) *" labelCls={label} node={<TextInput val={targetQty} set={setTargetQty} type="number" inputCls={inputCls} />} hint={`Planned operating ${fmtDur(plannedOperatingSec)} → takt ≈ ${(plannedOperatingSec / Math.max(1, Number(targetQty))).toFixed(1)}s/pcs`} />
          <Field labelText="Product ID" labelCls={label} node={<TextInput val={productId} set={setProductId} inputCls={inputCls} />} />
          <Field labelText="Nama produk *" labelCls={label} node={<TextInput val={productName} set={setProductName} inputCls={inputCls} />} />
          <Field labelText="Std cycle time (detik) *" labelCls={label} node={<TextInput val={stdCycle} set={setStdCycle} type="number" inputCls={inputCls} />} hint={`Ideal ${machine.idealCycleTimeSec}s · aktual ${(t.cyc / 100).toFixed(2)}s`} />
          <Field labelText="Estimasi rate" labelCls={label} node={<input value={`${Math.round(3600 / Math.max(0.1, Number(stdCycle)))} pcs/jam`} readOnly className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono opacity-70 ${inputCls}`} />} hint="3600 / std_cycle_time." />
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${card}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${value}`}><Clock className="w-4 h-4 text-purple-500" /> Operator & shift</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field labelText="Operator ID" labelCls={label} node={<TextInput val={operatorId} set={setOperatorId} inputCls={inputCls} />} />
          <Field labelText="Nama operator" labelCls={label} node={<TextInput val={operatorName} set={setOperatorName} inputCls={inputCls} />} />
          <Field labelText="Istirahat terjadwal (mnt)" labelCls={label} node={<TextInput val={breakMin} set={setBreakMin} type="number" inputCls={inputCls} />} />
          <Field labelText="Shift mulai" labelCls={label} node={<TextInput val={shiftStart} set={setShiftStart} inputCls={inputCls} />} />
          <Field labelText="Shift selesai" labelCls={label} node={<TextInput val={shiftEnd} set={setShiftEnd} inputCls={inputCls} />} />
          <Field labelText="Operating (auto)" labelCls={label} node={<input value={fmtDur(plannedOperatingSec)} readOnly className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono opacity-70 ${inputCls}`} />} />
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${panel}`}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${value}`}>Preview payload SET_JOB_CONFIG</h3>
          <button type="button" onClick={() => handleCopy(jobPayload)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${isDark ? 'border-blue-800 text-blue-300 hover:bg-blue-950' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}`}>
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} {copied ? 'Disalin' : 'Salin JSON'}
          </button>
        </div>
        <pre className={`p-3 rounded-xl border font-mono text-[11px] leading-relaxed overflow-x-auto ${isDark ? 'bg-[#050811] border-slate-800 text-emerald-300' : 'bg-white border-slate-200 text-emerald-800'}`}>{jobPayload}</pre>
        {!jobValid && <p className="text-[11px] text-rose-500 font-semibold mt-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Lengkapi WO, produk, target &gt; 0, dan cycle &gt; 0.</p>}
        <div className="flex justify-end gap-2 mt-3">
          <button type="button"
            onClick={onResetDraft}
            className={`px-4 py-2 rounded-lg border text-xs font-bold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
          >
            Reset
          </button>
          <button type="button" onClick={publishJob} disabled={!jobValid} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Publish & tunggu ACK
          </button>
        </div>
      </div>
    </div>
  );
};
