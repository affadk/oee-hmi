// /src/application/use-cases/GetTelemetryHistoryUseCase.ts
// Raw history points (§K.1) for drill-down/reconciliation (B2).

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { TelemetryHistoryPoint } from '../../domain/entities/backend/Telemetry';

export class GetTelemetryHistoryUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string, from?: string, to?: string, limit = 200, signal?: AbortSignal): Promise<TelemetryHistoryPoint[]> {
    if (!deviceId) throw new Error('deviceId is required.');
    return this.telemetryRepo.getHistory(deviceId, from, to, limit, signal);
  }
}
