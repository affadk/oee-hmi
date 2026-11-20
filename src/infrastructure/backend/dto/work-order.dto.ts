// /src/application/dto/work-order.dto.ts
// Boundary DTO: raw REST JSON → domain WorkOrderListItem.

import type {
  InitiateFromZonesResult,
  WorkOrderListItem,
  WorkOrderResolveResult,
  WorkOrderStatus,
  ZoneType,
  ZoneValidation,
} from '../../../domain/entities/backend/WorkOrder';
import { toFiniteNumber } from '../../../domain/entities/backend/LiveState';

interface RawWorkOrder {
  wo_id?: string; woId?: string;
  machine_id?: string; machineId?: string;
  machine_name?: string | null; machineName?: string | null;
  product_id?: string | null; productId?: string | null;
  product_name?: string | null; productName?: string | null;
  operator_id?: string | null; operatorId?: string | null;
  operator_name?: string | null; operatorName?: string | null;
  target_qty?: number; targetQty?: number; target_quantity?: number;
  status?: string;
  created_at?: string; createdAt?: string;
  start_time?: string | null; startTime?: string | null;
  end_time?: string | null; endTime?: string | null;
  dispatched_at?: string | null; dispatchedAt?: string | null;
  acked_at?: string | null; ackedAt?: string | null;
  actual_start_at?: string | null; actualStartAt?: string | null;
  actual_end_at?: string | null; actualEndAt?: string | null;
  provisional?: boolean;
  count_uncertain?: boolean; countUncertain?: boolean;
}

interface RawWorkOrderResolve {
  wo_id?: string; woId?: string;
  machine_id?: string; machineId?: string;
  product_id?: string; productId?: string;
  product_name?: string; productName?: string;
  std_cycle_time_sec?: string | number; stdCycleTimeSec?: string | number;
  operator_id?: string; operatorId?: string;
  operator_name?: string; operatorName?: string;
  target_qty?: number; targetQty?: number;
  shift_plan?: {
    shift_start?: string;
    shift_end?: string;
    planned_break_min?: number;
    planned_operating_sec?: number;
  };
  shiftPlan?: {
    shiftStart?: string;
    shiftEnd?: string;
    plannedBreakMin?: number;
    plannedOperatingSec?: number;
  };
  targetPerHour?: number | null;
  target_per_hour?: number | null;
  /** G10 terstruktur; string "HH:mm - HH:mm" tetap didukung via jobConfig. */
  break?: { start?: string; end?: string; minutes?: number } | null;
  status?: string;
}

function normalizeStatus(raw: unknown): WorkOrderStatus {
  const s = String(raw ?? 'PENDING').toUpperCase();
  return s === 'ACTIVE' || s === 'PENDING_CLOSE' || s === 'COMPLETED' || s === 'ABORTED' ? (s as WorkOrderStatus) : 'PENDING';
}

export function mapWorkOrderDto(raw: RawWorkOrder): WorkOrderListItem {
  return {
    woId: raw.wo_id ?? raw.woId ?? '',
    machineId: raw.machine_id ?? raw.machineId ?? '',
    machineName: raw.machine_name ?? raw.machineName ?? null,
    productId: raw.product_id ?? raw.productId ?? null,
    productName: raw.product_name ?? raw.productName ?? null,
    operatorId: raw.operator_id ?? raw.operatorId ?? null,
    operatorName: raw.operator_name ?? raw.operatorName ?? null,
    targetQty: raw.target_qty ?? raw.targetQty ?? raw.target_quantity ?? 0,
    status: normalizeStatus(raw.status),
    createdAt: raw.created_at ?? raw.createdAt ?? new Date(0).toISOString(),
    startTime: raw.start_time ?? raw.startTime ?? null,
    endTime: raw.end_time ?? raw.endTime ?? null,
    dispatchedAt: raw.dispatched_at ?? raw.dispatchedAt ?? null,
    ackedAt: raw.acked_at ?? raw.ackedAt ?? null,
    actualStartAt: raw.actual_start_at ?? raw.actualStartAt ?? null,
    actualEndAt: raw.actual_end_at ?? raw.actualEndAt ?? null,
    provisional: raw.provisional ?? false,
    countUncertain: raw.count_uncertain ?? raw.countUncertain ?? false,
  };
}

export function mapWorkOrderListDto(raw: unknown): WorkOrderListItem[] {
  if (Array.isArray(raw)) return (raw as RawWorkOrder[]).map(mapWorkOrderDto);
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return ((raw as { data: RawWorkOrder[] }).data).map(mapWorkOrderDto);
  }
  return [];
}

export function mapWorkOrderResolveDto(raw: RawWorkOrderResolve): WorkOrderResolveResult {
  const shiftPlan = raw.shift_plan ?? {};
  const camelShiftPlan = raw.shiftPlan ?? {};
  const br = raw.break;
  return {
    woId: raw.wo_id ?? raw.woId ?? '',
    machineId: raw.machine_id ?? raw.machineId ?? '',
    productId: raw.product_id ?? raw.productId ?? '',
    productName: raw.product_name ?? raw.productName ?? '',
    stdCycleTimeSec: toFiniteNumber(raw.std_cycle_time_sec ?? raw.stdCycleTimeSec),
    operatorId: raw.operator_id ?? raw.operatorId ?? '',
    operatorName: raw.operator_name ?? raw.operatorName ?? '',
    targetQty: raw.target_qty ?? raw.targetQty ?? 0,
    shiftPlan: {
      shiftStart: shiftPlan.shift_start ?? camelShiftPlan.shiftStart ?? '',
      shiftEnd: shiftPlan.shift_end ?? camelShiftPlan.shiftEnd ?? '',
      plannedBreakMin: shiftPlan.planned_break_min ?? camelShiftPlan.plannedBreakMin ?? 0,
      plannedOperatingSec: shiftPlan.planned_operating_sec ?? camelShiftPlan.plannedOperatingSec ?? 0,
    },
    targetPerHour: raw.targetPerHour ?? raw.target_per_hour ?? null,
    break: br && br.start && br.end && Number.isFinite(br.minutes)
      ? { start: br.start, end: br.end, minutes: br.minutes as number }
      : null,
    status: normalizeStatus(raw.status),
  };
}

// -------------------------------------------------------------
// Multi-Zone QR v2 (§C.7/§C.8) — unit 002 FR-004
// -------------------------------------------------------------

const ZONE_TYPES = ['PRODUCT', 'MACHINE', 'OPERATOR', 'SHIFT'] as const;

function normalizeZoneType(raw: unknown): ZoneType {
  const s = String(raw ?? '').toUpperCase();
  return (ZONE_TYPES as readonly string[]).includes(s) ? (s as ZoneType) : 'PRODUCT';
}

function toNullableBoolean(raw: unknown): boolean | null {
  return typeof raw === 'boolean' ? raw : null;
}

function toNullableString(raw: unknown): string | null {
  return typeof raw === 'string' && raw ? raw : null;
}

export function mapZoneValidationDto(raw: Record<string, unknown>): ZoneValidation {
  const parsed = raw.parsed;
  return {
    valid: raw.valid === true,
    zoneType: normalizeZoneType(raw.zone_type ?? raw.zoneType),
    // parsed = record key-value zona; string apa adanya (backend otoritatif).
    parsed: parsed && typeof parsed === 'object' ? Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    ) : {},
    machineReady: toNullableBoolean(raw.machine_ready ?? raw.machineReady),
    deviceOnline: toNullableBoolean(raw.device_online ?? raw.deviceOnline),
    message: toNullableString(raw.message),
  };
}

export function mapInitiateFromZonesDto(raw: Record<string, unknown>): InitiateFromZonesResult {
  const wo = (raw.work_order ?? {}) as Record<string, unknown>;
  const sp = (wo.shift_plan ?? wo.shiftPlan ?? {}) as Record<string, unknown>;
  return {
    success: raw.success === true,
    dispatchTxId: String(raw.dispatch_tx_id ?? raw.dispatchTxId ?? ''),
    idempotentDuplicate: raw.is_idempotent_duplicate === true,
    workOrder: {
      woId: String(wo.wo_id ?? wo.woId ?? ''),
      machineId: String(wo.machine_id ?? wo.machineId ?? ''),
      productName: String(wo.product_name ?? wo.productName ?? ''),
      stdCycleTimeSec: toFiniteNumber(wo.std_cycle_time_sec ?? wo.stdCycleTimeSec),
      operatorName: String(wo.operator_name ?? wo.operatorName ?? ''),
      targetQty: toFiniteNumber(wo.target_qty ?? wo.targetQty),
      shiftPlan: {
        shiftStart: String(sp.shift_start ?? sp.shiftStart ?? ''),
        shiftEnd: String(sp.shift_end ?? sp.shiftEnd ?? ''),
        plannedBreakMin: toFiniteNumber(sp.planned_break_min ?? sp.plannedBreakMin),
        plannedOperatingSec: toFiniteNumber(sp.planned_operating_sec ?? sp.plannedOperatingSec),
      },
      status: normalizeStatus(wo.status),
    },
  };
}
