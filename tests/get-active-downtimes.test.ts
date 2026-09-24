import { describe, expect, it } from 'vitest';
import { GetActiveDowntimesUseCase } from '../src/application/use-cases/GetActiveDowntimesUseCase';
import type { ITelemetryRepository } from '../src/domain/ports/IOeeBackend';

const twoActive = [
  { id: 1, deviceId: 'D', machineId: 'M', category: 'EQUIPMENT_FAILURE', operatorReason: null, startTime: '2026-09-22T01:00:00+07:00', endTime: null },
  { id: 2, deviceId: 'D', machineId: 'M', category: null, operatorReason: null, startTime: '2026-09-22T02:00:00+07:00', endTime: null },
];

describe('GetActiveDowntimesUseCase', () => {
  it('delegates to the telemetry repository', async () => {
    const uc = new GetActiveDowntimesUseCase({ getActiveDowntimes: async () => twoActive } as unknown as ITelemetryRepository);
    await expect(uc.execute()).resolves.toHaveLength(2);
  });

  it('propagates failures (callers decide null-vs-throw)', async () => {
    const uc = new GetActiveDowntimesUseCase({
      getActiveDowntimes: async () => { throw new Error('down'); },
    } as unknown as ITelemetryRepository);
    await expect(uc.execute()).rejects.toThrow('down');
  });
});
