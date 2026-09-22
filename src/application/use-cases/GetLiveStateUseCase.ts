// /src/application/use-cases/GetLiveStateUseCase.ts
// Application orchestration over the ILiveStateRepository port.
// Presentation calls this — never infrastructure/api directly.

import type { ILiveStateRepository } from '../../domain/ports/IOeeBackend';
import type { LiveStateSnapshot } from '../../domain/entities/backend/LiveState';

export class GetLiveStateUseCase {
  constructor(private readonly liveStateRepo: ILiveStateRepository) {}

  executeAll(signal?: AbortSignal): Promise<LiveStateSnapshot[]> {
    return this.liveStateRepo.getAllSnapshots(signal);
  }

  executeByDevice(deviceId: string, signal?: AbortSignal): Promise<LiveStateSnapshot> {
    if (!deviceId) throw new Error('deviceId is required.');
    return this.liveStateRepo.getSnapshotByDevice(deviceId, signal);
  }
}
