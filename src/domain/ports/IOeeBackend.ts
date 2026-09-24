// /src/domain/ports/IOeeBackend.ts
// Ports (interfaces) for the real IIoT OEE backend — REST + WebSocket.
// Implementations live in infrastructure/api + infrastructure/realtime.
// Application use-cases depend ONLY on these ports (dependency points inward).

import type { LiveStateSnapshot } from '../entities/backend/LiveState';
import type { WorkOrderListItem, WorkOrderQuery, WorkOrderResolveResult } from '../entities/backend/WorkOrder';
import type { DowntimeCategory, DowntimeEvent, OperationalEvent, TelemetryHistoryPoint, WsLifecycleEvent, WsTelemetryFrame } from '../entities/backend/Telemetry';
import type { DeviceCommandInput, DeviceRecord, MachineRecord, OperatorRecord, ProductRecord } from '../entities/backend/Device';

export interface PageMeta {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export interface ApiErrorShape {
  error: string;
  message: string;
}

export interface ILiveStateRepository {
  getAllSnapshots(signal?: AbortSignal): Promise<LiveStateSnapshot[]>;
  getSnapshotByDevice(deviceId: string, signal?: AbortSignal): Promise<LiveStateSnapshot>;
}

export interface IWorkOrderRepository {
  list(query?: WorkOrderQuery, signal?: AbortSignal): Promise<WorkOrderListItem[]>;
  getDetail(woId: string, signal?: AbortSignal): Promise<WorkOrderListItem>;
  resolve(woId: string, deviceId: string, signal?: AbortSignal): Promise<WorkOrderResolveResult>;
  dispatch(woId: string, deviceId: string, notes?: string): Promise<void>;
  complete(woId: string, finalRejectCount: number, notes?: string): Promise<void>;
  cancel(woId: string, reason?: string): Promise<void>;
}

export interface IDeviceCommandGateway {
  sendCommand(input: DeviceCommandInput): Promise<{ success: boolean; transactionId: string }>;
}

export interface DeviceMetadataPatch {
  ipAddress?: string;
  firmwareVersion?: string;
}

export interface MachineMetadataPatch {
  machineName?: string;
  modbusSlaveId?: number;
}

export interface IMasterDataRepository {
  listDevices(signal?: AbortSignal): Promise<DeviceRecord[]>;
  listMachines(signal?: AbortSignal): Promise<MachineRecord[]>;
  listProducts(signal?: AbortSignal): Promise<ProductRecord[]>;
  listOperators(signal?: AbortSignal): Promise<OperatorRecord[]>;
  getDevice(deviceId: string, signal?: AbortSignal): Promise<DeviceRecord>;
  updateDevice(deviceId: string, patch: DeviceMetadataPatch): Promise<DeviceRecord>;
  getMachine(machineId: string, signal?: AbortSignal): Promise<MachineRecord>;
  updateMachine(machineId: string, patch: MachineMetadataPatch): Promise<MachineRecord>;
  /** Bind device ↔ machine 1:1 (POST /machines/:machineId/bind). */
  bindDevice(machineId: string, deviceId: string): Promise<MachineRecord>;
  /** Unbind device from machine (POST /machines/:machineId/unbind). */
  unbindMachine(machineId: string): Promise<MachineRecord>;
}

export interface ITelemetryRepository {
  getHistory(deviceId: string, from?: string, to?: string, limit?: number, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]>;
  /** Live-trend buckets (§K.4 aggregate, B5); backend bucket enum 1m|5m|15m|1h|1d. */
  getAggregate(deviceId: string, bucket: string, from?: string, to?: string, limit?: number, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]>;
  getActiveDowntimes(signal?: AbortSignal): Promise<DowntimeEvent[]>;
  getDowntimes(deviceId: string, from?: string, to?: string, limit?: number, cursor?: string, envelope?: boolean, signal?: AbortSignal): Promise<{ data: DowntimeEvent[]; meta: PageMeta }>;
  getLabelableDowntimes(deviceId: string, signal?: AbortSignal): Promise<DowntimeEvent[]>;
  getHourlyTrends(deviceId: string, from?: string, to?: string, limit?: number, envelope?: boolean, signal?: AbortSignal): Promise<{ data: HourlyTrendPoint[]; meta: PageMeta }>;
  getOperationalEvents(deviceId: string, from?: string, to?: string, limit?: number, cursor?: string, envelope?: boolean, signal?: AbortSignal): Promise<{ data: OperationalEvent[]; meta: PageMeta }>;
  labelDowntimeReason(id: number, category: DowntimeCategory, reason: string, notes?: string): Promise<void>;
}

export interface HourlyTrendPoint {
  bucket: string;
  deviceId: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  totalCount: number;
  goodCount: number;
  rejectCount: number;
}

export interface AuthSession {
  token: string;
  expiresIn: number;
  operator: {
    id: string;
    username: string;
    role: string;
    lineId: string | null;
  };
}

export interface IAuthGateway {
  loginWithPin(pin: string, operatorId?: string, stationId?: string): Promise<AuthSession>;
  logout(): void;
  getToken(): string | null;
}

export type RealtimeListener = {
  onTelemetry?: (frame: WsTelemetryFrame) => void;
  onLifecycle?: (event: WsLifecycleEvent) => void;
};

export interface IRealtimeGateway {
  connect(listener: RealtimeListener): void;
  disconnect(): void;
  isConnected(): boolean;
}
