// /src/infrastructure/api/oeeApiClient.ts
// HTTP adapter implementing backend ports (ILiveStateRepository,
// IWorkOrderRepository, IDeviceCommandGateway, IMasterDataRepository,
// ITelemetryRepository, IAuthGateway). The ONLY place that knows REST paths,
// query-string shapes, and envelope unwrapping.

import type {
  AuthSession,
  IAuthGateway,
  IDeviceCommandGateway,
  ILiveStateRepository,
  IMasterDataRepository,
  ITelemetryRepository,
  IWorkOrderRepository,
} from '../../domain/ports/IOeeBackend';
import type { LiveStateSnapshot } from '../../domain/entities/backend/LiveState';
import type { DeviceCommandInput, DeviceRecord, MachineRecord, OperatorRecord, ProductRecord } from '../../domain/entities/backend/Device';
import type { DeviceMetadataPatch, MachineMetadataPatch } from '../../domain/ports/IOeeBackend';
import type { IAuthTokenStorage } from '../../domain/ports/IAuthTokenStorage';
import { AuthTokenStorageAdapter } from '../storage/AuthTokenStorageAdapter';
import type { DowntimeCategory, DowntimeEvent, OperationalEvent, TelemetryHistoryPoint } from '../../domain/entities/backend/Telemetry';
import type { HourlyTrendPoint, PageMeta } from '../../domain/ports/IOeeBackend';
import type { WorkOrderListItem, WorkOrderQuery, WorkOrderResolveResult } from '../../domain/entities/backend/WorkOrder';
import { mapLiveStateDto, mapLiveStateListDto } from '../../application/dto/live-state.dto';
import { mapWorkOrderDto, mapWorkOrderListDto, mapWorkOrderResolveDto } from '../../application/dto/work-order.dto';
import {
  mapDowntimeEventDto,
  mapDowntimeResultDto,
  mapHourlyTrendResultDto,
  mapOperationalEventResultDto,
  mapTelemetryHistoryListDto,
} from '../../application/dto/telemetry.dto';
import { assertDeviceCommandReason } from '../../domain/entities/backend/Device';
import { endpoints } from './endpoints';
import { httpRequest } from './httpClient';

function withQuery(path: string, params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
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
  async list(query: WorkOrderQuery = {}, signal?: AbortSignal): Promise<WorkOrderListItem[]> {
    const path = withQuery(endpoints.workOrders(), {
      status: query.status,
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
    const raw = await httpRequest<{ work_order?: unknown }>(endpoints.workOrderResolve(woId, deviceId), { signal });
    return mapWorkOrderResolveDto((raw.work_order ?? {}) as Record<string, unknown>);
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
  async getDevice(deviceId: string, signal?: AbortSignal): Promise<DeviceRecord> {
    return httpRequest<DeviceRecord>(endpoints.deviceDetail(deviceId), { signal });
  }
  async updateDevice(deviceId: string, patch: DeviceMetadataPatch): Promise<DeviceRecord> {
    return httpRequest<DeviceRecord>(endpoints.deviceDetail(deviceId), { method: 'PUT', body: patch });
  }
  async getMachine(machineId: string, signal?: AbortSignal): Promise<MachineRecord> {
    return httpRequest<MachineRecord>(endpoints.machineDetail(machineId), { signal });
  }
  async updateMachine(machineId: string, patch: MachineMetadataPatch): Promise<MachineRecord> {
    return httpRequest<MachineRecord>(endpoints.machineDetail(machineId), { method: 'PUT', body: patch });
  }
  async bindDevice(machineId: string, deviceId: string): Promise<MachineRecord> {
    // Bind contract uses snake_case body per API_DOCUMENTATION.md §F.6.
    return httpRequest<MachineRecord>(endpoints.machineBind(machineId), {
      method: 'POST',
      body: { device_id: deviceId },
    });
  }
  async unbindMachine(machineId: string): Promise<MachineRecord> {
    return httpRequest<MachineRecord>(endpoints.machineUnbind(machineId), { method: 'POST' });
  }
}

export class OeeHttpTelemetryRepository implements ITelemetryRepository {
  async getHistory(deviceId: string, from?: string, to?: string, limit = 200, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]> {
    const path = withQuery(endpoints.telemetryHistory(deviceId), { from, to, limit });
    const raw = await httpRequest<unknown>(path, { signal });
    return mapTelemetryHistoryListDto(raw);
  }
  async getActiveDowntimes(signal?: AbortSignal): Promise<DowntimeEvent[]> {
    const raw = await httpRequest<unknown>(endpoints.downtimeActive(), { signal });
    return Array.isArray(raw) ? raw.map((item) => mapDowntimeEventDto(item as Record<string, unknown>)) : mapDowntimeResultDto(raw).data;
  }
  async getDowntimes(
    deviceId: string,
    from?: string,
    to?: string,
    limit = 100,
    cursor?: string,
    envelope = false,
    signal?: AbortSignal
  ): Promise<{ data: DowntimeEvent[]; meta: PageMeta }> {
    const path = withQuery(endpoints.downtimesByDevice(deviceId), { from, to, limit, cursor, envelope });
    const raw = await httpRequest<unknown>(path, { signal });
    const result = mapDowntimeResultDto(raw);
    return { data: result.data, meta: envelope ? result.meta : { limit, hasMore: false, nextCursor: null, count: result.data.length } };
  }
  async getLabelableDowntimes(deviceId: string, signal?: AbortSignal): Promise<DowntimeEvent[]> {
    const path = withQuery(endpoints.downtimesByDevice(deviceId), {
      limit: 100,
      active_only: true,
      unlabeled_only: true,
    });
    const raw = await httpRequest<unknown>(path, { signal });
    return mapDowntimeResultDto(raw).data;
  }
  async getHourlyTrends(
    deviceId: string,
    from?: string,
    to?: string,
    limit = 72,
    envelope = false,
    signal?: AbortSignal
  ): Promise<{ data: HourlyTrendPoint[]; meta: PageMeta }> {
    const path = withQuery(endpoints.telemetryHourly(deviceId), { from, to, limit, envelope });
    const raw = await httpRequest<unknown>(path, { signal });
    const result = mapHourlyTrendResultDto(raw);
    return { data: result.data, meta: envelope ? result.meta : { limit, hasMore: false, nextCursor: null, count: result.data.length } };
  }
  async getOperationalEvents(
    deviceId: string,
    from?: string,
    to?: string,
    limit = 100,
    cursor?: string,
    envelope = false,
    signal?: AbortSignal
  ): Promise<{ data: OperationalEvent[]; meta: PageMeta }> {
    const path = withQuery(endpoints.operationalEvents(deviceId), { from, to, limit, cursor, envelope });
    const raw = await httpRequest<unknown>(path, { signal });
    const result = mapOperationalEventResultDto(raw);
    return { data: result.data, meta: envelope ? result.meta : { limit, hasMore: false, nextCursor: null, count: result.data.length } };
  }
  async labelDowntimeReason(id: number, category: DowntimeCategory, reason: string, notes?: string): Promise<void> {
    await httpRequest(endpoints.downtimeReason(id), { method: 'POST', body: { category, reason, notes } });
  }
}

export class OeeHttpAuthGateway implements IAuthGateway {
  constructor(private readonly tokens: IAuthTokenStorage = new AuthTokenStorageAdapter()) {}

  async loginWithPin(pin: string, operatorId?: string, stationId?: string): Promise<AuthSession> {
    const raw = await httpRequest<{
      token: string;
      expires_in: number;
      operator?: { id?: string; username?: string; role?: string; line_id?: string | null; lineId?: string | null };
    }>(endpoints.authOperatorPin(), {
      method: 'POST',
      body: { pin, operator_id: operatorId, station_id: stationId },
    });
    this.tokens.setToken(raw.token);
    return {
      token: raw.token,
      expiresIn: raw.expires_in,
      operator: {
        id: raw.operator?.id ?? operatorId ?? '',
        username: raw.operator?.username ?? '',
        role: raw.operator?.role ?? '',
        lineId: raw.operator?.line_id ?? raw.operator?.lineId ?? null,
      },
    };
  }
  logout(): void {
    this.tokens.clearToken();
  }
  getToken(): string | null {
    return this.tokens.getToken();
  }
}
