// /src/application/use-cases/LogRejectUseCase.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { MachineConfig } from '../../domain/entities/Machine';

export class LogRejectUseCase {
  constructor(private readonly machineRepo: IMachineRepository) {}

  public async execute(
    machineId: string,
    _reasonLabel: string,
    count: number
  ): Promise<MachineConfig> {
    const machine = await this.machineRepo.getMachineById(machineId);
    const prevRej = machine?.telemetry?.rej ?? 41;
    const prevTot = machine?.telemetry?.tot ?? 945;

    return this.machineRepo.updateTelemetry(machineId, {
      rej: prevRej + count,
      tot: prevTot + count,
    });
  }
}

