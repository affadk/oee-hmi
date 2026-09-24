// /src/infrastructure/adapters/BackendAlarmRepository.ts
// IAlarmRepository implementation backed by IIoT OEE operational-events.
// Maps operational events to MachineAlarmEvent[] for the AlarmsZone.
// In backend mode, alarms are read from operational-events endpoint.

import type { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import type { MachineAlarmEvent, AlarmType, AlarmStatus } from '../../domain/entities/Alarm';
import type { OperationalEvent } from '../../domain/entities/backend/Telemetry';
import type { IMasterDataRepository, ITelemetryRepository } from '../../domain/ports/IOeeBackend';

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
  constructor(
    private readonly telemetryRepo: ITelemetryRepository,
    private readonly masterDataRepo: IMasterDataRepository | null = null,
  ) {}

  async getAllAlarms(): Promise<MachineAlarmEvent[]> {
    try {
      // Route backend GET /operational-events/:deviceId mewajibkan deviceId
      // non-kosong — ambil daftar device dari registry lalu query per device.
      const deviceIds = await this.resolveDeviceIds();
      if (deviceIds.length === 0) return [];
      const settled = await Promise.all(
        deviceIds.map((deviceId) =>
          this.telemetryRepo
            .getOperationalEvents(deviceId, undefined, undefined, 50, undefined, false)
            .catch(() => ({ data: [] as OperationalEvent[], meta: { limit: 50, hasMore: false, nextCursor: null, count: 0 } }))
        )
      );
      const alarms = settled.flatMap((r) => r.data.map(mapOperationalEventToAlarm));
      alarms.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));
      return alarms.slice(0, 200);
    } catch {
      return [];
    }
  }

  private async resolveDeviceIds(): Promise<string[]> {
    if (!this.masterDataRepo) return [];
    try {
      const devices = await this.masterDataRepo.listDevices();
      return devices.map((d) => d.deviceId).filter((id) => !!id);
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