import { describe, expect, it } from 'vitest';
import { parseQrString } from '../src/domain/entities/BatchQr';

describe('parseQrString catalog codes', () => {
  it('resolves product/operator/schedule catalog labels', () => {
    expect(parseQrString('QR-PRD-01').kind).toBe('PRODUCT');
    expect(parseQrString('qr-op-02').kind).toBe('OPERATOR');
    expect(parseQrString('QR-SCH-01').kind).toBe('SCHEDULE');
  });

  it('resolves machine codes and raw device ids', () => {
    expect(parseQrString('QR-MC-STM32-OEE-01')).toMatchObject({ kind: 'MACHINE', machineId: 'STM32-OEE-01' });
    expect(parseQrString('STM32-OEE-01')).toMatchObject({ kind: 'MACHINE' });
  });
});

describe('parseQrString structured payloads', () => {
  it('parses inline product JSON', () => {
    const out = parseQrString(
      JSON.stringify({ type: 'PRODUCT', productName: 'Flange', workOrder: 'WO-1', cycleTimeSec: 45, targetQty: 560 }),
    );
    expect(out).toMatchObject({ kind: 'PRODUCT', code: 'QR-CUSTOM' });
  });

  it('parses key=value product payloads', () => {
    const out = parseQrString('WO=WO-1;PRD=Flange;CT=45;TARGET=560');
    expect(out).toMatchObject({ kind: 'PRODUCT' });
  });

  it('throws operator-friendly errors for empty/unknown input', () => {
    expect(() => parseQrString('   ')).toThrow(/kosong/);
    expect(() => parseQrString('HELLO-WORLD')).toThrow(/tidak dikenal/);
    expect(() => parseQrString('{bad json')).toThrow(/tidak valid/);
    expect(() => parseQrString('{"type":"NOPE"}')).toThrow(/tidak dikenal/);
  });
});
