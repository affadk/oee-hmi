// /src/application/use-cases/MqttEdgeCommandUseCase.ts

import { IMqttGateway, MqttEdgeCommand } from '../../domain/ports/IMqttGateway';
import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { MqttJobConfigPayload } from '../../domain/entities/MqttContracts';
import { MachineConfig } from '../../domain/entities/Machine';
import { splitOperatorDisplay } from '../../domain/entities/BatchQr';

export interface JobConfigDraft {
  workOrder: string;
  productName: string;
  operatorDisplay: string;
  targetQty: number;
  stdCycleTimeSec?: number;
  shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number };
  fallbackCycleSec?: number;
  fallbackShiftStart?: string;
  fallbackShiftEnd?: string;
  fallbackPlannedBreakMin?: number;
  fallbackPlannedOperatingSec?: number;
}

export function buildJobConfigPayload(draft: JobConfigDraft): MqttJobConfigPayload {
  const stdCycleSec = draft.stdCycleTimeSec ?? draft.fallbackCycleSec ?? 9.0;
  const { name: operatorName, id: operatorId } = splitOperatorDisplay(draft.operatorDisplay);
  return {
    command: 'SET_JOB_CONFIG',
    transaction_id: `tx-${Date.now()}`,
    work_order: draft.workOrder,
    product: {
      id: `PRD-${draft.productName.replace(/\s+/g, '-').toUpperCase()}`,
      name: draft.productName,
      std_cycle_time_sec: stdCycleSec,
    },
    operator: { id: operatorId, name: operatorName },
    shift_plan: {
      shift_start: draft.shiftOverride?.shiftStart ?? draft.fallbackShiftStart ?? '06:00',
      shift_end: draft.shiftOverride?.shiftEnd ?? draft.fallbackShiftEnd ?? '14:00',
      planned_break_min: draft.shiftOverride?.breakMin ?? draft.fallbackPlannedBreakMin ?? 60,
      planned_operating_sec: draft.fallbackPlannedOperatingSec ?? 25200,
      target_qty: draft.targetQty,
      ...(draft.shiftOverride?.breakWindow ? { break_window: draft.shiftOverride.breakWindow } : {}),
    },
  };
}

/** Presentation rate derivation kept next to the payload rule (not inside React). */
export function deriveActualRate(stdCycleSec: number): number {
  const theoretical = stdCycleSec > 0 ? Math.round(3600 / stdCycleSec) : 400;
  return Math.round(theoretical * 0.5075);
}

export class MqttEdgeCommandUseCase {
  constructor(
    private readonly mqttGateway: IMqttGateway,
    private readonly machineRepo: IMachineRepository
  ) {}

  public async dispatchCommand(
    machineId: string,
    command: MqttEdgeCommand
  ): Promise<{ message: string; updatedMachine?: MachineConfig }> {
    const result = await this.mqttGateway.sendCommand(machineId, command);

    let updatedMachine: MachineConfig | undefined;
    if (command === 'RESET_COUNTER') {
      updatedMachine = await this.machineRepo.resetCounters(machineId);
    } else if (command === 'PAUSE') {
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedMachine = await this.machineRepo.updateMachineStatus(machineId, 'DOWN', `${timeNow} (Paused via Edge)`);
    } else if (command === 'RESUME') {
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedMachine = await this.machineRepo.updateMachineStatus(machineId, 'RUNNING', `${timeNow} (Resumed via Edge)`);
    }

    return {
      message: result.message,
      updatedMachine,
    };
  }

  public async setJobConfig(
    machineId: string,
    payload: MqttJobConfigPayload
  ): Promise<{ transactionId: string; updatedMachine: MachineConfig }> {
    const result = await this.mqttGateway.sendJobConfig(payload);
    const updatedMachine = await this.machineRepo.setJobConfig(
      machineId,
      payload
    );

    return {
      transactionId: result.transactionId,
      updatedMachine,
    };
  }
}
