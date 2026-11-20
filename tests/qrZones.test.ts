// Unit 002 T106/T109 + unit 003 T203: buildZoneStrings (§C.8) — fail-closed.
import { describe, expect, it } from 'vitest';
import { buildZoneStrings } from '../src/application/qrZones';
import { QR_PRODUCT_CATALOG, QR_SCHEDULE_CATALOG } from '../src/domain/entities/BatchQr';
import type { BatchDraft } from '../src/domain/entities/BatchQr';

const draft: BatchDraft = {
  product: QR_PRODUCT_CATALOG[1]!, // PRD-FLANGE-B20, CT 45, target 560
  machineId: 'STM32-OEE-01',
  machineLine: 'LINE-01',
  machineName: 'CNC Milling 01',
  operator: { code: 'QR-OP-01', operatorName: 'Budi Santoso', operatorId: 'OP-4021' },
  schedule: { ...QR_SCHEDULE_CATALOG[0]!, shiftDate: '2026-11-20' }, // SHIFT-1 07:00-15:00 break 60
};

describe('buildZoneStrings', () => {
  it('format zona sesuai §C.8 dari nilai badge', () => {
    const z = buildZoneStrings(draft);
    expect(z).toEqual({
      product: 'PID=PRD-FLANGE-B20;CT=45;NAME=Flange Housing B-20',
      machine: 'MID=STM32-OEE-01;MCH=CNC Milling 01;LINE=LINE-01',
      operator: 'OID=OP-4021;OP=Budi Santoso',
      shift: 'SID=SHIFT-1;DATE=2026-11-20;START=07:00;END=15:00;BREAK=60;TARGET=560',
    });
  });

  it('draft tidak lengkap → throw (fail-closed, tanpa payload ke backend)', () => {
    expect(() => buildZoneStrings({ ...draft, product: null })).toThrow(/belum lengkap/i);
    expect(() => buildZoneStrings({ ...draft, operator: null })).toThrow(/belum lengkap/i);
  });

  it('DATE wajib dari badge — tanpa substitusi tanggal lokal', () => {
    const noDate = { ...draft, schedule: { ...draft.schedule!, shiftDate: undefined } };
    expect(() => buildZoneStrings(noDate)).toThrow(/DATE/i);
  });

  it('LINE wajib — bukan string kosong diam-diam', () => {
    expect(() => buildZoneStrings({ ...draft, machineLine: '' }, { line: '' })).toThrow(/LINE/i);
  });

  it('TARGET badge shift menang atas target produk', () => {
    const z = buildZoneStrings({ ...draft, schedule: { ...draft.schedule!, targetQty: 999 } });
    expect(z.shift).toContain('TARGET=999');
  });
});
