// /src/application/hooks/useAuthSession.ts
// Focused hook: operator PIN session + protected-action gating.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.
// Presentation injects collaborators via the args object.

import { useCallback, useRef, useState } from 'react';
import type { AuthSession, IAuthGateway } from '../../domain/ports/IOeeBackend';
import { isTokenExpiringSoon } from '../authToken';

export interface AuthSessionDeps {
  authGateway: IAuthGateway;
  useBackend: boolean;
  /** Station/device id attached to the PIN login (defaults to ''). */
  getStationId?: () => string;
  /** Called after a successful login (e.g. reload fleet for the boot-401 path). */
  onAuthenticated: () => void;
}

export interface AuthSessionApi {
  authSession: AuthSession | null;
  authError: string;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  /** Backend 401 outside an action (e.g. boot load): show session message + open PIN modal. */
  notifyUnauthorized: () => void;
  loginWithPin: (pin: string, operatorId?: string) => Promise<void>;
  logoutOperator: () => void;
  /** Runs the action, parking it behind the PIN modal when the session is missing/expired. */
  runProtected: (action: () => Promise<void>) => Promise<void>;
  hasAuthToken: () => boolean;
  isUnauthorizedError: (err: unknown) => boolean;
}

export function useAuthSession(deps: AuthSessionDeps): AuthSessionApi {
  const { authGateway, useBackend, getStationId, onAuthenticated } = deps;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const pendingProtectedActionRef = useRef<(() => Promise<void>) | null>(null);

  const isUnauthorizedError = useCallback((err: unknown): boolean => {
    return !!err && typeof err === 'object' && (
      (err as { status?: unknown }).status === 401 ||
      (err as { code?: unknown }).code === 'UNAUTHORIZED'
    );
  }, []);

  const hasAuthToken = useCallback((): boolean => {
    return !useBackend || !!authGateway.getToken();
  }, [authGateway, useBackend]);

  const runProtected = useCallback(async (action: () => Promise<void>): Promise<void> => {
    if (useBackend && !hasAuthToken()) {
      pendingProtectedActionRef.current = action;
      setAuthError('');
      setIsAuthModalOpen(true);
      return;
    }

    // G13: refresh diam-diam sebelum aksi bila token hampir kedaluwarsa —
    // menghilangkan kegagalan-buta pertama pasca-TTL. Gagal refresh →
    // jalur modal PIN reaktif seperti biasa (bukan throw buta).
    if (useBackend && isTokenExpiringSoon(authGateway.getToken())) {
      const renewed = await authGateway.refreshSession().catch(() => null);
      if (renewed) {
        setAuthSession(renewed);
      } else {
        pendingProtectedActionRef.current = action;
        setAuthError('Sesi operator hampir kedaluwarsa — silakan PIN ulang.');
        setIsAuthModalOpen(true);
        return;
      }
    }

    try {
      await action();
    } catch (err) {
      if (useBackend && isUnauthorizedError(err)) {
        pendingProtectedActionRef.current = action;
        setAuthError('Sesi operator diperlukan atau sudah kedaluwarsa.');
        setIsAuthModalOpen(true);
        return;
      }
      throw err;
    }
  }, [authGateway, hasAuthToken, isUnauthorizedError, useBackend]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError('');
    pendingProtectedActionRef.current = null;
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthError('');
    setIsAuthModalOpen(true);
  }, []);

  const notifyUnauthorized = useCallback(() => {
    setAuthError('Sesi operator diperlukan atau sudah kedaluwarsa.');
    setIsAuthModalOpen(true);
  }, []);

  const loginWithPin = useCallback(async (pin: string, operatorId?: string) => {
    setAuthError('');
    try {
      const session = await authGateway.loginWithPin(pin, operatorId, getStationId?.() ?? '');
      setAuthSession(session);
      setIsAuthModalOpen(false);
      const pending = pendingProtectedActionRef.current;
      pendingProtectedActionRef.current = null;
      if (pending) await pending();
      // Boot-401 path has no pending action — reload fleet after fresh login.
      onAuthenticated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PIN operator tidak valid.';
      setAuthError(message);
      throw err;
    }
  }, [authGateway, getStationId, onAuthenticated]);

  const logoutOperator = useCallback(() => {
    authGateway.logout();
    setAuthSession(null);
  }, [authGateway]);

  return {
    authSession,
    authError,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    notifyUnauthorized,
    loginWithPin,
    logoutOperator,
    runProtected,
    hasAuthToken,
    isUnauthorizedError,
  };
}
