// /src/application/use-cases/GetDowntimeReasonsUseCase.ts
// Fetches downtime events for a specific device and maps them to
// DowntimeReasonItem[] for the LossAnalysisZone and FloorPushButtonsPanel.

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { DowntimeReasonItem } from '../../domain/entities/Machine';
import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';

export class GetDowntimeReasonsUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string): Promise<DowntimeReasonItem[]> {
    const result = await this.telemetryRepo.getDowntimes(deviceId, undefined, undefined, 100, undefined, false);
    return result.data.map((event: DowntimeEvent, index: number) => ({
      id: `dt-${event.id}`,
      label: event.operatorReason ?? event.category ?? 'Unknown',
      category: event.category ?? 'OTHER',
      durationMinutes: event.endTime
        ? Math.max(1, Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000))
        : 1,
      type: event.category === 'PLANNED_MAINTENANCE' || event.category === 'REST_BREAK' || event.category === 'CLEANING_5S'
        ? 'PLANNED'
        : 'UNPLANNED',
    }));
  }
}
