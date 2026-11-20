// /src/presentation/components/modals/AckStatusPanel.tsx
// Unit 003 (FR-005/006, GAP-F26): status tunggu ACK edge pasca initiate/dispatch.
// Jujur: WO PENDING sampai ACK SUCCESS — bukan klaim "aktif" pra-ACK.

import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { AckWaitState } from '../../../domain/entities/backend/WorkOrder';
import { cx } from '../../styles/themeTokens';

interface AckStatusPanelProps {
  ackWait: AckWaitState | null;
  /** WO yang sedang ditunggu (initiatedWo / woId dispatch). */
  woId: string | null;
  isDark: boolean;
}

export const AckStatusPanel: React.FC<AckStatusPanelProps> = ({ ackWait, woId, isDark }) => {
  if (!woId) return null;
  const status = ackWait && ackWait.woId === woId ? ackWait.status : 'WAITING';

  const base = 'rounded-lg border p-2.5 text-xs font-mono flex items-start gap-2';
  if (status === 'ACTIVE') {
    return (
      <p role="status" className={cx(base, isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700')}>
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>WO <strong>{woId}</strong> ACTIVE — konfigurasi diterima edge (ACK SUCCESS). Tekan START di mesin untuk mulai produksi.</span>
      </p>
    );
  }
  if (status === 'ABORTED') {
    return (
      <p role="alert" className={cx(base, isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-300 text-rose-700')}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>WO <strong>{woId}</strong> ABORTED — edge menolak konfigurasi (ACK error). Periksa edge, lalu coba lagi.</span>
      </p>
    );
  }
  if (status === 'TIMEOUT') {
    return (
      <p role="alert" className={cx(base, isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800')}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>WO <strong>{woId}</strong> belum di-ACK edge (TIMEOUT_UNACKNOWLEDGED). Periksa koneksi edge, lalu coba lagi — retry idempoten.</span>
      </p>
    );
  }
  return (
    <p role="status" className={cx(base, isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700')}>
      <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
      <span>WO <strong>{woId}</strong> dibuat &amp; di-dispatch — menunggu ACK edge (≤15 detik)…</span>
    </p>
  );
};
