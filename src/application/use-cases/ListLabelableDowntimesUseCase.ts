// /src/application/use-cases/ListLabelableDowntimesUseCase.ts
// Reads active/unlabeled downtime events that can receive an operator reason.

import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';

export class ListLabelableDowntimesUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string, signal?: AbortSignal): Promise<DowntimeEvent[]> {
    return this.telemetryRepo.getLabelableDowntimes(deviceId, signal);
  }
}
