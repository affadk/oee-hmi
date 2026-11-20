// /src/presentation/components/modals/DeviceConfigModal/MachineMetaPanel.tsx
// Panel metadata mesin — edit nama mesin & Modbus slave ID.

import React from 'react';
import { Factory, Loader2, Save } from 'lucide-react';
import type { DeviceRecord, MachineRecord } from '../../../../domain/entities/backend/Device';

export interface MachineMetaPanelProps {
  registry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  machineDrafts: Record<string, { machineName: string; modbusSlaveId: string }>;
  setMachineDrafts: React.Dispatch<React.SetStateAction<Record<string, { machineName: string; modbusSlaveId: string }>>>;
  busyMachineId: string | null;
  panel: string;
  card: string;
  label: string;
  value: string;
  inputCls: string;
  isBackendMode: boolean;
  editDisabled?: boolean;
  onSave: (machineId: string, patch: { machineName?: string; modbusSlaveId?: number }, notice: string) => void;
}

export const MachineMetaPanel: React.FC<MachineMetaPanelProps> = ({
  registry,
  machineDrafts,
  setMachineDrafts,
  busyMachineId,
  panel,
  card,
  label,
  value,
  inputCls,
  isBackendMode,
  editDisabled = false,
  onSave,
}) => (
  <div className={`mt-4 p-4 rounded-xl border ${panel}`}>
    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3 ${value}`}>
      <Factory className="w-4 h-4 text-blue-500" /> Metadata Mesin
    </h4>
    <div className="space-y-3">
      {(registry?.machines ?? []).map((machine) => {
        const draft = machineDrafts[machine.machineId] ?? {
          machineName: machine.machineName,
          modbusSlaveId: String(machine.modbusSlaveId),
        };
        const slaveNum = draft.modbusSlaveId.trim() === '' ? NaN : Number(draft.modbusSlaveId);
        const dirty =
          draft.machineName !== machine.machineName ||
          (!Number.isNaN(slaveNum) && slaveNum !== machine.modbusSlaveId);
        const isBusy = busyMachineId === machine.machineId;
        return (
          <div key={machine.machineId} className={`p-3 rounded-xl border ${card}`}>
            <div className="flex items-center gap-2 min-w-0">
              <strong className={`font-mono text-sm ${value}`}>{machine.machineId}</strong>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <label className="block">
                <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${label}`}>Nama Mesin</span>
                <input
                  value={draft.machineName}
                  onChange={(e) => setMachineDrafts((prev) => ({ ...prev, [machine.machineId]: { ...draft, machineName: e.target.value } }))}
                  placeholder={machine.machineName}
                  className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
                />
              </label>
              <label className="block">
                <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${label}`}>Modbus Slave ID</span>
                <input
                  value={draft.modbusSlaveId}
                  inputMode="numeric"
                  onChange={(e) => setMachineDrafts((prev) => ({ ...prev, [machine.machineId]: { ...draft, modbusSlaveId: e.target.value } }))}
                  placeholder={String(machine.modbusSlaveId)}
                  className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
                />
              </label>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                disabled={!dirty || isBusy || !isBackendMode || Number.isNaN(slaveNum) || editDisabled}
                onClick={() =>
                  onSave(
                    machine.machineId,
                    {
                      machineName: draft.machineName.trim() || undefined,
                      modbusSlaveId: slaveNum,
                    },
                    `Metadata ${machine.machineId} tersimpan.`,
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5"
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan metadata
              </button>
            </div>
          </div>
        );
      })}
      {registry && registry.machines.length === 0 && (
        <p className={`text-xs ${label}`}>Tidak ada mesin terdaftar.</p>
      )}
    </div>
  </div>
);
