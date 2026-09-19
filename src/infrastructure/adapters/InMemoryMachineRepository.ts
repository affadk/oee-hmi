// /src/infrastructure/adapters/InMemoryMachineRepository.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { MachineConfig, MachineStatus, DowntimeReasonItem } from '../../domain/entities/Machine';
import { INITIAL_MACHINES } from '../../data/mockData';

export class InMemoryMachineRepository implements IMachineRepository {
  private machines: MachineConfig[];

  constructor(initialData: MachineConfig[] = INITIAL_MACHINES) {
    // Deep clone to prevent unintended reference mutation
    this.machines = JSON.parse(JSON.stringify(initialData));
  }

  public async getAllMachines(): Promise<MachineConfig[]> {
    return [...this.machines];
  }

  public async getMachineById(id: string): Promise<MachineConfig | null> {
    const found = this.machines.find((m) => m.id === id);
    return found ? { ...found } : null;
  }

  public async updateMachineStatus(
    id: string,
    status: MachineStatus,
    statusSince: string
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Machine with id ${id} not found.`);
    }

    const updated = {
      ...this.machines[index],
      status,
      statusSince,
    };
    this.machines[index] = updated;
    return { ...updated };
  }

  public async addDowntimeEvent(
    machineId: string,
    event: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'>
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const target = this.machines[index];
    const equivalentLossPcs = Math.round((event.durationMinutes * 60) / target.idealCycleTimeSec);
    const newReason: DowntimeReasonItem = {
      ...event,
      id: `dt-${Date.now()}`,
      equivalentLossPcs,
    };

    const updatedReasons = [newReason, ...target.downtimeReasons];
    const updatedDowntime = target.unplannedDowntimeMinutes + event.durationMinutes;

    const updatedMachine: MachineConfig = {
      ...target,
      unplannedDowntimeMinutes: updatedDowntime,
      downtimeReasons: updatedReasons,
    };

    this.machines[index] = updatedMachine;
    return { ...updatedMachine };
  }

  public async addRejectEvent(
    machineId: string,
    reasonLabel: string,
    count: number
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const target = this.machines[index];
    const newRejectTotal = target.rejectCount + count;
    const newTotal = target.totalCount + count;

    const existingIdx = target.rejectReasons.findIndex((r) => r.label === reasonLabel);
    let updatedRejectReasons = [...target.rejectReasons];

    if (existingIdx >= 0) {
      const prev = updatedRejectReasons[existingIdx];
      const newCount = prev.count + count;
      updatedRejectReasons[existingIdx] = {
        ...prev,
        count: newCount,
        percentage: Math.round((newCount / newRejectTotal) * 100),
      };
    } else {
      updatedRejectReasons.push({
        id: `rj-${Date.now()}`,
        label: reasonLabel,
        count,
        percentage: Math.round((count / newRejectTotal) * 100),
      });
    }

    updatedRejectReasons = updatedRejectReasons.map((r) => ({
      ...r,
      percentage: Math.round((r.count / newRejectTotal) * 100),
    }));

    const updatedMachine: MachineConfig = {
      ...target,
      totalCount: newTotal,
      rejectCount: newRejectTotal,
      rejectReasons: updatedRejectReasons,
    };

    this.machines[index] = updatedMachine;
    return { ...updatedMachine };
  }

  public async updateProductionCounts(
    machineId: string,
    totalCount: number,
    goodCount: number,
    rejectCount: number,
    actualCycleTimeSec: number,
    actualHourlyRate: number
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const updated: MachineConfig = {
      ...this.machines[index],
      totalCount,
      goodCount,
      rejectCount,
      actualCycleTimeSec,
      actualHourlyRate,
    };

    this.machines[index] = updated;
    return { ...updated };
  }

  public async resetCounters(machineId: string): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const updated: MachineConfig = {
      ...this.machines[index],
      totalCount: 0,
      goodCount: 0,
      rejectCount: 0,
    };

    this.machines[index] = updated;
    return { ...updated };
  }

  public async setJobConfig(
    machineId: string,
    product: string,
    targetCount: number
  ): Promise<MachineConfig> {
    const index = this.machines.findIndex((m) => m.id === machineId);
    if (index === -1) {
      throw new Error(`Machine with id ${machineId} not found.`);
    }

    const updated: MachineConfig = {
      ...this.machines[index],
      currentProduct: product,
      targetCount,
    };

    this.machines[index] = updated;
    return { ...updated };
  }
}
