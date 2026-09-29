import { describe, expect, it } from 'vitest';
import { mapShiftSummaryDto, mapShiftTimelineListDto } from '../src/infrastructure/backend/dto/shift.dto';
import { toTimelineSegments } from '../src/domain/services/ShiftTimeline';
import { GetShiftSummaryUseCase } from '../src/application/use-cases/GetShiftSummaryUseCase';
import { GetShiftTimelineUseCase } from '../src/application/use-cases/GetShiftTimelineUseCase';
import { mergeShiftSummary } from '../src/application/hooks/useShiftServerData';
import { OeeCalculator } from '../src/domain/services/OeeCalculator';
import { makeMachine } from './helpers';
import type { IShiftSummaryRepository, IShiftTimelineRepository } from '../src/domain/ports/IShiftSummary';

// Example payloads straight from the spec (§3.1/§3.2).
const SPEC_SUMMARY = {
  machine_id: 'CNC-MILLING-01',
  device_id: 'STM32-OEE-01',
  wo_id: 'WO-20260921-03',
  window: { from: '2026-09-21T22:00:00+07:00', to: '2026-09-22T06:00:00+07:00', tz: 'Asia/Jakarta', planned_break_min: 60, planned_operating_sec: 25200 },
  oee: { availability: 88.4, performance: 91.2, quality: 98.1, oee: 79.1 },
  counters: { target: 12500, actual: 8721 },
  rate: { target_per_h: 400 },
  time_sec: { planned: 25200, run: 19800, downtime: 5400, planned_dt: 3600, unplanned_dt: 1800 },
  downtime_top: [{ category: 'EQUIPMENT_FAILURE', sec: 1200, count: 3 }],
};

const SPEC_SEGMENTS = [
  { from: '2026-09-21T22:00:00+07:00', to: '2026-09-21T22:05:00+07:00', state: 'RUNNING', oee: 81.2 },
  { from: '2026-09-21T22:05:00+07:00', to: '2026-09-21T22:20:00+07:00', state: 'DOWN', downtime_id: 42, category: 'SETUP_AND_ADJUSTMENT', reason: 'Ganti roll film', planned: true },
];

describe('mapShiftSummaryDto', () => {
  it('maps the spec §3.1 example', () => {
    const out = mapShiftSummaryDto(SPEC_SUMMARY);
    expect(out.machineId).toBe('CNC-MILLING-01');
    expect(out.oee.oee).toBeCloseTo(79.1);
    expect(out.timeSec.run).toBe(19800);
    expect(out.timeSec.plannedDt).toBe(3600);
    expect(out.plannedOperatingSec).toBe(25200);
  });

  it('tolerates missing wo (unbound device)', () => {
    expect(mapShiftSummaryDto({}).woId).toBeNull();
  });
});

describe('mapShiftTimelineListDto + toTimelineSegments', () => {
  it('maps the spec §3.2 example to domain segments', () => {
    const segs = mapShiftTimelineListDto(SPEC_SEGMENTS);
    expect(segs).toHaveLength(2);
    expect(segs[1]?.category).toBe('SETUP_AND_ADJUSTMENT');
    const tl = toTimelineSegments(segs, '2026-09-21T22:00:00+07:00');
    expect(tl).toHaveLength(2);
    expect(tl[0]).toMatchObject({ kind: 'Active', startOffsetMin: 0, durationMinutes: 5 });
    expect(tl[1]).toMatchObject({ kind: 'Changeover', startOffsetMin: 5, durationMinutes: 15, planned: true });
  });

  it('skips unparseable bounds instead of crashing', () => {
    const tl = toTimelineSegments(mapShiftTimelineListDto([{ from: 'nope', to: 'nope', state: 'RUNNING' }]), '2026-09-21T22:00:00+07:00');
    expect(tl).toEqual([]);
  });

  it('accepts {data} envelopes and rejects garbage', () => {
    expect(mapShiftTimelineListDto({ data: SPEC_SEGMENTS })).toHaveLength(2);
    expect(mapShiftTimelineListDto(null)).toEqual([]);
  });
});

describe('mergeShiftSummary', () => {
  it('takes A/P/Q/OEE + time from server, gaps vs machine targets', () => {
    const machine = makeMachine();
    const fallback = OeeCalculator.calculate(machine);
    const merged = mergeShiftSummary(mapShiftSummaryDto(SPEC_SUMMARY), fallback, {
      targetOee: machine.targetOee,
      targetAvailability: machine.targetAvailability,
      targetPerformance: machine.targetPerformance,
      targetQuality: machine.targetQuality,
    });
    expect(merged.oeePct).toBeCloseTo(79.1);
    expect(merged.runTimeMin).toBe(330); // 19800s
    expect(merged.downtimeMin).toBe(90); // 5400s
    expect(merged.oeeGap).toBeCloseTo(79.1 - 85, 1);
    // Loss breakdown stays client-side until the backend provides it (G1).
    expect(merged.totalLossPcs).toBe(fallback.totalLossPcs);
  });

  it('shows 0 when the backend reports zero planned time (no dummy floor)', () => {
    const machine = makeMachine({
      shiftDurationMinutes: 0,
      plannedDowntimeMinutes: 0,
      unplannedDowntimeMinutes: 0,
    });
    const fallback = OeeCalculator.calculate(machine);
    const summaryWithZeros = {
      ...SPEC_SUMMARY,
      time_sec: { ...SPEC_SUMMARY.time_sec, planned: 0, run: 0, downtime: 0 },
    };
    const merged = mergeShiftSummary(mapShiftSummaryDto(summaryWithZeros), fallback, {
      targetOee: machine.targetOee,
      targetAvailability: machine.targetAvailability,
      targetPerformance: machine.targetPerformance,
      targetQuality: machine.targetQuality,
    });
    expect(merged.plannedProductionTimeMin).toBe(0);
    expect(merged.runTimeMin).toBe(0);
    expect(merged.downtimeMin).toBe(0);
  });
});

describe('shift use-cases', () => {
  it('validates query inputs', async () => {
    const summary = new GetShiftSummaryUseCase({} as IShiftSummaryRepository);
    await expect(summary.execute({})).rejects.toThrow(/machineId or deviceId/);
    const timeline = new GetShiftTimelineUseCase({} as IShiftTimelineRepository);
    await expect(timeline.execute({ from: '', to: '' })).rejects.toThrow(/from and to/);
  });

  it('passes repository null (404 endpoint absence) through', async () => {
    const summary = new GetShiftSummaryUseCase({ getShiftSummary: async () => null });
    await expect(summary.execute({ deviceId: 'D' })).resolves.toBeNull();
    const timeline = new GetShiftTimelineUseCase({ getShiftTimeline: async () => null });
    await expect(timeline.execute({ deviceId: 'D', from: 'a', to: 'b' })).resolves.toBeNull();
  });
});
