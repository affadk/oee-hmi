// /src/application/useInactivityLock.ts
// Unit 002 FR-010: auto-lock sesi setelah idle (default 5 menit,
// VITE_INACTIVITY_TIMEOUT_MS untuk override). Tab hidden → timer dijeda
// (lock bergeser saat kembali aktif, bukan saat pindah tab). Lock = soft:
// auth cleared → mutasi tertutup, read tetap jalan.
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveInactivityTimeoutMs, resetIdle, tickIdleLock, touchIdle, type IdleState } from './inactivityPolicy';

export interface InactivityLock {
  /** True setelah idle timeout (atau manual). */
  locked: boolean;
  /** Reset hitung idle (aktivitas pointer/keydown). */
  touch: () => void;
  /** Kunci sekarang (trigger manual). */
  lock: () => void;
  /** Buka kunci (dipanggil setelah login sukses). */
  unlock: () => void;
  /** Sisa detik menuju lock; null bila tidak aktif (belum ada sesi / tab hidden). */
  remainingSec: number | null;
}

/**
 * @param enabled false = tidak aktif (tanpa sesi login). Saat berubah false→true,
 *        hitung idle mulai dari 0.
 * @param onLock dipanggil sekali saat transisi ke locked (mis. logout paksa).
 */
export function useInactivityLock(enabled: boolean, onLock?: () => void): InactivityLock {
  const [locked, setLocked] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const stateRef = useRef<IdleState>({ lastActivityMs: Date.now(), timeoutMs: resolveInactivityTimeoutMs(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS), locked: false });
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const lock = useCallback(() => {
    if (!stateRef.current.locked) {
      stateRef.current = { ...stateRef.current, locked: true };
      setLocked(true);
      onLockRef.current?.();
    }
  }, []);

  const unlock = useCallback(() => {
    stateRef.current = resetIdle(Date.now(), resolveInactivityTimeoutMs(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS));
    setLocked(false);
  }, []);

  const touch = useCallback(() => {
    stateRef.current = touchIdle(stateRef.current, Date.now());
  }, []);

  // Reset hitung idle saat sesi baru dibuka.
  const wasEnabledRef = useRef(false);
  useEffect(() => {
    if (enabled && !wasEnabledRef.current) {
      stateRef.current = resetIdle(Date.now(), resolveInactivityTimeoutMs(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS));
      setLocked(false);
    }
    wasEnabledRef.current = enabled;
  }, [enabled]);

  // Tick 1s: lock saat idle lewat timeout; pause saat tab hidden.
  useEffect(() => {
    if (!enabled) {
      setRemainingSec(null);
      return;
    }
    const iv = setInterval(() => {
      const now = Date.now();
      const hidden = typeof document !== 'undefined' && document.hidden;
      if (!hidden) {
        const { state, fireLock } = tickIdleLock(stateRef.current, now, false);
        stateRef.current = state;
        const remain = Math.max(0, Math.ceil((state.timeoutMs - (now - state.lastActivityMs)) / 1000));
        setRemainingSec(state.locked ? 0 : remain);
        if (fireLock) {
          setLocked(true);
          onLockRef.current?.();
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [enabled]);

  // Aktivitas pengguna me-reset hitung idle.
  useEffect(() => {
    if (!enabled) return;
    const evts: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'wheel'];
    const handler = () => touch();
    evts.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => evts.forEach((e) => window.removeEventListener(e, handler));
  }, [enabled, touch]);

  return { locked, touch, lock, unlock, remainingSec };
}