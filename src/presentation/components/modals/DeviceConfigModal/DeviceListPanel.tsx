// /src/presentation/components/modals/DeviceConfigModal/DeviceListPanel.tsx
// Panel daftar perangkat edge (STM32) — edit IP & firmware per device.

import React from 'react';
import { Wifi, WifiOff, Loader2, Save } from 'lucide-react';
import type { DeviceRecord, MachineRecord } from '../../../../domain/entities/backend/Device';
import { connectionWord } from '../../../utils/statusWords';

export type DraftMap = Record<string, { ipAddress: string; firmwareVersion: string }>;

export interface DeviceListPanelProps {
  registry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  drafts: DraftMap;
  setDrafts: React.Dispatch<React.SetStateAction<DraftMap>>;
  busyDeviceId: string | null;
  panel: string;
  card: string;
  label: string;
  value: string;
  inputCls: string;
  isDark: boolean;
  isBackendMode: boolean;
  editDisabled?: boolean;
  onSave: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }, notice: string) => void;
}

export const DeviceListPanel: React.FC<DeviceListPanelProps> = ({
  registry,
  drafts,
  setDrafts,
  busyDeviceId,
  panel,
  card,
  label,
  value,
  inputCls,
  isDark,
  isBackendMode,
  editDisabled = false,
  onSave,
}) => (
  <div className={`mt-4 p-4 rounded-xl border ${panel}`}>
    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3 ${value}`}>
      <Wifi className="w-4 h-4 text-cyan-500" /> Perangkat Edge (STM32)
    </h4>
    <div className="space-y-3">
      {(registry?.devices ?? []).map((device) => {
        const draft = drafts[device.deviceId] ?? { ipAddress: device.ipAddress ?? '', firmwareVersion: device.firmwareVersion ?? '' };
        const dirty =
          draft.ipAddress !== (device.ipAddress ?? '') ||
          draft.firmwareVersion !== (device.firmwareVersion ?? '');
        const isBusy = busyDeviceId === device.deviceId;
        return (
          <div key={device.deviceId} className={`p-3 rounded-xl border ${card}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                {device.isOnline ? <Wifi className="w-4 h-4 text-emerald-500" aria-label="Terhubung" /> : <WifiOff className="w-4 h-4 text-slate-500" aria-label="Terputus" />}
                <strong className={`font-mono text-sm ${value}`}>{device.deviceId}</strong>
                <span className={`text-[11px] font-bold ${device.isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>{connectionWord(device.isOnline ? 'ONLINE' : 'OFFLINE')}</span>
                <span className={`text-[11px] ${label}`}>{device.model ?? 'model ?'}</span>
              </div>
              {device.boundMachine ? (
                <span className={`text-[11px] font-mono px-2 py-1 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                  ↔ {device.boundMachine.machineId}
                </span>
              ) : (
                <span className={`text-[11px] font-mono px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  belum terikat
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <label className="block">
                <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${label}`}>IP Address</span>
                <input
                  value={draft.ipAddress}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [device.deviceId]: { ...draft, ipAddress: e.target.value } }))}
                  placeholder="192.168.1.101"
                  className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
                />
              </label>
              <label className="block">
                <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${label}`}>Firmware</span>
                <input
                  value={draft.firmwareVersion}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [device.deviceId]: { ...draft, firmwareVersion: e.target.value } }))}
                  placeholder="v1.0.0"
                  className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none ${inputCls}`}
                />
              </label>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                disabled={!dirty || isBusy || !isBackendMode || editDisabled}
                onClick={() =>
                  onSave(
                    device.deviceId,
                    {
                      ipAddress: draft.ipAddress.trim() || undefined,
                      firmwareVersion: draft.firmwareVersion.trim() || undefined,
                    },
                    `Metadata ${device.deviceId} tersimpan.`,
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5"
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan metadata
              </button>
            </div>
          </div>
        );
      })}
      {registry && registry.devices.length === 0 && (
        <p className={`text-xs ${label}`}>Tidak ada perangkat terdaftar.</p>
      )}
    </div>
  </div>
);
