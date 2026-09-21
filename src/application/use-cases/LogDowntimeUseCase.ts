// /src/application/use-cases/LogDowntimeUseCase.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import { MachineConfig } from '../../domain/entities/Machine';
import { MachineAlarmEvent, AlarmType } from '../../domain/entities/Alarm';

export class LogDowntimeUseCase {
  constructor(
    private readonly machineRepo: IMachineRepository,
    private readonly alarmRepo: IAlarmRepository
  ) {}

  public async execute(
    machineId: string,
    event: { category: string; label: string; durationMinutes: number }
  ): Promise<{ updatedMachine: MachineConfig; createdAlarm: MachineAlarmEvent }> {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const machine = await this.machineRepo.getMachineById(machineId);
    const prevDt = machine?.telemetry?.dt ?? 2520;
    const addSec = event.durationMinutes * 60;

    const updatedMachine = await this.machineRepo.updateTelemetry(machineId, {
      dt: prevDt + addSec,
      st: 4, // UNPLANNED_DT
    });

    const alarmType: AlarmType =
      event.category === 'Breakdown'
        ? 'Breakdown'
        : event.category === 'Material'
        ? 'Material'
        : 'Warning';

    const createdAlarm: MachineAlarmEvent = {
      id: `alm-${Date.now()}`,
      timestamp: timeNow,
      type: alarmType,
      machineId,
      durationMinutes: event.durationMinutes,
      status: 'In Progress',
      description: `${event.label} (${event.durationMinutes} min downtime logged)`,
      operator: machine?.jobConfig?.operatorName ?? 'Floor Operator',
    };

    await this.alarmRepo.addAlarm(createdAlarm);

    return { updatedMachine, createdAlarm };
  }
}

