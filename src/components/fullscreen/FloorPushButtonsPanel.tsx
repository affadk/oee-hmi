// /src/components/fullscreen/FloorPushButtonsPanel.tsx

import React, { useEffect, useState } from 'react';
import { Play, Square, PlusCircle, AlertOctagon, RotateCcw, Wrench, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { MachineConfig } from '../../types';

interface FloorPushButtonsPanelProps {
  machine: MachineConfig;
  onUpdateMachineStatus: (status: 'RUNNING' | 'DOWN' | 'IDLE') => Promise<void>;
  onLogReject: (reasonLabel: string, count: number) => Promise<void>;
  onDispatchMqttCommand: (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => Promise<void>;
}

export const FloorPushButtonsPanel: React.FC<FloorPushButtonsPanelProps> = ({
  machine,
  onUpdateMachineStatus,
  onLogReject,
  onDispatchMqttCommand,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [pendingGuard, setPendingGuard] = useState<'RESET' | 'SPARE' | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Tutup dialog guard dengan Escape
  useEffect(() => {
    if (!pendingGuard || isBusy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingGuard(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingGuard, isBusy]);

  const runAction = async (id: 'START' | 'STOP' | 'COUNTING' | 'REJECT' | 'RESET' | 'SPARE') => {
    setActiveBtn(id);
    setTimeout(() => setActiveBtn(null), 600);

    switch (id) {
      case 'START':
        await onUpdateMachineStatus('RUNNING');
        break;
      case 'STOP':
        await onUpdateMachineStatus('DOWN');
        break;
      case 'COUNTING':
        // Simulated edge pulse for counting (+1)
        break;
      case 'REJECT':
        await onLogReject('Manual Reject Button', 1);
        break;
      case 'RESET':
        await onDispatchMqttCommand('RESET_COUNTER');
        break;
      case 'SPARE':
        break;
    }
  };

  const triggerButton = async (id: 'START' | 'STOP' | 'COUNTING' | 'REJECT' | 'RESET' | 'SPARE') => {
    // RESET & SPARE berbahaya — wajib konfirmasi guard
    if (id === 'RESET' || id === 'SPARE') {
      setPendingGuard(id);
      return;
    }
    await runAction(id);
  };

  const confirmGuard = async () => {
    if (!pendingGuard) return;
    setIsBusy(true);
    try {
      await runAction(pendingGuard);
    } finally {
      setIsBusy(false);
      setPendingGuard(null);
    }
  };

  const buttons = [
    {
      id: 'START',
      label: 'START',
      sublabel: 'Mesin Running',
      pin: 'DI 0 · PIN 12',
      icon: Play,
      accent: 'emerald',
      activeColor: 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30',
      idleColor: isDark ? 'bg-[#132238] border-emerald-900/60 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-600' : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100',
      isEngaged: machine.status === 'RUNNING',
    },
    {
      id: 'STOP',
      label: 'STOP',
      sublabel: 'Mesin Berhenti',
      pin: 'DI 1 · PIN 13',
      icon: Square,
      accent: 'rose',
      activeColor: 'bg-rose-600 border-rose-500 text-white shadow-rose-600/30',
      idleColor: isDark ? 'bg-[#132238] border-rose-900/60 text-rose-300 hover:bg-rose-950/40 hover:border-rose-600' : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100',
      isEngaged: machine.status === 'DOWN',
    },
    {
      id: 'RESET',
      label: 'RESET',
      sublabel: 'Reset Batch / Shift',
      pin: 'DI 4 · PIN 16',
      icon: RotateCcw,
      accent: 'slate',
      guarded: true,
      activeColor: 'bg-slate-600 border-slate-500 text-white shadow-slate-600/30',
      idleColor: isDark ? 'bg-[#132238] border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
      isEngaged: false,
    },
    {
      id: 'COUNTING',
      label: 'COUNT (+1)',
      sublabel: 'Pulsa Sensor / Input',
      pin: 'DI 2 · PIN 14',
      icon: PlusCircle,
      accent: 'blue',
      activeColor: 'bg-blue-600 border-blue-500 text-white shadow-blue-600/30',
      idleColor: isDark ? 'bg-[#132238] border-blue-900/60 text-blue-300 hover:bg-blue-950/40 hover:border-blue-600' : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100',
      isEngaged: false,
    },
    {
      id: 'REJECT',
      label: 'REJECT (+1)',
      sublabel: 'Tombol Push Reject',
      pin: 'DI 3 · PIN 15',
      icon: AlertOctagon,
      accent: 'amber',
      activeColor: 'bg-amber-600 border-amber-500 text-white shadow-amber-600/30',
      idleColor: isDark ? 'bg-[#132238] border-amber-900/60 text-amber-300 hover:bg-amber-950/40 hover:border-amber-600' : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100',
      isEngaged: false,
    },
    {
      id: 'SPARE',
      label: 'SPARE',
      sublabel: 'Cadangan / Andon',
      pin: 'DI 5 · PIN 17',
      icon: Wrench,
      accent: 'indigo',
      guarded: true,
      activeColor: 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/30',
      idleColor: isDark ? 'bg-[#132238] border-indigo-900/60 text-indigo-300 hover:bg-indigo-950/40 hover:border-indigo-600' : 'bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100',
      isEngaged: false,
    },
  ] as const;

  return (
    <div
      className={`px-2 pt-2 pb-2 rounded-xl border shadow-sm transition-colors flex flex-col gap-1.5 overflow-hidden min-h-0 shrink-0 ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header kompak satu baris */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className={`text-xs font-bold tracking-tight truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Floor Push Buttons
          </h3>
        </div>
        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
          machine.status === 'RUNNING'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
            : machine.status === 'DOWN'
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
            : 'bg-slate-500/10 text-slate-500 border-slate-500/25'
        }`}>
          {machine.status}
        </span>
      </div>

      {/* Grid 3x2 — ikon + label horizontal, hemat ruang vertikal */}
      <div className="grid grid-cols-3 gap-1.5">
        {buttons.map((b) => {
          const isTriggered = activeBtn === b.id;
          const Icon = b.icon;
          const isEngaged = b.isEngaged;
          const isGuarded = 'guarded' in b && b.guarded === true;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => triggerButton(b.id)}
              className={`px-1.5 py-2 rounded-lg border transition-all duration-150 flex items-center gap-1.5 relative cursor-pointer select-none active:scale-95 min-h-[52px] text-left overflow-hidden ${
                isTriggered
                  ? 'ring-2 ring-blue-500 scale-[1.03] ' + b.activeColor
                  : isEngaged
                  ? b.activeColor + ' ring-1 ring-white/30 font-bold shadow-md'
                  : b.idleColor
              }`}
              title={isGuarded ? `${b.label} — ${b.sublabel} (perlu konfirmasi)` : `${b.label} — ${b.sublabel}`}
            >
              {isEngaged && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              )}
              <span className={`p-1 rounded-md shrink-0 ${
                isTriggered || isEngaged ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
              }`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
              </span>
              <span className="font-extrabold text-xs leading-tight tracking-tight truncate min-w-0 flex-1">
                {b.label}
              </span>
              {isGuarded && (
                <ShieldAlert className="w-3 h-3 shrink-0 opacity-60" aria-label="Perlu konfirmasi" />
              )}
            </button>
          );
        })}
      </div>

      {/* Guard konfirmasi RESET / SPARE */}
      {pendingGuard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => { if (!isBusy) setPendingGuard(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={pendingGuard === 'RESET' ? 'Konfirmasi Reset' : 'Konfirmasi Spare'}
        >
          <div
            className={`w-full max-w-xs rounded-xl border p-4 shadow-xl ${isDark ? 'bg-[#0f1b2e] border-slate-700' : 'bg-white border-slate-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-md ${pendingGuard === 'RESET' ? 'bg-rose-500/15 text-rose-500' : 'bg-indigo-500/15 text-indigo-500'}`}>
                  <TriangleAlert className="w-4 h-4" />
                </span>
                <h4 className={`text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {pendingGuard === 'RESET' ? 'Konfirmasi RESET' : 'Konfirmasi SPARE'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => { if (!isBusy) setPendingGuard(null); }}
                className={`p-1 rounded cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                aria-label="Tutup"
                disabled={isBusy}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {pendingGuard === 'RESET'
                ? 'Counter batch/shift akan di-nol-kan via MQTT (RESET_COUNTER). Tindakan ini tidak bisa dibatalkan. Lanjutkan?'
                : 'Tombol cadangan / Andon akan dipicu. Lanjutkan?'}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingGuard(null)}
                disabled={isBusy}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmGuard}
                disabled={isBusy}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold text-white cursor-pointer transition-colors disabled:opacity-50 ${pendingGuard === 'RESET' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isBusy ? 'Memproses…' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
