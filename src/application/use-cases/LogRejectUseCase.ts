// /src/application/use-cases/LogRejectUseCase.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { MachineConfig } from '../../domain/entities/Machine';

export class LogRejectUseCase {
  constructor(private readonly machineRepo: IMachineRepository) {}

  public async execute(
    machineId: string,
    reasonLabel: string,
    count: number
  ): Promise<MachineConfig> {
    return this.machineRepo.addRejectEvent(machineId, reasonLabel, count);
  }
}
