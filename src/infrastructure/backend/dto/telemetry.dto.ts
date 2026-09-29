// /src/application/dto/telemetry.dto.ts
// Boundary DTO: raw WS/REST telemetry frames → domain WsTelemetryFrame.

import type {
  DowntimeCategory,
  DowntimeEvent,
  OperationalEvent,
  TelemetryHistoryPoint,
  WsLifecycleEvent,
  WsTelemetryFrame,
} from '../../../domain/entities/backend/Telemetry';
import { ALL_DOWNTIME_CATEGORIES } from '../../../domain/entities/backend/Telemetry';
import type { HourlyTrendPoint, PageMeta } from '../../../domain/ports/IOeeBackend';
import type { DeviceHealth, RejectBreakdownItem } from '../../../domain/entities/backend/Telemetry';
import { toFiniteNumber } from '../../../domain/entities/backend/LiveState';

interface RawFrame {
  timestamp?: number; ts?: number;
  device_id?: string; deviceId?: string;
  machine_id?: string; machineId?: string;
  wo_id?: string | null; woId?: string | null;
  fsm_state?: string; currentState?: string;
  counters?: { total?: number; tot?: number; good?: number; reject?: number; rej?: number; last_cycle_sec?: number; lastCycleSec?: number };
  tot?: number; rej?: number; cyc?: number;
  time_metrics_sec?: { operating_time?: number; operatingTime?: number; run_time?: number; runTime?: number; downtime?: number };
  run?: number; dt?: number;
  oee?: { availability?: number; a?: number; performance?: number; p?: number; quality?: number; q?: number; total_oee?: number; totalOee?: number };
  a?: number; p?: number; q?: number; oee_x100?: number;
  plc_modbus?: { spindle_rpm?: number; spindleRpm?: number; temp_c?: number; tempC?: number; alarm_code?: number; alarmCode?: number };
  rpm?: number; tmp?: number; alm?: number;
  hw_diag?: { uptime_sec?: number; uptimeSec?: number; free_heap?: number; freeHeap?: number };
  is_buffered?: boolean; isBuffered?: boolean;
}

interface RawTelemetryHistory {
  timestamp?: string; ts?: string; bucket?: string;
  deviceId?: string; device_id?: string;
  totalCount?: number; total_count?: number; total?: number;
  goodCount?: number; good_count?: number; good?: number;
  rejectCount?: number; reject_count?: number; reject?: number;
  oee?: string | number; total_oee?: string | number;
  availability?: string | number;
  performance?: string | number;
  quality?: string | number;
  isBuffered?: boolean; is_buffered?: boolean;
}

interface RawHourlyTrend {
  bucket?: string; hour?: string;
  deviceId?: string; device_id?: string;
  oee?: string | number; total_oee?: string | number;
  availability?: string | number;
  performance?: string | number;
  quality?: string | number;
  totalCount?: number; total_count?: number;
  goodCount?: number; good_count?: number;
  rejectCount?: number; reject_count?: number;
  targetPerHour?: number | null; target_per_hour?: number | null;
  state?: string | null;
  planned?: boolean | null;
}

interface RawDowntime {
  id?: number;
  deviceId?: string | null; device_id?: string | null;
  machineId?: string | null; machine_id?: string | null;
  category?: DowntimeCategory | null;
  operatorReason?: string | null; operator_reason?: string | null; reason?: string | null;
  startTime?: string; start_time?: string;
  endTime?: string | null; end_time?: string | null;
}

interface RawOperationalEvent {
  id?: number;
  deviceId?: string | null; device_id?: string | null;
  machineId?: string | null; machine_id?: string | null;
  eventType?: string; event_type?: string;
  timestamp?: string; created_at?: string; recordedAt?: string; recorded_at?: string;
  acknowledgedAt?: string | null; acknowledged_at?: string | null;
  acknowledgedBy?: string | null; acknowledged_by?: string | null;
  ackNote?: string | null; ack_note?: string | null;
}

interface RawRejectBreakdown {
  reason?: string;
  count?: number;
  pct?: number;
}

interface RawDeviceHealth {
  deviceId?: string; device_id?: string;
  timestamp?: string;
  heapFree?: number; heap_free?: number;
  tasksHealthy?: number; tasks_healthy?: number;
  tasksTotal?: number; tasks_total?: number;
  staleCount?: number; stale_count?: number;
  staleTasks?: string[]; stale_tasks?: string[];
  eventFlags?: number; event_flags?: number;
  ageSec?: number; age_sec?: number;
}

interface RawLifecycleEvent {
  type?: string;
  deviceId?: string; device_id?: string;
  machineId?: string; machine_id?: string;
  woId?: string; wo_id?: string;
  productId?: string; product_id?: string;
  status?: string;
  data?: { wo_id?: string; woId?: string; status?: string };
}

function unwrapList<T>(raw: unknown): { data: T[]; meta: PageMeta } {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const envelope = raw as { data?: unknown; meta?: Partial<PageMeta> };
    return {
      data: Array.isArray(envelope.data) ? (envelope.data as T[]) : [],
      meta: {
        limit: envelope.meta?.limit ?? 0,
        hasMore: envelope.meta?.hasMore ?? false,
        nextCursor: envelope.meta?.nextCursor ?? null,
        count: envelope.meta?.count ?? 0,
      },
    };
  }
  return { data: Array.isArray(raw) ? (raw as T[]) : [], meta: { limit: 0, hasMore: false, nextCursor: null, count: 0 } };
}

export function mapTelemetryFrameDto(raw: RawFrame): WsTelemetryFrame {
  const counters = raw.counters ?? {};
  const timeMetrics = raw.time_metrics_sec ?? {};
  const oee = raw.oee ?? {};
  const plc = raw.plc_modbus ?? {};
  const hw = raw.hw_diag ?? {};
  const total = toFiniteNumber(counters.total ?? counters.tot ?? raw.tot);
  const reject = toFiniteNumber(counters.reject ?? counters.rej ?? raw.rej);
  return {
    timestamp: toFiniteNumber(raw.timestamp ?? raw.ts, Math.floor(Date.now() / 1000)),
    deviceId: raw.device_id ?? raw.deviceId ?? '',
    machineId: raw.machine_id ?? raw.machineId ?? '',
    woId: raw.wo_id ?? raw.woId ?? null,
    fsmState: raw.fsm_state ?? raw.currentState ?? 'UNKNOWN',
    counters: {
      total,
      good: toFiniteNumber(counters.good, Math.max(0, total - reject)),
      reject,
      lastCycleSec: toFiniteNumber(counters.last_cycle_sec ?? counters.lastCycleSec ?? (raw.cyc != null ? raw.cyc / 100 : 0)),
    },
    timeMetricsSec: {
      operatingTime: toFiniteNumber(timeMetrics.operating_time ?? timeMetrics.operatingTime),
      runTime: toFiniteNumber(timeMetrics.run_time ?? timeMetrics.runTime ?? raw.run),
      downtime: toFiniteNumber(timeMetrics.downtime ?? raw.dt),
    },
    oee: {
      availability: toFiniteNumber(oee.availability ?? (raw.a != null ? raw.a / 100 : 0)),
      performance: toFiniteNumber(oee.performance ?? (raw.p != null ? raw.p / 100 : 0)),
      quality: toFiniteNumber(oee.quality ?? (raw.q != null ? raw.q / 100 : 0)),
      totalOee: toFiniteNumber(oee.total_oee ?? oee.totalOee ?? (raw.oee_x100 != null ? raw.oee_x100 / 100 : 0)),
    },
    plcModbus: {
      spindleRpm: toFiniteNumber(plc.spindle_rpm ?? plc.spindleRpm ?? raw.rpm),
      tempC: toFiniteNumber(plc.temp_c ?? plc.tempC ?? (raw.tmp != null ? raw.tmp / 10 : 0)),
      alarmCode: toFiniteNumber(plc.alarm_code ?? plc.alarmCode ?? raw.alm),
    },
    hwDiag: { uptimeSec: toFiniteNumber(hw.uptime_sec ?? hw.uptimeSec), freeHeap: toFiniteNumber(hw.free_heap ?? hw.freeHeap) },
    isBuffered: raw.is_buffered ?? raw.isBuffered ?? false,
  };
}

export function mapTelemetryHistoryDto(raw: RawTelemetryHistory): TelemetryHistoryPoint {
  return {
    timestamp: raw.timestamp ?? raw.ts ?? raw.bucket ?? new Date(0).toISOString(),
    deviceId: raw.deviceId ?? raw.device_id ?? '',
    totalCount: toFiniteNumber(raw.totalCount ?? raw.total_count ?? raw.total),
    goodCount: toFiniteNumber(raw.goodCount ?? raw.good_count ?? raw.good),
    rejectCount: toFiniteNumber(raw.rejectCount ?? raw.reject_count ?? raw.reject),
    oee: toFiniteNumber(raw.oee ?? raw.total_oee),
    availability: toFiniteNumber(raw.availability),
    performance: toFiniteNumber(raw.performance),
    quality: toFiniteNumber(raw.quality),
    isBuffered: raw.isBuffered ?? raw.is_buffered ?? false,
  };
}

export function mapTelemetryHistoryListDto(raw: unknown): TelemetryHistoryPoint[] {
  return unwrapList<RawTelemetryHistory>(raw).data.map(mapTelemetryHistoryDto);
}

export function mapHourlyTrendDto(raw: RawHourlyTrend): HourlyTrendPoint {
  return {
    bucket: raw.bucket ?? raw.hour ?? '',
    deviceId: raw.deviceId ?? raw.device_id ?? '',
    oee: toFiniteNumber(raw.oee ?? raw.total_oee),
    availability: toFiniteNumber(raw.availability),
    performance: toFiniteNumber(raw.performance),
    quality: toFiniteNumber(raw.quality),
    totalCount: toFiniteNumber(raw.totalCount ?? raw.total_count),
    goodCount: toFiniteNumber(raw.goodCount ?? raw.good_count),
    rejectCount: toFiniteNumber(raw.rejectCount ?? raw.reject_count),
    targetPerHour: raw.targetPerHour ?? raw.target_per_hour ?? null,
    state: raw.state ?? null,
    planned: raw.planned ?? false,
  };
}

export function mapHourlyTrendResultDto(raw: unknown): { data: HourlyTrendPoint[]; meta: PageMeta } {
  const unwrapped = unwrapList<RawHourlyTrend>(raw);
  return { data: unwrapped.data.map(mapHourlyTrendDto), meta: unwrapped.meta };
}

export function mapDowntimeEventDto(raw: RawDowntime): DowntimeEvent {
  const operatorReason = raw.operatorReason ?? raw.operator_reason ?? raw.reason ?? null;
  return {
    id: toFiniteNumber(raw.id),
    deviceId: raw.deviceId ?? raw.device_id ?? null,
    machineId: raw.machineId ?? raw.machine_id ?? null,
    // Backend GET /downtime-events tidak mengembalikan kolom `category` terpisah —
    // kategori Six Big Losses hanya ada sebagai prefix "[CATEGORY] ..." di
    // `operatorReason` (lihat services/downtime.ts: format "[CATEGORY] reason").
    // Ekstrak di sini agar pemisah planned/unplanned + label changeover tetap jalan.
    category: raw.category ?? parseCategoryFromReason(operatorReason),
    operatorReason,
    startTime: raw.startTime ?? raw.start_time ?? new Date(0).toISOString(),
    endTime: raw.endTime ?? raw.end_time ?? null,
  };
}

/** "[SETUP_AND_ADJUSTMENT] Ganti roll ..." -> "SETUP_AND_ADJUSTMENT", else null. */
export function parseCategoryFromReason(reason: string | null | undefined): DowntimeCategory | null {
  if (!reason) return null;
  const m = reason.match(/^\s*\[([A-Z0-9_]+)\]/);
  if (!m) return null;
  const cat = m[1] ?? '';
  return (ALL_DOWNTIME_CATEGORIES as readonly string[]).includes(cat)
    ? (cat as DowntimeCategory)
    : null;
}

export function mapDowntimeResultDto(raw: unknown): { data: DowntimeEvent[]; meta: PageMeta } {
  const unwrapped = unwrapList<RawDowntime>(raw);
  return { data: unwrapped.data.map(mapDowntimeEventDto), meta: unwrapped.meta };
}

export function mapOperationalEventDto(raw: RawOperationalEvent): OperationalEvent {
  return {
    id: toFiniteNumber(raw.id),
    deviceId: raw.deviceId ?? raw.device_id ?? null,
    machineId: raw.machineId ?? raw.machine_id ?? null,
    eventType: raw.eventType ?? raw.event_type ?? 'UNKNOWN',
    timestamp: raw.timestamp ?? raw.recordedAt ?? raw.recorded_at ?? raw.created_at ?? new Date(0).toISOString(),
    acknowledgedAt: (raw.acknowledgedAt ?? raw.acknowledged_at ?? null) as string | null,
    acknowledgedBy: raw.acknowledgedBy ?? raw.acknowledged_by ?? null,
    ackNote: raw.ackNote ?? raw.ack_note ?? null,
  };
}

/** G1: pareto reject — lewati baris tak valid, jangan fabrikasi. */
export function mapRejectBreakdownDto(raw: unknown): RejectBreakdownItem[] {
  const list = Array.isArray(raw) ? raw : (raw as { data?: unknown }).data;
  if (!Array.isArray(list)) return [];
  const out: RejectBreakdownItem[] = [];
  for (const item of list as RawRejectBreakdown[]) {
    if (!item || typeof item.reason !== 'string' || !Number.isFinite(item.count)) continue;
    out.push({
      reason: item.reason,
      count: Math.max(0, Math.floor(item.count as number)),
      pct: Number.isFinite(item.pct) ? (item.pct as number) : 0,
    });
  }
  return out;
}

/** G3: health edge — null bila bentuk tak dikenali (cache-miss jujur). */
export function mapDeviceHealthDto(raw: unknown): DeviceHealth | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as RawDeviceHealth;
  const deviceId = r.deviceId ?? r.device_id;
  if (!deviceId) return null;
  const ageSec = r.ageSec ?? r.age_sec ?? null;
  return {
    deviceId,
    timestamp: r.timestamp ?? new Date(0).toISOString(),
    heapFree: r.heapFree ?? r.heap_free ?? 0,
    tasksHealthy: r.tasksHealthy ?? r.tasks_healthy ?? 0,
    tasksTotal: r.tasksTotal ?? r.tasks_total ?? 0,
    staleCount: r.staleCount ?? r.stale_count ?? 0,
    staleTasks: r.staleTasks ?? r.stale_tasks ?? [],
    eventFlags: r.eventFlags ?? r.event_flags ?? 0,
    ageSec: ageSec ?? 999999,
  };
}

export function mapOperationalEventResultDto(raw: unknown): { data: OperationalEvent[]; meta: PageMeta } {
  const unwrapped = unwrapList<RawOperationalEvent>(raw);
  return { data: unwrapped.data.map(mapOperationalEventDto), meta: unwrapped.meta };
}

export function mapWsLifecycleEventDto(raw: RawLifecycleEvent): WsLifecycleEvent | null {
  const type = raw.type;
  if (type === 'MACHINE_BOUND') {
    return { type, machineId: raw.machineId ?? raw.machine_id ?? '', deviceId: raw.deviceId ?? raw.device_id ?? '' };
  }
  if (type === 'MACHINE_UNBOUND') {
    return { type, machineId: raw.machineId ?? raw.machine_id ?? '', deviceId: raw.deviceId ?? raw.device_id ?? '' };
  }
  if (type === 'MACHINE_DELETED') {
    return { type, machineId: raw.machineId ?? raw.machine_id ?? '' };
  }
  if (type === 'PRODUCT_DELETED') {
    return { type, productId: raw.productId ?? raw.product_id ?? '' };
  }
  if (type === 'WORK_ORDER_CANCELLED') {
    return {
      type,
      deviceId: raw.deviceId ?? raw.device_id ?? '',
      machineId: raw.machineId ?? raw.machine_id ?? '',
      woId: raw.woId ?? raw.wo_id ?? raw.data?.woId ?? raw.data?.wo_id ?? '',
      status: 'ABORTED',
    };
  }
  return null;
}
