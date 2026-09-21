import React, { useState } from 'react';
import { Play, Square, PlusCircle, AlertOctagon, RotateCcw, Wrench } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { MachineConfig } from '../../types';

interface PhysicalButtonRibbonProps {
  machine: MachineConfig;
  onUpdateMachineStatus: (status: 'RUNNING' | 'DOWN' | 'IDLE') => Promise<void>;
  onLogReject: (reasonLabel: string, count: number) => Promise<void>;
  onDispatchMqttCommand: (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => Promise<void>;
}

export const PhysicalButtonRibbon: React.FC<PhysicalButtonRibbonProps> = ({
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
    setTimeout(() => setActiveBtn(null), 700);

    switch (id) {
      case 'START':
        await onUpdateMachineStatus('RUNNING');
        break;
      case 'STOP':
        await onUpdateMachineStatus('DOWN');
        break;
      case 'COUNTING':
        // Simulated edge pulse for counting
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
    { id: 'START', label: 'START', color: 'emerald', icon: Play, desc: 'Mesin Running' },
    { id: 'STOP', label: 'STOP', color: 'rose', icon: Square, desc: 'Mesin Berhenti' },
    { id: 'COUNTING', label: 'COUNT (+1)', color: 'blue', icon: PlusCircle, desc: 'Pulsa Sensor / Input Fisik' },
    { id: 'REJECT', label: 'REJECT (+1)', color: 'amber', icon: AlertOctagon, desc: '1 Tombol Push Button Reject' },
    { id: 'RESET', label: 'RESET', color: 'slate', icon: RotateCcw, desc: 'Reset Batch / Shift' },
    { id: 'SPARE', label: 'SPARE', color: 'indigo', icon: Wrench, desc: 'Tombol Cadangan / Andon Alert' },
  ] as const;

  return (
    <div className={`p-2 sm:p-2.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md ${
      isDark ? 'bg-[#0b1528] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Title / Hardware Specs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            6 Physical Push Button I/O Status
          </span>
        </div>
        <span className="hidden md:inline text-[10px] text-slate-400 font-mono">
          (Satu-satunya sumber data dinamis lantai produksi)
        </span>
      </div>

      {/* Button Status / Clickable Simulation */}
      <div className="grid grid-cols-6 gap-1.5 w-full sm:w-auto">
        {buttons.map((b) => {
          const isTriggered = activeBtn === b.id;
          const Icon = b.icon;
          let activeBg = 'bg-slate-800/80 text-slate-300 border-slate-700';

          if (b.id === 'START' && machine.status === 'RUNNING') {
            activeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 ring-1 ring-emerald-500/40';
          } else if (b.id === 'STOP' && machine.status === 'DOWN') {
            activeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/60 ring-1 ring-rose-500/40';
          }

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => triggerButton(b.id)}
              title={`${b.label} - ${b.desc}`}
              className={`px-2 py-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none active:scale-95 ${activeBg} ${
                isTriggered ? 'scale-105 ring-2 ring-white shadow-lg bg-white text-slate-900 font-extrabold' : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${
                  b.id === 'START' ? 'text-emerald-400' :
                  b.id === 'STOP' ? 'text-rose-400' :
                  b.id === 'COUNTING' ? 'text-blue-400' :
                  b.id === 'REJECT' ? 'text-amber-400' :
                  b.id === 'RESET' ? 'text-slate-400' : 'text-indigo-400'
                }`} />
                <span className="text-[10px] font-bold font-mono tracking-tight">{b.label}</span>
              </div>
              <span className="text-[8px] text-slate-400 hidden lg:block">{b.desc.split('/')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
