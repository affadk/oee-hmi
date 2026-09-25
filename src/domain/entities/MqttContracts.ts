// /src/domain/entities/MqttContracts.ts

// MQTT Edge Controller Contracts (STM32H723 Spec v0.3.1)
export interface MqttTelemetryPayload {
  ts: number;           // Unix epoch timestamp
  st: number;           // 0=UNCONFIGURED, 1=READY, 2=RUNNING, 3=PLANNED_DT, 4=UNPLANNED_DT, 5=BATCH_FINISHED
  tot: number;          // total count
  rej: number;          // reject count
  cyc: number;          // last cycle in 10ms units (e.g. 1080 = 10.80s)
  run: number;          // run time in seconds
  dt: number;           // accumulated downtime in seconds
  oee: number;          // oee_x100 (e.g. 8240 = 82.40%)
  a: number;            // availability_x100 (e.g. 9120 = 91.20%)
  p: number;            // performance_x100 (e.g. 9450 = 94.50%)
  q: number;            // quality_x100 (e.g. 9560 = 95.60%)
  alm: number;          // plc alarm code
  rpm: number;          // plc rpm
  tmp: number;          // plc temp_c_x10 (e.g. 423 = 42.3 C)
  di: number;           // digital input bitmask PC0..5
  is_buffered: boolean; // true if draining from OSPI FIFO
}

export interface MqttJobConfigPayload {
  command: 'SET_JOB_CONFIG';
  transaction_id: string;
  work_order: string;
  product: {
    id: string;
    name: string;
    std_cycle_time_sec: number;
  };
  operator: {
    id: string;
    name: string;
  };
  shift_plan: {
    shift_start: string;
    shift_end: string;
    planned_break_min: number;
    planned_operating_sec: number;
    target_qty: number;
    /** Jendela istirahat "HH:MM - HH:MM" — opsional agar payload lama tetap valid. */
    break_window?: string;
  };
}

export interface MqttHealthPayload {
  timestamp: number;
  heap_free: number;
  tasks_healthy: number;
  tasks_total: number;
  stale_tasks: Array<{ name: string; age_ms: number; alive: number }>;
  stale_count: number;
  event_flags: number;
  /** G3: umur cache detik (hanya lane backend); undefined = frame MQTT langsung. */
  age_sec?: number;
}

/** Batas umur health sebelum badge Edge dianggap STALE (G3: age menandakan stale). */
export const EDGE_HEALTH_STALE_AFTER_SEC = 180;

export function isEdgeHealthOk(health: MqttHealthPayload): boolean {
  if ((health.stale_count ?? 0) !== 0) return false;
  if ((health.tasks_healthy ?? 0) !== (health.tasks_total ?? 0)) return false;
  if (health.age_sec != null && health.age_sec > EDGE_HEALTH_STALE_AFTER_SEC) return false;
  return true;
}
