// /src/application/use-cases/GetRejectBreakdownUseCase.ts
// G1: reject pareto nyata per device — [] jujur bila backend tak punya data.

import type { ITelemetryRepository } from '../../domain/ports/IOeeBackend';
import type { RejectReasonItem } from '../../domain/entities/Machine';
import type { RejectBreakdownItem } from '../../domain/entities/backend/Telemetry';

export class GetRejectBreakdownUseCase {
  constructor(private readonly telemetryRepo: ITelemetryRepository) {}

  async execute(deviceId: string, from?: string, to?: string): Promise<RejectReasonItem[]> {
    const items: RejectBreakdownItem[] = await this.telemetryRepo.getRejectBreakdown(deviceId, from, to);
    return items.map((r, idx) => ({
      id: `rej-${deviceId}-${idx}`,
      label: r.reason,
      count: r.count,
      percentage: r.pct,
    }));
  }
}
