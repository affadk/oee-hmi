// /src/presentation/pages/overview/components/panels/FleetCardsPanel.tsx
// Unit 002 FR-006: kartu fleet (station surface) — filter live-state sisi klien.
// RUNNING only, klik → selectMachine → live view eksisting. Kiosk/andon: null.
// LAYER RULES: presentation — receives machines via props, no IO.

import React from 'react';
import { Activity, CircleDot } from 'lucide-react';
import type { MachineConfig } from '../../../../../domain/entities/Machine';
import { cx } from '../../../../styles/themeTokens';

interface FleetCardsPanelProps {
  machines: MachineConfig[];
  currentMachineId: string;
  onSelectMachine: (machineId: string) => void;
  isDark: boolean;
}

export const FleetCardsPanel: React.FC<FleetCardsPanelProps> = ({
  machines,
  currentMachineId,
  onSelectMachine,
  isDark,
}) => {
  const running = machines.filter((m) => m.status === 'RUNNING');
  if (running.length === 0) return null;

  return (
    <section
      id="fleet-cards-panel"
      aria-label="Mesin berjalan (RUNNING)"
      className={`fixed top-3 left-3 z-40 w-64 max-h-[70vh] overflow-y-auto rounded-xl border p-2.5 shadow-xl backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#0b1528]/95 border-[#1e3a5f] text-slate-200' : 'bg-white/95 border-slate-300 text-slate-800'
      }`}
    >
      <h2 className={`text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
        <Activity className="w-3.5 h-3.5" />
        Mesin berjalan · {running.length}
      </h2>
      <ul className="mt-2 space-y-1.5">
        {running.map((m) => {
          const oeePct = m.telemetry?.oee != null ? Math.round(m.telemetry.oee) : null;
          const active = m.id === currentMachineId;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelectMachine(m.id)}
                aria-pressed={active}
                className={cx(
                  'w-full text-left rounded-lg border px-2.5 py-2 text-xs transition-colors cursor-pointer',
                  active
                    ? 'bg-emerald-600/20 border-emerald-500/40'
                    : isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-1.5 min-w-0">
                    <CircleDot className="w-3 h-3 shrink-0 text-emerald-500" />
                    <span className="truncate">{m.name}</span>
                  </span>
                  {oeePct !== null && (
                    <span className={`font-mono font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {oeePct}%
                    </span>
                  )}
                </span>
                <span className={`mt-1 block font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {m.jobConfig.productName || m.currentProduct || '—'} · total {m.totalCount.toLocaleString()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};