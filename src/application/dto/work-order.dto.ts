// /src/application/dto/work-order.dto.ts
// Boundary DTO: raw REST JSON → domain WorkOrderListItem.

import type { WorkOrderListItem, WorkOrderStatus } from '../../domain/entities/backend/WorkOrder';

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
