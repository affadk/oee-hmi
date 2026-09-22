// /src/domain/services/OeeCalculator.ts

import { MachineConfig } from '../entities/Machine';
import { CalculatedOeeMetrics } from '../entities/OeeMetrics';
import { MqttTelemetryPayload } from '../entities/MqttContracts';

/**
 * Domain Service: Pure OEE Calculation and MQTT Contract Decoders.
 * ISO 22400 / TPM standard calculations:
 * Availability = Run Time / Planned Operating Time
 * Performance = (Ideal Cycle Time × Total Count) / Run Time
 * Quality = Good Count / Total Count
 * OEE = Availability × Performance × Quality
 */
export class OeeCalculator {
  /**
   * Decodes raw MQTT scaled integers from STM32 telemetry payload to real engineering units.
   */
  public static decodeMqttTelemetry(telemetry: MqttTelemetryPayload) {
    return {
      oeePct: Number((telemetry.oee / 100).toFixed(1)),
      availabilityPct: Number((telemetry.a / 100).toFixed(1)),
      performancePct: Number((telemetry.p / 100).toFixed(1)),
      qualityPct: Number((telemetry.q / 100).toFixed(1)),
      lastCycleSec: Number((telemetry.cyc / 100).toFixed(2)),
      temperatureC: Number((telemetry.tmp / 10).toFixed(1)),
      rpm: telemetry.rpm,
      totalCount: telemetry.tot,
      rejectCount: telemetry.rej,
      goodCount: Math.max(0, telemetry.tot - telemetry.rej),
      runTimeSec: telemetry.run,
      downtimeSec: telemetry.dt,
      alarmCode: telemetry.alm,
      stateCode: telemetry.st,
      isBuffered: Boolean(telemetry.is_buffered),
    };
  }

  /**
   * Translates STM32 state integer (0..5) to readable status label.
   */
  public static getMqttStateLabel(st: number): string {
    switch (st) {
      case 0: return 'UNCONFIGURED';
      case 1: return 'READY';
      case 2: return 'RUNNING';
      case 3: return 'PLANNED_DT';
      case 4: return 'UNPLANNED_DT';
      case 5: return 'BATCH_FINISHED';
      default: return 'UNKNOWN';
    }
  }

  public static calculate(machine: MachineConfig): CalculatedOeeMetrics {
    const plannedProductionTimeMin = Math.max(1, machine.shiftDurationMinutes - machine.plannedDowntimeMinutes);
    const downtimeMin = machine.unplannedDowntimeMinutes;
    const runTimeMin = Math.max(0, plannedProductionTimeMin - downtimeMin);

    // If telemetry values are available, prioritize MQTT contract values
    const availabilityPct = machine.telemetry?.a ? Number((machine.telemetry.a / 100).toFixed(1)) : 0;
    const performancePct = machine.telemetry?.p ? Number((machine.telemetry.p / 100).toFixed(1)) : 0;
    const qualityPct = machine.telemetry?.q ? Number((machine.telemetry.q / 100).toFixed(1)) : 0;
    const oeePct = machine.telemetry?.oee ? Number((machine.telemetry.oee / 100).toFixed(1)) : 0;

    const totalCount = machine.telemetry?.tot ?? machine.totalCount;
    const rejectCount = machine.telemetry?.rej ?? machine.rejectCount;
    const goodCount = Math.max(0, totalCount - rejectCount);
    const targetCount = machine.jobConfig?.targetQuantity ?? machine.targetCount;

    // Production Achievement
    const achievementPct = targetCount > 0 
      ? Number(((totalCount / targetCount) * 100).toFixed(1)) 
      : 0;

    // Equivalent units loss calculation
    const safeCycleTime = Math.max(0.1, machine.idealCycleTimeSec);
    const potentialProductionPcs = Math.round((plannedProductionTimeMin * 60) / safeCycleTime);
    const totalLossPcs = Math.max(0, potentialProductionPcs - goodCount);
    const availabilityLossPcs = Math.round((downtimeMin * 60) / safeCycleTime);
    const qualityLossPcs = rejectCount;
    const performanceLossPcs = Math.max(0, totalLossPcs - availabilityLossPcs - qualityLossPcs);
    const performanceLossMin = Math.round((performanceLossPcs * safeCycleTime) / 60);

    const calendarUtilizationPct = 0;
    const teepPct = Number(((oeePct * (calendarUtilizationPct / 100))).toFixed(1));

    return {
      plannedProductionTimeMin,
      runTimeMin,
      downtimeMin,
      availabilityPct,
      performancePct,
      qualityPct,
      oeePct,
      oeeGap: Number((oeePct - machine.targetOee).toFixed(1)),
      availabilityGap: Number((availabilityPct - machine.targetAvailability).toFixed(1)),
      performanceGap: Number((performancePct - machine.targetPerformance).toFixed(1)),
      qualityGap: Number((qualityPct - machine.targetQuality).toFixed(1)),
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

/** Named helper — lets presentation import { formatNumber } without the class. */
export function formatNumber(num: number): string {
  return OeeCalculator.formatNumber(num);
}

