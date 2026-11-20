// Unit 001 Fase 3 (T016/T018/T019/T020/T021): DTO kanonis *Pct + null-preserving
// + provisional (FR-017/018), parity availability fallback (FR-019),
// capability gate fail-closed (FR-007/008), ack body bersih (FR-020).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapHourlyTrendDto, mapTelemetryHistoryDto } from '../src/infrastructure/backend/dto/telemetry.dto';
import { canMutate } from '../src/application/capabilityGate';
import { OeeCalculator } from '../src/domain/services/OeeCalculator';
import { OeeHttpTelemetryRepository } from '../src/infrastructure/backend/api-clients/oeeApiClient';
import type { MachineConfig } from '../src/domain/entities/Machine';
import { makeMachine } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('DTO kanonis *Pct (FR-017/FR-018, ADR-0003)', () => {
  it('kanonis *Pct terpetakan dari payload live (hourly & aggregate)', () => {
    const point = mapHourlyTrendDto({
      bucket: '2026-11-20T03:00:00Z', deviceId: 'D1',
      oeePct: '83.80', availabilityPct: '90.00', performancePct: '94.31', qualityPct: '98.73',
      totalCount: 100, goodCount: 98, rejectCount: 2, sampleCount: 22,
      operatingSec: 3600, runSec: 3240, provisional: true,
    });
    expect(point.oee).toBe(83.8);
    expect(point.availability).toBe(90);
    expect(point.performance).toBe(94.31);
    expect(point.quality).toBe(98.73);
    expect(point.provisional).toBe(true);
    expect(point.operatingSec).toBe(3600);
    expect(point.runSec).toBe(3240);
    expect(point.sampleCount).toBe(22);
  });

  it('alias legacy di-sunset (ADR-0003): payload avg*-saja → null, bukan angka lama', () => {
    const point = mapHourlyTrendDto({ bucket: 'b', deviceId: 'D1', avgOee: '70.5', totalCount: 10 } as Parameters<typeof mapHourlyTrendDto>[0]);
    expect(point.oee).toBeNull();
  });

  it('aggregate kanonis outputDelta/goodDelta/rejectDelta terpetakan (live 2026-11-20)', () => {
    const point = mapHourlyTrendDto({
      bucket: 'b', deviceId: 'D1', outputDelta: 500, rejectDelta: 10, goodDelta: 490,
      availabilityPct: '100.00', performancePct: null, qualityPct: '98.00', oeePct: null,
      runSec: 18000, operatingSec: 21000, sampleCount: 62, provisional: true,
    });
    expect(point.totalCount).toBe(500);
    expect(point.goodCount).toBe(490);
    expect(point.rejectCount).toBe(10);
    expect(point.performance).toBeNull();
    expect(point.oee).toBeNull();
    expect(point.provisional).toBe(true);
  });

  it('null eksplisit dipertahankan (bucket tanpa sampel ≠ 0)', () => {
    const point = mapHourlyTrendDto({ bucket: 'b', deviceId: 'D1', oeePct: null, availabilityPct: null, totalCount: 0 });
    expect(point.oee).toBeNull();
    expect(point.availability).toBeNull();
    expect(point.performance).toBeNull();
    expect(point.quality).toBeNull();
  });

  it('semua key absen → null, bukan fabrikasi nol', () => {
    const point = mapHourlyTrendDto({ bucket: 'b', deviceId: 'D1', totalCount: 0 });
    expect(point.oee).toBeNull();
    const row = mapTelemetryHistoryDto({ recordedAt: '2026-11-20T03:00:00Z', deviceId: 'D1', totalCount: 5 });
    expect(row.oee).toBeNull();
    expect(row.availability).toBeNull();
  });
});

describe('canMutate — fail-closed (FR-007/008, OQ-004)', () => {
  const base = { useBackend: true, mutationsAllowed: true as boolean | null, capabilities: { 'device_command.send': 'allow' } as Record<string, 'allow' | 'deny' | 'unknown'> | null, key: 'device_command.send' };
  it('allow → boleh', () => {
    expect(canMutate(base).allowed).toBe(true);
  });
  it('deny eksplisit → nonaktif + alasan; unknown/absen/null = enforcement backend', () => {
    expect(canMutate({ ...base, capabilities: { 'device_command.send': 'deny' } }).allowed).toBe(false);
    expect(canMutate({ ...base, capabilities: { 'device_command.send': 'deny' } }).reason).toContain('device_command.send');
    // Amandemen OQ-004: shadow-mode unknown = baseline preset; backend menegakkan per-rute.
    expect(canMutate({ ...base, capabilities: { 'device_command.send': 'unknown' } }).allowed).toBe(true);
    expect(canMutate({ ...base, capabilities: {} }).allowed).toBe(true);
    expect(canMutate({ ...base, capabilities: null }).allowed).toBe(true);
  });
  it('mutationsAllowed false (tunnel) → nonaktif meski allow', () => {
    expect(canMutate({ ...base, mutationsAllowed: false }).allowed).toBe(false);
    expect(canMutate({ ...base, mutationsAllowed: false }).reason).toContain('read-only');
  });
  it('lane simulasi → boleh tanpa capability', () => {
    expect(canMutate({ ...base, useBackend: false, capabilities: null }).allowed).toBe(true);
  });
});

describe('OeeCalculator fallback — parity run/(run+udt) (FR-019, 016/ADR-019)', () => {
  it('planned downtime tidak menurunkan availability fallback', () => {
    // shift 480m, break 60m, unplanned 60m → operating 420m, run 360m.
    const machine = {
      ...makeMachine({ shiftDurationMinutes: 480, plannedDowntimeMinutes: 60, unplannedDowntimeMinutes: 60 }),
      telemetry: undefined,
    } as unknown as MachineConfig;
    const metrics = OeeCalculator.calculate(machine);
    const run = 360, udt = 60;
    expect(metrics.availabilityPct).toBe(Number(((run / (run + udt)) * 100).toFixed(1)));
    expect(metrics.availabilityPct).toBe(85.7);
    expect(metrics.plannedProductionTimeMin).toBe(420);
  });
});

describe('ack operational-event — body bersih (FR-020)', () => {
  it('hanya note; aktor dari subjek JWT (operator_id tidak dikirim)', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: 42, acknowledgedAt: '2026-11-20T03:00:00Z', acknowledgedBy: 'OPR-1001', ackNote: 'ok', acknowledged: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    const repo = new OeeHttpTelemetryRepository();
    await repo.acknowledgeOperationalEvent(42, 'OPR-1001', 'ok');
    expect(calls[0]?.url).toContain('/api/v1/operational-events/42/ack');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ note: 'ok' });
  });
});
