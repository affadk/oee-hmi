// /src/infrastructure/backend/dto/master-data.dto.ts
// Boundary DTO: master-data JSON (Devices §E, Machines §F, Products §G,
// Operators §H) → domain records. Backend boleh mengirim camelCase atau
// snake_case, plus envelope `{data, meta}` untuk endpoint list (kontrak §1.3).
// Toleran seperti mapper lain: jangan biarkan record rusak jadi `undefined`.

import type {
  DeviceRecord,
  MachineRecord,
  OperatorRecord,
  OperatorRole,
  ProductRecord,
} from '../../../domain/entities/backend/Device';
import { toFiniteNumber } from '../../../domain/entities/backend/LiveState';

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function str(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c !== '') return c;
    if (typeof c === 'number' && Number.isFinite(c)) return String(c);
  }
  return '';
}

function strOrNull(...candidates: unknown[]): string | null {
  const s = str(...candidates);
  return s === '' ? null : s;
}

function bool(...candidates: unknown[]): boolean {
  for (const c of candidates) {
    if (typeof c === 'boolean') return c;
    if (c === 1 || c === '1' || c === 'true') return true;
    if (c === 0 || c === '0' || c === 'false') return false;
  }
  return false;
}

/**
 * List endpoint: bare array ATAU envelope `{data: [...]}`. `{data: {...}}`
 * (objek tunggal) tidak dianggap list — kembalikan [] jujur.
 */
function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

/** Detail/mutation endpoint: objek langsung ATAU envelope `{data: {...}}`. */
function unwrapRecord(raw: unknown): RawRecord {
  const rec = asRecord(raw);
  const inner = asRecord(rec.data);
  return Object.keys(inner).length > 0 ? inner : rec;
}

const OPERATOR_ROLES: OperatorRole[] = ['OPERATOR', 'SUPERVISOR', 'ADMIN', 'MAINTENANCE'];

function normalizeRole(raw: unknown): OperatorRole {
  const s = String(raw ?? 'OPERATOR').toUpperCase();
  return (OPERATOR_ROLES as string[]).includes(s) ? (s as OperatorRole) : 'OPERATOR';
}

export function mapDeviceDto(raw: unknown): DeviceRecord {
  const r = unwrapRecord(raw);
  const bound = r.boundMachine ?? r.bound_machine;
  const bm = bound && typeof bound === 'object' ? asRecord(bound) : null;
  const machineId = bm ? str(bm.machineId, bm.machine_id) : '';
  return {
    deviceId: str(r.deviceId, r.device_id),
    model: strOrNull(r.model),
    macAddress: strOrNull(r.macAddress, r.mac_address),
    ipAddress: strOrNull(r.ipAddress, r.ip_address),
    firmwareVersion: strOrNull(r.firmwareVersion, r.firmware_version),
    isOnline: bool(r.isOnline, r.is_online),
    lastSeenAt: strOrNull(r.lastSeenAt, r.last_seen_at),
    createdAt: str(r.createdAt, r.created_at),
    boundMachine: machineId === ''
      ? null
      : { machineId, machineName: bm ? str(bm.machineName, bm.machine_name) : '' },
  };
}

export function mapMachineDto(raw: unknown): MachineRecord {
  const r = unwrapRecord(raw);
  const bound = r.boundDevice ?? r.bound_device;
  const bd = bound && typeof bound === 'object' ? asRecord(bound) : null;
  const deviceId = bd ? str(bd.deviceId, bd.device_id) : '';
  return {
    machineId: str(r.machineId, r.machine_id),
    machineName: str(r.machineName, r.machine_name),
    // `deviceId` top-level (bind 1:1) menang; fallback ke boundDevice.deviceId.
    deviceId: strOrNull(r.deviceId, r.device_id) ?? (deviceId === '' ? null : deviceId),
    modbusSlaveId: toFiniteNumber(r.modbusSlaveId ?? r.modbus_slave_id),
    createdAt: str(r.createdAt, r.created_at),
    lineId: strOrNull(r.lineId, r.line_id),
    boundDevice: deviceId === ''
      ? null
      : {
          deviceId,
          macAddress: strOrNull(bd?.macAddress, bd?.mac_address),
          isOnline: bd ? bool(bd.isOnline, bd.is_online) : false,
        },
  };
}

export function mapProductDto(raw: unknown): ProductRecord {
  const r = unwrapRecord(raw);
  return {
    productId: str(r.productId, r.product_id),
    productName: str(r.productName, r.product_name),
    stdCycleTimeSec: toFiniteNumber(r.stdCycleTimeSec ?? r.std_cycle_time_sec),
    createdAt: str(r.createdAt, r.created_at),
  };
}

export function mapOperatorDto(raw: unknown): OperatorRecord {
  const r = unwrapRecord(raw);
  return {
    operatorId: str(r.operatorId, r.operator_id),
    operatorName: str(r.operatorName, r.operator_name),
    role: normalizeRole(r.role),
    lineId: strOrNull(r.lineId, r.line_id),
    isActive: bool(r.isActive, r.is_active),
    createdAt: str(r.createdAt, r.created_at),
  };
}

export function mapDeviceListDto(raw: unknown): DeviceRecord[] {
  return unwrapList<unknown>(raw).map(mapDeviceDto);
}

export function mapMachineListDto(raw: unknown): MachineRecord[] {
  return unwrapList<unknown>(raw).map(mapMachineDto);
}

export function mapProductListDto(raw: unknown): ProductRecord[] {
  return unwrapList<unknown>(raw).map(mapProductDto);
}

export function mapOperatorListDto(raw: unknown): OperatorRecord[] {
  return unwrapList<unknown>(raw).map(mapOperatorDto);
}
