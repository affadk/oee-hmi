// /src/application/use-cases/GetMachinesUseCase.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { MachineConfig } from '../../domain/entities/Machine';

export class GetMachinesUseCase {
  constructor(private readonly machineRepo: IMachineRepository) {}

  public async executeAll(): Promise<MachineConfig[]> {
    return this.machineRepo.getAllMachines();
  }

  public async executeById(id: string): Promise<MachineConfig | null> {
    return this.machineRepo.getMachineById(id);
  }
}
