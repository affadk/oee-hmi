// /src/infrastructure/adapters/InMemoryMachineRepository.ts

import { IMachineRepository } from '../../../domain/ports/IMachineRepository';
import { MachineConfig, MachineStatus } from '../../../domain/entities/Machine';
import { MqttJobConfigPayload, MqttTelemetryPayload } from '../../../domain/entities/MqttContracts';
import { INITIAL_MACHINES } from '../../simulation/data-generation/seedData';

export class InMemoryMachineRepository implements IMachineRepository {
  private machines: MachineConfig[];

  constructor(initialData: MachineConfig[] = INITIAL_MACHINES) {
    this.machines = JSON.parse(JSON.stringify(initialData));
  }

  public async getAllMachines(): Promise<MachineConfig[]> {
    return [...this.machines];
  }

  public async getMachineById(id: string): Promise<MachineConfig | null> {
    const found = this.machines.find((m) => m.id === id || m.deviceId === id);
    return found ? { ...found } : null;
  }

  public async updateMachineStatus(
    id: string,
    status: MachineStatus,
    _statusSince: string
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === id || m.deviceId === id);
    if (index === -1) {
      throw new Error(`Machine with id ${id} not found.`);
    }

    const stateMap: Record<MachineStatus, number> = {
      RUNNING: 2,
      IDLE: 1,
      DOWN: 4,
      SETUP: 3,
      PLANNED_STOP: 3,
    };

    const target = this.machines[index];
    if (!target) {
      throw new Error('Machine not found in simulation store.');
    }
    const newTelemetry: MqttTelemetryPayload = {
      ...target.telemetry,
      st: stateMap[status] ?? 2,
      rpm: status === 'RUNNING' ? 1450 : 0,
    };

    const updated: MachineConfig = {
      ...target,
      status,
      telemetry: newTelemetry,
    };
    this.machines[index] = updated;
    return { ...updated };
  }

  public async updateTelemetry(
    machineId: string,
    telemetry: Partial<MqttTelemetryPayload>
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId || m.deviceId === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const target = this.machines[index];
    if (!target) {
      throw new Error('Machine not found in simulation store.');
    }
    const updatedTelemetry: MqttTelemetryPayload = {
      ...target.telemetry,
      ...telemetry,
      ts: telemetry.ts ?? Math.floor(Date.now() / 1000),
    };

    const updated: MachineConfig = {
      ...target,
      lastTelemetryTs: updatedTelemetry.ts,
      telemetry: updatedTelemetry,
      totalCount: updatedTelemetry.tot,
      rejectCount: updatedTelemetry.rej,
      goodCount: Math.max(0, updatedTelemetry.tot - updatedTelemetry.rej),
    };

    this.machines[index] = updated;
    return { ...updated };
  }

  public async updateProductionCounts(
    machineId: string,
    totalCount: number,
    goodCount: number,
    rejectCount: number,
    actualCycleTimeSec: number,
    actualHourlyRate: number
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId || m.deviceId === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const target = this.machines[index];
    if (!target) {
      throw new Error('Machine not found in simulation store.');
    }
    const cycScaled = Math.round(actualCycleTimeSec * 100);
    const updatedTelemetry: MqttTelemetryPayload = {
      ...target.telemetry,
      tot: totalCount,
      rej: rejectCount,
      cyc: cycScaled,
    };

    // Synchronize last hour's trend data with live counter updates
    const updatedHourlyTrends = [...target.hourlyTrends];
    if (updatedHourlyTrends.length > 0) {
      const lastIdx = updatedHourlyTrends.length - 1;
      const lastPoint = updatedHourlyTrends[lastIdx];
      if (lastPoint) {
        const deltaTotal = totalCount - target.totalCount;
        const deltaGood = goodCount - target.goodCount;
        const deltaReject = rejectCount - target.rejectCount;

        if (deltaTotal !== 0 || deltaReject !== 0) {
          const newAct = Math.max(0, lastPoint.actual + deltaTotal);
          const newGd = Math.max(0, lastPoint.good + deltaGood);
          const newRej = Math.max(0, lastPoint.reject + deltaReject);
          const newQual = newAct > 0 ? Number(((newGd / newAct) * 100).toFixed(1)) : lastPoint.quality;

          updatedHourlyTrends[lastIdx] = {
            ...lastPoint,
            actual: newAct,
            good: newGd,
            reject: newRej,
            quality: newQual,
          };
        }
      }
    }

    const updated: MachineConfig = {
      ...target,
      totalCount,
      goodCount,
      rejectCount,
      actualCycleTimeSec,
      actualHourlyRate,
      telemetry: updatedTelemetry,
      hourlyTrends: updatedHourlyTrends,
    };

    this.machines[index] = updated;
    return { ...updated };
  }

  public async resetCounters(machineId: string): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId || m.deviceId === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const target = this.machines[index];
    if (!target) {
      throw new Error('Machine not found in simulation store.');
    }
    const updatedTelemetry: MqttTelemetryPayload = {
      ...target.telemetry,
      tot: 0,
      rej: 0,
      run: 0,
      dt: 0,
    };

    const resetHourlyTrends = target.hourlyTrends.map((h) => ({
      ...h,
      actual: 0,
      good: 0,
      reject: 0,
      quality: 100,
      performance: 0,
      oee: 0,
    }));

    const updated: MachineConfig = {
      ...target,
      totalCount: 0,
      goodCount: 0,
      rejectCount: 0,
      telemetry: updatedTelemetry,
      hourlyTrends: resetHourlyTrends,
    };

    this.machines[index] = updated;
    return { ...updated };
  }

  public async setJobConfig(
    machineId: string,
    jobConfig: MqttJobConfigPayload
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId || m.deviceId === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const target = this.machines[index];
    if (!target) {
      throw new Error('Machine not found in simulation store.');
    }
    const newTargetQty = jobConfig.shift_plan.target_qty;
    const hoursCount = target.hourlyTrends.length || 8;
    const newHourlyTarget = Math.round(newTargetQty / hoursCount);

    const updatedHourlyTrends = target.hourlyTrends.map((h) => ({
      ...h,
      target: newHourlyTarget,
    }));

    const updated: MachineConfig = {
      ...target,
      currentProduct: jobConfig.product.name,
      idealCycleTimeSec: jobConfig.product.std_cycle_time_sec,
      targetCount: newTargetQty,
      hourlyTrends: updatedHourlyTrends,
      jobConfig: {
        workOrder: jobConfig.work_order,
        productName: jobConfig.product.name,
        productId: jobConfig.product.id,
        operatorName: jobConfig.operator.name,
        operatorId: jobConfig.operator.id,
        standardCycleTimeSec: jobConfig.product.std_cycle_time_sec,
        targetQuantity: newTargetQty,
        shiftStart: jobConfig.shift_plan.shift_start,
        shiftEnd: jobConfig.shift_plan.shift_end,
        breakTimeWindow: jobConfig.shift_plan.break_window || target.jobConfig?.breakTimeWindow || '12:00 - 13:00',
        plannedBreakMin: jobConfig.shift_plan.planned_break_min,
        plannedOperatingSec: jobConfig.shift_plan.planned_operating_sec,
      },
    };

    this.machines[index] = updated;
    return { ...updated };
  }
}

