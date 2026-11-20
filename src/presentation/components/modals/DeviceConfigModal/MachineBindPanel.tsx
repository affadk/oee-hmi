// /src/presentation/components/modals/DeviceConfigModal/MachineBindPanel.tsx
// Panel binding 1:1 mesin ↔ device edge.

import React from 'react';
import { Factory, Link2, Link2Off, Loader2 } from 'lucide-react';
import type { DeviceRecord, MachineRecord } from '../../../../domain/entities/backend/Device';
import { connectionWord } from '../../../utils/statusWords';

export interface MachineBindPanelProps {
  registry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  unboundDevices: DeviceRecord[];
  bindTarget: Record<string, string>;
  setBindTarget: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  busyMachineId: string | null;
  panel: string;
  card: string;
  label: string;
  value: string;
  inputCls: string;
  isDark: boolean;
  isBackendMode: boolean;
  editDisabled?: boolean;
  onBind: (machineId: string, deviceId: string) => void;
  onUnbind: (machineId: string) => void;
}

export const MachineBindPanel: React.FC<MachineBindPanelProps> = ({
  registry,
  unboundDevices,
  bindTarget,
  setBindTarget,
  busyMachineId,
  panel,
  card,
  label,
  value,
  inputCls,
  isDark,
  isBackendMode,
  editDisabled = false,
  onBind,
  onUnbind,
}) => (
  <div className={`mt-4 p-4 rounded-xl border ${panel}`}>
    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3 ${value}`}>
      <Factory className="w-4 h-4 text-blue-500" /> Mesin &amp; Binding 1:1
    </h4>
    <div className="space-y-3">
      {(registry?.machines ?? []).map((machine) => {
        const isBusy = busyMachineId === machine.machineId;
        const candidate = bindTarget[machine.machineId] ?? '';
        return (
          <div key={machine.machineId} className={`p-3 rounded-xl border ${card}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <strong className={`font-mono text-sm ${value}`}>{machine.machineId}</strong>
                <span className={`text-[11px] ml-2 ${label}`}>{machine.machineName}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {machine.deviceId ? (
                  <>
                    <span className={`text-[11px] font-mono px-2 py-1 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                      ↔ {machine.deviceId}
                    </span>
                    <button
                      type="button"
                      disabled={isBusy || !isBackendMode || editDisabled}
                      onClick={() => onUnbind(machine.machineId)}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/60 text-rose-500 hover:bg-rose-500/10 disabled:opacity-40 text-[11px] font-bold flex items-center gap-1.5"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                      Unbind
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={candidate}
                      onChange={(e) => setBindTarget((prev) => ({ ...prev, [machine.machineId]: e.target.value }))}
                      className={`border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
                    >
                      <option value="">— pilih device —</option>
                      {unboundDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.deviceId}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isBusy || !isBackendMode || !candidate || editDisabled}
                      onClick={() => onBind(machine.machineId, candidate)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      Bind
                    </button>
                  </>
                )}
              </div>
            </div>
            {machine.boundDevice && (
              <p className={`text-[11px] font-mono mt-1 ${label}`}>
                MAC {machine.boundDevice.macAddress ?? '—'} · {connectionWord(machine.boundDevice.isOnline ? 'ONLINE' : 'OFFLINE').toLowerCase()} · modbus slave {machine.modbusSlaveId}
              </p>
            )}
          </div>
        );
      })}
      {registry && registry.machines.length === 0 && (
        <p className={`text-xs ${label}`}>Tidak ada mesin terdaftar.</p>
      )}
    </div>
    <p className={`text-[11px] mt-3 ${label}`}>
      Mutasi metadata &amp; binding bersifat ADMIN LAN only — modal PIN operator muncul otomatis bila sesi JWT belum ada.
    </p>
  </div>
);
