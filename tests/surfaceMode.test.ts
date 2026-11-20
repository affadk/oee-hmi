// Unit 002 T101/T104: resolveSurfaceMode (FR-001, ADR-0004).
import { describe, expect, it } from 'vitest';
import { resolveSurfaceMode } from '../src/application/surfaceMode';

describe('resolveSurfaceMode', () => {
  it('station context tervalidasi → kiosk', () => {
    expect(resolveSurfaceMode({ stationId: 'STM32-OEE-01', hasSession: false })).toBe('kiosk');
    expect(resolveSurfaceMode({ stationId: 'STM32-OEE-01', hasSession: true })).toBe('kiosk');
  });
  it('tanpa binding + sesi → station', () => {
    expect(resolveSurfaceMode({ stationId: '', hasSession: true })).toBe('station');
  });
  it('tanpa binding + tanpa sesi → andon (publik/tunnel)', () => {
    expect(resolveSurfaceMode({ stationId: '', hasSession: false })).toBe('andon');
  });
  it('station id whitespace dianggap tanpa binding', () => {
    expect(resolveSurfaceMode({ stationId: '   ', hasSession: true })).toBe('station');
  });
});