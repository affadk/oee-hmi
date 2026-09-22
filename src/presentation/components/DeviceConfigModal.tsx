// /src/presentation/components/DeviceConfigModal.tsx
// Device Configuration — registry management for the real backend lane.
// Read  : GET /api/v1/devices, GET /api/v1/machines (public).
// Mutate: PUT /api/v1/devices/:deviceId, POST /machines/:machineId/bind,
//         POST /machines/:machineId/unbind (ADMIN LAN + JWT — via PIN modal).

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Cpu,
  Link2,
  Link2Off,
  RefreshCw,
  Save,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  Factory,
} from 'lucide-react';
import type { DeviceRecord, MachineRecord } from '../../domain/entities/backend/Device';
import { useTheme } from '../providers/ThemeProvider';

interface DeviceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  registry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  registryError: string;
  isBackendMode: boolean;
  onRefresh: () => Promise<void>;
  onSaveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
  onBindDevice: (machineId: string, deviceId: string) => Promise<void>;
  onUnbindDevice: (machineId: string) => Promise<void>;
}

type DraftMap = Record<string, { ipAddress: string; firmwareVersion: string }>;

export const DeviceConfigModal: React.FC<DeviceConfigModalProps> = ({
  isOpen,
  onClose,
  registry,
  registryError,
  isBackendMode,
  onRefresh,
  onSaveDeviceMetadata,
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

interface DeviceListPanelProps {
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
  onSave: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }, notice: string) => void;
}

const DeviceListPanel: React.FC<DeviceListPanelProps> = ({
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
                {device.isOnline ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-slate-500" />}
                <strong className={`font-mono text-sm ${value}`}>{device.deviceId}</strong>
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
                disabled={!dirty || isBusy || !isBackendMode}
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

interface MachineBindPanelProps {
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
  onBind: (machineId: string, deviceId: string) => void;
  onUnbind: (machineId: string) => void;
}

const MachineBindPanel: React.FC<MachineBindPanelProps> = ({
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
                      disabled={isBusy || !isBackendMode}
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
                      disabled={isBusy || !isBackendMode || !candidate}
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
                MAC {machine.boundDevice.macAddress ?? '—'} · {machine.boundDevice.isOnline ? 'online' : 'offline'} · modbus slave {machine.modbusSlaveId}
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