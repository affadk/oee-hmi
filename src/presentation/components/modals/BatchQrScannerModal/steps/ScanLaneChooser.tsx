// /src/presentation/components/modals/BatchQrScannerModal/steps/ScanLaneChooser.tsx
// Unit 004 (FR-001, NFR-001/002): chooser 2 jalur scan backend-mode.
// Dua kartu besar fokusabel keyboard — operator memilih jalur sebelum
// kamera/input aktif. Presentational (tanpa IO); reuse themeTokens.
// START logging = tombol fisik di Edge OEE; HMI hanya konfigurasi edge.

import React from 'react';
import { Layers, QrCode, ArrowRight } from 'lucide-react';
import type { BatchQrModalContext } from '../BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../../styles/themeTokens';

interface ScanLaneChooserProps {
  ctx: BatchQrModalContext;
  onPickZone: () => void;
  onPickWo: () => void;
}

export const START_EDGE_HINT =
  'HMI hanya mengonfigurasi edge device. START logging = tekan tombol fisik di Edge OEE setelah WO ACTIVE.';

export const ScanLaneChooser: React.FC<ScanLaneChooserProps> = ({ ctx, onPickZone, onPickWo }) => {
  const base = cx(
    'group flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all w-full cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-blue-500',
    tx(themeTokens.cardInset, ctx.isDark),
    tx(themeTokens.cardHover, ctx.isDark),
  );

  return (
    <div className="space-y-3 mb-2">
      <p className={cx('text-xs', tx(themeTokens.textMuted, ctx.isDark))}>{START_EDGE_HINT}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Pilih jalur konfigurasi edge">
        <button type="button" onClick={onPickZone} className={base} aria-label="Jalur A — 4 QR Bertahap">
          <div className="flex items-center gap-2 w-full">
            <span className="p-2 rounded-lg bg-blue-600/20 text-blue-500 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <span className={cx('text-sm font-bold', tx(themeTokens.textStrong, ctx.isDark))}>
              Jalur A — 4 QR Bertahap
            </span>
            <ArrowRight className={cx('w-4 h-4 ml-auto opacity-60 group-hover:opacity-100', tx(themeTokens.textMuted, ctx.isDark))} />
          </div>
          <span className={cx('text-[11px]', tx(themeTokens.textSecondary, ctx.isDark))}>
            Scan 4 badge fisik berurutan: produk → mesin → operator → shift. Membuat WO baru lalu mengonfigurasi edge.
          </span>
        </button>

        <button type="button" onClick={onPickWo} className={base} aria-label="Jalur B — Scan WO Existing">
          <div className="flex items-center gap-2 w-full">
            <span className="p-2 rounded-lg bg-emerald-600/20 text-emerald-500 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </span>
            <span className={cx('text-sm font-bold', tx(themeTokens.textStrong, ctx.isDark))}>
              Jalur B — Scan WO Existing
            </span>
            <ArrowRight className={cx('w-4 h-4 ml-auto opacity-60 group-hover:opacity-100', tx(themeTokens.textMuted, ctx.isDark))} />
          </div>
          <span className={cx('text-[11px]', tx(themeTokens.textSecondary, ctx.isDark))}>
            Scan/tempel QR WO yang sudah dibuat admin → pratinjau → konfigurasi edge dari WO tersimpan.
          </span>
        </button>
      </div>
    </div>
  );
};