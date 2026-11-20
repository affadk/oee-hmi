// Unit 002 T106/T109: buildZoneStrings (§C.8) — format persis qr-zone-parser backend.
import { describe, expect, it } from 'vitest';
import { buildZoneStrings, localDateString } from '../src/application/qrZones';
import { QR_PRODUCT_CATALOG, QR_SCHEDULE_CATALOG } from '../src/domain/entities/BatchQr';
import type { BatchDraft } from '../src/domain/entities/BatchQr';

const draft: BatchDraft = {
  product: QR_PRODUCT_CATALOG[1]!, // PRD-FLANGE-B20, CT 45, target 560
  machineId: 'STM32-OEE-01',
  operator: { code: 'QR-OP-01', operatorName: 'Budi Santoso', operatorId: 'OP-4021' },
  schedule: QR_SCHEDULE_CATALOG[0]!, // SHIFT-1 07:00-15:00 break 60
};

describe('buildZoneStrings', () => {
  it('format zona sesuai §C.8', () => {
    const z = buildZoneStrings(draft, { machineName: 'CNC Milling 01', line: 'LINE-01', shiftDate: '2026-11-20' });
    expect(z).toEqual({
      product: 'PID=PRD-FLANGE-B20;CT=45;NAME=Flange Housing B-20',
      machine: 'MID=STM32-OEE-01;MCH=CNC Milling 01;LINE=LINE-01',
      operator: 'OID=OP-4021;OP=Budi Santoso',
      shift: 'SID=SHIFT-1;DATE=2026-11-20;START=07:00;END=15:00;BREAK=60;TARGET=560',
    });
  });

  it('default: MCH=machineId, SID dari preset, DATE hari ini', () => {
    const z = buildZoneStrings(draft);
    const today = localDateString(new Date());
    expect(z.machine).toBe('MID=STM32-OEE-01;MCH=STM32-OEE-01;LINE=');
    expect(z.shift).toContain(`DATE=${today}`);
    expect(z.shift).toContain('SID=SHIFT-1');
  });

  it('LINE kosong tetap dikirim (backend 400 yang menolak, bukan klien)', () => {
    expect(buildZoneStrings(draft, { line: '' }).machine).toContain(';LINE=');
  });
});