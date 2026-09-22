// /src/domain/entities/backend/Device.ts
// Master-data contracts for Devices (§E), Machines (§F), Products (§G),
// Operators (§H), and device commands (§D).

export interface DeviceRecord {
  deviceId: string;
  model: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  firmwareVersion: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  boundMachine: { machineId: string; machineName: string } | null;
}

export interface MachineRecord {
  machineId: string;
  machineName: string;
  deviceId: string | null;
  modbusSlaveId: number;
  createdAt: string;
  boundDevice: { deviceId: string; macAddress: string | null; isOnline: boolean } | null;
}

export interface ProductRecord {
  productId: string;
  productName: string;
  stdCycleTimeSec: number;
  createdAt: string;
}

export type OperatorRole = 'OPERATOR' | 'SUPERVISOR' | 'ADMIN' | 'MAINTENANCE';

export interface OperatorRecord {
  operatorId: string;
  operatorName: string;
  role: OperatorRole;
  lineId: string | null;
  isActive: boolean;
  createdAt: string;
}

export type DeviceCommandKind = 'PAUSE' | 'RESUME' | 'RESET_COUNTER';

export interface DeviceCommandInput {
  deviceId: string;
  command: DeviceCommandKind;
  reason: string; // min 5 chars per API contract
}

export function assertDeviceCommandReason(reason: string): void {
  if (!reason || reason.trim().length < 5) {
    throw new Error('Command reason must be at least 5 characters.');
  }
}
