// /src/presentation/components/modals/BatchQrScannerModal/BatchQrStepper.tsx
// Wizard stepper — 5 langkah dengan status aktif/selesai + klik navigasi.

import React from 'react';
import { CheckCircle2, Layers, Cpu, UserCheck, Calendar, ClipboardCheck } from 'lucide-react';
import type { QrBatchStep } from '../../../../domain/entities/BatchQr';
import type { BatchQrModalContext } from './BatchQrModalContext';
import { cx } from '../../../styles/themeTokens';

const STEPS: Array<{ id: QrBatchStep; index: number; label: string; short: string }> = [
  { id: 'PRODUCT', index: 0, label: 'Produk & Cycle Time', short: 'Produk' },
  { id: 'MACHINE', index: 1, label: 'Mesin & Line', short: 'Mesin' },
  { id: 'OPERATOR', index: 2, label: 'Operator ID', short: 'Operator' },
  { id: 'SCHEDULE', index: 3, label: 'Jadwal Shift', short: 'Shift' },
  { id: 'REVIEW', index: 4, label: 'Review & Terapkan', short: 'Review' },
];

const STEP_ICONS = [Layers, Cpu, UserCheck, Calendar, ClipboardCheck] as const;

interface BatchQrStepperProps {
  ctx: BatchQrModalContext;
}

export const BatchQrStepper: React.FC<BatchQrStepperProps> = ({ ctx }) => {
  return (
    <ol className="flex items-center gap-1 mb-4 overflow-x-auto" aria-label="Langkah setup batch">
      {STEPS.map((s, i) => {
        const Icon = STEP_ICONS[i] ?? Layers;
        const isActive = s.id === ctx.step;
        const isDone =
          (s.id === 'PRODUCT' && ctx.stepIndex > 0) ||
          (s.id === 'MACHINE' && ctx.stepIndex > 1) ||
          (s.id === 'OPERATOR' && ctx.stepIndex > 2) ||
          (s.id === 'SCHEDULE' && ctx.stepIndex > 3);
        return (
          <li key={s.id} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className={cx('w-3 h-px mx-0.5', ctx.isDark ? 'bg-slate-700' : 'bg-slate-300')} aria-hidden="true" />}
            <button
              type="button"
              onClick={() => ctx.setStep(s.id)}
              aria-current={isActive ? 'step' : undefined}
              title={s.label}
              className={cx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : isDone
                    ? ctx.isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : ctx.isDark
                      ? 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                      : 'bg-transparent text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <span
                className={cx(
                  'w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0',
                  isActive ? 'bg-white/25 text-white' : isDone ? '' : ctx.isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600',
                )}
              >
                {isDone && !isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.short}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

export { STEPS };
