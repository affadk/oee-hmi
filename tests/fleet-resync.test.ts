// Unit 001 Fase 2 (T011/T012/T013/T015): FSM merge domain mapper,
// merge snapshot resync (FR-012), scheduler debounced refetch (FR-011).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fsmToMachineStatus } from '../src/domain/entities/backend/LiveState';
import { mergeSnapshotsIntoMachines } from '../src/application/fleetResync';
import { createRefetchScheduler, refetchKindsForEvent } from '../src/application/lifecycleRefetch';
import type { LiveStateSnapshot } from '../src/domain/entities/backend/LiveState';
import { makeMachine } from './helpers';

afterEach(() => vi.useRealTimers());

describe('fsmToMachineStatus — kanonis 6 + legacy (FR-009)', () => {
  it('memetakan himpunan kanonis', () => {
    expect(fsmToMachineStatus('RUNNING')).toBe('RUNNING');
    expect(fsmToMachineStatus('PLANNED_DOWNTIME')).toBe('PLANNED_STOP');
    expect(fsmToMachineStatus('UNPLANNED_DOWNTIME')).toBe('DOWN');
    expect(fsmToMachineStatus('READY')).toBe('IDLE');
    expect(fsmToMachineStatus('UNCONFIGURED')).toBe('IDLE');
    expect(fsmToMachineStatus('BATCH_FINISHED')).toBe('IDLE');
  });
  it('legacy STANDBY/PLANNED_DT/UNPLANNED_DT + unknown toleran', () => {
    expect(fsmToMachineStatus('STANDBY')).toBe('IDLE');
    expect(fsmToMachineStatus('PLANNED_DT')).toBe('PLANNED_STOP');
    expect(fsmToMachineStatus('UNPLANNED_DT')).toBe('DOWN');
    expect(fsmToMachineStatus('WEIRD')).toBe('IDLE');
  });
});

function makeSnapshot(overrides: Partial<LiveStateSnapshot> = {}): LiveStateSnapshot {
  return {
    deviceId: 'STM32-OEE-01', machineId: 'MC-01', woId: 'WO-1', currentState: 'RUNNING',
    availability: 90, performance: 95, quality: 98, oee: 83.8,
    totalCount: 2000, goodCount: 1948, rejectCount: 52, lastCycleTimeSec: 4.45,
    operatingTimeSec: 28800, runTimeSec: 26640, downtimeSec: 2160,
    uptimeSeconds: 86400, freeHeapBytes: 48200,
    lastTelemetryAt: '2026-11-20T03:00:00.000Z', updatedAt: '2026-11-20T03:00:01.000Z',
    ...overrides,
  } as LiveStateSnapshot;
}

describe('mergeSnapshotsIntoMachines — resync (FR-012)', () => {
  it('merge counters/status/telemetry per deviceId', () => {
    const machines = [makeMachine()];
    const merged = mergeSnapshotsIntoMachines(machines, [makeSnapshot()]);
    const m = merged[0];
    expect(m?.totalCount).toBe(2000);
    expect(m?.rejectCount).toBe(52);
    expect(m?.status).toBe('RUNNING');
    expect(m?.telemetry.oee).toBe(8380);
    expect(m?.telemetry.tot).toBe(2000);
    expect(m?.lastTelemetryTs).toBe(Math.floor(Date.parse('2026-11-20T03:00:00.000Z') / 1000));
  });

  it('statusSince berubah hanya saat transisi status', () => {
    const machines = [makeMachine({ status: 'RUNNING', statusSince: '2026-11-20T01:00:00.000Z' })];
    const same = mergeSnapshotsIntoMachines(machines, [makeSnapshot({ currentState: 'RUNNING' })]);
    expect(same[0]?.statusSince).toBe('2026-11-20T01:00:00.000Z');
    const changed = mergeSnapshotsIntoMachines(machines, [makeSnapshot({ currentState: 'UNPLANNED_DT' })]);
    expect(changed[0]?.status).toBe('DOWN');
    expect(changed[0]?.statusSince).toBe('2026-11-20T03:00:01.000Z');
  });

  it('snapshot kosong / device tak dikenal = state tidak disentuh', () => {
    const machines = [makeMachine()];
    expect(mergeSnapshotsIntoMachines(machines, [])).toBe(machines);
    const untouched = mergeSnapshotsIntoMachines(machines, [makeSnapshot({ deviceId: 'STM32-OTHER' })]);
    expect(untouched[0]).toBe(machines[0]);
  });
});

describe('createRefetchScheduler — debounce + dedupe (FR-011/NFR-001)', () => {
  it('satu refetch per jenis per jendela debounce', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const sched = createRefetchScheduler(run);
    sched.schedule(['fleet', 'fleet', 'registry']);
    vi.advanceTimersByTime(1_400);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledWith('fleet');
    expect(run).toHaveBeenCalledWith('registry');
    sched.dispose();
  });

  it('dispose membatalkan refetch tertunda', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const sched = createRefetchScheduler(run);
    sched.schedule(['supplemental']);
    sched.dispose();
    vi.advanceTimersByTime(5_000);
    expect(run).not.toHaveBeenCalled();
  });

  it('klasifikasi event: downtime → supplemental; master → fleet+registry; presence → langsung', () => {
    expect(refetchKindsForEvent('DOWNTIME_EVENT_OPENED')).toEqual(['supplemental']);
    expect(refetchKindsForEvent('WORK_ORDER_COMPLETED')).toEqual(['fleet', 'supplemental']);
    expect(refetchKindsForEvent('MACHINE_BOUND')).toEqual(['fleet', 'registry']);
    expect(refetchKindsForEvent('SHIFT_SCHEDULE_UPDATED')).toEqual(['fleet', 'registry']);
    expect(refetchKindsForEvent('DEVICE_STATUS_UPDATE')).toEqual([]);
  });
});
