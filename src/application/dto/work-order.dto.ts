// /src/application/dto/work-order.dto.ts
// Boundary DTO: raw REST JSON → domain WorkOrderListItem.

import type { WorkOrderListItem, WorkOrderResolveResult, WorkOrderStatus } from '../../domain/entities/backend/WorkOrder';

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
  status?: string;
}

function normalizeStatus(raw: unknown): WorkOrderStatus {
  const s = String(raw ?? 'PENDING').toUpperCase();
  return s === 'ACTIVE' || s === 'COMPLETED' || s === 'ABORTED' ? (s as WorkOrderStatus) : 'PENDING';
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
  };
}

export function mapWorkOrderListDto(raw: unknown): WorkOrderListItem[] {
  if (Array.isArray(raw)) return (raw as RawWorkOrder[]).map(mapWorkOrderDto);
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return ((raw as { data: RawWorkOrder[] }).data).map(mapWorkOrderDto);
  }
  return [];
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
}

export function mapWorkOrderResolveDto(raw: RawWorkOrderResolve): WorkOrderResolveResult {
  const shiftPlan = raw.shift_plan ?? {};
  const camelShiftPlan = raw.shiftPlan ?? {};
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
    status: normalizeStatus(raw.status),
  };
}
