// /src/infrastructure/adapters/InMemoryAlarmRepository.ts

import { IAlarmRepository } from '../../../domain/ports/IAlarmRepository';
import { MachineAlarmEvent, AlarmStatus } from '../../../domain/entities/Alarm';
import { INITIAL_ALARMS } from '../../simulation/data-generation/seedData';

export class InMemoryAlarmRepository implements IAlarmRepository {
  private alarms: MachineAlarmEvent[];

  constructor(initialData: MachineAlarmEvent[] = INITIAL_ALARMS) {
    this.alarms = JSON.parse(JSON.stringify(initialData));
  }

  public async getAllAlarms(): Promise<MachineAlarmEvent[]> {
    return [...this.alarms];
  }

  public async addAlarm(alarm: MachineAlarmEvent): Promise<MachineAlarmEvent> {
    this.alarms = [alarm, ...this.alarms];
    return { ...alarm };
  }

  public async updateAlarmStatus(alarmId: string, status: AlarmStatus): Promise<MachineAlarmEvent> {
    const index = this.alarms.findIndex((a) => a.id === alarmId);
    if (index === -1) {
      throw new Error(`Alarm with id ${alarmId} not found.`);
    }

    const current = this.alarms[index];
    if (!current) {
      throw new Error(`Alarm with id ${alarmId} not found.`);
    }

    const updated: MachineAlarmEvent = {
      ...current,
      status,
    };
    this.alarms[index] = updated;
    return { ...updated };
  }
}
