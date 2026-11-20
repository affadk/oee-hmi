// /src/application/inactivityPolicy.ts
// Unit 002 FR-010: pure decision helper for idle lock. No React, no timers —
// caller ticks this each second and acts on the result.
import type { SurfaceMode } from './surfaceMode';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export function resolveInactivityTimeoutMs(rawEnv: string | undefined): number {
  const raw = rawEnv;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

export interface IdleState {
  lastActivityMs: number;
  timeoutMs: number;
  locked: boolean;
}

/** Pure: apply a tick at `nowMs`; returns locked state (and whether to fire onLock this tick). */
export function tickIdleLock(
  state: IdleState,
  nowMs: number,
  tabHidden: boolean,
): { state: IdleState; fireLock: boolean } {
  if (!tabHidden && !state.locked && nowMs - state.lastActivityMs >= state.timeoutMs) {
    return { state: { ...state, locked: true }, fireLock: true };
  }
  return { state, fireLock: false };
}

export function touchIdle(state: IdleState, nowMs: number): IdleState {
  if (state.locked) return state;
  return { ...state, lastActivityMs: nowMs };
}

/** Unlock / new session: clear lock and restart idle from now. */
export function resetIdle(nowMs: number, timeoutMs: number): IdleState {
  return { lastActivityMs: nowMs, timeoutMs, locked: false };
}

/** Surface yang kena auto-lock: station/andon punya sesi operator; kiosk tidak (device-bound, OQ-101). */
export function isLockableSurface(surface: SurfaceMode): boolean {
  return surface === 'station' || surface === 'andon';
}