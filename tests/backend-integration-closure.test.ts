// G1–G16 frontend closure: pure DTO/endpoint/auth-expiry tests (no IO).
import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/infrastructure/api/endpoints';
import {
  mapDeviceHealthDto,
  mapHourlyTrendDto,
  mapOperationalEventDto,
  mapRejectBreakdownDto,
} from '../src/application/dto/telemetry.dto';
import { mapWorkOrderResolveDto } from '../src/application/dto/work-order.dto';
import { decodeJwtExpMs, isTokenExpiringSoon } from '../src/application/authToken';

function jwt(exp: number): string {
  const b64 = (o: unknown): string =>
    Buffer.from(JSON.stringify(o)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ exp })}.sig`;
}

describe('G1/G3/G5 endpoints (pure path builders)', () => {
  it('builds new 016 contract paths', () => {
    expect(endpoints.qualityRejects('STM32 01')).toBe('/api/v1/quality/rejects/STM32%2001');
    expect(endpoints.deviceHealth('STM32-OEE-01')).toBe('/api/v1/devices/STM32-OEE-01/health');
    expect(endpoints.operationalEventsGlobal()).toBe('/api/v1/operational-events');
    expect(endpoints.operationalEventAck(42)).toBe('/api/v1/operational-events/42/ack');
    expect(endpoints.authRefresh()).toBe('/api/v1/auth/refresh');
  });
});

describe('G1 reject breakdown mapper (never fabricate)', () => {
  it('maps pareto items with pct', () => {
    const out = mapRejectBreakdownDto({ data: [{ reason: 'UNCLASSIFIED', count: 12, pct: 100 }], meta: {} });
    expect(out).toEqual([{ reason: 'UNCLASSIFIED', count: 12, pct: 100 }]);
  });
  it('drops invalid rows and non-lists honestly', () => {
    expect(mapRejectBreakdownDto({ data: [{ reason: 'A' }, null, 'x'] })).toEqual([]);
    expect(mapRejectBreakdownDto([])).toEqual([]);
    expect(mapRejectBreakdownDto({})).toEqual([]);
  });
});

describe('G3 device health mapper (camel + snake)', () => {
  it('maps camelCase backend response', () => {
    const out = mapDeviceHealthDto({
      deviceId: 'STM32-OEE-01', timestamp: '2026-09-25T04:00:00.000Z',
      heapFree: 48100, tasksHealthy: 5, tasksTotal: 5,
      staleCount: 0, staleTasks: [], eventFlags: 0, ageSec: 1,
    });
    expect(out?.heapFree).toBe(48100);
    expect(out?.ageSec).toBe(1);
  });
  it('maps snake_case and nulls honestly', () => {
    const out = mapDeviceHealthDto({ device_id: 'D', heap_free: 10, age_sec: 999999 });
    expect(out?.deviceId).toBe('D');
    expect(out?.tasksTotal).toBe(0);
    expect(mapDeviceHealthDto(null)).toBeNull();
    expect(mapDeviceHealthDto({})).toBeNull();
  });
});

describe('G2/G9 hourly enrichment (additive passthrough)', () => {
  it('passes targetPerHour/state/planned through', () => {
    const out = mapHourlyTrendDto({
      bucket: '2026-09-24T10:00:00.000Z', deviceId: 'D',
      targetPerHour: 63, state: 'UNCONFIGURED', planned: false,
    });
    expect(out.targetPerHour).toBe(63);
    expect(out.state).toBe('UNCONFIGURED');
    expect(out.planned).toBe(false);
  });
  it('defaults preserve legacy behavior', () => {
    const out = mapHourlyTrendDto({ bucket: '10:00', deviceId: 'D' });
    expect(out.targetPerHour).toBeNull();
    expect(out.state).toBeNull();
    expect(out.planned).toBe(false);
  });
});

describe('G10/G2 resolve mapper (structured break)', () => {
  it('maps break + targetPerHour', () => {
    const out = mapWorkOrderResolveDto({
      wo_id: 'WO-1', shift_plan: { shift_start: '07:00', shift_end: '16:00', planned_break_min: 60, planned_operating_sec: 28800 },
      targetPerHour: 63, break: { start: '15:00', end: '16:00', minutes: 60 }, status: 'ACTIVE',
    } as never);
    expect(out.break).toEqual({ start: '15:00', end: '16:00', minutes: 60 });
    expect(out.targetPerHour).toBe(63);
  });
  it('nulls honestly without new fields', () => {
    const out = mapWorkOrderResolveDto({ wo_id: 'WO-1', status: 'PENDING' } as never);
    expect(out.break).toBeNull();
    expect(out.targetPerHour).toBeNull();
  });
});

describe('G4 ack fields on operational events', () => {
  it('maps acknowledged event to Acknowledged attribution', () => {
    const out = mapOperationalEventDto({ id: 7, acknowledged_at: '2026-09-25T04:00:00Z', acknowledged_by: 'OPR-1' });
    expect(out.acknowledgedAt).toBe('2026-09-25T04:00:00Z');
    expect(out.acknowledgedBy).toBe('OPR-1');
    expect(out.ackNote).toBeNull();
  });
});

describe('G13 token expiry helpers (pure)', () => {
  it('decodes exp and flags imminent expiry', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(decodeJwtExpMs(jwt(nowSec + 60))).toBeGreaterThan(Date.now());
    expect(isTokenExpiringSoon(jwt(nowSec + 60))).toBe(true);
    expect(isTokenExpiringSoon(jwt(nowSec + 3600))).toBe(false);
    expect(isTokenExpiringSoon('garbage')).toBe(false);
    expect(isTokenExpiringSoon(null)).toBe(false);
  });
});
