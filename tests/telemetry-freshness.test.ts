import { describe, expect, it } from 'vitest';
import { isTelemetryStale, telemetryAgeSec, TELEMETRY_STALE_AFTER_SEC } from '../src/domain/entities/Machine';

describe('telemetryAgeSec', () => {
  it('returns whole-second age', () => {
    expect(telemetryAgeSec(1000, 1090)).toBe(90);
  });

  it('returns null for unknown timestamps', () => {
    expect(telemetryAgeSec(0, 1090)).toBeNull();
    expect(telemetryAgeSec(Number.NaN, 1090)).toBeNull();
  });

  it('clamps future timestamps to 0', () => {
    expect(telemetryAgeSec(2000, 1090)).toBe(0);
  });
});

describe('isTelemetryStale', () => {
  it(`flags age beyond ${TELEMETRY_STALE_AFTER_SEC}s`, () => {
    expect(isTelemetryStale(1000, 1000 + TELEMETRY_STALE_AFTER_SEC)).toBe(false);
    expect(isTelemetryStale(1000, 1000 + TELEMETRY_STALE_AFTER_SEC + 1)).toBe(true);
  });

  it('never flags unknown timestamps', () => {
    expect(isTelemetryStale(0, 999999)).toBe(false);
  });
});
