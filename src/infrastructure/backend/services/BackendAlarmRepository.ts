// /src/infrastructure/adapters/BackendAlarmRepository.ts
// IAlarmRepository implementation backed by IIoT OEE operational-events.
// Maps operational events to MachineAlarmEvent[] for the AlarmsZone.
// In backend mode, alarms are read from operational-events endpoint.

import type { IAlarmRepository } from '../../../domain/ports/IAlarmRepository';
import type { MachineAlarmEvent, AlarmType, AlarmStatus } from '../../../domain/entities/Alarm';
import type { OperationalEvent } from '../../../domain/entities/backend/Telemetry';
import type { IMasterDataRepository, ITelemetryRepository } from '../../../domain/ports/IOeeBackend';

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

  // G4: event yang sudah di-ack backend tampil Acknowledged + operator.
  const acked = !!event.acknowledgedAt;
  const status: AlarmStatus = acked ? 'Acknowledged' : 'In Progress';

  return {
    id: `alm-${event.id}`,
    timestamp: event.timestamp,
    type: alarmType,
    machineId: event.machineId ?? event.deviceId ?? 'unknown',
    durationMinutes: 1,
    status,
    description: `${event.eventType}${event.machineId ? ` on ${event.machineId}` : ''}`,
    operator: event.acknowledgedBy ?? 'System',
  };
}

export class BackendAlarmRepository implements IAlarmRepository {
  constructor(
    private readonly telemetryRepo: ITelemetryRepository,
    private readonly masterDataRepo: IMasterDataRepository | null = null,
  ) {}

  async getAllAlarms(): Promise<MachineAlarmEvent[]> {
    // G5: umpan global tunggal (tanpa N+1). Gagal → fallback fan-out per
    // device (perilaku lama); gagal total → [] jujur.
    try {
      const global = await this.telemetryRepo.getAllOperationalEvents({ limit: 100, envelope: true });
      if (global.data.length > 0) {
        const alarms = global.data.map(mapOperationalEventToAlarm);
        alarms.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));
        return alarms.slice(0, 200);
      }
    } catch {
      // fall through to per-device fan-out
    }
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

  async updateAlarmStatus(alarmId: string, status: AlarmStatus, operatorId?: string): Promise<MachineAlarmEvent> {
    const id = alarmId.replace('alm-', '');
    // G4: sinkron ack ke server bila operator diketahui; gagal/unknown →
    // perilaku lokal lama (antar-sesi tak sinkron, tapi tak pernah merusak UI).
    if ((status === 'Acknowledged' || status === 'Resolved') && operatorId && /^\d+$/.test(id)) {
      try {
        const acked = await this.telemetryRepo.acknowledgeOperationalEvent(Number(id), operatorId);
        return {
          id: alarmId,
          timestamp: acked.timestamp,
          type: 'Warning',
          machineId: acked.machineId ?? acked.deviceId ?? 'unknown',
          durationMinutes: 1,
          status: 'Acknowledged',
          description: `Event ${id} acknowledged by ${acked.acknowledgedBy ?? operatorId}`,
          operator: acked.acknowledgedBy ?? operatorId,
        };
      } catch {
        // fall through to local-only below
      }
    }
    return {
      id: alarmId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Warning',
      machineId: 'unknown',
      durationMinutes: 1,
      status,
      description: `Alarm ${id} updated to ${status}`,
      operator: operatorId ?? 'System',
    };
  }
}