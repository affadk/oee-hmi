// /src/domain/entities/OeeMetrics.ts

export interface CalculatedOeeMetrics {
  plannedProductionTimeMin: number;
  runTimeMin: number;
  downtimeMin: number;

  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;

  oeeGap: number; // Actual - Target
  availabilityGap: number;
  performanceGap: number;
  qualityGap: number;

  achievementPct: number; // Actual / Target

  // Equivalent units loss
  potentialProductionPcs: number;
  totalLossPcs: number;
  availabilityLossPcs: number;
  performanceLossPcs: number;
  qualityLossPcs: number;

  // Performance loss in time
  performanceLossMin: number;

  teepPct: number;
  calendarUtilizationPct: number;
}
