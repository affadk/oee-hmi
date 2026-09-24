// /src/application/use-cases/GetShiftTimelineUseCase.ts
// Fase 2 shift-timeline (§3.2) with 404-fallback contract: null means the
// backend does not implement the endpoint yet — callers use buildShiftTimeline.

import type { IShiftTimelineRepository, ShiftTimelineQuery, ShiftTimelineSegment } from '../../domain/ports/IShiftSummary';

export class GetShiftTimelineUseCase {
  constructor(private readonly shifts: IShiftTimelineRepository) {}

  async execute(query: ShiftTimelineQuery, signal?: AbortSignal): Promise<ShiftTimelineSegment[] | null> {
    if (!query.from || !query.to) throw new Error('from and to are required.');
    if (!query.machineId && !query.deviceId) throw new Error('machineId or deviceId is required.');
    return this.shifts.getShiftTimeline(query, signal);
  }
}
