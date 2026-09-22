import type {
  DeviceMetadataPatch,
  IMasterDataRepository,
  MachineMetadataPatch,
} from '../../domain/ports/IOeeBackend';
import type { DeviceRecord, MachineRecord } from '../../domain/entities/backend/Device';

/**
 * Device/machine configuration mutations against the backend master-data
 * registry (§E PUT /devices/:id, §F PUT+bind+unbind /machines/:id).
 * All routes are ADMIN LAN only — callers must hold a valid JWT session.
 */
export class ConfigureDeviceUseCase {
  constructor(private readonly masterData: IMasterDataRepository) {}

  /** Full registry snapshot: devices with bound-machine info + machines with bound-device info. */
  async loadRegistry(signal?: AbortSignal): Promise<{ devices: DeviceRecord[]; machines: MachineRecord[] }> {
    const [devices, machines] = await Promise.all([
      this.masterData.listDevices(signal),
      this.masterData.listMachines(signal),
    ]);
    return { devices, machines };
  }

  updateDeviceMetadata(deviceId: string, patch: DeviceMetadataPatch): Promise<DeviceRecord> {
    if (!deviceId) throw new Error('deviceId is required.');
    return this.masterData.updateDevice(deviceId, patch);
  }

  updateMachineMetadata(machineId: string, patch: MachineMetadataPatch): Promise<MachineRecord> {
    if (!machineId) throw new Error('machineId is required.');
    return this.masterData.updateMachine(machineId, patch);
  }

  bindDeviceToMachine(machineId: string, deviceId: string): Promise<MachineRecord> {
    if (!machineId || !deviceId) throw new Error('machineId and deviceId are required.');
    return this.masterData.bindDevice(machineId, deviceId);
  }

  unbindDeviceFromMachine(machineId: string): Promise<MachineRecord> {
    if (!machineId) throw new Error('machineId is required.');
    return this.masterData.unbindMachine(machineId);
  }
}