// /src/application/dto/telemetry.dto.ts
// Boundary DTO: raw WS/REST telemetry frames → domain WsTelemetryFrame.

import type { WsTelemetryFrame } from '../../domain/entities/backend/Telemetry';

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

export function mapTelemetryFrameDto(raw: RawFrame): WsTelemetryFrame {
  const counters = raw.counters ?? {};
  const timeMetrics = raw.time_metrics_sec ?? {};
  const oee = raw.oee ?? {};
  const plc = raw.plc_modbus ?? {};
  const hw = raw.hw_diag ?? {};
  return {
    timestamp: raw.timestamp ?? raw.ts ?? Math.floor(Date.now() / 1000),
    deviceId: raw.device_id ?? raw.deviceId ?? '',
    machineId: raw.machine_id ?? raw.machineId ?? '',
    woId: raw.wo_id ?? raw.woId ?? null,
    fsmState: raw.fsm_state ?? raw.currentState ?? 'UNKNOWN',
    counters: {
      total: counters.total ?? counters.tot ?? raw.tot ?? 0,
      good: counters.good ?? 0,
      reject: counters.reject ?? counters.rej ?? raw.rej ?? 0,
      lastCycleSec: counters.last_cycle_sec ?? counters.lastCycleSec ?? (raw.cyc != null ? raw.cyc / 100 : 0),
    },
    timeMetricsSec: {
      operatingTime: timeMetrics.operating_time ?? timeMetrics.operatingTime ?? 0,
      runTime: timeMetrics.run_time ?? timeMetrics.runTime ?? raw.run ?? 0,
      downtime: timeMetrics.downtime ?? raw.dt ?? 0,
    },
    oee: {
      availability: oee.availability ?? (raw.a != null ? raw.a / 100 : 0),
      performance: oee.performance ?? (raw.p != null ? raw.p / 100 : 0),
      quality: oee.quality ?? (raw.q != null ? raw.q / 100 : 0),
      totalOee: oee.total_oee ?? oee.totalOee ?? 0,
    },
    plcModbus: {
      spindleRpm: plc.spindle_rpm ?? plc.spindleRpm ?? raw.rpm ?? 0,
      tempC: plc.temp_c ?? plc.tempC ?? (raw.tmp != null ? raw.tmp / 10 : 0),
      alarmCode: plc.alarm_code ?? plc.alarmCode ?? raw.alm ?? 0,
    },
    hwDiag: { uptimeSec: hw.uptime_sec ?? hw.uptimeSec ?? 0, freeHeap: hw.free_heap ?? hw.freeHeap ?? 0 },
    isBuffered: raw.is_buffered ?? raw.isBuffered ?? false,
  };
}
