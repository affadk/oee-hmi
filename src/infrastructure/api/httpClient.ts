// /src/infrastructure/api/httpClient.ts
// Thin fetch wrapper owned by infrastructure. Translates HTTP errors into
// Error objects carrying backend {error, message} codes — application layers
// catch these without ever touching fetch/Response.

import { env } from '../config/env';
import { AuthTokenStorageAdapter } from '../storage/AuthTokenStorageAdapter';

export interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

export class BackendHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'BackendHttpError';
  }
}

const tokenStorage = new AuthTokenStorageAdapter();

function resolveToken(explicit?: string | null): string | null {
  if (explicit) return explicit;
  return tokenStorage.getToken() ?? (env.apiToken || null);
}

export async function httpRequest<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const token = resolveToken(options.token);
  const hasBody = options.body !== undefined;
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 204) return undefined as T;

  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  let payload: unknown;
  try {
    payload = isJson ? await res.json() : await res.text();
  } catch {
    throw new BackendHttpError(res.status, 'INVALID_RESPONSE', `Invalid response body for ${path}`);
  }

  if (!res.ok) {
    const code = (payload as { error?: string } | null)?.error ?? `HTTP_${res.status}`;
    const message = (payload as { message?: string } | null)?.message ?? res.statusText;
    throw new BackendHttpError(res.status, code, message);
  }
  return payload as T;
}

export async function httpDownload(path: string, options: HttpOptions = {}): Promise<Blob> {
  const token = resolveToken(options.token);
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: options.signal,
  });
  if (!res.ok) {
    const message = res.statusText || `Download failed for ${path}`;
    throw new BackendHttpError(res.status, `HTTP_${res.status}`, message);
  }
  return res.blob();
}
