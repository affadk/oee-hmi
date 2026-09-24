import React from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { QR_PRODUCT_CATALOG } from '../../../../../domain/entities/BatchQr';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface ProductStepProps {
  ctx: BatchQrModalContext;
}

export const ProductStep: React.FC<ProductStepProps> = ({ ctx }) => {
  const cardBase = cx(
    'p-3 rounded-xl border flex flex-col justify-between transition-all text-left w-full',
    tx(themeTokens.cardInset, ctx.isDark),
    tx(themeTokens.cardHover, ctx.isDark),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Pilih produk">
      {QR_PRODUCT_CATALOG.map((product) => {
        const selected = ctx.draft.product.code === product.code;
        const isActive = ctx.current.productName === product.productName;
        const scanning = ctx.scanningCode === product.code;
        const rate = product.cycleTimeSec > 0 ? Math.round(3600 / product.cycleTimeSec) : 0;

        return (
          <div key={product.code} className={cx(cardBase, selected && themeTokens.selectedCard)}>
            <div>
              <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, ctx.isDark))}>
                <span>{product.code}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{product.cycleTimeSec}s CT</span>
              </div>
              <strong className={cx('text-xs block mb-0.5', tx(themeTokens.textBody, ctx.isDark))}>
                {product.productName}
                {isActive && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                )}
              </strong>
              <div className={cx('text-[11px] font-mono mb-1', tx(themeTokens.textMuted, ctx.isDark))}>
                {product.workOrder} · Target {product.targetQty.toLocaleString()} pcs · {rate} pcs/h
              </div>
            </div>
            <button
              type="button"
              disabled={scanning}
              onClick={() => ctx.onScanProduct(product)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
              {scanning ? 'Memindai…' : selected ? 'Dipilih — Pindai Ulang' : 'Scan QR Produk Ini'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
