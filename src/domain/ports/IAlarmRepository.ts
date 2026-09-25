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
   * @param operatorId acknowledged-by attribution for server-synced backends
   * (G4); omitted = local-only update.
   */
  updateAlarmStatus(alarmId: string, status: AlarmStatus, operatorId?: string): Promise<MachineAlarmEvent>;
}
