// /src/domain/entities/BatchQr.ts
//
// Kontrak domain untuk "Setup Batch Produksi via QR Code".
// Satu batch = 4 identitas hasil pindaian: Produk, Mesin, Operator, Shift.
// File ini menyimpan katalog preset simulasi + parser string QR fisik
// (format label maupun JSON) agar modal tidak menampung logika bisnis.

export type QrBatchStep = 'PRODUCT' | 'MACHINE' | 'OPERATOR' | 'SCHEDULE' | 'REVIEW';

export interface QrProductPreset {
  code: string;
  productName: string;
  productId: string;
  workOrder: string;
  cycleTimeSec: number;
  targetQty: number;
}

export interface QrOperatorPreset {
  code: string;
  operatorName: string;
  operatorId: string;
}

export interface QrSchedulePreset {
  code: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  breakStart: string;
  breakEnd: string;
  breakMin: number;
}

export interface BatchDraft {
  product: QrProductPreset;
  machineId: string;
  operator: QrOperatorPreset;
  schedule: QrSchedulePreset;
}

export const QR_PRODUCT_CATALOG: QrProductPreset[] = [
  { code: 'QR-PRD-00', productName: 'Sodium Tablets 500mg', productId: 'PRD-SODIUM-500', workOrder: 'WO-2026-0920-00', cycleTimeSec: 9, targetQty: 12500 },
  { code: 'QR-PRD-01', productName: 'Flange Housing B-20', productId: 'PRD-FLANGE-B20', workOrder: 'WO-2026-0920-01', cycleTimeSec: 45, targetQty: 560 },
  { code: 'QR-PRD-02', productName: 'Drive Shaft Type-C', productId: 'PRD-SHAFT-C', workOrder: 'WO-2026-0920-02', cycleTimeSec: 30, targetQty: 840 },
  { code: 'QR-PRD-03', productName: 'Brake Disc Rotor 240mm', productId: 'PRD-ROTOR-240', workOrder: 'WO-2026-0920-03', cycleTimeSec: 60, targetQty: 420 },
];

export const QR_OPERATOR_CATALOG: QrOperatorPreset[] = [
  { code: 'QR-OP-01', operatorName: 'Budi Santoso', operatorId: 'OP-4021' },
  { code: 'QR-OP-02', operatorName: 'Agus Wijaya', operatorId: 'OP-4108' },
  { code: 'QR-OP-03', operatorName: 'Siti Rahmawati', operatorId: 'OP-3995' },
];

export const QR_SCHEDULE_CATALOG: QrSchedulePreset[] = [
  { code: 'QR-SCH-01', shiftName: 'Shift 1 (Pagi)', shiftStart: '07:00', shiftEnd: '15:00', breakStart: '12:00', breakEnd: '13:00', breakMin: 60 },
  { code: 'QR-SCH-02', shiftName: 'Shift 2 (Siang)', shiftStart: '15:00', shiftEnd: '23:00', breakStart: '18:00', breakEnd: '19:00', breakMin: 60 },
  { code: 'QR-SCH-03', shiftName: 'Shift 3 (Malam)', shiftStart: '23:00', shiftEnd: '07:00', breakStart: '02:00', breakEnd: '03:00', breakMin: 60 },
];

export type ParsedQrKind = 'PRODUCT' | 'OPERATOR' | 'SCHEDULE' | 'MACHINE';

export interface ParsedQrResult {
  kind: ParsedQrKind;
  /** Kode katalog yang cocok (jika ada). */
  code: string;
  product?: QrProductPreset;
  operator?: QrOperatorPreset;
  schedule?: QrSchedulePreset;
  /** Device/machine id mentah untuk QR mesin. */
  machineId?: string;
}

export function formatOperatorDisplay(op: QrOperatorPreset): string {
  return `${op.operatorName} (${op.operatorId})`;
}

/** Pecah "Budi Santoso (OP-4021)" menjadi { name, id } — tahan terhadap nama tanpa ID. */
export function splitOperatorDisplay(display: string): { name: string; id: string } {
  const m = display.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m) return { name: m[1].trim() || display, id: m[2].trim() };
  return { name: display.trim(), id: 'OP-EDGE' };
}

function findProductByCode(code: string): QrProductPreset | undefined {
  const key = code.trim().toUpperCase();
  return QR_PRODUCT_CATALOG.find((p) => p.code.toUpperCase() === key);
}

function findOperatorByCode(code: string): QrOperatorPreset | undefined {
  const key = code.trim().toUpperCase();
  return QR_OPERATOR_CATALOG.find((o) => o.code.toUpperCase() === key);
}

function findScheduleByCode(code: string): QrSchedulePreset | undefined {
  const key = code.trim().toUpperCase();
  return QR_SCHEDULE_CATALOG.find((s) => s.code.toUpperCase() === key);
}

/**
 * Parse string QR fisik menjadi payload batch.
 *
 * Format yang didukung:
 *  1. Kode label katalog: "QR-PRD-01", "QR-OP-02", "QR-SCH-01"
 *  2. Kode mesin: "QR-MC-STM32-OEE-01" atau device id mentah "STM32-OEE-01"
 *  3. JSON: {"type":"PRODUCT","code":"QR-PRD-01"} atau
 *     {"type":"PRODUCT","productName":"...","workOrder":"...","cycleTimeSec":45,"targetQty":560}
 *  4. Key=value: "WO=WO-1;PRD=Flange;CT=45;TARGET=560;OP=Budi;OPID=OP-1"
 *
 * Mengembalikan ParsedQrResult atau melempar Error dengan pesan ramah operator.
 */
export function parseQrString(raw: string): ParsedQrResult {
  const input = raw.trim();
  if (!input) throw new Error('Isi QR kosong — tempel atau ketik kode QR terlebih dahulu.');

  // 3. JSON payload.
  if (input.startsWith('{')) {
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(input) as Record<string, unknown>;
    } catch {
      throw new Error('QR JSON tidak valid — periksa kurung kurawal dan tanda kutip.');
    }
    const type = String(obj.type ?? obj.kind ?? '').toUpperCase();
    const code = String(obj.code ?? '').trim();
    if (type === 'PRODUCT' || code.toUpperCase().startsWith('QR-PRD')) {
      const fromCatalog = code ? findProductByCode(code) : undefined;
      if (fromCatalog) return { kind: 'PRODUCT', code: fromCatalog.code, product: fromCatalog };
      const productName = String(obj.productName ?? obj.product ?? '');
      const workOrder = String(obj.workOrder ?? obj.wo ?? '');
      const cycleTimeSec = Number(obj.cycleTimeSec ?? obj.ct ?? NaN);
      const targetQty = Number(obj.targetQty ?? obj.target ?? NaN);
      if (!productName || !workOrder || !Number.isFinite(cycleTimeSec) || !Number.isFinite(targetQty)) {
        throw new Error('QR Produk JSON kurang field — butuh productName, workOrder, cycleTimeSec, targetQty.');
      }
      const product: QrProductPreset = {
        code: code || 'QR-CUSTOM',
        productName,
        productId: String(obj.productId ?? `PRD-${productName.replace(/\s+/g, '-').toUpperCase()}`),
        workOrder,
        cycleTimeSec,
        targetQty,
      };
      return { kind: 'PRODUCT', code: product.code, product };
    }
    if (type === 'OPERATOR' || code.toUpperCase().startsWith('QR-OP')) {
      const fromCatalog = code ? findOperatorByCode(code) : undefined;
      if (fromCatalog) return { kind: 'OPERATOR', code: fromCatalog.code, operator: fromCatalog };
      const operatorName = String(obj.operatorName ?? obj.operator ?? '');
      const operatorId = String(obj.operatorId ?? obj.opId ?? '');
      if (!operatorName || !operatorId) throw new Error('QR Operator JSON kurang field — butuh operatorName dan operatorId.');
      return { kind: 'OPERATOR', code: code || 'QR-CUSTOM', operator: { code: code || 'QR-CUSTOM', operatorName, operatorId } };
    }
    if (type === 'SHIFT' || type === 'SCHEDULE' || code.toUpperCase().startsWith('QR-SCH')) {
      const fromCatalog = code ? findScheduleByCode(code) : undefined;
      if (fromCatalog) return { kind: 'SCHEDULE', code: fromCatalog.code, schedule: fromCatalog };
      throw new Error('QR Shift JSON tidak dikenal — gunakan kode QR-SCH-01 s/d QR-SCH-03.');
    }
    if (type === 'MACHINE' || code.toUpperCase().startsWith('QR-MC')) {
      const machineId = String(obj.machineId ?? obj.deviceId ?? code.replace(/^QR-MC-/i, '') ?? '');
      if (!machineId) throw new Error('QR Mesin JSON kurang field machineId/deviceId.');
      return { kind: 'MACHINE', code: code || machineId, machineId };
    }
    throw new Error(`Tipe QR "${type || '?'}" tidak dikenal — gunakan PRODUCT, OPERATOR, SHIFT, atau MACHINE.`);
  }

  // 4. Key=value pairs.
  if (input.includes('=')) {
    const pairs: Record<string, string> = {};
    for (const seg of input.split(';')) {
      const idx = seg.indexOf('=');
      if (idx === -1) continue;
      pairs[seg.slice(0, idx).trim().toUpperCase()] = seg.slice(idx + 1).trim();
    }
    if (pairs.WO || pairs.PRD || pairs.PRODUCT) {
      const productName = pairs.PRD ?? pairs.PRODUCT ?? '';
      const workOrder = pairs.WO ?? pairs.WORKORDER ?? '';
      const cycleTimeSec = Number(pairs.CT ?? pairs.CYCLE ?? NaN);
      const targetQty = Number(pairs.TARGET ?? pairs.QTY ?? NaN);
      if (!productName || !workOrder || !Number.isFinite(cycleTimeSec) || !Number.isFinite(targetQty)) {
        throw new Error('QR key=value produk kurang field — format: WO=...;PRD=...;CT=...;TARGET=...');
      }
      const product: QrProductPreset = {
        code: 'QR-CUSTOM',
        productName,
        productId: `PRD-${productName.replace(/\s+/g, '-').toUpperCase()}`,
        workOrder,
        cycleTimeSec,
        targetQty,
      };
      return { kind: 'PRODUCT', code: product.code, product };
    }
    throw new Error('Format key=value tidak dikenal — contoh: WO=WO-1;PRD=Flange;CT=45;TARGET=560.');
  }

  // 1. Kode label katalog.
  const upper = input.toUpperCase();
  const product = findProductByCode(upper);
  if (product) return { kind: 'PRODUCT', code: product.code, product };
  const operator = findOperatorByCode(upper);
  if (operator) return { kind: 'OPERATOR', code: operator.code, operator };
  const schedule = findScheduleByCode(upper);
  if (schedule) return { kind: 'SCHEDULE', code: schedule.code, schedule };

  // 2. Kode mesin.
  if (upper.startsWith('QR-MC-')) {
    const machineId = input.slice('QR-MC-'.length).trim();
    if (!machineId) throw new Error('Kode QR mesin kosong setelah prefix QR-MC-.');
    return { kind: 'MACHINE', code: input, machineId };
  }
  if (/^(MC-|STM32-|SODIUM-|CP\d+)/i.test(input)) {
    return { kind: 'MACHINE', code: input, machineId: input };
  }

  throw new Error(
    `Kode "${input}" tidak dikenal. Gunakan QR-PRD-## (produk), QR-OP-## (operator), QR-SCH-## (shift), atau QR-MC-<device-id> (mesin).`,
  );
}

/** Bentuk ringkas jadwal untuk payload MQTT shift_plan. */
export function scheduleToShiftOverride(s: QrSchedulePreset): {
  shiftStart: string;
  shiftEnd: string;
  breakWindow: string;
  breakMin: number;
} {
  return {
    shiftStart: s.shiftStart,
    shiftEnd: s.shiftEnd,
    breakWindow: `${s.breakStart} - ${s.breakEnd}`,
    breakMin: s.breakMin,
  };
}
