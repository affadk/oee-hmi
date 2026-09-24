// /src/application/dto/live-state.dto.ts
// Boundary DTO: raw REST JSON (snake_case strings) → domain LiveStateSnapshot.
// Keeps API shape quirks out of domain entities.

import { LiveStateSnapshot, toFiniteNumber, LiveMachineState } from '../../domain/entities/backend/LiveState';

interface RawLiveState {
  deviceId?: string; device_id?: string;
  machineId?: string | null; machine_id?: string | null;
  woId?: string | null; wo_id?: string | null;
  currentState?: string; current_state?: string; fsm_state?: string;
  availability?: string | number; performance?: string | number;
  quality?: string | number; oee?: string | number; total_oee?: string | number;
  totalCount?: number; total_count?: number;
  goodCount?: number; good_count?: number;
  rejectCount?: number; reject_count?: number;
  lastCycleTimeSec?: string | number | null; last_cycle_sec?: number | null;
  operatingTimeSec?: number; operating_time?: number;
  runTimeSec?: number; run_time?: number;
  downtimeSec?: number; downtime?: number;
  spindleRpm?: string | number | null; spindle_rpm?: number | null;
  machineTempC?: string | number | null; temp_c?: number | null;
  plcAlarmCode?: number; plc_alarm_code?: number; alarm_code?: number;
  uptimeSeconds?: number; uptime_sec?: number;
  freeHeapBytes?: number; free_heap?: number;
  lastTelemetryAt?: string; last_telemetry_at?: string;
  updatedAt?: string; updated_at?: string;
}

const KNOWN_STATES: LiveMachineState[] = ['RUNNING','IDLE','DOWN','SETUP','PLANNED_STOP','UNCONFIGURED','READY','BATCH_FINISHED','PLANNED_DT','UNPLANNED_DT'];

// Backend FSM memakai PLANNED_DOWNTIME/UNPLANNED_DOWNTIME (FsmStateEnum);
// domain memakai PLANNED_DT/UNPLANNED_DT. Normalkan di batas DTO agar
// mesin downtime tidak jatuh ke UNCONFIGURED (= tampil IDLE).
function normalizeState(raw: unknown): LiveMachineState {
  const s = String(raw ?? 'UNCONFIGURED').toUpperCase();
  if (s === 'PLANNED_DOWNTIME') return 'PLANNED_DT';
  if (s === 'UNPLANNED_DOWNTIME') return 'UNPLANNED_DT';
  return (KNOWN_STATES as string[]).includes(s) ? (s as LiveMachineState) : 'UNCONFIGURED';
}

export function mapLiveStateDto(raw: RawLiveState): LiveStateSnapshot {
  return {
    deviceId: raw.deviceId ?? raw.device_id ?? '',
    machineId: raw.machineId ?? raw.machine_id ?? null,
    woId: raw.woId ?? raw.wo_id ?? null,
    currentState: normalizeState(raw.currentState ?? raw.current_state ?? raw.fsm_state),
    availability: toFiniteNumber(raw.availability),
    performance: toFiniteNumber(raw.performance),
    quality: toFiniteNumber(raw.quality),
    oee: toFiniteNumber(raw.oee ?? raw.total_oee),
    totalCount: toFiniteNumber(raw.totalCount ?? raw.total_count),
    goodCount: toFiniteNumber(raw.goodCount ?? raw.good_count),
    rejectCount: toFiniteNumber(raw.rejectCount ?? raw.reject_count),
    lastCycleTimeSec: toFiniteNumber(raw.lastCycleTimeSec ?? raw.last_cycle_sec ?? null) || null,
    operatingTimeSec: toFiniteNumber(raw.operatingTimeSec ?? raw.operating_time),
    runTimeSec: toFiniteNumber(raw.runTimeSec ?? raw.run_time),
    downtimeSec: toFiniteNumber(raw.downtimeSec ?? raw.downtime),
    spindleRpm: toFiniteNumber(raw.spindleRpm ?? raw.spindle_rpm ?? null) || null,
    machineTempC: toFiniteNumber(raw.machineTempC ?? raw.temp_c ?? null) || null,
    plcAlarmCode: toFiniteNumber(raw.plcAlarmCode ?? raw.plc_alarm_code ?? raw.alarm_code),
    uptimeSeconds: toFiniteNumber(raw.uptimeSeconds ?? raw.uptime_sec),
    freeHeapBytes: toFiniteNumber(raw.freeHeapBytes ?? raw.free_heap),
    lastTelemetryAt: raw.lastTelemetryAt ?? raw.last_telemetry_at ?? new Date(0).toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date(0).toISOString(),
  };
}

export function mapLiveStateListDto(raw: unknown): LiveStateSnapshot[] {
  if (Array.isArray(raw)) return (raw as RawLiveState[]).map(mapLiveStateDto);
  // Toleransi envelope {data} seperti endpoint list lain (G16): hanya mengubah
  // kasus yang kini rusak (non-array → []), bukan perilaku array telanjang.
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return ((raw as { data: RawLiveState[] }).data).map(mapLiveStateDto);
  }
  return [];
}
