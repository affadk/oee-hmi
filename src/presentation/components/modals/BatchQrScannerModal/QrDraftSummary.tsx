// /src/presentation/components/modals/BatchQrScannerModal/QrDraftSummary.tsx
// Ringkasan draft aktif — 4 sel (mesin, part, operator, shift) dengan badge "baru".

import React from 'react';
import type { BatchQrModalContext } from './BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../styles/themeTokens';

interface QrDraftSummaryProps {
  ctx: BatchQrModalContext;
}

export const QrDraftSummary: React.FC<QrDraftSummaryProps> = ({ ctx }) => {
  const { draft, current, allMachines } = ctx;

  const cells = [
    {
      label: '1. Mesin',
      value: allMachines.find((m) => m.id === draft.machineId)?.name ?? draft.machineId,
      sub: allMachines.find((m) => m.id === draft.machineId)?.line ?? '',
      subClass: 'text-blue-500 dark:text-blue-400',
      dirty: draft.machineId !== current.machineId,
    },
    {
      label: '2. Part & Target',
      value: draft.product.productName,
      sub: `Target: ${draft.product.targetQty.toLocaleString()} pcs · CT ${draft.product.cycleTimeSec}s`,
      subClass: 'text-amber-600 dark:text-amber-400',
      dirty: draft.product.productName !== current.productName || draft.product.targetQty !== current.targetQty,
    },
    {
      label: '3. Operator',
      value: draft.operator.operatorName,
      sub: draft.operator.operatorId,
      subClass: 'text-emerald-600 dark:text-emerald-400',
      dirty: ctx.draftOperatorDisplay !== current.operatorDisplay,
    },
    {
      label: '4. Shift & Break',
      value: ctx.draftShiftLabel,
      sub: `${draft.schedule.breakStart}-${draft.schedule.breakEnd} (${draft.schedule.breakMin}m)`,
      subClass: 'text-purple-600 dark:text-purple-400',
      dirty: ctx.draftShiftLabel !== current.shiftLabel,
    },
  ];

  return (
    <div
      className={cx(
        'p-3 rounded-xl border mb-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono shrink-0',
        ctx.isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200',
      )}
    >
      {cells.map((cell) => (
        <div key={cell.label}>
          <span className={cx('text-[10px] block uppercase tracking-wide', tx(themeTokens.textFaint, ctx.isDark))}>
            {cell.label}
            {cell.dirty && <span className="ml-1 text-amber-600 dark:text-amber-400">•baru</span>}
          </span>
          <strong className={cx('block truncate text-xs', tx(themeTokens.textStrong, ctx.isDark))} title={cell.value}>
            {cell.value}
          </strong>
          <span className={cx('text-[10px]', cell.subClass)}>{cell.sub}</span>
        </div>
      ))}
    </div>
  );
};
