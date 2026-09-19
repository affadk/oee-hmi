// /src/domain/services/OeeCalculator.ts

import { MachineConfig } from '../entities/Machine';
import { CalculatedOeeMetrics } from '../entities/OeeMetrics';

/**
 * Domain Service: Pure OEE Calculation conforming strictly to ISO 22400 / TPM standards.
 * Availability = Run Time / Planned Production Time
 * Performance = (Ideal Cycle Time × Total Count) / Run Time
 * Quality = Good Count / Total Count
 * OEE = Availability × Performance × Quality
 * TEEP = OEE × Calendar Utilization
 */
export class OeeCalculator {
  public static calculate(machine: MachineConfig): CalculatedOeeMetrics {
    const plannedProductionTimeMin = Math.max(1, machine.shiftDurationMinutes - machine.plannedDowntimeMinutes);
    const downtimeMin = machine.unplannedDowntimeMinutes;
    const runTimeMin = Math.max(0, plannedProductionTimeMin - downtimeMin);

    // 1. Availability = Run Time / Planned Production Time
    const availability = plannedProductionTimeMin > 0 ? (runTimeMin / plannedProductionTimeMin) : 0;

    // 2. Performance = (Ideal Cycle Time * Total Count) / Run Time (seconds)
    const runTimeSec = runTimeMin * 60;
    const theoreticalOperatingTimeSec = machine.idealCycleTimeSec * machine.totalCount;
    const performance = runTimeSec > 0 ? Math.min(1.2, theoreticalOperatingTimeSec / runTimeSec) : 0;

    // 3. Quality = Good Count / Total Count
    const quality = machine.totalCount > 0 ? (machine.goodCount / machine.totalCount) : 0;

    // 4. OEE = Availability * Performance * Quality
    const oee = availability * performance * quality;

    // Percentages (0 - 100)
    const availabilityPct = Number((availability * 100).toFixed(1));
    const performancePct = Number((performance * 100).toFixed(1));
    const qualityPct = Number((quality * 100).toFixed(1));
    const oeePct = Number((oee * 100).toFixed(1));

    // Gaps vs Target
    const oeeGap = Number((oeePct - machine.targetOee).toFixed(1));
    const availabilityGap = Number((availabilityPct - machine.targetAvailability).toFixed(1));
    const performanceGap = Number((performancePct - machine.targetPerformance).toFixed(1));
    const qualityGap = Number((qualityPct - machine.targetQuality).toFixed(1));

    // Production Achievement
    const achievementPct = machine.targetCount > 0 
      ? Number(((machine.totalCount / machine.targetCount) * 100).toFixed(1)) 
      : 0;

    // Equivalent units loss calculation
    const potentialProductionPcs = Math.round((plannedProductionTimeMin * 60) / machine.idealCycleTimeSec);
    const totalLossPcs = Math.max(0, potentialProductionPcs - machine.goodCount);

    // Availability loss in units = Downtime / Ideal Cycle Time
    const availabilityLossPcs = Math.round((downtimeMin * 60) / machine.idealCycleTimeSec);

    // Quality loss in units = Total Count - Good Count (Rejects)
    const qualityLossPcs = Math.max(0, machine.totalCount - machine.goodCount);

    // Performance loss in units = Remaining loss
    const performanceLossPcs = Math.max(0, totalLossPcs - availabilityLossPcs - qualityLossPcs);

    // Performance loss in minutes (time lost due to speed reduction & minor stops)
    const performanceLossMin = Math.round((performanceLossPcs * machine.idealCycleTimeSec) / 60);

    // Calendar Utilization & TEEP
    const calendarUtilization = machine.shiftDurationMinutes > 0 
      ? (plannedProductionTimeMin / machine.shiftDurationMinutes) 
      : 0;
    const calendarUtilizationPct = Number((calendarUtilization * 100).toFixed(1));
    const teepPct = Number(((oee * calendarUtilization) * 100).toFixed(1));

    return {
      plannedProductionTimeMin,
      runTimeMin,
      downtimeMin,
      availabilityPct,
      performancePct,
      qualityPct,
      oeePct,
      oeeGap,
      availabilityGap,
      performanceGap,
      qualityGap,
      achievementPct,
      potentialProductionPcs,
      totalLossPcs,
      availabilityLossPcs,
      performanceLossPcs,
      qualityLossPcs,
      performanceLossMin,
      teepPct,
      calendarUtilizationPct,
    };
  }

  public static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }
}
