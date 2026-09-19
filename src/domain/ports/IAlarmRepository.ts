// /src/domain/ports/IAlarmRepository.ts

import { MachineAlarmEvent, AlarmStatus } from '../entities/Alarm';

export interface IAlarmRepository {
  /**
   * Retrieves all production alarms and events.
   */
  getAllAlarms(): Promise<MachineAlarmEvent[]>;

  /**
   * Appends a new alarm event.
   */
  addAlarm(alarm: MachineAlarmEvent): Promise<MachineAlarmEvent>;

  /**
   * Updates the status of an existing alarm (e.g. Acknowledged or Resolved).
   */
  updateAlarmStatus(alarmId: string, status: AlarmStatus): Promise<MachineAlarmEvent>;
}
