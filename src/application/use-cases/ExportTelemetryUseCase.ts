import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';

export type TelemetryExportFormat = 'csv' | 'ndjson';

export class ExportTelemetryUseCase {
  constructor(private readonly telemetry: ITelemetryRepository) {}

  execute(deviceId: string, format: TelemetryExportFormat = 'csv', from?: string, to?: string, signal?: AbortSignal): Promise<Blob> {
    if (!deviceId) throw new Error('deviceId is required.');
    return this.telemetry.getExport(deviceId, format, from, to, signal);
  }
}
