// /src/infrastructure/api/oeeApiClient.ts
// HTTP adapter implementing backend ports (ILiveStateRepository,
// IWorkOrderRepository, IDeviceCommandGateway, IMasterDataRepository,
// ITelemetryRepository, IAuthGateway, IShiftSummaryRepository,
// IShiftTimelineRepository). The ONLY place that knows REST paths,
// query-string shapes, and envelope unwrapping.

import type {
  AccessMode,
  AuthSession,
  BackendHealth,
  CapabilityMap,
  IAuthGateway,
  IDeviceCommandGateway,
  IHealthRepository,
  ILiveStateRepository,
  IMasterDataRepository,
  ITelemetryRepository,
  IWorkOrderRepository,
} from '../../../domain/ports/IOeeBackend';
import type {
  IShiftSummaryRepository,
  IShiftTimelineRepository,
  ShiftSummary,
  ShiftSummaryQuery,
  ShiftTimelineQuery,
  ShiftTimelineSegment,
} from '../../../domain/ports/IShiftSummary';
import type { LiveStateSnapshot } from '../../../domain/entities/backend/LiveState';
import type { DeviceCommandInput, DeviceRecord, MachineRecord, OperatorRecord, ProductRecord } from '../../../domain/entities/backend/Device';
import type { DeviceMetadataPatch, MachineMetadataPatch } from '../../../domain/ports/IOeeBackend';
import type { IAuthTokenStorage } from '../../../domain/ports/IAuthTokenStorage';
import { AuthTokenStorageAdapter } from '../../storage/AuthTokenStorageAdapter';
import type { DowntimeCategory, DeviceHealth, DowntimeEvent, OperationalEvent, RejectBreakdownItem, TelemetryHistoryPoint } from '../../../domain/entities/backend/Telemetry';
import type { HourlyTrendPoint, OperationalEventsQuery, PageMeta } from '../../../domain/ports/IOeeBackend';
import type { WorkOrderListItem, WorkOrderQuery, WorkOrderResolveResult } from '../../../domain/entities/backend/WorkOrder';
import { mapLiveStateDto, mapLiveStateListDto } from '../dto/live-state.dto';
import { mapWorkOrderDto, mapWorkOrderListDto, mapWorkOrderResolveDto } from '../dto/work-order.dto';
import {
  mapDeviceHealthDto,
  mapDowntimeEventDto,
  mapDowntimeResultDto,
  mapHourlyTrendResultDto,
  mapOperationalEventResultDto,
  mapRejectBreakdownDto,
  mapTelemetryHistoryListDto,
} from '../dto/telemetry.dto';
import { mapShiftSummaryDto, mapShiftTimelineListDto } from '../dto/shift.dto';
import {
  mapDeviceDto,
  mapDeviceListDto,
  mapMachineDto,
  mapMachineListDto,
  mapOperatorListDto,
  mapProductListDto,
} from '../dto/master-data.dto';
import { assertCountAdjust, assertDeviceCommandReason } from '../../../domain/entities/backend/Device';
import { endpoints } from './endpoints';
import { BackendHttpError, httpDownload, httpRequest } from './httpClient';

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
    assertCountAdjust(input.command, input.count);
    const raw = await httpRequest<{ success: boolean; transaction_id: string }>(endpoints.deviceCommand(input.deviceId), {
      method: 'POST',
      body: {
        command: input.command,
        reason: input.reason,
        ...(input.command === 'COUNT_ADJUST' ? { count: input.count } : {}),
      },
    });
    return { success: raw.success, transactionId: raw.transaction_id };
  }
}

export class OeeHttpMasterDataRepository implements IMasterDataRepository {
  async listDevices(signal?: AbortSignal): Promise<DeviceRecord[]> {
    const raw = await httpRequest<unknown>(endpoints.devices(), { signal });
    return mapDeviceListDto(raw);
  }
  async listMachines(signal?: AbortSignal): Promise<MachineRecord[]> {
    const raw = await httpRequest<unknown>(endpoints.machines(), { signal });
    return mapMachineListDto(raw);
  }
  async listProducts(signal?: AbortSignal): Promise<ProductRecord[]> {
    const raw = await httpRequest<unknown>(endpoints.products(), { signal });
    return mapProductListDto(raw);
  }
  async listOperators(signal?: AbortSignal): Promise<OperatorRecord[]> {
    const raw = await httpRequest<unknown>(endpoints.operators(), { signal });
    return mapOperatorListDto(raw);
  }
  async getDevice(deviceId: string, signal?: AbortSignal): Promise<DeviceRecord> {
    const raw = await httpRequest<unknown>(endpoints.deviceDetail(deviceId), { signal });
    return mapDeviceDto(raw);
  }
  async updateDevice(deviceId: string, patch: DeviceMetadataPatch): Promise<DeviceRecord> {
    const raw = await httpRequest<unknown>(endpoints.deviceDetail(deviceId), { method: 'PUT', body: patch });
    return mapDeviceDto(raw);
  }
  async getMachine(machineId: string, signal?: AbortSignal): Promise<MachineRecord> {
    const raw = await httpRequest<unknown>(endpoints.machineDetail(machineId), { signal });
    return mapMachineDto(raw);
  }
  async updateMachine(machineId: string, patch: MachineMetadataPatch): Promise<MachineRecord> {
    const raw = await httpRequest<unknown>(endpoints.machineDetail(machineId), { method: 'PUT', body: patch });
    return mapMachineDto(raw);
  }
  async bindDevice(machineId: string, deviceId: string): Promise<MachineRecord> {
    // Bind contract uses snake_case body per API_DOCUMENTATION.md §F.6.
    const raw = await httpRequest<unknown>(endpoints.machineBind(machineId), {
      method: 'POST',
      body: { device_id: deviceId },
    });
    return mapMachineDto(raw);
  }
  async unbindMachine(machineId: string): Promise<void> {
    // G12: kontrak resmi 200 + body (bukan 204); return dibuang — pemanggil
    // wajib reload registry + fleet (lihat useDeviceRegistry).
    await httpRequest<MachineRecord>(endpoints.machineUnbind(machineId), { method: 'POST' });
  }
}

export class OeeHttpTelemetryRepository implements ITelemetryRepository {
  async getHistory(deviceId: string, from?: string, to?: string, limit = 200, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]> {
    const path = withQuery(endpoints.telemetryHistory(deviceId), { from, to, limit });
    const raw = await httpRequest<unknown>(path, { signal });
    return mapTelemetryHistoryListDto(raw);
  }
  async getAggregate(deviceId: string, bucket: string, from?: string, to?: string, limit = 96, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]> {
    const path = withQuery(endpoints.telemetryAggregate(deviceId), { bucket, from, to, limit });
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
  async getRejectBreakdown(deviceId: string, from?: string, to?: string, signal?: AbortSignal): Promise<RejectBreakdownItem[]> {
    const path = withQuery(endpoints.qualityRejects(deviceId), { from, to, limit: 50, envelope: true });
    const raw = await httpRequest<unknown>(path, { signal });
    return mapRejectBreakdownDto(raw);
  }
  async getDeviceHealth(deviceId: string, signal?: AbortSignal): Promise<DeviceHealth | null> {
    try {
      const raw = await httpRequest<unknown>(endpoints.deviceHealth(deviceId), { signal });
      return mapDeviceHealthDto(raw);
    } catch (err) {
      if (err instanceof BackendHttpError && err.status === 404) return null;
      throw err;
    }
  }
  async getAllOperationalEvents(query: OperationalEventsQuery = {}, signal?: AbortSignal): Promise<{ data: OperationalEvent[]; meta: PageMeta }> {
    const path = withQuery(endpoints.operationalEventsGlobal(), {
      machine_id: query.machineId,
      event_type: query.eventType,
      from: query.from,
      to: query.to,
      limit: query.limit ?? 100,
      cursor: query.cursor,
      envelope: query.envelope ?? true,
    });
    const raw = await httpRequest<unknown>(path, { signal });
    return mapOperationalEventResultDto(raw);
  }
  async acknowledgeOperationalEvent(id: number, operatorId: string, note?: string): Promise<OperationalEvent> {
    const raw = await httpRequest<unknown>(endpoints.operationalEventAck(id), {
      method: 'PATCH',
      body: { note },
    });
    // Respons ack ringkas {id, acknowledgedAt, ...} — gabung ke bentuk event penuh.
    const ack = raw as { acknowledgedAt?: string; acknowledged_at?: string; acknowledgedBy?: string; acknowledged_by?: string; ackNote?: string; ack_note?: string };
    return {
      id,
      deviceId: null,
      machineId: null,
      eventType: 'ACKNOWLEDGED',
      timestamp: new Date().toISOString(),
      acknowledgedAt: (ack.acknowledgedAt ?? ack.acknowledged_at ?? new Date().toISOString()) as string,
      acknowledgedBy: (ack.acknowledgedBy ?? ack.acknowledged_by ?? operatorId) as string,
      ackNote: (ack.ackNote ?? ack.ack_note ?? note ?? null) as string | null,
    };
  }
  async getExport(deviceId: string, format: string, from?: string, to?: string, signal?: AbortSignal): Promise<Blob> {
    const path = withQuery(endpoints.telemetryExport(deviceId), { format, from, to });
    return httpDownload(path, { signal });
  }
}

export class OeeHttpHealthRepository implements IHealthRepository {
  async getHealth(signal?: AbortSignal): Promise<BackendHealth | null> {
    try {
      const raw = await httpRequest<unknown>(endpoints.health(), { signal });
      const body = raw as {
        status?: string;
        ws_clients?: number;
        wsClients?: number;
        buffer_pending?: number;
        bufferPending?: number;
        uptime_sec?: number;
        uptimeSec?: number;
        uptime?: number;
      };
      const toFinite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
      return {
        status: typeof body.status === 'string' ? body.status : 'ok',
        wsClients: toFinite(body.ws_clients ?? body.wsClients),
        bufferPending: toFinite(body.buffer_pending ?? body.bufferPending),
        uptimeSec: toFinite(body.uptime_sec ?? body.uptimeSec ?? body.uptime),
      };
    } catch (err) {
      return nullOnMissingEndpoint(err);
    }
  }
}

export class OeeHttpAuthGateway implements IAuthGateway {
  private lastOperator: AuthSession['operator'] | null = null;

  constructor(private readonly tokens: IAuthTokenStorage = new AuthTokenStorageAdapter()) {}

  async loginWithPassword(operatorId: string, password: string, stationId?: string): Promise<AuthSession> {
    const raw = await httpRequest<{
      token: string;
      expires_in: number;
      operator?: {
        id?: string; username?: string; role?: string;
        line_id?: string | null; lineId?: string | null;
        must_change_password?: boolean; mustChangePassword?: boolean;
      };
    }>(endpoints.authLogin(), {
      method: 'POST',
      body: { operator_id: operatorId, password, station_id: stationId || undefined },
    });
    this.tokens.setToken(raw.token);
    const session: AuthSession = {
      token: raw.token,
      expiresIn: raw.expires_in,
      operator: {
        id: raw.operator?.id ?? operatorId,
        username: raw.operator?.username ?? operatorId,
        role: raw.operator?.role ?? '',
        lineId: raw.operator?.line_id ?? raw.operator?.lineId ?? null,
        mustChangePassword: raw.operator?.must_change_password ?? raw.operator?.mustChangePassword ?? false,
      },
    };
    this.lastOperator = session.operator;
    return session;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await httpRequest(endpoints.authPasswordChange(), {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
  }

  logout(): void {
    this.tokens.clearToken();
    this.lastOperator = null;
  }

  getToken(): string | null {
    return this.tokens.getToken();
  }

  getStationId(): string | null {
    return this.tokens.getStationId();
  }

  setStationId(stationId: string): void {
    this.tokens.setStationId(stationId);
  }

  /** G13 sliding refresh — null hanya bila tak ada token; error propagate (FR-006). */
  async refreshSession(): Promise<AuthSession | null> {
    const current = this.tokens.getToken();
    if (!current) return null;
    const raw = await httpRequest<{ token: string; expires_in: number }>(endpoints.authRefresh(), {
      method: 'POST',
      body: { token: current },
    });
    this.tokens.setToken(raw.token);
    return {
      token: raw.token,
      expiresIn: raw.expires_in,
      operator: this.lastOperator ?? { id: '', username: '', role: '', lineId: null, mustChangePassword: false },
    };
  }

  /** §L/§3.4: bentuk nested {authz:{capabilities}} dan flat {capabilities} diterima. */
  async getCapabilities(): Promise<CapabilityMap> {
    const raw = await httpRequest<Record<string, unknown>>(endpoints.authMe());
    const authz = (raw.authz ?? raw) as { capabilities?: unknown };
    const list = Array.isArray(authz.capabilities) ? authz.capabilities : [];
    const map: CapabilityMap = {};
    for (const item of list as Array<{ key?: unknown; decision?: unknown }>) {
      if (typeof item?.key !== 'string') continue;
      const decision = item.decision;
      map[item.key] = decision === 'allow' || decision === 'deny' ? decision : 'unknown';
    }
    return map;
  }

  async getAccessMode(): Promise<AccessMode> {
    const raw = await httpRequest<Record<string, unknown>>(endpoints.systemAccessMode());
    const src = (raw.access ?? raw) as { mode?: unknown; channel?: unknown; mutations_allowed?: unknown; mutationsAllowed?: unknown };
    const channel = src.channel === 'lan' || src.channel === 'tunnel' ? src.channel : 'unknown';
    return {
      mode: typeof src.mode === 'string' ? src.mode : 'private',
      channel,
      mutationsAllowed: src.mutations_allowed === true || src.mutationsAllowed === true,
    };
  }
}

/** Returns null when the endpoint is not implemented (404); throws otherwise. */
function nullOnMissingEndpoint(err: unknown): null {
  if (err instanceof BackendHttpError && err.status === 404) return null;
  throw err;
}

export class OeeHttpShiftSummaryRepository implements IShiftSummaryRepository {
  async getShiftSummary(query: ShiftSummaryQuery, signal?: AbortSignal): Promise<ShiftSummary | null> {
    const path = withQuery(endpoints.shiftSummary(), {
      machine_id: query.machineId,
      device_id: query.deviceId,
      from: query.from,
      to: query.to,
      date: query.date,
      shift: query.shift,
    });
    try {
      const raw = await httpRequest<unknown>(path, { signal });
      return mapShiftSummaryDto(raw as Record<string, unknown>);
    } catch (err) {
      return nullOnMissingEndpoint(err);
    }
  }
}

export class OeeHttpShiftTimelineRepository implements IShiftTimelineRepository {
  async getShiftTimeline(query: ShiftTimelineQuery, signal?: AbortSignal): Promise<ShiftTimelineSegment[] | null> {
    const path = withQuery(endpoints.shiftTimeline(), {
      machine_id: query.machineId,
      device_id: query.deviceId,
      from: query.from,
      to: query.to,
      bucket: query.bucket,
    });
    try {
      const raw = await httpRequest<unknown>(path, { signal });
      return mapShiftTimelineListDto(raw);
    } catch (err) {
      return nullOnMissingEndpoint(err);
    }
  }
}
