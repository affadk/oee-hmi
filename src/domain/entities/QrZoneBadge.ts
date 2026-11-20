// /src/domain/entities/QrZoneBadge.ts
//
// Unit 003 (FR-001, ADR-0005): parser badge zona QR fisik format backend §C.8.
// Cermin aturan `iiot-oee/apps/backend/.../work-order/qr-zone-parser.ts` +
// strict master-id service (`multi-zone-work-order.ts`): PID/MID/OID/SID wajib.
// Terpisah dari parseQrString (katalog demo/simulasi + jalur WO).
// LAYER RULES: pure — no IO, no DOM, no infrastructure imports.

export type ZoneBadgeType = 'PRODUCT' | 'MACHINE' | 'OPERATOR' | 'SHIFT';

export interface ZoneBadgeProduct {
  productId: string;
  cycleTimeSec: number;
  productName: string;
}

export interface ZoneBadgeMachine {
  machineId: string;
  machineName: string;
  line: string;
}

export interface ZoneBadgeOperator {
  operatorId: string;
  operatorName: string;
}

export interface ZoneBadgeShift {
  shiftId: string;
  /** YYYY-MM-DD dari badge (wajib; bukan tanggal lokal). */
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  breakMin: number;
  targetQty: number;
  breakAt?: string;
}

export interface ParsedZoneBadge {
  zoneType: ZoneBadgeType;
  product?: ZoneBadgeProduct;
  machine?: ZoneBadgeMachine;
  operator?: ZoneBadgeOperator;
  shift?: ZoneBadgeShift;
}

/** Error parse badge zona — pesan ramah operator menyebut zona + key. */
export class ZoneBadgeError extends Error {
  constructor(message: string, public readonly zoneType?: ZoneBadgeType) {
    super(message);
    this.name = 'ZoneBadgeError';
  }
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Cermin parseKeyValueString backend: ';' delimiter, key uppercase, trim, toleran token kosong. */
function parseKeyValue(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of raw.split(';')) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim().toUpperCase();
    const value = trimmed.slice(eq + 1).trim();
    if (key.length > 0) result[key] = value;
  }
  return result;
}

// Kunci diskriminatif per zona (deteksi lane) — unik, tak tumpang tindih.
// NAME bukan kunci deteksi: dipakai PRODUCT (nama produk) DAN fallback OPERATOR.
// Penanda zona = id/field khas: produk PID/CT, mesin MID/MCH/LINE, operator OID/OP,
// shift SID/DATE/dst. NAME tetap dibaca saat parse (required/fallback), bukan deteksi.
const ZONE_KEYS: Record<ZoneBadgeType, string[]> = {
  PRODUCT: ['PID', 'PRODUCT_ID', 'CT', 'CYCLE'],
  MACHINE: ['MID', 'MACHINE_ID', 'MCH', 'LINE'],
  OPERATOR: ['OID', 'OPERATOR_ID', 'OP'],
  SHIFT: ['SID', 'SHIFT_ID', 'DATE', 'START', 'END', 'BREAK', 'BREAK_AT', 'TARGET'],
};

/** Nama zona ramah operator untuk pesan error. */
const ZONE_LABEL: Record<ZoneBadgeType, string> = {
  PRODUCT: 'produk',
  MACHINE: 'mesin',
  OPERATOR: 'operator',
  SHIFT: 'shift',
};

function detectZones(kv: Record<string, string>): ZoneBadgeType[] {
  const found: ZoneBadgeType[] = [];
  for (const zone of Object.keys(ZONE_KEYS) as ZoneBadgeType[]) {
    // NAME dipakai PRODUCT dan fallback OPERATOR — hanya dihitung khas PRODUCT
    // bila ada kunci produk lain; OP/OID tetap penanda operator.
    if (ZONE_KEYS[zone].some((k) => k in kv)) found.push(zone);
  }
  return found;
}

/** Kunci lane WO (katalog/key-value lama) — menang atas deteksi zona bila ada. */
const WO_LANE_KEYS = ['WO', 'WORKORDER', 'PRD', 'PRODUCT'];

function isWoLanePayload(input: string, kv: Record<string, string>): boolean {
  // JSON payload = lane WO/katalog (parseQrString), bukan badge zona.
  if (input.startsWith('{')) return true;
  return WO_LANE_KEYS.some((k) => k in kv);
}

/** True bila string memuat kunci khas zona badge (untuk tolak paste zona di textfield WO). */
export function looksLikeZoneBadge(raw: string): boolean {
  const input = (raw ?? '').trim();
  if (!input || !input.includes('=')) return false;
  const kv = parseKeyValue(input);
  if (isWoLanePayload(input, kv)) return false;
  return detectZones(kv).length > 0;
}

function required(kv: Record<string, string>, zone: ZoneBadgeType, keys: string[]): string {
  for (const key of keys) {
    const value = (kv[key] ?? '').trim();
    if (value) return value;
  }
  throw new ZoneBadgeError(
    `Badge ${ZONE_LABEL[zone]} kurang key wajib: ${keys.join(' / ')}.`,
    zone,
  );
}

function parseProductBadge(kv: Record<string, string>): ZoneBadgeProduct {
  const productId = required(kv, 'PRODUCT', ['PID', 'PRODUCT_ID']);
  const productName = required(kv, 'PRODUCT', ['NAME']);
  const ctRaw = required(kv, 'PRODUCT', ['CT', 'CYCLE']);
  const ct = Number.parseFloat(ctRaw);
  if (!Number.isFinite(ct) || ct <= 0) {
    throw new ZoneBadgeError(`CT badge produk harus angka > 0 (diterima: '${ctRaw}').`, 'PRODUCT');
  }
  return { productId, cycleTimeSec: ct, productName };
}

function parseMachineBadge(kv: Record<string, string>): ZoneBadgeMachine {
  const machineId = required(kv, 'MACHINE', ['MID', 'MACHINE_ID']);
  const machineName = required(kv, 'MACHINE', ['MCH']);
  const line = required(kv, 'MACHINE', ['LINE']);
  return { machineId, machineName, line };
}

function parseOperatorBadge(kv: Record<string, string>): ZoneBadgeOperator {
  const operatorId = required(kv, 'OPERATOR', ['OID', 'OPERATOR_ID']);
  const operatorName = required(kv, 'OPERATOR', ['OP', 'NAME']);
  return { operatorId, operatorName };
}

/** Cermin calculatePlannedOperatingSeconds backend (shift lintas tengah malam). */
export function plannedOperatingSeconds(shiftStart: string, shiftEnd: string, breakMin: number): number {
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  let startSec = (startH ?? 0) * 3600 + (startM ?? 0) * 60;
  let endSec = (endH ?? 0) * 3600 + (endM ?? 0) * 60;
  if (endSec <= startSec) endSec += 24 * 3600;
  return endSec - startSec - breakMin * 60;
}

function parseShiftBadge(kv: Record<string, string>): ZoneBadgeShift {
  const shiftId = required(kv, 'SHIFT', ['SID', 'SHIFT_ID']);
  const shiftDate = required(kv, 'SHIFT', ['DATE']);
  if (!DATE_REGEX.test(shiftDate)) {
    throw new ZoneBadgeError(`DATE badge shift '${shiftDate}' tidak valid — wajib YYYY-MM-DD.`, 'SHIFT');
  }
  const shiftStart = required(kv, 'SHIFT', ['START']);
  const shiftEnd = required(kv, 'SHIFT', ['END']);
  if (!TIME_REGEX.test(shiftStart)) {
    throw new ZoneBadgeError(`START badge shift '${shiftStart}' tidak valid — wajib HH:MM (24 jam).`, 'SHIFT');
  }
  if (!TIME_REGEX.test(shiftEnd)) {
    throw new ZoneBadgeError(`END badge shift '${shiftEnd}' tidak valid — wajib HH:MM (24 jam).`, 'SHIFT');
  }
  const breakRaw = required(kv, 'SHIFT', ['BREAK']);
  const breakMin = Number.parseInt(breakRaw, 10);
  if (!Number.isFinite(breakMin) || breakMin < 0) {
    throw new ZoneBadgeError(`BREAK badge shift harus integer ≥ 0 (diterima: '${breakRaw}').`, 'SHIFT');
  }
  const targetRaw = required(kv, 'SHIFT', ['TARGET']);
  const targetQty = Number.parseInt(targetRaw, 10);
  if (!Number.isFinite(targetQty) || targetQty <= 0) {
    throw new ZoneBadgeError(`TARGET badge shift harus integer > 0 (diterima: '${targetRaw}').`, 'SHIFT');
  }
  const breakAt = (kv['BREAK_AT'] ?? '').trim() || undefined;
  if (breakAt && !TIME_REGEX.test(breakAt)) {
    throw new ZoneBadgeError(`BREAK_AT badge shift '${breakAt}' tidak valid — wajib HH:MM.`, 'SHIFT');
  }
  if (plannedOperatingSeconds(shiftStart, shiftEnd, breakMin) <= 0) {
    throw new ZoneBadgeError(
      `Durasi shift tidak valid: window ${shiftStart}-${shiftEnd} dengan istirahat ${breakMin}m menghasilkan waktu operasi ≤ 0.`,
      'SHIFT',
    );
  }
  return { shiftId, shiftDate, shiftStart, shiftEnd, breakMin, targetQty, breakAt };
}

/**
 * Parse badge zona fisik format backend (§C.8).
 * - `null` = bukan badge zona (tak ada kunci khas) → pemanggil boleh coba jalur WO.
 * - throw ZoneBadgeError = badge zona terdeteksi tapi invalid (jangan fallthrough).
 */
export function parseZoneBadge(raw: string): ParsedZoneBadge | null {
  const input = (raw ?? '').trim();
  if (!input || !input.includes('=')) return null;
  const kv = parseKeyValue(input);
  if (isWoLanePayload(input, kv)) return null;
  const zones = detectZones(kv);
  if (zones.length === 0) return null;
  if (zones.length > 1) {
    throw new ZoneBadgeError(
      `QR memuat kunci beberapa zona (${zones.map((z) => ZONE_LABEL[z]).join(', ')}) — satu badge = satu zona.`,
    );
  }
  const zoneType = zones[0]!;
  switch (zoneType) {
    case 'PRODUCT':
      return { zoneType, product: parseProductBadge(kv) };
    case 'MACHINE':
      return { zoneType, machine: parseMachineBadge(kv) };
    case 'OPERATOR':
      return { zoneType, operator: parseOperatorBadge(kv) };
    case 'SHIFT':
      return { zoneType, shift: parseShiftBadge(kv) };
  }
}
