// /src/domain/entities/Alarm.ts

export type AlarmType = 'Breakdown' | 'Material' | 'Quality' | 'Speed' | 'Warning';

export type AlarmStatus = 'Waiting Maintenance' | 'In Progress' | 'Resolved' | 'Acknowledged';

export interface MachineAlarmEvent {
  id: string;
  timestamp: string;
  type: AlarmType;
  machineId: string;
  durationMinutes: number;
  status: AlarmStatus;
  description: string;
  operator: string;
}
