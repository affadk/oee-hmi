// Unit 002 T115: inactivityPolicy — timeout, pause tab hidden, reset (FR-010).
import { describe, expect, it } from 'vitest';
import {
  isLockableSurface,
  resetIdle,
  resolveInactivityTimeoutMs,
  tickIdleLock,
  touchIdle,
} from '../src/application/inactivityPolicy';

const T = 5000;
const base = { lastActivityMs: 0, timeoutMs: T, locked: false };

describe('resolveInactivityTimeoutMs (FR-010)', () => {
  it('default 5 menit tanpa env', () => {
    expect(resolveInactivityTimeoutMs(undefined)).toBe(300_000);
  });
  it('override env valid', () => {
    expect(resolveInactivityTimeoutMs('5000')).toBe(5000);
  });
  it('env invalid → default (bukan 0/NaN)', () => {
    expect(resolveInactivityTimeoutMs('abc')).toBe(300_000);
    expect(resolveInactivityTimeoutMs('0')).toBe(300_000);
  });
});

describe('tickIdleLock (FR-010)', () => {
  it('belum timeout → tidak lock', () => {
    expect(tickIdleLock(base, 4000, false).fireLock).toBe(false);
  });
  it('lewat timeout → lock sekali', () => {
    const once = tickIdleLock(base, 5000, false);
    expect(once.fireLock).toBe(true);
    expect(once.state.locked).toBe(true);
    expect(tickIdleLock(once.state, 9000, false).fireLock).toBe(false);
  });
  it('tab hidden → tidak lock (timer dijeda)', () => {
    expect(tickIdleLock(base, 60_000, true).fireLock).toBe(false);
  });
});

describe('touchIdle / resetIdle (FR-010)', () => {
  it('aktivitas reset hitung idle', () => {
    const touched = touchIdle(base, 4000);
    expect(touched.lastActivityMs).toBe(4000);
    expect(tickIdleLock(touched, 8000, false).fireLock).toBe(false);
  });
  it('touch saat sudah locked tidak membuka kunci', () => {
    const locked = { ...base, locked: true };
    expect(touchIdle(locked, 9000).locked).toBe(true);
  });
  it('unlock reset idle dari sekarang', () => {
    const r = resetIdle(10_000, T);
    expect(r).toEqual({ lastActivityMs: 10_000, timeoutMs: T, locked: false });
  });
});

describe('isLockableSurface (FR-010)', () => {
  it('station/andon lockable; kiosk device-bound tidak', () => {
    expect(isLockableSurface('station')).toBe(true);
    expect(isLockableSurface('andon')).toBe(true);
    expect(isLockableSurface('kiosk')).toBe(false);
  });
});
