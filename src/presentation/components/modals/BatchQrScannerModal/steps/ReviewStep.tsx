import React from 'react';
import { CheckCircle2, MonitorSmartphone } from 'lucide-react';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface ReviewStepProps {
  ctx: BatchQrModalContext;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ ctx }) => {
  const { current, draft, allMachines } = ctx;

  const rows = [
    {
      label: '1. Mesin & Line',
      old: `${current.machineName}`,
      next: allMachines.find((m) => m.id === draft.machineId)?.name ?? draft.machineId,
    },
    {
      label: '2. Produk / WO / CT',
      old: `${current.productName} · ${current.workOrder} · ${current.cycleTimeSec}s`,
      next: `${draft.product?.productName ?? '—'} · ${draft.product?.workOrder || '—'} · ${draft.product?.cycleTimeSec ?? '—'}s`,
    },
    {
      label: 'Target Qty / Rate',
      old: `${current.targetQty.toLocaleString()} pcs`,
      next: `${(draft.product?.targetQty ?? 0).toLocaleString()} pcs · ${ctx.targetRate} pcs/h`,
    },
    {
      label: '3. Operator',
      old: current.operatorDisplay,
      next: ctx.draftOperatorDisplay,
    },
    {
      label: '4. Shift / Istirahat',
      old: `${current.shiftLabel} (${current.breakLabel})`,
      next: `${ctx.draftShiftLabel} (${draft.schedule ? `${draft.schedule.breakStart}-${draft.schedule.breakEnd}, ${draft.schedule.breakMin}m` : '—'})`,
    },
  ];

  return (
    <div className={cx('rounded-xl border overflow-hidden', tx(themeTokens.borderSoft, ctx.isDark))}>
      <table className="w-full text-xs">
        <thead>
          <tr className={cx('font-mono uppercase text-[10px] tracking-wider', ctx.isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500')}>
            <th className="text-left px-3 py-2 font-semibold">Identitas</th>
            <th className="text-left px-3 py-2 font-semibold">Aktif Sekarang</th>
            <th className="text-left px-3 py-2 font-semibold">Hasil Scan (Draft)</th>
          </tr>
        </thead>
        <tbody className={cx('divide-y', ctx.isDark ? 'divide-slate-800' : 'divide-slate-100')}>
          {rows.map((row) => {
            const isChanged = row.old !== row.next;
            return (
              <tr key={row.label} className={isChanged ? (ctx.isDark ? 'bg-amber-500/5' : 'bg-amber-50/60') : undefined}>
                <td className={cx('px-3 py-2 font-semibold whitespace-nowrap', tx(themeTokens.textMuted, ctx.isDark))}>{row.label}</td>
                <td className={cx('px-3 py-2 font-mono', tx(themeTokens.textSecondary, ctx.isDark))}>{row.old}</td>
                <td className="px-3 py-2 font-mono font-semibold">
                  <span className={isChanged ? 'text-amber-600 dark:text-amber-400' : tx(themeTokens.textBody, ctx.isDark)}>
                    {row.next}
                  </span>
                  {isChanged && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-px rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      berubah
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!ctx.changed && (
        <p className={cx('px-3 py-2 text-xs flex items-center gap-1.5', tx(themeTokens.textMuted, ctx.isDark))}>
          <MonitorSmartphone className="w-3.5 h-3.5" />
          Draft sama dengan konfigurasi aktif — tidak ada yang perlu diterapkan.
        </p>
      )}
      {ctx.applied && (
        <p className="px-3 py-2 text-xs flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Batch diterapkan — WO {draft.product?.workOrder || '—'} · {draft.product?.productName ?? '—'} · {ctx.draftOperatorDisplay}.
        </p>
      )}
    </div>
  );
};
