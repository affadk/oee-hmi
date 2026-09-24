import { describe, expect, it } from 'vitest';
import { GetTelemetryAggregateUseCase } from '../src/application/use-cases/GetTelemetryAggregateUseCase';
import { GetTelemetryHistoryUseCase } from '../src/application/use-cases/GetTelemetryHistoryUseCase';
import type { ITelemetryRepository } from '../src/domain/ports/IOeeBackend';

const repo = {
  getAggregate: async () => [
    { timestamp: '2026-09-22T10:00:00+07:00', deviceId: 'D', totalCount: 10, goodCount: 9, rejectCount: 1, oee: 80, availability: 90, performance: 95, quality: 98, isBuffered: false },
  ],
  getHistory: async () => [
    { timestamp: '2026-09-22T10:00:00+07:00', deviceId: 'D', totalCount: 5, goodCount: 5, rejectCount: 0, oee: 85, availability: 90, performance: 95, quality: 100, isBuffered: false },
  ],
} as unknown as ITelemetryRepository;

describe('telemetry aggregate/history use-cases (B5/B2)', () => {
  it('aggregate validates deviceId and delegates', async () => {
    const uc = new GetTelemetryAggregateUseCase(repo);
    await expect(uc.execute('')).rejects.toThrow(/deviceId/);
    const out = await uc.execute('D', '5m');
    expect(out).toHaveLength(1);
    expect(out[0]?.oee).toBe(80);
  });

  it('history validates deviceId and delegates', async () => {
    const uc = new GetTelemetryHistoryUseCase(repo);
    await expect(uc.execute('')).rejects.toThrow(/deviceId/);
    const out = await uc.execute('D');
    expect(out).toHaveLength(1);
    expect(out[0]?.quality).toBe(100);
  });
});
