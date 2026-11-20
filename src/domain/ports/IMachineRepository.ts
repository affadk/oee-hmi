// /src/domain/ports/IMachineRepository.ts

import { MachineConfig, MachineStatus } from '../entities/Machine';
import { EdgeJobConfigPayload, EdgeTelemetryPayload } from '../entities/EdgeContracts';
import type { DeviceCommandKind } from '../entities/backend/Device';

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
   * Updates live MQTT telemetry frame.
   */
  updateTelemetry(machineId: string, telemetry: Partial<EdgeTelemetryPayload>): Promise<MachineConfig>;

  /**
   * Resets production counters (e.g. at start of new shift or job).
   */
  resetCounters(machineId: string): Promise<MachineConfig>;

  /**
   * Applies job configuration (Work order, product recipe, target count).
   */
  setJobConfig(machineId: string, jobConfig: EdgeJobConfigPayload): Promise<MachineConfig>;

  /**
   * FR-015: perintah perangkat kanonis 6 enum (§D). `count` wajib untuk
   * COUNT_ADJUST; reason ≥ 5 karakter divalidasi di gateway/domain.
   */
  sendCommand(machineId: string, command: DeviceCommandKind, reason: string, count?: number): Promise<MachineConfig>;
}

