import { describe, expect, it } from 'vitest';
import {
  mapTelemetryFrameDto,
  mapTelemetryHistoryDto,
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
});

describe('mapTelemetryHistoryDto (incl. B5 aggregate buckets)', () => {
  it('falls back to bucket as timestamp', () => {
    const out = mapTelemetryHistoryDto({ bucket: '2026-09-22T10:00:00+07:00', oee: 81.2 });
    expect(out.timestamp).toBe('2026-09-22T10:00:00+07:00');
    expect(out.oee).toBeCloseTo(81.2);
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
