// /src/application/use-cases/GetDowntimeReasonsUseCase.ts
// Fetches downtime events for a specific device and maps them to
// DowntimeReasonItem[] for the LossAnalysisZone and FloorPushButtonsPanel.

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { DowntimeReasonItem } from '../../domain/entities/Machine';
import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import { isPlannedDowntimeCategory } from '../../domain/entities/backend/Telemetry';

export class GetDowntimeReasonsUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string): Promise<DowntimeReasonItem[]> {
    const result = await this.telemetryRepo.getDowntimes(deviceId, undefined, undefined, 100, undefined, false);
    return result.data.map((event: DowntimeEvent) => ({
      id: `dt-${event.id}`,
      label: event.operatorReason ?? event.category ?? 'Unknown',
      category: event.category ?? 'OTHER',
      durationMinutes: event.endTime
        ? Math.max(1, Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000))
        : 1,
      // Changeover terjadwal (SETUP_AND_ADJUSTMENT) = PLANNED, sejajar
      // REST_BREAK / PLANNED_MAINTENANCE / CLEANING_5S (kontrak ISO 22400 di
      // LossAnalysisZone: planned mengurangi shift time). Sisanya UNPLANNED.
      // Kebenaran tunggal: isPlannedDowntimeCategory (domain/entities/backend/Telemetry).
      type: isPlannedDowntimeCategory(event.category) ? 'PLANNED' : 'UNPLANNED',
    }));
  }
}
