import { describe, expect, it } from 'vitest';
import {
  mapHourlyTrendDto,
  mapTelemetryFrameDto,
  mapTelemetryHistoryDto,
  mapWsHealthDto,
  parseCategoryFromReason,
} from '../src/infrastructure/backend/dto/telemetry.dto';
import { isLiveTelemetryFrame } from '../src/domain/entities/backend/Telemetry';

describe('mapTelemetryFrameDto', () => {
  it('maps nested backend shape', () => {
    const frame = mapTelemetryFrameDto({
      device_id: 'STM32-01',
      machine_id: 'MC-01',
      timestamp: 1700000000,
      counters: { total: 100, good: 95, reject: 5, last_cycle_sec: 9 },
      time_metrics_sec: { operating_time: 28800, run_time: 25200, downtime: 3600 },
      oee: { availability: 87.5, performance: 94, quality: 95, total_oee: 78.1 },
      plc_modbus: { spindle_rpm: 1450, temp_c: 42.3, alarm_code: 0 },
      hw_diag: { uptime_sec: 3600, free_heap: 100000 },
      is_buffered: false,
    });
    expect(frame.deviceId).toBe('STM32-01');
    expect(frame.counters.total).toBe(100);
    expect(frame.oee.totalOee).toBeCloseTo(78.1);
    expect(frame.isBuffered).toBe(false);
  });

  it('maps flat MQTT wire (x100/x10 scales) with divisors', () => {
    const frame = mapTelemetryFrameDto({
      device_id: 'STM32-01',
      tot: 945,
      rej: 41,
      cyc: 900, // 10ms units → 9s
      a: 9120,
      p: 9450,
      q: 9560,
      oee_x100: 8240,
      tmp: 423,
      rpm: 1450,
      alm: 0,
    });
    expect(frame.counters.lastCycleSec).toBeCloseTo(9);
    expect(frame.oee.availability).toBeCloseTo(91.2);
    expect(frame.oee.totalOee).toBeCloseTo(82.4);
    expect(frame.plcModbus.tempC).toBeCloseTo(42.3);
  });

  it('derives good = total - reject when good is absent (pure MQTT frames)', () => {
    const frame = mapTelemetryFrameDto({ device_id: 'D', tot: 100, rej: 7 });
    expect(frame.counters.good).toBe(93);
  });

  it('coerces numeric strings instead of leaking strings downstream', () => {
    const frame = mapTelemetryFrameDto({
      device_id: 'D',
      counters: { total: '100' as unknown as number, good: '95' as unknown as number },
    });
    expect(frame.counters.total).toBe(100);
    expect(frame.counters.good).toBe(95);
  });

  it('unwraps relay TELEMETRY_UPDATE envelope (payload dari WS live)', () => {
    const frame = mapTelemetryFrameDto({
      type: 'TELEMETRY_UPDATE',
      device_id: 'STM32-OEE-SIM',
      machine_id: 'CNC-MILLING-SIM',
      data: {
        timestamp: 1790751450,
        device_id: 'STM32-OEE-SIM',
        machine_id: 'CNC-MILLING-SIM',
        wo_id: 'WO-SIM-20260906-01',
        fsm_state: 'UNCONFIGURED',
        counters: { total: 120, good: 118, reject: 2, last_cycle_sec: 12 },
        time_metrics_sec: { operating_time: 600, run_time: 540, downtime: 60 },
        oee: { availability: 90, performance: 95, quality: 98, total_oee: 84 },
        plc_modbus: { spindle_rpm: 1450, temp_c: 35, alarm_code: 0 },
        hw_diag: { uptime_sec: 15715, free_heap: 48487 },
        is_buffered: false,
      },
    } as never);
    expect(frame.deviceId).toBe('STM32-OEE-SIM');
    expect(frame.counters.total).toBe(120);
    expect(frame.counters.good).toBe(118);
    expect(frame.oee.totalOee).toBe(84);
    expect(frame.plcModbus.spindleRpm).toBe(1450);
    expect(frame.hwDiag.uptimeSec).toBe(15715);
    expect(isLiveTelemetryFrame(frame)).toBe(true);
  });

  it('maps relay HEALTH_UPDATE to domain health (bukan counter 0)', () => {
    const out = mapWsHealthDto({
      type: 'HEALTH_UPDATE',
      device_id: 'STM32-OEE-SIM',
      data: {
        timestamp: 1790751451, heap_free: 48526, tasks_healthy: 8, tasks_total: 9,
        stale_tasks: [{ name: 'Watchdog', age_ms: 411, alive: 1 }],
        stale_count: 0, event_flags: 7,
      },
      timestamp: '2026-09-30T06:57:31.470Z',
    });
    expect(out?.deviceId).toBe('STM32-OEE-SIM');
    expect(out?.health.heap_free).toBe(48526);
    expect(out?.health.tasks_healthy).toBe(8);
    expect(out?.health.stale_tasks).toHaveLength(1);
    expect(out?.health.age_sec).toBeUndefined();
  });

  it('rejects non-health relay types and garbage', () => {
    expect(mapWsHealthDto({ type: 'TELEMETRY_UPDATE', data: {} })).toBeNull();
    expect(mapWsHealthDto({ type: 'HEALTH_UPDATE', data: {} })).toBeNull();
    expect(mapWsHealthDto(null)).toBeNull();
  });
});

describe('mapTelemetryHistoryDto (incl. B5 aggregate buckets)', () => {
  it('falls back to bucket as timestamp', () => {
    const out = mapTelemetryHistoryDto({ bucket: '2026-09-22T10:00:00+07:00', oeePct: 81.2 });
    expect(out.timestamp).toBe('2026-09-22T10:00:00+07:00');
    expect(out.oee).toBeCloseTo(81.2);
  });

  it('falls back to recordedAt when timestamp/ts/bucket absent (raw history shape)', () => {
    const out = mapTelemetryHistoryDto({ recordedAt: '2026-09-29T06:41:49.000Z', oeePct: '83.80' });
    expect(out.timestamp).toBe('2026-09-29T06:41:49.000Z');
    expect(out.oee).toBeCloseTo(83.8);
  });

  it('reads canonical aggregate keys (*Pct numeric strings, sunset avg* 2026-11-20)', () => {
    const out = mapTelemetryHistoryDto({
      bucket: '2026-09-29T06:00:00.000Z',
      oeePct: '83.80',
      availabilityPct: '90.00',
      performancePct: '94.31',
      qualityPct: '98.73',
    });
    expect(out.oee).toBeCloseTo(83.8);
    expect(out.availability).toBeCloseTo(90.0);
    expect(out.performance).toBeCloseTo(94.31);
    expect(out.quality).toBeCloseTo(98.73);
  });
});

describe('mapHourlyTrendDto (kanonis *Pct + counter delta; sunset avg* 2026-11-20)', () => {
  it('maps canonical *Pct keys and totalCount as per-hour actual', () => {
    const out = mapHourlyTrendDto({
      bucket: '2026-09-29T06:00:00.000Z',
      deviceId: 'STM32-OEE-01',
      oeePct: '83.80',
      availabilityPct: '90.00',
      performancePct: '94.31',
      qualityPct: '98.73',
      totalCount: 8579,
      rejectCount: 0,
      targetPerHour: 63,
      state: 'RUNNING',
      planned: false,
    });
    expect(out.oee).toBeCloseTo(83.8);
    expect(out.availability).toBeCloseTo(90.0);
    expect(out.performance).toBeCloseTo(94.31);
    expect(out.quality).toBeCloseTo(98.73);
    expect(out.totalCount).toBe(8579);
    expect(out.rejectCount).toBe(0);
    expect(out.goodCount).toBe(8579);
    expect(out.targetPerHour).toBe(63);
    expect(out.state).toBe('RUNNING');
  });

  it('derives good = output - reject when goodCount absent', () => {
    const out = mapHourlyTrendDto({ bucket: '10:00', outputDelta: 1000, rejectDelta: 25 });
    expect(out.totalCount).toBe(1000);
    expect(out.rejectCount).toBe(25);
    expect(out.goodCount).toBe(975);
  });

  it('prefers explicit counts over estimates', () => {
    const out = mapHourlyTrendDto({ bucket: '10:00', totalCount: 100, goodCount: 90, rejectCount: 10, outputDelta: 8579, rejectDelta: 999 });
    expect(out.totalCount).toBe(100);
    expect(out.goodCount).toBe(90);
    expect(out.rejectCount).toBe(10);
  });
});

describe('parseCategoryFromReason', () => {
  it('extracts [CATEGORY] prefix', () => {
    expect(parseCategoryFromReason('[SETUP_AND_ADJUSTMENT] Ganti roll')).toBe('SETUP_AND_ADJUSTMENT');
  });

  it('returns null without prefix or for unknown categories', () => {
    expect(parseCategoryFromReason('Mesin macet')).toBeNull();
    expect(parseCategoryFromReason('[WARP_DRIVE] foo')).toBeNull();
    expect(parseCategoryFromReason(null)).toBeNull();
  });
});

describe('isLiveTelemetryFrame', () => {
  it('drops buffered backlog frames', () => {
    const live = mapTelemetryFrameDto({ device_id: 'D', is_buffered: false });
    const buffered = mapTelemetryFrameDto({ device_id: 'D', is_buffered: true });
    expect(isLiveTelemetryFrame(live)).toBe(true);
    expect(isLiveTelemetryFrame(buffered)).toBe(false);
  });
});
