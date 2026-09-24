// /src/presentation/components/modals/BatchQrScannerModal/QrScanInput.tsx
// Input QR manual (paste/ketik) + tombol Parse & Isi — berlaku semua langkah.

import React from 'react';
import { QrCode, ScanLine } from 'lucide-react';
import type { BatchQrModalContext } from './BatchQrModalContext';
import { cx, themeTokens, tx } from '../../../styles/themeTokens';

interface QrScanInputProps {
  ctx: BatchQrModalContext;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  backendMode: boolean;
}

export const QrScanInput: React.FC<QrScanInputProps> = ({ ctx, placeholder, inputRef, backendMode }) => {
  return (
    <form
      className="flex gap-2 mb-3 shrink-0"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ctx.manualQr.trim()) return;
        if (backendMode) void ctx.submitWoForPreview(ctx.manualQr);
        else ctx.applyParsedQr(ctx.manualQr);
      }}
    >
      <div className="relative flex-1">
        <ScanLine
          className={cx('w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none', tx(themeTokens.textFaint, ctx.isDark))}
        />
        <input
          ref={inputRef}
          value={ctx.manualQr}
          onChange={(e) => ctx.setManualQr(e.target.value)}
          placeholder={placeholder}
          aria-label="Tempel atau ketik kode QR"
          spellCheck={false}
          autoComplete="off"
          className={cx(
            'w-full pl-8 pr-3 py-2 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
            tx(themeTokens.input, ctx.isDark),
          )}
        />
      </div>
      <button
        type="submit"
        disabled={!ctx.manualQr.trim()}
        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Parse & Isi</span>
        <span className="sm:hidden">Parse</span>
      </button>
    </form>
  );
};
