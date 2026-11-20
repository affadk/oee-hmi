// /src/domain/entities/backend/Telemetry.ts
// Domain entities for Telemetry history, downtime events, operational events,
// and WS broadcast frames (§I/J/K + §4 API_DOCUMENTATION.md).

export interface TelemetryHistoryPoint {
  timestamp: string;
  deviceId: string;
  totalCount: number;
  goodCount: number;
  rejectCount: number;
  /** FR-018: null = tanpa sampel (bukan 0). */
  oee: number | null;
  availability: number | null;
  performance: number | null;
  quality: number | null;
  isBuffered: boolean;
}

export type DowntimeCategory =
  | 'EQUIPMENT_FAILURE'
  | 'SETUP_AND_ADJUSTMENT'
  | 'IDLING_AND_MINOR_STOPPAGE'
  | 'REDUCED_SPEED'
  | 'PROCESS_DEFECT'
  | 'MATERIAL_SHORTAGE'
  | 'PLANNED_MAINTENANCE'
  | 'REST_BREAK'
  | 'CLEANING_5S'
  | 'OTHER';

/**
 * Kategori downtime yang dihitung sebagai planned stop (mengurangi shift
 * time, bukan run time — ISO 22400). Changeover terjadwal
 * (SETUP_AND_ADJUSTMENT) termasuk planned, sejajar break/maintenance.
 * Satu-satunya sumber kebenaran — dipakai GetDowntimeReasonsUseCase dan
 * BackendMachineRepository agar tidak divergen lagi.
 */
export const PLANNED_DOWNTIME_CATEGORIES: ReadonlySet<DowntimeCategory> = new Set([
  'PLANNED_MAINTENANCE',
  'REST_BREAK',
  'CLEANING_5S',
  'SETUP_AND_ADJUSTMENT',
]);

export const ALL_DOWNTIME_CATEGORIES: readonly DowntimeCategory[] = [
  'EQUIPMENT_FAILURE',
  'SETUP_AND_ADJUSTMENT',
  'IDLING_AND_MINOR_STOPPAGE',
  'REDUCED_SPEED',
  'PROCESS_DEFECT',
  'MATERIAL_SHORTAGE',
  'PLANNED_MAINTENANCE',
  'REST_BREAK',
  'CLEANING_5S',
  'OTHER',
];

export function isPlannedDowntimeCategory(category: DowntimeCategory | string | null | undefined): boolean {
  if (!category) return false;
  return (PLANNED_DOWNTIME_CATEGORIES as ReadonlySet<string>).has(category);
}

export interface DowntimeEvent {
  id: number;
  deviceId: string | null;
  machineId: string | null;
  category: DowntimeCategory | null;
  operatorReason: string | null;
  startTime: string;
  endTime: string | null;
}

export interface OperationalEvent {
  id: number;
  deviceId: string | null;
  machineId: string | null;
  eventType: string;
  timestamp: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  ackNote: string | null;
}

/** Reject pareto item — GET /api/v1/quality/rejects/:device_id (G1). */
export interface RejectBreakdownItem {
  reason: string;
  count: number;
  pct: number;
}

/** Latest cached STM32 edge health — GET /api/v1/devices/:id/health (G3). */
export interface DeviceHealth {
  deviceId: string;
  timestamp: string;
  heapFree: number;
  tasksHealthy: number;
  tasksTotal: number;
  staleCount: number;
  staleTasks: string[];
  eventFlags: number;
  ageSec: number;
}

/** WS telemetry broadcast frame (server → client), §4. is_buffered frames must not drive 60fps UI. */
export interface WsTelemetryFrame {
  timestamp: number;
  deviceId: string;
  machineId: string;
  woId: string | null;
  fsmState: string;
  counters: { total: number; good: number; reject: number; lastCycleSec: number };
  timeMetricsSec: { operatingTime: number; runTime: number; downtime: number };
  oee: { availability: number; performance: number; quality: number; totalOee: number };
  plcModbus: { spindleRpm: number; tempC: number; alarmCode: number };
  hwDiag: { uptimeSec: number; freeHeap: number };
  isBuffered: boolean;
}

export type WsLifecycleEvent =
  | { type: 'MACHINE_BOUND'; machineId: string; deviceId: string }
  | { type: 'MACHINE_UNBOUND'; machineId: string; deviceId: string }
  | { type: 'MACHINE_DELETED'; machineId: string }
  | { type: 'MACHINE_CREATED'; machineId: string; deviceId: string | null }
  | { type: 'MACHINE_UPDATED'; machineId: string }
  | { type: 'PRODUCT_CREATED'; productId: string }
  | { type: 'PRODUCT_UPDATED'; productId: string }
  | { type: 'PRODUCT_DELETED'; productId: string }
  | { type: 'PRODUCTION_LINE_CREATED'; lineId: string }
  | { type: 'PRODUCTION_LINE_UPDATED'; lineId: string }
  | { type: 'PRODUCTION_LINE_DELETED'; lineId: string }
  | { type: 'SHIFT_CREATED'; shiftId: string }
  | { type: 'SHIFT_UPDATED'; shiftId: string }
  | { type: 'SHIFT_DELETED'; shiftId: string }
  | { type: 'SHIFT_SCHEDULE_CREATED'; lineId: string; shiftId: string; dayOfWeek: number | null }
  | { type: 'SHIFT_SCHEDULE_UPDATED'; scheduleId: string }
  | { type: 'SHIFT_SCHEDULE_DELETED'; scheduleId: string }
  | { type: 'DEVICE_STATUS_UPDATE'; deviceId: string; isOnline: boolean }
  | { type: 'DEVICE_EVENT'; deviceId: string }
  | { type: 'DOWNTIME_EVENT_OPENED'; eventId: number; deviceId: string; machineId: string | null }
  | { type: 'DOWNTIME_EVENT_CLOSED'; eventId: number; deviceId: string; machineId: string | null }
  | { type: 'DOWNTIME_REASON_LABELED'; eventId: number; deviceId: string }
  | { type: 'WORK_ORDER_COMPLETED'; deviceId: string; machineId: string; woId: string; status: string }
  | { type: 'WORK_ORDER_CANCELLED'; deviceId: string; machineId: string; woId: string; status: 'ABORTED' };

export function isLiveTelemetryFrame(frame: WsTelemetryFrame): boolean {
  return frame.isBuffered === false;
}
