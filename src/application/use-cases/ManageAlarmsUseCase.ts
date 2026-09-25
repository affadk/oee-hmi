// /src/application/use-cases/ManageAlarmsUseCase.ts

import { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import { MachineAlarmEvent } from '../../domain/entities/Alarm';

export class ManageAlarmsUseCase {
  constructor(private readonly alarmRepo: IAlarmRepository) {}

  public async getAllAlarms(): Promise<MachineAlarmEvent[]> {
    return this.alarmRepo.getAllAlarms();
  }

  public async acknowledgeAlarm(alarmId: string, operatorId?: string): Promise<MachineAlarmEvent> {
    return this.alarmRepo.updateAlarmStatus(alarmId, 'Acknowledged', operatorId);
  }

  public async resolveAlarm(alarmId: string, operatorId?: string): Promise<MachineAlarmEvent> {
    return this.alarmRepo.updateAlarmStatus(alarmId, 'Resolved', operatorId);
  }

  public async addCustomAlarm(alarm: MachineAlarmEvent): Promise<MachineAlarmEvent> {
    return this.alarmRepo.addAlarm(alarm);
  }
}
