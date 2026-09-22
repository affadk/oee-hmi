// /src/domain/entities/backend/WorkOrder.ts
// Domain entity mirroring Work Order Dispatch & Management (§C API_DOCUMENTATION.md).

export type WorkOrderStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ABORTED';

export interface WorkOrderListItem {
  woId: string;
  machineId: string;
  machineName: string | null;
  productId: string | null;
  productName: string | null;
  operatorId: string | null;
  operatorName: string | null;
  targetQty: number;
  status: WorkOrderStatus;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
}

export interface WorkOrderResolveResult {
  woId: string;
  machineId: string;
  productId: string;
  productName: string;
  stdCycleTimeSec: number;
  operatorId: string;
  operatorName: string;
  targetQty: number;
  shiftPlan: {
    shiftStart: string;
    shiftEnd: string;
    plannedBreakMin: number;
    plannedOperatingSec: number;
  };
  status: WorkOrderStatus;
}

export interface WorkOrderQuery {
  status?: WorkOrderStatus;
  machineId?: string;
  productId?: string;
  operatorId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export function isActiveWorkOrder(wo: Pick<WorkOrderListItem, 'status'>): boolean {
  return wo.status === 'ACTIVE' || wo.status === 'PENDING';
}
