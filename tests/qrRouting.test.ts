// Unit 003 T207: routing dual-lane kamera/textfield (FR-002).
import { describe, expect, it } from 'vitest';
import { routeBackendQr, isZonePaste, ZONE_PASTE_REJECT_MESSAGE } from '../src/application/qrRouting';

describe('routeBackendQr', () => {
  it('badge zona → kind zone', () => {
    const route = routeBackendQr('OID=OP-4021;OP=Budi Santoso');
    expect(route.kind).toBe('zone');
    if (route.kind === 'zone') expect(route.badge.operator?.operatorId).toBe('OP-4021');
  });

  it('QR produk ber-WO → kind wo dengan woId', () => {
    const route = routeBackendQr('QR-PRD-01'); // katalog: PRD-FLANGE-B20 → WO-2026-...
    expect(route.kind).toBe('wo');
    if (route.kind === 'wo') expect(route.woId.length).toBeGreaterThan(0);
  });

  it('key-value WO= → kind wo', () => {
    const route = routeBackendQr('WO=WO-2026-001;PRD=Flange;CT=45;TARGET=560');
    expect(route.kind).toBe('wo');
    if (route.kind === 'wo') expect(route.woId).toBe('WO-2026-001');
  });

  it('badge zona invalid → kind error dengan pesan zona', () => {
    const route = routeBackendQr('PID=X;CT=0;NAME=Y');
    expect(route.kind).toBe('error');
    if (route.kind === 'error') expect(route.message).toMatch(/CT/i);
  });

  it('string sampah → kind error', () => {
    expect(routeBackendQr('halo dunia').kind).toBe('error');
    expect(routeBackendQr('').kind).toBe('error');
  });

  it('JSON payload (bukan zona, tanpa WO) → error', () => {
    const route = routeBackendQr('{"type":"PRODUCT","productId":"P-1"}');
    expect(route.kind).toBe('error');
  });
});

describe('isZonePaste (directive: textfield hanya jalur WO)', () => {
  it('badge zona → true (tolak, arah kamera)', () => {
    expect(isZonePaste('MID=M1;MCH=Lathe;LINE=L1')).toBe(true);
    expect(isZonePaste('SID=S;DATE=2026-11-20;START=07:00;END=15:00;BREAK=0;TARGET=1')).toBe(true);
  });

  it('QR WO / katalog / JSON → false', () => {
    expect(isZonePaste('WO=WO-1;PRD=F;CT=1;TARGET=1')).toBe(false);
    expect(isZonePaste('QR-PRD-01')).toBe(false);
    expect(isZonePaste('{"type":"OPERATOR","operatorId":"OP-1"}')).toBe(false);
  });

  it('pesan reject menyebut kamera', () => {
    expect(ZONE_PASTE_REJECT_MESSAGE).toMatch(/kamera/);
  });
});