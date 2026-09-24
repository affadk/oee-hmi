// /src/application/use-cases/GetShiftSummaryUseCase.ts
// Fase 2 shift-summary (§3.1) with 404-fallback contract: null means the
// backend does not implement the endpoint yet — callers use §2 composition.

import type { IShiftSummaryRepository, ShiftSummary, ShiftSummaryQuery } from '../../domain/ports/IShiftSummary';

export class GetShiftSummaryUseCase {
  constructor(private readonly shifts: IShiftSummaryRepository) {}

  async execute(query: ShiftSummaryQuery, signal?: AbortSignal): Promise<ShiftSummary | null> {
    if (!query.machineId && !query.deviceId) throw new Error('machineId or deviceId is required.');
    return this.shifts.getShiftSummary(query, signal);
  }
}
