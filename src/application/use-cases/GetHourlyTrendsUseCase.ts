// /src/application/use-cases/GetHourlyTrendsUseCase.ts
// Fetches hourly OEE trend data for a specific device.

import type { ITelemetryRepository, HourlyTrendPoint } from '../../domain/ports/IOeeBackend';
import type { HourlyDataPoint } from '../../domain/entities/Machine';

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
