// /src/domain/entities/backend/Telemetry.ts
// Domain entities for Telemetry history, downtime events, operational events,
// and WS broadcast frames (§I/J/K + §4 API_DOCUMENTATION.md).

export interface TelemetryHistoryPoint {
  timestamp: string;
  deviceId: string;
  totalCount: number;
  goodCount: number;
  rejectCount: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
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
  | { type: 'PRODUCT_DELETED'; productId: string }
  | { type: 'WORK_ORDER_CANCELLED'; deviceId: string; machineId: string; woId: string; status: 'ABORTED' };

export function isLiveTelemetryFrame(frame: WsTelemetryFrame): boolean {
  return frame.isBuffered === false;
}
