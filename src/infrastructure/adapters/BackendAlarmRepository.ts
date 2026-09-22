// /src/infrastructure/adapters/BackendAlarmRepository.ts
// IAlarmRepository implementation backed by IIoT OEE operational-events.
// Maps operational events to MachineAlarmEvent[] for the AlarmsZone.
// In backend mode, alarms are read from operational-events endpoint.

import type { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import type { MachineAlarmEvent, AlarmType, AlarmStatus } from '../../domain/entities/Alarm';
import type { OperationalEvent } from '../../domain/entities/backend/Telemetry';
import { OeeHttpTelemetryRepository } from '../api/oeeApiClient';

const TYPE_MAP: Record<string, AlarmType> = {
  'PLC_ALARM': 'Breakdown',
  'COMMAND': 'Warning',
  'WO_DISPATCH': 'Warning',
  'WO_COMPLETED': 'Warning',
  'WO_CANCELLED': 'Warning',
  'DOWNTIME_REASON_LABELED': 'Warning',
  'MACHINE_BOUND': 'Warning',
  'MACHINE_UNBOUND': 'Warning',
  'MACHINE_DELETED': 'Warning',
  'PRODUCT_DELETED': 'Warning',
  'SHIFT_START': 'Warning',
  'SHIFT_END': 'Warning',
};

function mapOperationalEventToAlarm(event: OperationalEvent): MachineAlarmEvent {
  const alarmType = TYPE_MAP[event.eventType] ?? 'Warning';

  // Operational events don't carry a status field; default to 'In Progress'
  // and let operator actions (acknowledge/resolve) update via UI callbacks.
  const status: AlarmStatus = 'In Progress';

  return {
    id: `alm-${event.id}`,
    timestamp: event.timestamp,
    type: alarmType,
    machineId: event.machineId ?? event.deviceId ?? 'unknown',
    durationMinutes: 1,
    status,
    description: `${event.eventType}${event.machineId ? ` on ${event.machineId}` : ''}`,
    operator: 'System',
  };
}

export class BackendAlarmRepository implements IAlarmRepository {
  private readonly telemetryRepo: OeeHttpTelemetryRepository;

  constructor(telemetryRepo?: OeeHttpTelemetryRepository) {
    this.telemetryRepo = telemetryRepo ?? new OeeHttpTelemetryRepository();
  }

  async getAllAlarms(): Promise<MachineAlarmEvent[]> {
    try {
      // Fetch operational events for all devices (empty deviceId = all)
      const result = await this.telemetryRepo.getOperationalEvents('', undefined, undefined, 200, undefined, false);
      return result.data.map(mapOperationalEventToAlarm);
    } catch {
      return [];
    }
  }

  async addAlarm(alarm: MachineAlarmEvent): Promise<MachineAlarmEvent> {
    // Alarms are created via backend operational events or command responses.
    // Client-side alarm creation is not applicable in backend mode.
    return alarm;
  }

  async updateAlarmStatus(alarmId: string, status: AlarmStatus): Promise<MachineAlarmEvent> {
    const id = alarmId.replace('alm-', '');
    return {
      id: alarmId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Warning',
      machineId: 'unknown',
      durationMinutes: 1,
      status,
      description: `Alarm ${id} updated to ${status}`,
      operator: 'System',
    };
  }
}