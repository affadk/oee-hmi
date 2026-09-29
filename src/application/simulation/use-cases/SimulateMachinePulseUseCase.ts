// /src/application/use-cases/SimulateMachinePulseUseCase.ts

import { IMachineRepository } from '../../../domain/ports/IMachineRepository';
import { MachineConfig } from '../../../domain/entities/Machine';

export class SimulateMachinePulseUseCase {
  constructor(private readonly machineRepo: IMachineRepository) {}

  public async execute(machine: MachineConfig): Promise<MachineConfig | null> {
    if (machine.status !== 'RUNNING') {
      return null;
    }

    // 95% good pieces, 5% random rejects
    const isReject = Math.random() < 0.05;
    const newTotal = machine.totalCount + 1;
    const newGood = isReject ? machine.goodCount : machine.goodCount + 1;
    const newReject = isReject ? machine.rejectCount + 1 : machine.rejectCount;

    // Small natural jitter on cycle time
    const jitter = (Math.random() - 0.5) * 0.2;
    const newActualCycle = Math.max(
      machine.idealCycleTimeSec,
      Number((machine.actualCycleTimeSec + jitter).toFixed(1))
    );
    const newRate = Math.round(3600 / newActualCycle);

    return this.machineRepo.updateProductionCounts(
      machine.id,
      newTotal,
      newGood,
      newReject,
      newActualCycle,
      newRate
    );
  }
}
