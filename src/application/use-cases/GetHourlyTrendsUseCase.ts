// /src/application/use-cases/GetHourlyTrendsUseCase.ts
// Fetches hourly OEE trend data for a specific device.

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { HourlyDataPoint } from '../../domain/entities/Machine';
import type { HourlyTrendPoint, PageMeta } from '../../domain/ports/IOeeBackend';
import type { LiveMachineState } from '../../domain/entities/backend/LiveState';

function mapLiveStateToMachineStatus(state: LiveMachineState): 'RUNNING' | 'IDLE' | 'DOWN' | 'SETUP' | 'PLANNED_STOP' {
  switch (state) {
    case 'RUNNING':
      return 'RUNNING';
    case 'READY':
    case 'UNCONFIGURED':
    case 'BATCH_FINISHED':
      return 'IDLE';
    case 'PLANNED_STOP':
    case 'PLANNED_DT':
      return 'PLANNED_STOP';
    case 'UNPLANNED_DT':
    case 'SETUP':
      return 'SETUP';
    default:
      return 'IDLE';
  }
}

export class GetHourlyTrendsUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string, from?: string, to?: string, limit = 72): Promise<HourlyDataPoint[]> {
    const result = await this.telemetryRepo.getHourlyTrends(deviceId, from, to, limit, false);
    return result.data.map((point: HourlyTrendPoint) => ({
      hour: point.bucket,
      target: 0,
      actual: point.totalCount > 0 ? Math.round(point.totalCount / Math.max(1, result.data.length)) : 0,
      good: point.goodCount,
      reject: point.rejectCount,
      oee: point.oee,
      availability: point.availability,
      performance: point.performance,
      quality: point.quality,
      status: 'RUNNING',
    }));
  }
}
