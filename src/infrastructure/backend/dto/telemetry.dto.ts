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
import type { EdgeHealthPayload } from '../../../domain/entities/EdgeContracts';
import { toFiniteNumber } from '../../../domain/entities/backend/LiveState';

interface RawFrame {
  /** Relay envelope discriminator/type (`TELEMETRY_UPDATE`/`HEALTH_UPDATE`). */
  type?: string;
  /** Relay envelope payload; field telemetri flat ada di sini bila dibungkus. */
  data?: Record<string, unknown>;
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
  timestamp?: string; ts?: string; bucket?: string; recordedAt?: string; recorded_at?: string;
  deviceId?: string; device_id?: string;
  totalCount?: number; total_count?: number; total?: number;
  goodCount?: number; good_count?: number; good?: number;
  rejectCount?: number; reject_count?: number; reject?: number;
  oee?: string | number | null; total_oee?: string | number | null; avgOee?: string | number | null; avg_oee?: string | number | null;
  oeePct?: string | number | null;
  availability?: string | number | null; avgAvailability?: string | number | null; avg_availability?: string | number | null;
  availabilityPct?: string | number | null;
  performance?: string | number | null; avgPerformance?: string | number | null; avg_performance?: string | number | null;
  performancePct?: string | number | null;
  quality?: string | number | null; avgQuality?: string | number | null; avg_quality?: string | number | null;
  qualityPct?: string | number | null;
  isBuffered?: boolean; is_buffered?: boolean;
}

interface RawHourlyTrend {
  bucket?: string; hour?: string;
  deviceId?: string; device_id?: string;
  oee?: string | number | null; total_oee?: string | number | null; avgOee?: string | number | null; avg_oee?: string | number | null;
  oeePct?: string | number | null;
  availability?: string | number | null; avgAvailability?: string | number | null; avg_availability?: string | number | null;
  availabilityPct?: string | number | null;
  performance?: string | number | null; avgPerformance?: string | number | null; avg_performance?: string | number | null;
  performancePct?: string | number | null;
  quality?: string | number | null; avgQuality?: string | number | null; avg_quality?: string | number | null;
  qualityPct?: string | number | null;
  totalCount?: number; total_count?: number;
  goodCount?: number; good_count?: number;
  rejectCount?: number; reject_count?: number;
  estHourlyOutput?: number; est_hourly_output?: number;
  estHourlyReject?: number; est_hourly_reject?: number;
  targetPerHour?: number | null; target_per_hour?: number | null;
  state?: string | null;
  planned?: boolean | null;
  provisional?: boolean | null;
  operatingSec?: number | null; operating_sec?: number | null;
  runSec?: number | null; run_sec?: number | null;
  sampleCount?: number | null; sample_count?: number | null;
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
  lineId?: string; line_id?: string;
  shiftId?: string; shift_id?: string;
  scheduleId?: string; schedule_id?: string;
  dayOfWeek?: number; day_of_week?: number;
  eventId?: number; event_id?: number;
  isOnline?: boolean; is_online?: boolean;
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
  // Relay backend membungkus frame telemetri dalam envelope
  // `{ type: 'TELEMETRY_UPDATE', device_id, data: {…flat fields…} }`. Kontrak
  // lama mengirim field flat di root. Unwrap bila ada `data` objek, agar kedua
  // bentuk menghasilkan frame yang sama (kritis: tanpa ini semua counter 0).
  const inner = raw.data && typeof raw.data === 'object' ? (raw.data as RawFrame) : null;
  const src: RawFrame = inner
    ? { ...inner, is_buffered: inner.is_buffered ?? raw.is_buffered, isBuffered: inner.isBuffered ?? raw.isBuffered }
    : raw;
  const counters = src.counters ?? {};
  const timeMetrics = src.time_metrics_sec ?? {};
  const oee = src.oee ?? {};
  const plc = src.plc_modbus ?? {};
  const hw = src.hw_diag ?? {};
  const total = toFiniteNumber(counters.total ?? counters.tot ?? src.tot);
  const reject = toFiniteNumber(counters.reject ?? counters.rej ?? src.rej);
  return {
    timestamp: toFiniteNumber(src.timestamp ?? src.ts, Math.floor(Date.now() / 1000)),
    deviceId: src.device_id ?? src.deviceId ?? raw.device_id ?? raw.deviceId ?? '',
    machineId: src.machine_id ?? src.machineId ?? raw.machine_id ?? raw.machineId ?? '',
    woId: src.wo_id ?? src.woId ?? null,
    fsmState: src.fsm_state ?? src.currentState ?? 'UNKNOWN',
    counters: {
      total,
      good: toFiniteNumber(counters.good, Math.max(0, total - reject)),
      reject,
      lastCycleSec: toFiniteNumber(counters.last_cycle_sec ?? counters.lastCycleSec ?? (src.cyc != null ? src.cyc / 100 : 0)),
    },
    timeMetricsSec: {
      operatingTime: toFiniteNumber(timeMetrics.operating_time ?? timeMetrics.operatingTime),
      runTime: toFiniteNumber(timeMetrics.run_time ?? timeMetrics.runTime ?? src.run),
      downtime: toFiniteNumber(timeMetrics.downtime ?? src.dt),
    },
    oee: {
      availability: toFiniteNumber(oee.availability ?? (src.a != null ? src.a / 100 : 0)),
      performance: toFiniteNumber(oee.performance ?? (src.p != null ? src.p / 100 : 0)),
      quality: toFiniteNumber(oee.quality ?? (src.q != null ? src.q / 100 : 0)),
      totalOee: toFiniteNumber(oee.total_oee ?? oee.totalOee ?? (src.oee_x100 != null ? src.oee_x100 / 100 : 0)),
    },
    plcModbus: {
      spindleRpm: toFiniteNumber(plc.spindle_rpm ?? plc.spindleRpm ?? src.rpm),
      tempC: toFiniteNumber(plc.temp_c ?? plc.tempC ?? (src.tmp != null ? src.tmp / 10 : 0)),
      alarmCode: toFiniteNumber(plc.alarm_code ?? plc.alarmCode ?? src.alm),
    },
    hwDiag: { uptimeSec: toFiniteNumber(hw.uptime_sec ?? hw.uptimeSec), freeHeap: toFiniteNumber(hw.free_heap ?? hw.freeHeap) },
    isBuffered: src.is_buffered ?? src.isBuffered ?? false,
  };
}

/**
 * FR-017/FR-018 (ADR-0003): skema kanonis `*Pct` MENANG atas alias legacy
 * (`avg*`, nama lama); null dipertahankan (bucket tanpa sampel != 0).
 * Semua kandidat absen/null -> null (jujur, bukan fabrikasi nol).
 */
function toNullablePercent(...candidates: Array<string | number | null | undefined>): number | null {
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const n = toFiniteNumber(c, NaN);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function mapTelemetryHistoryDto(raw: RawTelemetryHistory): TelemetryHistoryPoint {
  return {
    timestamp: raw.timestamp ?? raw.ts ?? raw.recordedAt ?? raw.recorded_at ?? raw.bucket ?? new Date(0).toISOString(),
    deviceId: raw.deviceId ?? raw.device_id ?? '',
    totalCount: toFiniteNumber(raw.totalCount ?? raw.total_count ?? raw.total),
    goodCount: toFiniteNumber(raw.goodCount ?? raw.good_count ?? raw.good),
    rejectCount: toFiniteNumber(raw.rejectCount ?? raw.reject_count ?? raw.reject),
    oee: toNullablePercent(raw.oeePct, raw.oee, raw.total_oee, raw.avgOee, raw.avg_oee),
    availability: toNullablePercent(raw.availabilityPct, raw.availability, raw.avgAvailability, raw.avg_availability),
    performance: toNullablePercent(raw.performancePct, raw.performance, raw.avgPerformance, raw.avg_performance),
    quality: toNullablePercent(raw.qualityPct, raw.quality, raw.avgQuality, raw.avg_quality),
    isBuffered: raw.isBuffered ?? raw.is_buffered ?? false,
  };
}

export function mapTelemetryHistoryListDto(raw: unknown): TelemetryHistoryPoint[] {
  return unwrapList<RawTelemetryHistory>(raw).data.map(mapTelemetryHistoryDto);
}

export function mapHourlyTrendDto(raw: RawHourlyTrend): HourlyTrendPoint {
  // Backend v2 hourly mengirim `estHourlyOutput`/`estHourlyReject` (perkiraan
  // output/reject per jam) alih-alih totalCount/goodCount/rejectCount. Good
  // diturunkan = output - reject (aritmetika jujur, bukan fabrikasi).
  const totalCount = toFiniteNumber(raw.totalCount ?? raw.total_count ?? raw.estHourlyOutput ?? raw.est_hourly_output);
  const rejectCount = toFiniteNumber(raw.rejectCount ?? raw.reject_count ?? raw.estHourlyReject ?? raw.est_hourly_reject);
  const explicitGood = raw.goodCount ?? raw.good_count;
  const goodCount = explicitGood !== undefined && explicitGood !== null
    ? toFiniteNumber(explicitGood)
    : Math.max(0, totalCount - rejectCount);
  return {
    bucket: raw.bucket ?? raw.hour ?? '',
    deviceId: raw.deviceId ?? raw.device_id ?? '',
    oee: toNullablePercent(raw.oeePct, raw.oee, raw.total_oee, raw.avgOee, raw.avg_oee),
    availability: toNullablePercent(raw.availabilityPct, raw.availability, raw.avgAvailability, raw.avg_availability),
    performance: toNullablePercent(raw.performancePct, raw.performance, raw.avgPerformance, raw.avg_performance),
    quality: toNullablePercent(raw.qualityPct, raw.quality, raw.avgQuality, raw.avg_quality),
    totalCount,
    goodCount,
    rejectCount,
    targetPerHour: raw.targetPerHour ?? raw.target_per_hour ?? null,
    state: raw.state ?? null,
    planned: raw.planned ?? false,
    provisional: raw.provisional === true,
    operatingSec: raw.operatingSec ?? raw.operating_sec ?? null,
    runSec: raw.runSec ?? raw.run_sec ?? null,
    sampleCount: raw.sampleCount ?? raw.sample_count ?? null,
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

/**
 * FR-011: seluruh envelope lifecycle §4 (26 tipe) dipetakan defensif
 * (camelCase/snake_case campuran sesuai kontrak). Type tak dikenal → null
 * (ignore-unknown by design; server MAY menambah advisory types).
 */
export function mapWsLifecycleEventDto(raw: RawLifecycleEvent): WsLifecycleEvent | null {
  const type = raw.type;
  const deviceId = raw.deviceId ?? raw.device_id ?? '';
  const machineId = raw.machineId ?? raw.machine_id ?? '';
  const productId = raw.productId ?? raw.product_id ?? '';
  const lineId = raw.lineId ?? raw.line_id ?? '';
  const shiftId = raw.shiftId ?? raw.shift_id ?? '';
  const scheduleId = raw.scheduleId ?? raw.schedule_id ?? '';
  const eventId = toFiniteNumber(raw.eventId ?? raw.event_id);
  switch (type) {
    case 'MACHINE_BOUND':
    case 'MACHINE_UNBOUND':
      return { type, machineId, deviceId };
    case 'MACHINE_DELETED':
    case 'MACHINE_UPDATED':
      return { type, machineId };
    case 'MACHINE_CREATED':
      return { type, machineId, deviceId: deviceId || null };
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
    case 'PRODUCT_DELETED':
      return { type, productId };
    case 'PRODUCTION_LINE_CREATED':
    case 'PRODUCTION_LINE_UPDATED':
    case 'PRODUCTION_LINE_DELETED':
      return { type, lineId };
    case 'SHIFT_CREATED':
    case 'SHIFT_UPDATED':
    case 'SHIFT_DELETED':
      return { type, shiftId };
    case 'SHIFT_SCHEDULE_CREATED':
      return { type, lineId, shiftId, dayOfWeek: raw.dayOfWeek ?? raw.day_of_week ?? null };
    case 'SHIFT_SCHEDULE_UPDATED':
    case 'SHIFT_SCHEDULE_DELETED':
      return { type, scheduleId };
    case 'DEVICE_STATUS_UPDATE':
      return { type, deviceId, isOnline: raw.isOnline ?? raw.is_online ?? false };
    case 'DEVICE_EVENT':
      return { type, deviceId };
    case 'DOWNTIME_EVENT_OPENED':
    case 'DOWNTIME_EVENT_CLOSED':
      return { type, eventId, deviceId, machineId: machineId || null };
    case 'DOWNTIME_REASON_LABELED':
      return { type, eventId, deviceId };
    case 'WORK_ORDER_COMPLETED':
      return {
        type, deviceId, machineId,
        woId: raw.woId ?? raw.wo_id ?? raw.data?.woId ?? raw.data?.wo_id ?? '',
        status: raw.data?.status ?? raw.status ?? 'COMPLETED',
      };
    case 'WORK_ORDER_CANCELLED':
      return {
        type, deviceId, machineId,
        woId: raw.woId ?? raw.wo_id ?? raw.data?.woId ?? raw.data?.wo_id ?? '',
        status: 'ABORTED',
      };
    default:
      return null;
  }
}

interface RawWsHealthItem { name?: string; age_ms?: number; alive?: number }

interface RawWsHealth {
  timestamp?: number;
  heap_free?: number;
  tasks_healthy?: number;
  tasks_total?: number;
  stale_count?: number;
  stale_tasks?: RawWsHealthItem[];
  event_flags?: number;
}

export interface WsHealthUpdate {
  deviceId: string;
  health: EdgeHealthPayload;
}

/**
 * Relay `HEALTH_UPDATE` → payload domain health. `age_sec` dibiarkan
 * undefined: frame realtime selalu segar saat diterima (`isEdgeHealthOk`
 * menilai tanpa umur bila field ini absen).
 * Kembalikan null bila payload tak berbentuk health (caller abaikan).
 */
export function mapWsHealthDto(raw: unknown): WsHealthUpdate | null {
  if (!raw || typeof raw !== 'object') return null;
  const env = raw as { type?: unknown; device_id?: unknown; deviceId?: unknown; data?: unknown };
  if (env.type !== 'HEALTH_UPDATE') return null;
  const deviceId = typeof env.deviceId === 'string' ? env.deviceId
    : typeof env.device_id === 'string' ? env.device_id : '';
  if (deviceId === '') return null;
  const d = env.data && typeof env.data === 'object' ? (env.data as RawWsHealth) : {};
  const tasksTotal = toFiniteNumber(d.tasks_total);
  return {
    deviceId,
    health: {
      timestamp: toFiniteNumber(d.timestamp, Math.floor(Date.now() / 1000)),
      heap_free: toFiniteNumber(d.heap_free),
      tasks_healthy: toFiniteNumber(d.tasks_healthy),
      tasks_total: tasksTotal,
      stale_tasks: Array.isArray(d.stale_tasks)
        ? d.stale_tasks.map((s) => ({
            name: typeof s.name === 'string' ? s.name : '',
            age_ms: toFiniteNumber(s.age_ms),
            alive: s.alive === 0 ? 0 : 1,
          }))
        : [],
      stale_count: toFiniteNumber(d.stale_count),
      event_flags: toFiniteNumber(d.event_flags),
    },
  };
}
