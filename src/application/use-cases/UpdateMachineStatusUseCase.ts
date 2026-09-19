// /src/application/use-cases/UpdateMachineStatusUseCase.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import { MachineConfig, MachineStatus } from '../../domain/entities/Machine';
import { MachineAlarmEvent } from '../../domain/entities/Alarm';

export class UpdateMachineStatusUseCase {
  constructor(
    private readonly machineRepo: IMachineRepository,
    private readonly alarmRepo: IAlarmRepository
  ) {}

  public async execute(
    machineId: string,
    newStatus: MachineStatus
  ): Promise<{ updatedMachine: MachineConfig; createdAlarm?: MachineAlarmEvent }> {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const statusSince = `${timeNow} (${newStatus === 'RUNNING' ? 'Running' : newStatus})`;

    const updatedMachine = await this.machineRepo.updateMachineStatus(machineId, newStatus, statusSince);

    let createdAlarm: MachineAlarmEvent | undefined;
    if (newStatus === 'DOWN') {
      createdAlarm = {
        id: `alm-${Date.now()}`,
        timestamp: timeNow,
        type: 'Breakdown',
        machineId,
        durationMinutes: 1,
        status: 'Waiting Maintenance',
        description: `Floor status change: Machine ${machineId} flagged as DOWN`,
        operator: 'Line Supervisor',
      };
      await this.alarmRepo.addAlarm(createdAlarm);
    }

    return { updatedMachine, createdAlarm };
  }
}
