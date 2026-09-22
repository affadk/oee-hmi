// /src/domain/ports/IOeeBackend.ts
// Ports (interfaces) for the real IIoT OEE backend — REST + WebSocket.
// Implementations live in infrastructure/api + infrastructure/realtime.
// Application use-cases depend ONLY on these ports (dependency points inward).

import type { LiveStateSnapshot } from '../entities/backend/LiveState';
import type { WorkOrderListItem, WorkOrderQuery, WorkOrderResolveResult, WorkOrderStatus } from '../entities/backend/WorkOrder';
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
  updateStatusFilter(status: WorkOrderStatus): void;
}

export interface IDeviceCommandGateway {
  sendCommand(input: DeviceCommandInput): Promise<{ success: boolean; transactionId: string }>;
}

export interface IMasterDataRepository {
  listDevices(signal?: AbortSignal): Promise<DeviceRecord[]>;
  listMachines(signal?: AbortSignal): Promise<MachineRecord[]>;
  listProducts(signal?: AbortSignal): Promise<ProductRecord[]>;
  listOperators(signal?: AbortSignal): Promise<OperatorRecord[]>;
}

export interface ITelemetryRepository {
  getHistory(deviceId: string, from?: string, to?: string, limit?: number, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]>;
  getActiveDowntimes(signal?: AbortSignal): Promise<DowntimeEvent[]>;
  getDowntimes(deviceId: string, signal?: AbortSignal): Promise<DowntimeEvent[]>;
  labelDowntimeReason(id: number, category: DowntimeCategory, reason: string, notes?: string): Promise<void>;
  getOperationalEvents(deviceId: string, signal?: AbortSignal): Promise<OperationalEvent[]>;
}

export interface IAuthGateway {
  loginWithPin(pin: string, operatorId?: string, stationId?: string): Promise<{ token: string; expiresIn: number }>;
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
