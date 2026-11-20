// /src/presentation/components/modals/BatchQrScannerModal/steps/BackendReviewStep.tsx
// Unit 003 (FR-005, AC-010): REVIEW backend-mode =
//   Jalur A (draft zona): PANEL KONFIRMASI konfigurasi 4 zona hasil scan —
//     nilai persis yang akan dikirim; initiate hanya setelah konfirmasi eksplisit.
//   Jalur B (scannedWo): preview resolve WO existing → lanjut Setup Produksi.

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import type { WorkOrderResolveResult } from '../../../../../domain/entities/backend/WorkOrder';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface BackendReviewStepProps {
  ctx: BatchQrModalContext;
  workOrderPreview: { woId: string; result: WorkOrderResolveResult } | null;
}

export const BackendReviewStep: React.FC<BackendReviewStepProps> = ({ ctx, workOrderPreview }) => {
  const { draft } = ctx;

  // Jalur A: panel konfirmasi konfigurasi 4 zona (nilai badge, bukan sintesis).
  if (!ctx.scannedWo) {
    const targetQty = draft.schedule?.targetQty ?? draft.product?.targetQty ?? 0;
    const rows: Array<[string, string]> = [
      ['Produk (PID)', draft.product ? `${draft.product.productId} · ${draft.product.productName}` : '— belum discan —'],
      ['Cycle time (CT)', draft.product ? `${draft.product.cycleTimeSec}s` : '—'],
      ['Mesin (MID/MCH)', draft.machineId ? `${draft.machineId} · ${draft.machineName ?? ctx.machine.name}` : '— belum discan —'],
      ['Line (LINE)', draft.machineLine || '—'],
      ['Operator (OID/OP)', draft.operator ? `${draft.operator.operatorId} · ${draft.operator.operatorName}` : '— belum discan —'],
      ['Shift (SID)', draft.schedule ? draft.schedule.shiftId : '— belum discan —'],
      ['Tanggal (DATE)', draft.schedule?.shiftDate ?? '—'],
      ['Window (START/END)', draft.schedule ? `${draft.schedule.shiftStart} - ${draft.schedule.shiftEnd}` : '—'],
      ['Istirahat (BREAK)', draft.schedule ? `${draft.schedule.breakMin}m` : '—'],
      ['Target (TARGET)', draft.schedule ? `${targetQty.toLocaleString()} pcs` : '—'],
    ];
    return (
      <div className={cx('rounded-xl border overflow-hidden p-3 space-y-2', tx(themeTokens.borderSoft, ctx.isDark))}>
        <p className={cx('text-xs font-semibold', tx(themeTokens.textBody, ctx.isDark))}>
          Konfirmasi konfigurasi 4 zona {ctx.draftComplete ? '(lengkap)' : '(belum lengkap)'}
        </p>
        <dl className="grid grid-cols-2 gap-2 text-xs font-mono">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className={cx('text-[10px] uppercase tracking-wide', tx(themeTokens.textFaint, ctx.isDark))}>{k}</dt>
              <dd className={cx('font-semibold', tx(themeTokens.textBody, ctx.isDark))}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className={cx('text-[11px]', tx(themeTokens.textMuted, ctx.isDark))}>
          Tombol <strong>Konfirmasi &amp; Konfigurasi Mesin</strong> di bawah memvalidasi 4 zona ke backend,
          membuat WO baru, lalu mengirim SET_JOB_CONFIG ke edge device. Pastikan nilai badge sesuai sebelum lanjut.
        </p>
      </div>
    );
  }

  // Jalur B: preview WO existing hasil resolve.
  return (
    <div className={cx('rounded-xl border overflow-hidden p-3 space-y-2', tx(themeTokens.borderSoft, ctx.isDark))}>
      <p className={cx('text-xs font-mono', tx(themeTokens.textSecondary, ctx.isDark))}>
        WO pindaian: <strong className={tx(themeTokens.textBody, ctx.isDark)}>{ctx.scannedWo ?? '—'}</strong>
      </p>
      {ctx.resolvingWo && (
        <p className="text-xs flex items-center gap-1.5 opacity-80" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Memuat data WO dari backend…
        </p>
      )}
      {!ctx.resolvingWo && workOrderPreview && workOrderPreview.woId === ctx.scannedWo && (
        <dl className="grid grid-cols-2 gap-2 text-xs font-mono">
          {[
            ['Produk', workOrderPreview.result.productName],
            ['Target', `${workOrderPreview.result.targetQty.toLocaleString()} pcs`],
            ['Operator', workOrderPreview.result.operatorName || '—'],
            ['Shift', `${workOrderPreview.result.shiftPlan.shiftStart} - ${workOrderPreview.result.shiftPlan.shiftEnd}`],
            ['Cycle', `${workOrderPreview.result.stdCycleTimeSec}s`],
            ['Status', workOrderPreview.result.status],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className={cx('text-[10px] uppercase tracking-wide', tx(themeTokens.textFaint, ctx.isDark))}>{k}</dt>
              <dd className={cx('font-semibold', tx(themeTokens.textBody, ctx.isDark))}>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {!ctx.resolvingWo && !workOrderPreview && (
        <p className={cx('text-xs', tx(themeTokens.textMuted, ctx.isDark))}>
          Belum ada data backend — pindai ulang atau cek kode WO.
        </p>
      )}
    </div>
  );
};
