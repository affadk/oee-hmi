// /src/presentation/components/modals/DeviceConfigModal/DeviceConfigModal.tsx
// Device Configuration — registry management for the real backend lane.
// Read  : GET /api/v1/devices, GET /api/v1/machines (public).
// Mutate: PUT /api/v1/devices/:deviceId, POST /machines/:machineId/bind,
//         POST /machines/:machineId/unbind (ADMIN LAN + JWT — via PIN modal).
// Koordinator modal — panel rendering didelegasikan ke file terpisah.

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Cpu,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { DeviceRecord, MachineRecord } from '../../../../domain/entities/backend/Device';
import { useTheme } from '../../../providers/ThemeProvider';
import { DeviceListPanel, type DraftMap } from './DeviceListPanel';
import { MachineMetaPanel } from './MachineMetaPanel';
import { MachineBindPanel } from './MachineBindPanel';

interface DeviceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  registry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  registryError: string;
  isBackendMode: boolean;
  onRefresh: () => Promise<void>;
  onSaveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
  onSaveMachineMetadata: (machineId: string, patch: { machineName?: string; modbusSlaveId?: number }) => Promise<void>;
  onBindDevice: (machineId: string, deviceId: string) => Promise<void>;
  onUnbindDevice: (machineId: string) => Promise<void>;
}

export const DeviceConfigModal: React.FC<DeviceConfigModalProps> = ({
  isOpen,
  onClose,
  registry,
  registryError,
  isBackendMode,
  onRefresh,
  onSaveDeviceMetadata,
  onSaveMachineMetadata,
  onBindDevice,
  onUnbindDevice,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [busyMachineId, setBusyMachineId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string>('');
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [machineDrafts, setMachineDrafts] = useState<Record<string, { machineName: string; modbusSlaveId: string }>>({});
  const [bindTarget, setBindTarget] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setActionError('');
      setActionNotice('');
      setBusyDeviceId(null);
      setBusyMachineId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!registry) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const device of registry.devices) {
        if (!next[device.deviceId]) {
          next[device.deviceId] = {
            ipAddress: device.ipAddress ?? '',
            firmwareVersion: device.firmwareVersion ?? '',
          };
        }
      }
      return next;
    });
  }, [registry]);

  const unboundDevices = useMemo(() => (registry?.devices ?? []).filter((d) => !d.boundMachine), [registry]);

  if (!isOpen) return null;

  const card = isDark ? 'bg-[#0d1830] border-[#1c3358]' : 'bg-white border-slate-200';
  const panel = isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200';
  const label = isDark ? 'text-slate-400' : 'text-slate-500';
  const value = isDark ? 'text-slate-100' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-[#050811] border-[#22395f] text-white focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500';

  const runBusy = async (key: string, setBusy: (v: string | null) => void, action: () => Promise<void>, notice: string) => {
    setActionError('');
    setActionNotice('');
    setBusy(key);
    try {
      await action();
      setActionNotice(notice);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Aksi gagal — cek koneksi LAN & sesi operator.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Device Configuration">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto border rounded-2xl shadow-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-500" />
            <h3 className={`text-base font-bold ${value}`}>Device Configuration</h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
              {registry ? `${registry.devices.length} device · ${registry.machines.length} mesin` : 'memuat…'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onRefresh().catch(() => undefined)}
              className={`p-2 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
              title="Muat ulang registry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isBackendMode && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
            <span className={isDark ? 'text-amber-200' : 'text-amber-800'}>
              Mode simulasi aktif — set VITE_USE_BACKEND=true agar registry &amp; mutasi membaca backend IIoT OEE.
            </span>
          </div>
        )}

        {(registryError || actionError) && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
            <span className="text-rose-500 font-semibold">{registryError || actionError}</span>
          </div>
        )}
        {actionNotice && (
          <div className={`mt-3 p-3 rounded-xl border text-xs font-semibold ${isDark ? 'border-emerald-700 bg-emerald-500/10 text-emerald-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
            {actionNotice}
          </div>
        )}

        <DeviceListPanel
          registry={registry}
          drafts={drafts}
          setDrafts={setDrafts}
          busyDeviceId={busyDeviceId}
          panel={panel}
          card={card}
          label={label}
          value={value}
          inputCls={inputCls}
          isDark={isDark}
          isBackendMode={isBackendMode}
          onSave={(deviceId, patch, notice) =>
            void runBusy(deviceId, setBusyDeviceId, () => onSaveDeviceMetadata(deviceId, patch), notice)
          }
        />

        <MachineMetaPanel
          registry={registry}
          machineDrafts={machineDrafts}
          setMachineDrafts={setMachineDrafts}
          busyMachineId={busyMachineId}
          panel={panel}
          card={card}
          label={label}
          value={value}
          inputCls={inputCls}
          isBackendMode={isBackendMode}
          onSave={(machineId, patch, notice) =>
            void runBusy(machineId, setBusyMachineId, () => onSaveMachineMetadata(machineId, patch), notice)
          }
        />

        <MachineBindPanel
          registry={registry}
          unboundDevices={unboundDevices}
          bindTarget={bindTarget}
          setBindTarget={setBindTarget}
          busyMachineId={busyMachineId}
          panel={panel}
          card={card}
          label={label}
          value={value}
          inputCls={inputCls}
          isDark={isDark}
          isBackendMode={isBackendMode}
          onBind={(machineId, deviceId) =>
            void runBusy(machineId, setBusyMachineId, () => onBindDevice(machineId, deviceId), `Device ${deviceId} terikat ke ${machineId}.`)
          }
          onUnbind={(machineId) =>
            void runBusy(machineId, setBusyMachineId, () => onUnbindDevice(machineId), `Device dilepas dari ${machineId}.`)
          }
        />
      </div>
    </div>
  );
};
