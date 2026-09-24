import React from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { QR_OPERATOR_CATALOG } from '../../../../../domain/entities/BatchQr';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface OperatorStepProps {
  ctx: BatchQrModalContext;
}

export const OperatorStep: React.FC<OperatorStepProps> = ({ ctx }) => {
  const cardBase = cx(
    'p-3 rounded-xl border flex flex-col justify-between transition-all text-left w-full',
    tx(themeTokens.cardInset, ctx.isDark),
    tx(themeTokens.cardHover, ctx.isDark),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Pilih operator">
      {QR_OPERATOR_CATALOG.map((op) => {
        const selected = ctx.draft.operator.code === op.code;
        const isActive = ctx.current.operatorDisplay.includes(op.operatorName);
        const scanning = ctx.scanningCode === op.code;

        return (
          <div key={op.code} className={cx(cardBase, selected && themeTokens.selectedCard)}>
            <div>
              <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, ctx.isDark))}>
                <span>{op.code}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{op.operatorId}</span>
              </div>
              <strong className={cx('text-xs block mb-1', tx(themeTokens.textBody, ctx.isDark))}>
                {op.operatorName}
                {isActive && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                )}
              </strong>
              <div className={cx('text-[11px] mb-2', tx(themeTokens.textMuted, ctx.isDark))}>Shift Operator</div>
            </div>
            <button
              type="button"
              disabled={scanning}
              onClick={() => ctx.onScanOperator(op)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
              {scanning ? 'Memindai…' : 'Scan Badge Ini'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
