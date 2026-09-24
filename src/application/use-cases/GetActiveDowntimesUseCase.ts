// /src/application/use-cases/GetActiveDowntimesUseCase.ts
// Global active downtimes (§J.1) for the Active badge. Transparent
// pass-through — callers decide null-vs-empty semantics.

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';

export class GetActiveDowntimesUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(signal?: AbortSignal): Promise<DowntimeEvent[]> {
    return this.telemetryRepo.getActiveDowntimes(signal);
  }
}
