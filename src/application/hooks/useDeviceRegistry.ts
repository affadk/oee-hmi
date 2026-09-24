// /src/application/hooks/useDeviceRegistry.ts
// Focused hook: backend device registry (list/update/bind/unbind) + config modal.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useCallback, useState } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { DeviceRecord, MachineRecord } from '../../domain/entities/backend/Device';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { ConfigureDeviceUseCase } from '../use-cases/ConfigureDeviceUseCase';

export interface DeviceRegistryDeps {
  useBackend: boolean;
  configureDeviceUseCase: ConfigureDeviceUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  runProtected: (action: () => Promise<void>) => Promise<void>;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export interface DeviceRegistryApi {
  isDeviceConfigModalOpen: boolean;
  openDeviceConfigModal: () => void;
  closeDeviceConfigModal: () => void;
  deviceRegistry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  deviceRegistryError: string;
  refreshDeviceRegistry: () => Promise<void>;
  saveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
  bindDeviceToMachine: (machineId: string, deviceId: string) => Promise<void>;
  unbindDeviceFromMachine: (machineId: string) => Promise<void>;
}

export function useDeviceRegistry(deps: DeviceRegistryDeps): DeviceRegistryApi {
  const { useBackend, configureDeviceUseCase, getMachinesUseCase, runProtected, setMachines } = deps;

  const [isDeviceConfigModalOpen, setIsDeviceConfigModalOpen] = useState<boolean>(false);
  const [deviceRegistry, setDeviceRegistry] = useState<{ devices: DeviceRecord[]; machines: MachineRecord[] } | null>(null);
  const [deviceRegistryError, setDeviceRegistryError] = useState<string>('');

  // ===== Device configuration (§E PUT /devices/:id, §F bind/unbind) =====
  const refreshDeviceRegistry = useCallback(async () => {
    if (!useBackend) return;
    setDeviceRegistryError('');
    try {
      const registry = await configureDeviceUseCase.loadRegistry();
      setDeviceRegistry(registry);
    } catch (err) {
      setDeviceRegistryError(err instanceof Error ? err.message : 'Gagal memuat registry perangkat.');
      throw err;
    }
  }, [configureDeviceUseCase, useBackend]);

  const openDeviceConfigModal = useCallback(() => {
    setDeviceRegistryError('');
    setIsDeviceConfigModalOpen(true);
    void refreshDeviceRegistry().catch(() => undefined);
  }, [refreshDeviceRegistry]);

  const closeDeviceConfigModal = useCallback(() => setIsDeviceConfigModalOpen(false), []);

  const saveDeviceMetadata = useCallback(async (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => {
    if (!useBackend) throw new Error('Konfigurasi perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.updateDeviceMetadata(deviceId, patch);
      const registry = await configureDeviceUseCase.loadRegistry();
      setDeviceRegistry(registry);
    });
  }, [configureDeviceUseCase, runProtected, useBackend]);

  const bindDeviceToMachine = useCallback(async (machineId: string, deviceId: string) => {
    if (!useBackend) throw new Error('Binding perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.bindDeviceToMachine(machineId, deviceId);
      const [registry, machineList] = await Promise.all([
        configureDeviceUseCase.loadRegistry(),
        getMachinesUseCase.executeAll(),
      ]);
      setDeviceRegistry(registry);
      setMachines(machineList);
    });
  }, [configureDeviceUseCase, getMachinesUseCase, runProtected, setMachines, useBackend]);

  const unbindDeviceFromMachine = useCallback(async (machineId: string) => {
    if (!useBackend) throw new Error('Unbind perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.unbindDeviceFromMachine(machineId);
      const [registry, machineList] = await Promise.all([
        configureDeviceUseCase.loadRegistry(),
        getMachinesUseCase.executeAll(),
      ]);
      setDeviceRegistry(registry);
      setMachines(machineList);
    });
  }, [configureDeviceUseCase, getMachinesUseCase, runProtected, setMachines, useBackend]);

  return {
    isDeviceConfigModalOpen,
    openDeviceConfigModal,
    closeDeviceConfigModal,
    deviceRegistry,
    deviceRegistryError,
    refreshDeviceRegistry,
    saveDeviceMetadata,
    bindDeviceToMachine,
    unbindDeviceFromMachine,
  };
}
