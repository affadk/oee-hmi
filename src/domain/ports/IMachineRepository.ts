// /src/domain/ports/IMachineRepository.ts

import { MachineConfig, MachineStatus, DowntimeReasonItem, RejectReasonItem } from '../entities/Machine';

export interface IMachineRepository {
  /**
   * Retrieves all available machines in the production plant.
   */
  getAllMachines(): Promise<MachineConfig[]>;

  /**
   * Retrieves a single machine by ID.
   */
  getMachineById(id: string): Promise<MachineConfig | null>;

  /**
   * Updates machine operating status (e.g. RUNNING, DOWN, IDLE, SETUP).
   */
  updateMachineStatus(id: string, status: MachineStatus, statusSince: string): Promise<MachineConfig>;

  /**
   * Appends a new downtime event and updates total downtime.
   */
  addDowntimeEvent(
    machineId: string,
    event: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'>
  ): Promise<MachineConfig>;

  /**
   * Appends reject counts and recalculates Pareto distribution percentages.
   */
  addRejectEvent(
    machineId: string,
    reasonLabel: string,
    count: number
  ): Promise<MachineConfig>;

  /**
   * Updates pulse count, good/reject count, and actual cycle time (sensor simulation).
   */
  updateProductionCounts(
    machineId: string,
    totalCount: number,
    goodCount: number,
    rejectCount: number,
    actualCycleTimeSec: number,
    actualHourlyRate: number
  ): Promise<MachineConfig>;

  /**
   * Resets production counters (e.g. at start of new shift or job).
   */
  resetCounters(machineId: string): Promise<MachineConfig>;

  /**
   * Applies job configuration (Work order, product recipe, target count).
   */
  setJobConfig(machineId: string, product: string, targetCount: number): Promise<MachineConfig>;
}
