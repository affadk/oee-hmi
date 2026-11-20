// Unit 003 T201: parser badge zona — vektor dari test backend
// (iiot-oee/apps/backend/test/multi-zone-work-order.test.ts + qr-zone-parser.test.ts).
import { describe, expect, it } from 'vitest';
import { parseZoneBadge, plannedOperatingSeconds, looksLikeZoneBadge, ZoneBadgeError } from '../src/domain/entities/QrZoneBadge';

describe('parseZoneBadge — produk', () => {
  it('CT desimal diizinkan', () => {
    const badge = parseZoneBadge('PID=Gear-10;CT=4.5;NAME=Gear Shaft 10mm');
    expect(badge?.zoneType).toBe('PRODUCT');
    expect(badge?.product).toEqual({ productId: 'Gear-10', cycleTimeSec: 4.5, productName: 'Gear Shaft 10mm' });
  });

  it('CT ≤ 0 / non-angka → ZoneBadgeError', () => {
    expect(() => parseZoneBadge('PID=X;CT=-1.2;NAME=Invalid')).toThrow(ZoneBadgeError);
    expect(() => parseZoneBadge('PID=X;CT=0;NAME=Invalid')).toThrow(ZoneBadgeError);
    expect(() => parseZoneBadge('PID=X;CT=abc;NAME=Invalid')).toThrow(ZoneBadgeError);
  });

  it('PID / NAME wajib', () => {
    expect(() => parseZoneBadge('CT=45;NAME=X')).toThrow(/PID/);
    expect(() => parseZoneBadge('PID=X;CT=45')).toThrow(/NAME/);
  });

  it('alias PRODUCT_ID / CYCLE diterima (master yang di-hydrate)', () => {
    const badge = parseZoneBadge('PRODUCT_ID=P-1;CYCLE=12;NAME=Part One');
    expect(badge?.product?.cycleTimeSec).toBe(12);
  });
});

describe('parseZoneBadge — mesin', () => {
  it('MID wajib; MCH + LINE wajib (strict master-id)', () => {
    const badge = parseZoneBadge('MID=STM32-OEE-01;MCH=CNC Lathe 01;LINE=LINE-02');
    expect(badge?.zoneType).toBe('MACHINE');
    expect(badge?.machine).toEqual({ machineId: 'STM32-OEE-01', machineName: 'CNC Lathe 01', line: 'LINE-02' });
    expect(() => parseZoneBadge('MCH=CNC Lathe 01;LINE=Line 2')).toThrow(ZoneBadgeError);
    expect(() => parseZoneBadge('MID=M1;LINE=Line 2')).toThrow(/MCH/);
    expect(() => parseZoneBadge('MID=M1;MCH=Lathe')).toThrow(/LINE/);
  });
});

describe('parseZoneBadge — operator', () => {
  it('OID wajib, OP atau NAME untuk nama', () => {
    expect(parseZoneBadge('OID=OP-1;OP=Ahmad Fauzi')?.operator).toEqual({ operatorId: 'OP-1', operatorName: 'Ahmad Fauzi' });
    expect(parseZoneBadge('OID=OP-1;NAME=Budi Santoso')?.operator?.operatorName).toBe('Budi Santoso');
    expect(() => parseZoneBadge('OP=Ahmad Fauzi')).toThrow(/OID/);
  });
});

describe('parseZoneBadge — shift', () => {
  it('window + break valid → plannedOperatingSec', () => {
    const badge = parseZoneBadge('SID=SHIFT-1;DATE=2026-11-20;START=07:00;END=16:00;BREAK=60;TARGET=500');
    expect(badge?.shift).toEqual({
      shiftId: 'SHIFT-1', shiftDate: '2026-11-20', shiftStart: '07:00', shiftEnd: '16:00', breakMin: 60, targetQty: 500, breakAt: undefined,
    });
    expect(plannedOperatingSeconds('07:00', '16:00', 60)).toBe(8 * 3600);
  });

  it('shift lintas tengah malam (overnight)', () => {
    const badge = parseZoneBadge('SID=SHIFT-3;DATE=2026-11-20;START=22:00;END=06:00;BREAK=60;TARGET=400');
    expect(badge?.shift?.shiftEnd).toBe('06:00');
    expect(plannedOperatingSeconds('22:00', '06:00', 60)).toBe(7 * 3600);
  });

  it('istirahat melebihi window → error ( plannedOperatingSec > 0 )', () => {
    expect(() => parseZoneBadge('SID=S;DATE=2026-11-20;START=08:00;END=09:00;BREAK=90;TARGET=1')).toThrow(ZoneBadgeError);
  });

  it('DATE wajib YYYY-MM-DD dari badge — bukan hari ini', () => {
    expect(() => parseZoneBadge('SID=S;START=07:00;END=15:00;BREAK=0;TARGET=1')).toThrow(/DATE/);
    expect(() => parseZoneBadge('SID=S;DATE=20/11/2026;START=07:00;END=15:00;BREAK=0;TARGET=1')).toThrow(/DATE/);
  });

  it('TARGET > 0, BREAK integer ≥ 0, HH:MM 24 jam', () => {
    expect(() => parseZoneBadge('SID=S;DATE=2026-11-20;START=7:00;END=15:00;BREAK=0;TARGET=1')).toThrow(/START/);
    expect(() => parseZoneBadge('SID=S;DATE=2026-11-20;START=07:00;END=25:00;BREAK=0;TARGET=1')).toThrow(/END/);
    expect(() => parseZoneBadge('SID=S;DATE=2026-11-20;START=07:00;END=15:00;BREAK=-1;TARGET=1')).toThrow(/BREAK/);
    expect(() => parseZoneBadge('SID=S;DATE=2026-11-20;START=07:00;END=15:00;BREAK=0;TARGET=0')).toThrow(/TARGET/);
  });
});

describe('routing guard', () => {
  it('bukan badge zona → null (boleh jatuh ke jalur WO)', () => {
    expect(parseZoneBadge('QR-PRD-01')).toBeNull();
    expect(parseZoneBadge('WO=WO-2026-001;PRD=Flange;CT=45;TARGET=560')).toBeNull();
    expect(parseZoneBadge('{"type":"OPERATOR","operatorId":"OP-1"}')).toBeNull();
  });

  it('kunci campur beberapa zona → error (satu badge = satu zona)', () => {
    expect(() => parseZoneBadge('PID=P;CT=1;NAME=N;OID=O;OP=X')).toThrow(/beberapa zona/);
  });

  it('looksLikeZoneBadge: hanya badge zona true; WO/katalog false', () => {
    expect(looksLikeZoneBadge('OID=OP-1;OP=Budi')).toBe(true);
    expect(looksLikeZoneBadge('WO=WO-1;PRD=Flange;CT=45;TARGET=560')).toBe(false);
    expect(looksLikeZoneBadge('QR-OP-01')).toBe(false);
  });
});