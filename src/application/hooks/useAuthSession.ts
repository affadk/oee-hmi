// /src/application/hooks/useAuthSession.ts
// Focused hook: operator PASSWORD session (020/spec 044) + station context +
// rotation gate (spec 043) + sliding refresh (G13) + capability/access-mode
// projection (FR-007/008 fetch; gating aksi = fase 3).
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.
// Presentation injects collaborators via the args object.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccessMode, AuthSession, CapabilityMap, IAuthGateway } from '../../domain/ports/IOeeBackend';
import { isTokenExpiringSoon } from '../authToken';
import { pickStationId } from '../stationContext';

const REFRESH_INTERVAL_MS = 300_000; // FR-006: refresh berkala ≤ 5 menit selama sesi aktif

export interface AuthSessionDeps {
  authGateway: IAuthGateway;
  useBackend: boolean;
  /** env VITE_STATION_ID (deployment kiosk), diinject composition root. */
  stationIdEnv: string;
  /** Query ?station= (commissioning); presentation membaca URL. */
  getQueryStationId?: () => string | null;
  /** deviceId terdaftar (registry); [] = belum termuat → station tak dikirim. */
  getRegisteredDeviceIds: () => string[];
  /** Called after a successful login (e.g. reload fleet for the boot-401 path). */
  onAuthenticated: () => void;
}

export type AuthMode = 'login' | 'change-password';

export interface AuthSessionApi {
  authSession: AuthSession | null;
  authError: string;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  /** Countdown 429 Retry-After (FR-003); 0 = tidak terkunci. */
  retryAfterSec: number;
  capabilities: CapabilityMap | null;
  mutationsAllowed: boolean | null;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  /** Backend 401 outside an action (e.g. boot load): show session message + open login modal. */
  notifyUnauthorized: () => void;
  loginWithPassword: (operatorId: string, password: string) => Promise<void>;
  /** spec 043: ganti password lalu login ulang otomatis (token lama AUTHZ_STALE). */
  submitPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
  logoutOperator: () => void;
  /** Runs the action, parking it behind the auth modal when the session is missing/expired. */
  runProtected: <T>(action: () => Promise<T>) => Promise<T | void>;
  hasAuthToken: () => boolean;
  isUnauthorizedError: (err: unknown) => boolean;
}

function errorCode(err: unknown): string {
  return !!err && typeof err === 'object' ? String((err as { code?: unknown }).code ?? '') : '';
}

function errorStatus(err: unknown): number {
  return !!err && typeof err === 'object' ? Number((err as { status?: unknown }).status ?? 0) : 0;
}

function errorRetryAfter(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const v = (err as { retryAfterSec?: unknown }).retryAfterSec;
  return typeof v === 'number' && v > 0 ? v : null;
}

export function useAuthSession(deps: AuthSessionDeps): AuthSessionApi {
  const { authGateway, useBackend, stationIdEnv, getQueryStationId, getRegisteredDeviceIds, onAuthenticated } = deps;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [retryAfterSec, setRetryAfterSec] = useState<number>(0);
  const [capabilities, setCapabilities] = useState<CapabilityMap | null>(null);
  const [mutationsAllowed, setMutationsAllowed] = useState<boolean | null>(null);
  const pendingProtectedActionRef = useRef<(() => Promise<unknown>) | null>(null);
  const rotationOperatorRef = useRef<string>('');

  // Countdown 429 (FR-003): backend satu-satunya sumber throttle.
  useEffect(() => {
    if (retryAfterSec <= 0) return;
    const t = setInterval(() => setRetryAfterSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [retryAfterSec > 0]);

  const isUnauthorizedError = useCallback((err: unknown): boolean => {
    const code = errorCode(err);
    return errorStatus(err) === 401 || code === 'UNAUTHORIZED' || code === 'AUTHZ_STALE';
  }, []);

  const hasAuthToken = useCallback((): boolean => {
    return !useBackend || !!authGateway.getToken();
  }, [authGateway, useBackend]);

  const refreshProjection = useCallback(() => {
    if (!useBackend) return;
    void authGateway.getCapabilities().then(setCapabilities).catch(() => setCapabilities(null));
    void authGateway.getAccessMode().then((m: AccessMode) => setMutationsAllowed(m.mutationsAllowed)).catch(() => setMutationsAllowed(null));
  }, [authGateway, useBackend]);

  const forceLogout = useCallback(() => {
    authGateway.logout();
    setAuthSession(null);
    setCapabilities(null);
    setMutationsAllowed(null);
  }, [authGateway]);

  const parkForLogin = useCallback((message: string) => {
    setAuthMode('login');
    setAuthError(message);
    setIsAuthModalOpen(true);
  }, []);

  const parkForRotation = useCallback((message: string) => {
    setAuthMode('change-password');
    setAuthError(message);
    setIsAuthModalOpen(true);
  }, []);

  const loginWithPassword = useCallback(async (operatorId: string, password: string) => {
    setAuthError('');
    const stationId = pickStationId(
      [getQueryStationId?.(), authGateway.getStationId(), stationIdEnv],
      getRegisteredDeviceIds(),
    );
    if (stationId) authGateway.setStationId(stationId);
    try {
      const session = await authGateway.loginWithPassword(operatorId, password, stationId || undefined);
      setAuthSession(session);
      rotationOperatorRef.current = session.operator.id;
      refreshProjection();
      if (session.operator.mustChangePassword) {
        // spec 043: gerbang rotasi — modal tetap terbuka dalam mode ganti password.
        parkForRotation('Password sementara wajib diganti sebelum aksi terproteksi.');
        return;
      }
      setIsAuthModalOpen(false);
      setAuthMode('login');
      const pending = pendingProtectedActionRef.current;
      pendingProtectedActionRef.current = null;
      if (pending) await pending();
      // Boot-401 path has no pending action — reload fleet after fresh login.
      onAuthenticated();
    } catch (err) {
      const retry = errorRetryAfter(err);
      if (retry) setRetryAfterSec(retry);
      const code = errorCode(err);
      setAuthError(
        code === 'STATION_NOT_FOUND' ? 'Station kiosk tidak terdaftar di registry perangkat.'
        : retry ? `Terlalu banyak percobaan login. Coba lagi dalam ${retry} detik.`
        : err instanceof Error ? err.message : 'Login operator gagal.',
      );
    }
  }, [authGateway, getQueryStationId, getRegisteredDeviceIds, onAuthenticated, parkForRotation, refreshProjection, stationIdEnv]);

  const submitPasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    setAuthError('');
    try {
      await authGateway.changePassword(currentPassword, newPassword);
      // authz_version naik → token lama AUTHZ_STALE: login ulang otomatis.
      const operatorId = rotationOperatorRef.current || authSession?.operator.id || '';
      await loginWithPassword(operatorId, newPassword);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Ganti password gagal.');
    }
  }, [authGateway, authSession, loginWithPassword]);

  const runProtected = useCallback(async <T,>(action: () => Promise<T>): Promise<T | void> => {
    if (useBackend && !hasAuthToken()) {
      pendingProtectedActionRef.current = action;
      parkForLogin('');
      return;
    }

    // G13: refresh diam-diam sebelum aksi bila token hampir kedaluwarsa.
    if (useBackend && isTokenExpiringSoon(authGateway.getToken())) {
      try {
        const renewed = await authGateway.refreshSession();
        if (renewed) {
          setAuthSession(renewed);
          refreshProjection();
        }
      } catch (err) {
        pendingProtectedActionRef.current = action;
        if (isUnauthorizedError(err)) {
          forceLogout();
          parkForLogin('Sesi berakhir (token dicabut/kedaluwarsa). Silakan login ulang.');
        } else {
          parkForLogin('Sesi operator hampir kedaluwarsa — silakan login ulang.');
        }
        return undefined as T;
      }
    }

    try {
      await action();
    } catch (err) {
      const code = errorCode(err);
      if (useBackend && code === 'PASSWORD_ROTATION_REQUIRED') {
        pendingProtectedActionRef.current = action;
        rotationOperatorRef.current = authSession?.operator.id ?? rotationOperatorRef.current;
        parkForRotation('Password wajib diganti sebelum aksi ini (spec 043).');
        return;
      }
      if (useBackend && isUnauthorizedError(err)) {
        pendingProtectedActionRef.current = action;
        forceLogout();
        parkForLogin('Sesi operator diperlukan atau sudah kedaluwarsa.');
        return;
      }
      throw err;
    }
  }, [authGateway, authSession, forceLogout, hasAuthToken, isUnauthorizedError, parkForLogin, parkForRotation, refreshProjection, useBackend]);

  // FR-006: refresh berkala selama sesi aktif (HMI idle panjang tidak mati mendadak).
  useEffect(() => {
    if (!useBackend || !authSession) return;
    const t = setInterval(() => {
      authGateway.refreshSession()
        .then((renewed) => {
          if (renewed) {
            setAuthSession(renewed);
            refreshProjection();
          }
        })
        .catch((err) => {
          if (isUnauthorizedError(err)) {
            forceLogout();
            parkForLogin('Sesi berakhir (token dicabut/kedaluwarsa). Silakan login ulang.');
          }
          // error lain: pre-action refresh akan retry; jangan loop modal.
        });
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [authGateway, authSession, forceLogout, isUnauthorizedError, parkForLogin, refreshProjection, useBackend]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError('');
    setAuthMode('login');
    setRetryAfterSec(0);
    pendingProtectedActionRef.current = null;
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthError('');
    setAuthMode('login');
    setIsAuthModalOpen(true);
  }, []);

  const notifyUnauthorized = useCallback(() => {
    parkForLogin('Sesi operator diperlukan atau sudah kedaluwarsa.');
  }, [parkForLogin]);

  const logoutOperator = useCallback(() => {
    forceLogout();
  }, [forceLogout]);

  return {
    authSession,
    authError,
    isAuthModalOpen,
    authMode,
    retryAfterSec,
    capabilities,
    mutationsAllowed,
    openAuthModal,
    closeAuthModal,
    notifyUnauthorized,
    loginWithPassword,
    submitPasswordChange,
    logoutOperator,
    runProtected,
    hasAuthToken,
    isUnauthorizedError,
  };
}
