// /src/domain/entities/backend/LiveState.ts
// Domain entity mirroring GET /api/v1/live-state (§B API_DOCUMENTATION.md).
// Pure contract — no fetch, no framework imports.

import type { MachineStatus } from '../Machine';

export type LiveMachineState = 'RUNNING' | 'IDLE' | 'DOWN' | 'SETUP' | 'PLANNED_STOP' | 'UNCONFIGURED' | 'READY' | 'BATCH_FINISHED' | 'PLANNED_DT' | 'UNPLANNED_DT';

export interface LiveStateSnapshot {
  deviceId: string;
  machineId: string | null;
  woId: string | null;
  currentState: LiveMachineState;
  availability: number; // percent
  performance: number; // percent
  quality: number; // percent
  oee: number; // percent
  totalCount: number;
  goodCount: number;
  rejectCount: number;
  lastCycleTimeSec: number | null;
  operatingTimeSec: number;
  runTimeSec: number;
  downtimeSec: number;
  spindleRpm: number | null;
  machineTempC: number | null;
  plcAlarmCode: number;
  uptimeSeconds: number;
  freeHeapBytes: number;
  lastTelemetryAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

/** Coerce backend string numerics ("92.50") to numbers safely. */
export function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * FR-009: FSM kanonis (§6A/§7D) + legacy → MachineStatus domain.
 * Dipakai merge WS live (hook) dan snapshot; satu sumber normalisasi.
 * `STANDBY` legacy dinormalisasi server → READY, tetap ditoleransi di sini.
 */
export function fsmToMachineStatus(raw: unknown): MachineStatus {
  const s = String(raw ?? '').toUpperCase();
  switch (s) {
    case 'RUNNING': return 'RUNNING';
    case 'PLANNED_DOWNTIME':
    case 'PLANNED_DT':
    case 'PLANNED_STOP': return 'PLANNED_STOP';
    case 'UNPLANNED_DOWNTIME':
    case 'UNPLANNED_DT': return 'DOWN';
    case 'SETUP': return 'SETUP';
    case 'READY':
    case 'UNCONFIGURED':
    case 'BATCH_FINISHED':
    case 'STANDBY':
    case 'IDLE': return 'IDLE';
    default: return 'IDLE';
  }
}
