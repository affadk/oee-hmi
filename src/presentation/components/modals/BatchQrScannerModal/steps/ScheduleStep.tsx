import React from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { QR_SCHEDULE_CATALOG } from '../../../../../domain/entities/BatchQr';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface ScheduleStepProps {
  ctx: BatchQrModalContext;
}

export const ScheduleStep: React.FC<ScheduleStepProps> = ({ ctx }) => {
  const cardBase = cx(
    'p-3 rounded-xl border flex flex-col justify-between transition-all text-left w-full',
    tx(themeTokens.cardInset, ctx.isDark),
    tx(themeTokens.cardHover, ctx.isDark),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Pilih jadwal shift">
      {QR_SCHEDULE_CATALOG.map((sch) => {
        const selected = ctx.draft.schedule.code === sch.code;
        const isActive = ctx.current.shiftLabel === `${sch.shiftStart} - ${sch.shiftEnd}`;
        const scanning = ctx.scanningCode === sch.code;

        return (
          <div key={sch.code} className={cx(cardBase, selected && themeTokens.selectedCard)}>
            <div>
              <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, ctx.isDark))}>
                <span>{sch.code}</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{sch.shiftName}</span>
              </div>
              <strong className={cx('text-xs block mb-1', tx(themeTokens.textBody, ctx.isDark))}>
                {sch.shiftStart} - {sch.shiftEnd}
                {isActive && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                )}
              </strong>
              <div className={cx('text-[11px] font-mono mb-2', tx(themeTokens.textMuted, ctx.isDark))}>
                Istirahat {sch.breakStart}-{sch.breakEnd} ({sch.breakMin}m)
              </div>
            </div>
            <button
              type="button"
              disabled={scanning}
              onClick={() => ctx.onScanSchedule(sch)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
              {scanning ? 'Memindai…' : 'Scan QR Shift Ini'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
