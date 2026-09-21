// /src/components/fullscreen/FloorPushButtonsPanel.tsx

import React, { useState } from 'react';
import { Play, Square, PlusCircle, AlertOctagon, RotateCcw, Wrench } from 'lucide-react';
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

  const triggerButton = async (id: 'START' | 'STOP' | 'COUNTING' | 'REJECT' | 'RESET' | 'SPARE') => {
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
      id: 'RESET',
      label: 'RESET',
      sublabel: 'Reset Batch / Shift',
      pin: 'DI 4 · PIN 16',
      icon: RotateCcw,
      accent: 'slate',
      activeColor: 'bg-slate-600 border-slate-500 text-white shadow-slate-600/30',
      idleColor: isDark ? 'bg-[#132238] border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
      isEngaged: false,
    },
    {
      id: 'SPARE',
      label: 'SPARE',
      sublabel: 'Cadangan / Andon',
      pin: 'DI 5 · PIN 17',
      icon: Wrench,
      accent: 'indigo',
      activeColor: 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/30',
      idleColor: isDark ? 'bg-[#132238] border-indigo-900/60 text-indigo-300 hover:bg-indigo-950/40 hover:border-indigo-600' : 'bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100',
      isEngaged: false,
    },
  ] as const;

  return (
    <div
      className={`p-4 rounded-xl border shadow-sm transition-colors flex flex-col justify-between ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Floor Push Buttons
          </h3>
        </div>
      </div>

      {/* Grid of 6 Push Buttons - Clean & Minimalist without text clutter */}
      <div className="grid grid-cols-2 gap-2.5">
        {buttons.map((b) => {
          const isTriggered = activeBtn === b.id;
          const Icon = b.icon;
          const isEngaged = b.isEngaged;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => triggerButton(b.id)}
              className={`p-3 rounded-lg border text-left transition-all duration-150 flex items-center justify-between relative cursor-pointer select-none active:scale-97 ${
                isTriggered
                  ? 'ring-2 ring-blue-500 scale-[1.02] ' + b.activeColor
                  : isEngaged
                  ? b.activeColor + ' ring-1 ring-white/30 font-bold shadow-md'
                  : b.idleColor
              }`}
              title={b.label}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${
                  isTriggered || isEngaged ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs sm:text-sm leading-tight tracking-tight">
                  {b.label}
                </div>
              </div>

              {isEngaged && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
