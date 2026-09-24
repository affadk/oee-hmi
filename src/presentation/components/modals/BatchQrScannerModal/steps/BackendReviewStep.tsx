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
  return (
    <div className={cx('rounded-xl border overflow-hidden p-3 space-y-2', tx(themeTokens.borderSoft, ctx.isDark))}>
      <p className={cx('text-xs font-mono', tx(themeTokens.textSecondary, ctx.isDark))}>
        WO pindaan: <strong className={tx(themeTokens.textBody, ctx.isDark)}>{ctx.scannedWo ?? '—'}</strong>
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
