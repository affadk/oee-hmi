// /src/infrastructure/storage/AuthTokenStorageAdapter.ts
// Single owner of the operator API token key + storage access.
// httpClient and OeeHttpAuthGateway consume this instead of touching
// window.localStorage directly.

import type { IAuthTokenStorage } from '../../domain/ports/IAuthTokenStorage';

export const API_TOKEN_STORAGE_KEY = 'oee_api_token';

export class AuthTokenStorageAdapter implements IAuthTokenStorage {
  getToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(API_TOKEN_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(API_TOKEN_STORAGE_KEY, token);
    } catch {
      // storage unavailable — token stays in memory only
    }
  }

  clearToken(): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
