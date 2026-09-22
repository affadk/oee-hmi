// /src/infrastructure/api/oeeApiClient.ts
// HTTP adapter implementing backend ports (ILiveStateRepository,
// IWorkOrderRepository, IDeviceCommandGateway, IMasterDataRepository,
// ITelemetryRepository, IAuthGateway). The ONLY place that knows REST paths,
// query-string shapes, and envelope unwrapping.

import type {
  IAuthGateway,
  IDeviceCommandGateway,
  ILiveStateRepository,
  IMasterDataRepository,
  ITelemetryRepository,
  IWorkOrderRepository,
} from '../../domain/ports/IOeeBackend';
import type { LiveStateSnapshot } from '../../domain/entities/backend/LiveState';
import type { DeviceCommandInput, DeviceRecord, MachineRecord, OperatorRecord, ProductRecord } from '../../domain/entities/backend/Device';
import type { DowntimeCategory, DowntimeEvent, OperationalEvent, TelemetryHistoryPoint } from '../../domain/entities/backend/Telemetry';
import type { WorkOrderListItem, WorkOrderQuery, WorkOrderResolveResult } from '../../domain/entities/backend/WorkOrder';
import { mapLiveStateDto, mapLiveStateListDto } from '../../application/dto/live-state.dto';
import { mapWorkOrderDto, mapWorkOrderListDto } from '../../application/dto/work-order.dto';
import { assertDeviceCommandReason } from '../../domain/entities/backend/Device';
import { endpoints } from './endpoints';
import { httpRequest } from './httpClient';

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

export class OeeHttpLiveStateRepository implements ILiveStateRepository {
  async getAllSnapshots(signal?: AbortSignal): Promise<LiveStateSnapshot[]> {
    const raw = await httpRequest<unknown>(endpoints.liveStateAll(), { signal });
    return mapLiveStateListDto(raw);
  }
  async getSnapshotByDevice(deviceId: string, signal?: AbortSignal): Promise<LiveStateSnapshot> {
    const raw = await httpRequest<unknown>(endpoints.liveStateByDevice(deviceId), { signal });
    return mapLiveStateDto(raw as Record<string, unknown>);
  }
}

export class OeeHttpWorkOrderRepository implements IWorkOrderRepository {
  private statusFilter: WorkOrderQuery['status'];
  updateStatusFilter(status: WorkOrderQuery['status']): void {
    this.statusFilter = status;
  }
  async list(query: WorkOrderQuery = {}, signal?: AbortSignal): Promise<WorkOrderListItem[]> {
    const path = withQuery(endpoints.workOrders(), {
      status: query.status ?? this.statusFilter,
      machine_id: query.machineId,
      product_id: query.productId,
      operator_id: query.operatorId,
      from: query.from,
      to: query.to,
      limit: query.limit ?? 50,
      cursor: query.cursor,
      envelope: true,
    });
    const raw = await httpRequest<unknown>(path, { signal });
    return mapWorkOrderListDto(raw);
  }
  async getDetail(woId: string, signal?: AbortSignal): Promise<WorkOrderListItem> {
    const raw = await httpRequest<unknown>(endpoints.workOrderDetail(woId), { signal });
    return mapWorkOrderDto(raw as Record<string, string>);
  }
  async resolve(woId: string, deviceId: string, signal?: AbortSignal): Promise<WorkOrderResolveResult> {
    const raw = await httpRequest<{ work_order: WorkOrderResolveResult }>(endpoints.workOrderResolve(woId, deviceId), { signal });
    return raw.work_order;
  }
  async dispatch(woId: string, deviceId: string, notes?: string): Promise<void> {
    await httpRequest(endpoints.workOrderDispatch(woId), { method: 'POST', body: { device_id: deviceId, notes } });
  }
  async complete(woId: string, finalRejectCount: number, notes?: string): Promise<void> {
    await httpRequest(endpoints.workOrderComplete(woId), {
      method: 'POST',
      body: { finalRejectCount, notes },
    });
  }
  async cancel(woId: string, reason?: string): Promise<void> {
    await httpRequest(endpoints.workOrderCancel(woId), { method: 'POST', body: { reason } });
  }
}

export class OeeHttpDeviceCommandGateway implements IDeviceCommandGateway {
  async sendCommand(input: DeviceCommandInput): Promise<{ success: boolean; transactionId: string }> {
    assertDeviceCommandReason(input.reason);
    const raw = await httpRequest<{ success: boolean; transaction_id: string }>(endpoints.deviceCommand(input.deviceId), {
      method: 'POST',
      body: { command: input.command, reason: input.reason },
    });
    return { success: raw.success, transactionId: raw.transaction_id };
  }
}

export class OeeHttpMasterDataRepository implements IMasterDataRepository {
  async listDevices(signal?: AbortSignal): Promise<DeviceRecord[]> {
    return httpRequest<DeviceRecord[]>(endpoints.devices(), { signal });
  }
  async listMachines(signal?: AbortSignal): Promise<MachineRecord[]> {
    return httpRequest<MachineRecord[]>(endpoints.machines(), { signal });
  }
  async listProducts(signal?: AbortSignal): Promise<ProductRecord[]> {
    return httpRequest<ProductRecord[]>(endpoints.products(), { signal });
  }
  async listOperators(signal?: AbortSignal): Promise<OperatorRecord[]> {
    return httpRequest<OperatorRecord[]>(endpoints.operators(), { signal });
  }
}

export class OeeHttpTelemetryRepository implements ITelemetryRepository {
  async getHistory(deviceId: string, from?: string, to?: string, limit = 200, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]> {
    const path = withQuery(endpoints.telemetryHistory(deviceId), { from, to, limit });
    return httpRequest<TelemetryHistoryPoint[]>(path, { signal });
  }
  async getActiveDowntimes(signal?: AbortSignal): Promise<DowntimeEvent[]> {
    return httpRequest<DowntimeEvent[]>(endpoints.downtimeActive(), { signal });
  }
  async getDowntimes(deviceId: string, signal?: AbortSignal): Promise<DowntimeEvent[]> {
    return httpRequest<DowntimeEvent[]>(endpoints.downtimesByDevice(deviceId), { signal });
  }
  async labelDowntimeReason(id: number, category: DowntimeCategory, reason: string, notes?: string): Promise<void> {
    await httpRequest(endpoints.downtimeReason(id), { method: 'POST', body: { category, reason, notes } });
  }
  async getOperationalEvents(deviceId: string, signal?: AbortSignal): Promise<OperationalEvent[]> {
    return httpRequest<OperationalEvent[]>(endpoints.operationalEvents(deviceId), { signal });
  }
}

export class OeeHttpAuthGateway implements IAuthGateway {
  async loginWithPin(pin: string, operatorId?: string, stationId?: string): Promise<{ token: string; expiresIn: number }> {
    const raw = await httpRequest<{ token: string; expires_in: number }>(endpoints.authOperatorPin(), {
      method: 'POST',
      body: { pin, operator_id: operatorId, station_id: stationId },
    });
    try {
      window.localStorage.setItem('oee_api_token', raw.token);
    } catch {
      // storage unavailable — token stays in memory only
    }
    return { token: raw.token, expiresIn: raw.expires_in };
  }
  logout(): void {
    try {
      window.localStorage.removeItem('oee_api_token');
    } catch {
      // ignore
    }
  }
  getToken(): string | null {
    try {
      return window.localStorage.getItem('oee_api_token');
    } catch {
      return null;
    }
  }
}
