// /src/application/use-cases/CalculateOeeUseCase.ts

import { MachineConfig } from '../../domain/entities/Machine';
import { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import { OeeCalculator } from '../../domain/services/OeeCalculator';

export class CalculateOeeUseCase {
  public execute(machine: MachineConfig): CalculatedOeeMetrics {
    return OeeCalculator.calculate(machine);
  }
}
