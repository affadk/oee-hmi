// /src/presentation/components/modals/BatchQrScannerModal/steps/BackendZoneStep.tsx
// Unit 003 (FR-002/003/004): langkah zona backend-mode — status scan badge +
// pilih master nyata (produk/operator/mesin terikat). Tanpa katalog demo.
// Badge zona wajib kamera; shift hanya dari badge fisik (tanpa picker master).

import React from 'react';
import { Camera, CheckCircle2, QrCode } from 'lucide-react';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface BackendZoneStepProps {
  ctx: BatchQrModalContext;
}

const ZONE_META = {
  PRODUCT: { title: 'Zona 1 — Produk', badge: 'PID=..;CT=..;NAME=..' },
  MACHINE: { title: 'Zona 2 — Mesin & Line', badge: 'MID=..;MCH=..;LINE=..' },
  OPERATOR: { title: 'Zona 3 — Operator', badge: 'OID=..;OP=..' },
  SCHEDULE: { title: 'Zona 4 — Shift', badge: 'SID=..;DATE=..;START=..;END=..;BREAK=..;TARGET=..' },
} as const;

export const BackendZoneStep: React.FC<BackendZoneStepProps> = ({ ctx }) => {
  const { draft, step } = ctx;
  const zone = step === 'SCHEDULE' ? 'SCHEDULE' : step;
  const meta = ZONE_META[zone as keyof typeof ZONE_META] ?? ZONE_META.PRODUCT;

  const scanned =
    (step === 'PRODUCT' && Boolean(draft.product)) ||
    (step === 'MACHINE' && Boolean(draft.machineId)) ||
    (step === 'OPERATOR' && Boolean(draft.operator)) ||
    (step === 'SCHEDULE' && Boolean(draft.schedule));

  const cardBase = cx(
    'p-3 rounded-xl border flex flex-col justify-between transition-all text-left w-full',
    tx(themeTokens.cardInset, ctx.isDark),
    tx(themeTokens.cardHover, ctx.isDark),
  );
  const hint = cx('text-[11px] font-mono', tx(themeTokens.textMuted, ctx.isDark));

  return (
    <div className="space-y-2.5">
      <div className={cx('flex items-center justify-between gap-2 text-xs font-semibold', tx(themeTokens.textBody, ctx.isDark))}>
        <span>{meta.title}</span>
        {scanned ? (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> terisi
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-mono">
            <Camera className="w-3.5 h-3.5" /> belum discan
          </span>
        )}
      </div>
      <p className={hint}>Badge fisik: {meta.badge} — arahkan kamera ke badge.</p>

      {step === 'PRODUCT' && (
        <>
          {draft.product && (
            <div className={cx(cardBase, themeTokens.selectedCard)}>
              <div className="text-xs font-mono">
                <strong>{draft.product.productName}</strong>
                <span className="block opacity-80">{draft.product.productId} · CT {draft.product.cycleTimeSec}s</span>
              </div>
            </div>
          )}
          {(ctx.catalog?.products ?? []).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Produk master backend">
              {(ctx.catalog?.products ?? []).map((product) => {
                const selected = draft.product?.productId === product.productId;
                return (
                  <div key={product.productId} className={cx(cardBase, selected && themeTokens.selectedCard)}>
                    <div className="text-xs font-mono mb-1.5">
                      <span className="block opacity-70">{product.productId} · CT {product.stdCycleTimeSec}s</span>
                      <strong>{product.productName}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => ctx.onPickProduct(product)}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {selected ? 'Dipilih' : 'Pilih dari Master'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {step === 'MACHINE' && (
        <div className={cx(cardBase, draft.machineId === ctx.machine.id && themeTokens.selectedCard)}>
          <div className="text-xs font-mono mb-1.5">
            <strong>{ctx.machine.name}</strong>
            <span className="block opacity-80">
              MID {ctx.machine.id} · LINE {draft.machineId === ctx.machine.id ? (draft.machineLine || ctx.machine.line || '—') : (ctx.machine.line || '—')}
            </span>
            {draft.machineName && draft.machineId === ctx.machine.id && (
              <span className="block opacity-60">MCH badge: {draft.machineName}</span>
            )}
          </div>
          <button
            type="button"
            onClick={ctx.onPickBoundMachine}
            className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            {draft.machineId === ctx.machine.id ? 'Mesin Terikat Dipilih' : 'Gunakan Mesin Terikat (LINE master)'}
          </button>
          <p className={cx(hint, 'mt-1.5')}>Badge mesin MID ≠ mesin terikat akan ditolak. LINE master kosong → wajib badge mesin.</p>
        </div>
      )}

      {step === 'OPERATOR' && (
        <>
          {draft.operator && (
            <div className={cx(cardBase, themeTokens.selectedCard)}>
              <div className="text-xs font-mono">
                <strong>{draft.operator.operatorName}</strong>
                <span className="block opacity-80">{draft.operator.operatorId}</span>
              </div>
            </div>
          )}
          {(ctx.catalog?.operators ?? []).filter((op) => op.isActive).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Operator master backend">
              {(ctx.catalog?.operators ?? []).filter((op) => op.isActive).map((op) => {
                const selected = draft.operator?.operatorId === op.operatorId;
                return (
                  <div key={op.operatorId} className={cx(cardBase, selected && themeTokens.selectedCard)}>
                    <div className="text-xs font-mono mb-1.5">
                      <span className="block opacity-70">{op.operatorId}</span>
                      <strong>{op.operatorName}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => ctx.onPickOperator(op)}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                    >
                      {selected ? 'Dipilih' : 'Pilih dari Master'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {step === 'SCHEDULE' && (
        draft.schedule ? (
          <div className={cx(cardBase, themeTokens.selectedCard)}>
            <div className="text-xs font-mono space-y-0.5">
              <strong>{draft.schedule.shiftName} · {draft.schedule.shiftStart} - {draft.schedule.shiftEnd}</strong>
              <span className="block opacity-80">SID {draft.schedule.shiftId} · DATE {draft.schedule.shiftDate ?? '—'}</span>
              <span className="block opacity-80">BREAK {draft.schedule.breakMin}m · TARGET {(draft.schedule.targetQty ?? 0).toLocaleString()} pcs</span>
            </div>
          </div>
        ) : (
          <p className={hint}>Zona shift hanya dari badge fisik (DATE/window/BREAK/TARGET) — tanpa pilihan master. Scan badge shift via kamera.</p>
        )
      )}
    </div>
  );
};
