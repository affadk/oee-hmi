// Unit 002 (FR-004) + unit 003 (FR-003/004, §C.8): draft BatchQr → 4 string zona QR v2.
// Format persis backend `qr-zone-parser.ts`:
//   product:  PID=<product_id>;CT=<cycle_time>;NAME=<display name>
//   machine:  MID=<machine_id>;MCH=<display name>;LINE=<line_id|line_name>
//   operator: OID=<operator_id>;OP=<display name>
//   shift:    SID=<shift_id>;DATE=YYYY-MM-DD;START=HH:MM;END=HH:MM;BREAK=<minutes>;TARGET=<qty>
// Unit 003: fail-closed — draft wajib 4 zona lengkap; LINE & DATE wajib dari
// badge/master (tanpa substitusi hari-ini diam-diam); TARGET badge shift menang.
// LAYER RULES: pure — no IO, no DOM, no infrastructure imports.

import type { BatchDraft } from '../domain/entities/BatchQr';
import { isDraftComplete } from '../domain/entities/BatchQr';
import type { ZoneRawStrings } from '../domain/entities/backend/WorkOrder';

export interface ZoneExtras {
  /** MCH display name; default = draft.machineName lalu draft.machineId. */
  machineName?: string;
  /** LINE id/nama; default = draft.machineLine (badge/master). Wajib backend. */
  line?: string;
  /** SID master; default = shiftId preset draft.schedule. */
  shiftId?: string;
  /** DATE YYYY-MM-DD; default = draft.schedule.shiftDate (badge shift). Wajib. */
  shiftDate?: string;
}

export function buildZoneStrings(draft: BatchDraft, extras: ZoneExtras = {}): ZoneRawStrings {
  if (!isDraftComplete(draft)) {
    throw new Error('Draft 4 zona belum lengkap — pindai badge produk, mesin, operator, dan shift dulu.');
  }
  const product = draft.product!;
  const operator = draft.operator!;
  const schedule = draft.schedule!;
  const machineName = extras.machineName?.trim() || draft.machineName?.trim() || draft.machineId!;
  const line = (extras.line ?? draft.machineLine ?? '').trim();
  if (!line) {
    throw new Error('LINE mesin wajib — pindai badge mesin (LINE=..) atau pakai LINE master mesin terikat.');
  }
  const shiftId = (extras.shiftId ?? schedule.shiftId).trim();
  const shiftDate = (extras.shiftDate ?? schedule.shiftDate ?? '').trim();
  if (!shiftDate) {
    throw new Error('DATE shift wajib dari badge shift fisik (DATE=YYYY-MM-DD) — bukan tanggal lokal.');
  }
  const targetQty = schedule.targetQty ?? product.targetQty;
  return {
    product: `PID=${product.productId};CT=${product.cycleTimeSec};NAME=${product.productName}`,
    machine: `MID=${draft.machineId};MCH=${machineName};LINE=${line}`,
    operator: `OID=${operator.operatorId};OP=${operator.operatorName}`,
    shift: `SID=${shiftId};DATE=${shiftDate};START=${schedule.shiftStart};END=${schedule.shiftEnd};BREAK=${schedule.breakMin};TARGET=${targetQty}`,
  };
}
