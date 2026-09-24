import React from 'react';
import { Loader2, QrCode } from 'lucide-react';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface MachineStepProps {
  ctx: BatchQrModalContext;
}

export const MachineStep: React.FC<MachineStepProps> = ({ ctx }) => {
  const cardBase = cx(
    'p-3 rounded-xl border flex flex-col justify-between transition-all text-left w-full',
    tx(themeTokens.cardInset, ctx.isDark),
    tx(themeTokens.cardHover, ctx.isDark),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Pilih mesin">
      {ctx.allMachines.map((m) => {
        const selected = ctx.draft.machineId === m.id;
        const isActive = ctx.current.machineId === m.id;
        const code = `QR-MC-${m.deviceId || m.id}`;
        const scanning = ctx.scanningCode === code;

        return (
          <div key={m.id} className={cx(cardBase, selected && themeTokens.selectedCard)}>
            <div>
              <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, ctx.isDark))}>
                <span>{code}</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{m.deviceId || m.id}</span>
              </div>
              <strong className={cx('text-xs block mb-0.5', tx(themeTokens.textBody, ctx.isDark))}>
                {m.name}
                {isActive && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                )}
              </strong>
              <div className={cx('text-[11px] mb-1 flex items-center gap-1.5', tx(themeTokens.textMuted, ctx.isDark))}>
                <span>{m.line || 'Production Line'}</span>
                <span
                  className={cx(
                    'inline-flex items-center gap-1 font-mono text-[10px]',
                    m.status === 'RUNNING' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  <span className={cx('w-1.5 h-1.5 rounded-full', m.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-rose-500')} />
                  {m.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={scanning}
              onClick={() => ctx.onScanMachine(m)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
              {scanning ? 'Memindai…' : selected ? 'Dipilih — Pindai Ulang' : 'Scan QR Mesin Ini'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
