// /src/presentation/components/layouts/sub-components/FullscreenFooter.tsx
// Lower footer bar — machine metadata, planned/staffed time, stale telemetry indicator.

import React from 'react';
import { Radio } from 'lucide-react';

export interface FullscreenFooterProps {
  machineName: string;
  machineLine: string;
  connectionStatus: string | undefined;
  plannedProductionTimeMin: number;
  plannedDowntimeMinutes: number | undefined;
  isStale: boolean;
  staleAgeSec: number | null;
  useBackend?: boolean;
  onOpenMqttModal: () => void;
  isDark: boolean;
  formatStaffed: (totalMin: number) => string;
}

export const FullscreenFooter: React.FC<FullscreenFooterProps> = ({
  machineName,
  machineLine,
  connectionStatus,
  plannedProductionTimeMin,
  plannedDowntimeMinutes,
  isStale,
  staleAgeSec,
  useBackend,
  onOpenMqttModal,
  isDark,
  formatStaffed,
}) => {
  return (
    <footer
      className={`w-full px-[1.2vw] py-[0.8vh] border-t text-xs font-mono transition-colors shrink-0 overflow-hidden ${
        isDark ? 'bg-[#0d1728] border-slate-800 text-slate-400' : 'bg-[#e2e8f0] border-[#c4cbd5] text-slate-600'
      }`}
    >
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        {/* Left: machine metadata */}
        <div className="flex items-center gap-3">
          <span>Machine: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machineName}</strong></span>
          <span>Line: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machineLine}</strong></span>
          <span>Status: <strong className={connectionStatus === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}>{connectionStatus || '—'}</strong></span>
          {!useBackend && isStale && staleAgeSec !== null && staleAgeSec > 60 ? (
            <span
              role="status"
              title={`Telemetri terakhir ${staleAgeSec} dtk lalu — angka yang tampil mungkin basi`}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/40"
            >
              STALE {staleAgeSec}s
            </span>
          ) : null}
        </div>

        {/* Right: planned time + edge I/O link */}
        <div className="flex items-center gap-3">
          <span>Planned Time: <strong>{plannedProductionTimeMin}m</strong></span>
          <span>Staffed: <strong>{formatStaffed(plannedProductionTimeMin + (plannedDowntimeMinutes || 0))}</strong></span>
          {!useBackend && (
            <button
              type="button"
              onClick={onOpenMqttModal}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Radio className="w-3 h-3" />
              STM32H723 Edge I/O
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
