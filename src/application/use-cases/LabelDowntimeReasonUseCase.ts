// /src/application/use-cases/LabelDowntimeReasonUseCase.ts
// Writes the operator reason/category for an existing backend downtime event.

import type { DowntimeCategory } from '../../domain/entities/backend/Telemetry';
import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';

export class LabelDowntimeReasonUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(id: number, category: DowntimeCategory, reason: string, notes?: string): Promise<void> {
    await this.telemetryRepo.labelDowntimeReason(id, category, reason, notes);
  }
}
