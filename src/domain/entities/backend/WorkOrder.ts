// /src/domain/entities/backend/WorkOrder.ts
// Domain entity mirroring Work Order Dispatch & Management (§C API_DOCUMENTATION.md).

export type WorkOrderStatus = 'PENDING' | 'ACTIVE' | 'PENDING_CLOSE' | 'COMPLETED' | 'ABORTED';

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
  /** ADR-0021 workflow fields (aditif, nullable). */
  dispatchedAt?: string | null;
  ackedAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  provisional?: boolean;
  countUncertain?: boolean;
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
  /** G2: target per jam dari backend; null = hitung klien (fallback lama). */
  targetPerHour: number | null;
  /** G10: jendela istirahat terstruktur; null = parse string breakTimeWindow. */
  break: { start: string; end: string; minutes: number } | null;
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
  // PENDING_CLOSE masih menempati mesin (konfirmasi operator wajib) — aktif.
  return wo.status === 'ACTIVE' || wo.status === 'PENDING' || wo.status === 'PENDING_CLOSE';
}

// -------------------------------------------------------------
// Multi-Zone QR v2 (§C.7/§C.8 API_DOCUMENTATION.md) — unit 002 FR-004
// -------------------------------------------------------------

export type ZoneType = 'PRODUCT' | 'MACHINE' | 'OPERATOR' | 'SHIFT';

/** Zona QR key-value mentah: `PID=..;CT=..;NAME=..`. */
export type ZoneRawStrings = { product: string; machine: string; operator: string; shift: string };

/** POST /work-orders/validate-zone — pre-flight per zona. */
export interface ZoneValidation {
  valid: boolean;
  zoneType: ZoneType;
  parsed: Record<string, string>;
  /** Hanya zona MACHINE: edge siap & online (null = backend tak kirim). */
  machineReady: boolean | null;
  deviceOnline: boolean | null;
  message: string | null;
}

/** POST /work-orders/initiate-from-zones — WO dialokasikan + dispatch. */
export interface InitiatedWorkOrder {
  woId: string;
  machineId: string;
  productName: string;
  stdCycleTimeSec: number;
  operatorName: string;
  targetQty: number;
  shiftPlan: { shiftStart: string; shiftEnd: string; plannedBreakMin: number; plannedOperatingSec: number };
  status: WorkOrderStatus;
}

export interface InitiateFromZonesResult {
  success: boolean;
  dispatchTxId: string;
  /** Retry idempoten: WO sama sudah pernah dibuat (bukan error). */
  idempotentDuplicate: boolean;
  workOrder: InitiatedWorkOrder;
}

// -------------------------------------------------------------
// Unit 003 (FR-005/006): status tunggu ACK edge pasca initiate/dispatch.
// WAITING = poll bounded berjalan; ACTIVE = ACK SUCCESS (WO aktif, START siap);
// ABORTED = ACK error edge; TIMEOUT = tanpa ACK ≤ batas (watchdog backend 15s).
// -------------------------------------------------------------

export type AckWaitStatus = 'WAITING' | 'ACTIVE' | 'ABORTED' | 'TIMEOUT';

export interface AckWaitState {
  woId: string;
  status: AckWaitStatus;
}
