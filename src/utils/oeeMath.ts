// /src/utils/oeeMath.ts
// Re-export domain calculation service for backwards compatibility

import { OeeCalculator } from '../domain/services/OeeCalculator';
import { MachineConfig } from '../domain/entities/Machine';
import { CalculatedOeeMetrics } from '../domain/entities/OeeMetrics';

export function calculateOeeMetrics(machine: MachineConfig): CalculatedOeeMetrics {
  return OeeCalculator.calculate(machine);
}

export function formatNumber(num: number): string {
  return OeeCalculator.formatNumber(num);
}
