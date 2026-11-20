// /src/application/hooks/useDeviceRegistry.ts
// Focused hook: backend device registry (list/update/bind/unbind) + config modal.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useCallback, useState } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { DeviceRecord, MachineRecord, OperatorRecord, ProductRecord } from '../../domain/entities/backend/Device';
import type { MachineMetadataPatch } from '../../domain/ports/IOeeBackend';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { ConfigureDeviceUseCase } from '../use-cases/ConfigureDeviceUseCase';
import { canMutate } from '../capabilityGate';

export interface DeviceRegistryDeps {
  useBackend: boolean;
  configureDeviceUseCase: ConfigureDeviceUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  runProtected: <T>(action: () => Promise<T>) => Promise<T | void>;
  capabilities: import('../../domain/ports/IOeeBackend').CapabilityMap | null;
  mutationsAllowed: boolean | null;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export interface DeviceRegistryApi {
  isDeviceConfigModalOpen: boolean;
  openDeviceConfigModal: () => void;
  closeDeviceConfigModal: () => void;
  deviceRegistry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  deviceRegistryError: string;
  catalog: { products: ProductRecord[]; operators: OperatorRecord[] } | null;
  refreshDeviceRegistry: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  saveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
  saveMachineMetadata: (machineId: string, patch: MachineMetadataPatch) => Promise<void>;
  bindDeviceToMachine: (machineId: string, deviceId: string) => Promise<void>;
  unbindDeviceFromMachine: (machineId: string) => Promise<void>;
}

export function useDeviceRegistry(deps: DeviceRegistryDeps): DeviceRegistryApi {
  const { useBackend, configureDeviceUseCase, getMachinesUseCase, runProtected, capabilities, mutationsAllowed, setMachines } = deps;

  const [isDeviceConfigModalOpen, setIsDeviceConfigModalOpen] = useState<boolean>(false);
  const [deviceRegistry, setDeviceRegistry] = useState<{ devices: DeviceRecord[]; machines: MachineRecord[] } | null>(null);
  const [deviceRegistryError, setDeviceRegistryError] = useState<string>('');
  const [catalog, setCatalog] = useState<{ products: ProductRecord[]; operators: OperatorRecord[] } | null>(null);

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

  const refreshCatalog = useCallback(async () => {
    if (!useBackend) return;
    try {
      const next = await configureDeviceUseCase.loadCatalog();
      setCatalog(next);
    } catch {
      setCatalog(null);
    }
  }, [configureDeviceUseCase, useBackend]);

  const closeDeviceConfigModal = useCallback(() => setIsDeviceConfigModalOpen(false), []);

  const saveDeviceMetadata = useCallback(async (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => {
    const gate = canMutate({ useBackend, mutationsAllowed, capabilities, key: 'device.update' });
    if (!gate.allowed) throw new Error(gate.reason);
    if (!useBackend) throw new Error('Konfigurasi perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.updateDeviceMetadata(deviceId, patch);
      const registry = await configureDeviceUseCase.loadRegistry();
      setDeviceRegistry(registry);
    });
  }, [configureDeviceUseCase, runProtected, useBackend, useBackend, mutationsAllowed, capabilities]);

  const saveMachineMetadata = useCallback(async (machineId: string, patch: MachineMetadataPatch) => {
    const gate = canMutate({ useBackend, mutationsAllowed, capabilities, key: 'machine.update' });
    if (!gate.allowed) throw new Error(gate.reason);
    if (!useBackend) throw new Error('Konfigurasi mesin hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.updateMachineMetadata(machineId, patch);
      const registry = await configureDeviceUseCase.loadRegistry();
      setDeviceRegistry(registry);
    });
  }, [configureDeviceUseCase, runProtected, useBackend, useBackend, mutationsAllowed, capabilities]);

  const bindDeviceToMachine = useCallback(async (machineId: string, deviceId: string) => {
    const gate = canMutate({ useBackend, mutationsAllowed, capabilities, key: 'machine.update' });
    if (!gate.allowed) throw new Error(gate.reason);
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
  }, [configureDeviceUseCase, getMachinesUseCase, runProtected, setMachines, useBackend, useBackend, mutationsAllowed, capabilities]);

  const unbindDeviceFromMachine = useCallback(async (machineId: string) => {
    const gate = canMutate({ useBackend, mutationsAllowed, capabilities, key: 'machine.update' });
    if (!gate.allowed) throw new Error(gate.reason);
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
  }, [configureDeviceUseCase, getMachinesUseCase, runProtected, setMachines, useBackend, useBackend, mutationsAllowed, capabilities]);

  return {
    isDeviceConfigModalOpen,
    openDeviceConfigModal,
    closeDeviceConfigModal,
    deviceRegistry,
    deviceRegistryError,
    catalog,
    refreshDeviceRegistry,
    refreshCatalog,
    saveDeviceMetadata,
    saveMachineMetadata,
    bindDeviceToMachine,
    unbindDeviceFromMachine,
  };
}
