// Unit 002 (FR-004, §C.8): draft BatchQr → 4 string zona QR v2.
// Format persis backend `qr-zone-parser.ts`:
//   product:  PID=<product_id>;CT=<cycle_time>;NAME=<display name>
//   machine:  MID=<machine_id>;MCH=<display name>;LINE=<line_id|line_name>
//   operator: OID=<operator_id>;OP=<display name>
//   shift:    SID=<shift_id>;DATE=YYYY-MM-DD;START=HH:MM;END=HH:MM;BREAK=<minutes>;TARGET=<qty>
// LAYER RULES: pure — no IO, no DOM, no infrastructure imports.

import type { BatchDraft } from '../domain/entities/BatchQr';
import type { ZoneRawStrings } from '../domain/entities/backend/WorkOrder';

export interface ZoneExtras {
  /** MCH display name; default = draft.machineId. */
  machineName?: string;
  /** LINE id/nama dari master mesin; wajib backend (kosong = 400 INVALID_ZONE_FORMAT). */
  line?: string;
  /** SID master; default = shiftId preset draft.schedule. */
  shiftId?: string;
  /** DATE YYYY-MM-DD lokal; default = hari ini. */
  shiftDate?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD lokal (bukan UTC — shift date mengikuti tanggal pabrik). */
export function localDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function buildZoneStrings(draft: BatchDraft, extras: ZoneExtras = {}): ZoneRawStrings {
  const machineName = extras.machineName?.trim() || draft.machineId;
  const line = (extras.line ?? '').trim();
  const shiftId = (extras.shiftId ?? draft.schedule.shiftId).trim();
  const shiftDate = (extras.shiftDate ?? localDateString(new Date())).trim();
  return {
    product: `PID=${draft.product.productId};CT=${draft.product.cycleTimeSec};NAME=${draft.product.productName}`,
    machine: `MID=${draft.machineId};MCH=${machineName};LINE=${line}`,
    operator: `OID=${draft.operator.operatorId};OP=${draft.operator.operatorName}`,
    shift: `SID=${shiftId};DATE=${shiftDate};START=${draft.schedule.shiftStart};END=${draft.schedule.shiftEnd};BREAK=${draft.schedule.breakMin};TARGET=${draft.product.targetQty}`,
  };
}