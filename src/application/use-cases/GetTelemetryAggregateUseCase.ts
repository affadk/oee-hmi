// /src/application/use-cases/GetTelemetryAggregateUseCase.ts
// Live-trend buckets (§K.4 aggregate, B5) for the 5m overlay.

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { TelemetryHistoryPoint } from '../../domain/entities/backend/Telemetry';

export class GetTelemetryAggregateUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string, bucket = '5m', from?: string, to?: string, limit = 96, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]> {
    if (!deviceId) throw new Error('deviceId is required.');
    return this.telemetryRepo.getAggregate(deviceId, bucket, from, to, limit, signal);
  }
}
