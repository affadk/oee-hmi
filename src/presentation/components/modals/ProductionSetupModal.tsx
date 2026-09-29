// /src/presentation/components/ProductionSetupModal.tsx
// Production Setup — work order lifecycle against the real backend (§C).
// Read   : GET /work-orders?status=PENDING, GET /work-orders/:wo_id/resolve (safe read, no MQTT).
// Mutate : POST /:wo_id/dispatch → SET_JOB_CONFIG ke edge (JWT + LAN, PIN-protected),
//          POST /:wo_id/complete, POST /:wo_id/cancel (ADMIN).

import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Play,
  CheckCheck,
  Ban,
  Eye,
} from 'lucide-react';
import type { WorkOrderListItem, WorkOrderResolveResult } from '../../../domain/entities/backend/WorkOrder';
import { useTheme } from '../../providers/ThemeProvider';

interface ProductionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendMode: boolean;
  machineId: string;
  deviceId: string | null;
  pendingWorkOrders: WorkOrderListItem[];
  workOrderError: string;
  preview: { woId: string; result: WorkOrderResolveResult } | null;
  busy: boolean;
  onLoadPending: () => Promise<void>;
  onPreview: (woId: string) => Promise<void>;
  onClearPreview: () => void;
  onOpenDetail: (woId: string) => Promise<void>;
  onDispatch: (woId: string, deviceId: string) => Promise<void>;
  onComplete: (woId: string, finalRejectCount: number) => Promise<void>;
  onCancel: (woId: string, reason?: string) => Promise<void>;
}

export const ProductionSetupModal: React.FC<ProductionSetupModalProps> = ({
  isOpen,
  onClose,
  isBackendMode,
  machineId,
  deviceId,
  pendingWorkOrders,
  workOrderError,
  preview,
  busy,
  onLoadPending,
  onPreview,
  onClearPreview,
  onOpenDetail,
  onDispatch,
  onComplete,
  onCancel,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [actionError, setActionError] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string>('');
  const [completeRejectCount, setCompleteRejectCount] = useState<number>(0);
  const [cancelReason, setCancelReason] = useState<string>('');

  if (!isOpen) return null;

  const card = isDark ? 'bg-[#0d1830] border-[#1c3358]' : 'bg-white border-slate-200';
  const panel = isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200';
  const label = isDark ? 'text-slate-400' : 'text-slate-500';
  const value = isDark ? 'text-slate-100' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-[#050811] border-[#22395f] text-white focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500';

  const guardError = workOrderError || actionError || (isBackendMode ? '' : 'Mode simulasi aktif — set VITE_USE_BACKEND=true untuk setup produksi via backend.');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Production Setup">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto border rounded-2xl shadow-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-base font-bold ${value}`}>Production Setup</h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
              {machineId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onLoadPending().catch(() => undefined)}
              disabled={!isBackendMode}
              className={`p-2 rounded-lg border disabled:opacity-40 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
              title="Muat ulang work order"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {guardError && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
            <span className="text-rose-500 font-semibold">{guardError}</span>
          </div>
        )}
        {actionNotice && (
          <div className={`mt-3 p-3 rounded-xl border text-xs font-semibold ${isDark ? 'border-emerald-700 bg-emerald-500/10 text-emerald-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
            {actionNotice}
          </div>
        )}

        {!deviceId && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
            <span className={isDark ? 'text-amber-200' : 'text-amber-800'}>
              Mesin ini belum terikat perangkat — lakukan binding di Device Configuration terlebih dahulu.
            </span>
          </div>
        )}

        {/* Work order pending */}
        <div className={`mt-4 p-4 rounded-xl border ${panel}`}>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${value}`}>Work Order Pending</h4>
          <div className="space-y-2">
            {pendingWorkOrders.length === 0 && (
              <p className={`text-xs ${label}`}>Tidak ada WO pending. Gunakan “Muat ulang” untuk memuat dari backend.</p>
            )}
            {pendingWorkOrders.map((wo) => (
              <div key={wo.woId} className={`p-3 rounded-xl border flex items-center justify-between gap-2 flex-wrap ${card}`}>
                <div className="min-w-0">
                  <strong className={`font-mono text-sm ${value}`}>{wo.woId}</strong>
                  <span className={`text-[11px] ml-2 ${label}`}>
                    {wo.productName ?? 'produk ?'} · target {wo.targetQty} pcs
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || !isBackendMode}
                    onClick={() => {
                      setActionError('');
                      void onOpenDetail(wo.woId).catch((err: unknown) =>
                        setActionError(err instanceof Error ? err.message : 'Detail gagal.'),
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    disabled={busy || !isBackendMode}
                    onClick={() => {
                      setActionError('');
                      setActionNotice('');
                      void onPreview(wo.woId).catch((err: unknown) =>
                        setActionError(err instanceof Error ? err.message : 'Resolve gagal.'),
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    type="button"
                    disabled={busy || !isBackendMode || !deviceId}
                    onClick={() => {
                      if (!deviceId) return;
                      setActionError('');
                      void onDispatch(wo.woId, deviceId)
                        .then(() => setActionNotice(`WO ${wo.woId} didispatch — SET_JOB_CONFIG dikirim ke ${deviceId}.`))
                        .catch((err: unknown) =>
                          setActionError(err instanceof Error ? err.message : 'Dispatch gagal.'),
                        );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview resolve */}
        {preview && (
          <div className={`mt-4 p-4 rounded-xl border ${panel}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolve {preview.woId}
              </h4>
              <button type="button" onClick={onClearPreview} className={`text-[11px] ${label}`}>
                tutup
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              {[
                ['Produk', `${preview.result.productName} (${preview.result.productId})`],
                ['Std cycle', `${preview.result.stdCycleTimeSec}s`],
                ['Operator', `${preview.result.operatorName} (${preview.result.operatorId})`],
                ['Target', `${preview.result.targetQty} pcs`],
                ['Shift', `${preview.result.shiftPlan.shiftStart} → ${preview.result.shiftPlan.shiftEnd}`],
                ['Break / operating', `${preview.result.shiftPlan.plannedBreakMin}m / ${Math.round(preview.result.shiftPlan.plannedOperatingSec / 60)}m`],
              ].map(([k, v]) => (
                <div key={k} className={`p-2 rounded-lg border ${card}`}>
                  <div className={label}>{k}</div>
                  <div className={`font-bold mt-0.5 ${value}`}>{v}</div>
                </div>
              ))}
            </div>
            <p className={`text-[11px] mt-2 ${label}`}>
              Dispatch mem-publish SET_JOB_CONFIG ke topik config device (QoS 1) dengan watchdog 15 detik di backend.
            </p>
          </div>
        )}

        {/* Complete / cancel WO aktif */}
        <div className={`mt-4 p-4 rounded-xl border ${panel}`}>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${value}`}>Tutup Work Order (Complete / Cancel)</h4>
          <p className={`text-[11px] mb-3 ${label}`}>
            Target WO mengikuti preview aktif: <strong className="font-mono">{preview?.woId ?? '— preview dulu —'}</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${label}`}>Final reject count (complete)</span>
              <input
                type="number"
                min={0}
                value={completeRejectCount}
                onChange={(e) => setCompleteRejectCount(Math.max(0, Number(e.target.value) || 0))}
                className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
              />
            </div>
            <div>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${label}`}>Alasan cancel (opsional)</span>
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Order dibatalkan customer"
                className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 mt-3">
            <button
              type="button"
              disabled={busy || !isBackendMode || !preview}
              onClick={() => {
                const woId = preview?.woId;
                if (!woId) return;
                setActionError('');
                void onComplete(woId, completeRejectCount)
                  .then(() => setActionNotice(`WO ${woId} selesai — final reject ${completeRejectCount}.`))
                  .catch((err: unknown) =>
                    setActionError(err instanceof Error ? err.message : 'Complete gagal.'),
                  );
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Complete
            </button>
            <button
              type="button"
              disabled={busy || !isBackendMode || !preview}
              onClick={() => {
                const woId = preview?.woId;
                if (!woId) return;
                setActionError('');
                void onCancel(woId, cancelReason.trim() || undefined)
                  .then(() => setActionNotice(`WO ${woId} dibatalkan (ABORTED).`))
                  .catch((err: unknown) =>
                    setActionError(err instanceof Error ? err.message : 'Cancel gagal.'),
                  );
              }}
              className="px-3 py-1.5 rounded-lg border border-rose-500/60 text-rose-500 hover:bg-rose-500/10 disabled:opacity-40 text-[11px] font-bold flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};