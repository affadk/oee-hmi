// Shared fixtures for pure-logic tests (no IO, no network, no DOM).
// Covers domain entities/services, DTO mappers, and endpoint builders.

import type { MachineConfig } from '../src/domain/entities/Machine';
import type { MqttTelemetryPayload, MqttHealthPayload } from '../src/domain/entities/MqttContracts';

export function makeTelemetry(overrides: Partial<MqttTelemetryPayload> = {}): MqttTelemetryPayload {
  return {
    ts: 1_700_000_000,
    st: 2,
    tot: 945,
    rej: 41,
    cyc: 900, // 9.00s in 10ms units
    run: 25200,
    dt: 3600,
    oee: 8240,
    a: 9120,
    p: 9450,
    q: 9560,
    alm: 0,
    rpm: 1450,
    tmp: 423,
    di: 0,
    is_buffered: false,
    ...overrides,
  };
}

export function makeHealth(overrides: Partial<MqttHealthPayload> = {}): MqttHealthPayload {
  return {
    timestamp: 1_700_000_000,
    heap_free: 184320,
    tasks_healthy: 6,
    tasks_total: 6,
    stale_tasks: [],
    stale_count: 0,
    event_flags: 1,
    ...overrides,
  };
}

export function makeMachine(overrides: Partial<MachineConfig> = {}): MachineConfig {
  return {
    id: 'MC-01',
    name: 'Test Machine',
    deviceId: 'STM32-OEE-01',
    connectionStatus: 'ONLINE',
    lastTelemetryTs: 1_700_000_000,
    jobConfig: {
      workOrder: 'WO-1',
      productName: 'Flange',
      productId: 'PRD-FLANGE',
      operatorName: 'Budi',
      operatorId: 'OP-1',
      standardCycleTimeSec: 9,
      targetQuantity: 2800,
      shiftStart: '06:00',
      shiftEnd: '14:00',
      plannedBreakMin: 60,
      plannedOperatingSec: 25200,
    },
    telemetry: makeTelemetry(),
    health: makeHealth(),
    hourlyTrends: [],
    targetOee: 85,
    targetAvailability: 90,
    targetPerformance: 95,
    targetQuality: 98,
    status: 'RUNNING',
    currentProduct: 'Flange',
    idealCycleTimeSec: 9,
    actualCycleTimeSec: 9.5,
    shiftDurationMinutes: 480,
    plannedDowntimeMinutes: 60,
    unplannedDowntimeMinutes: 60,
    targetCount: 2800,
    totalCount: 945,
    goodCount: 904,
    rejectCount: 41,
    ...overrides,
  };
}
