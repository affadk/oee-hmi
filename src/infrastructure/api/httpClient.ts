// /src/infrastructure/api/httpClient.ts
// Thin fetch wrapper owned by infrastructure. Translates HTTP errors into
// Error objects carrying backend {error, message} codes — application layers
// catch these without ever touching fetch/Response.

import { env } from '../config/env';

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

function resolveToken(explicit?: string | null): string | null {
  if (explicit) return explicit;
  try {
    return window.localStorage.getItem('oee_api_token') ?? (env.apiToken || null);
  } catch {
    return env.apiToken || null;
  }
}

export async function httpRequest<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const token = resolveToken(options.token);
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (res.status === 204) return undefined as T;

  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const code = (payload as { error?: string } | null)?.error ?? `HTTP_${res.status}`;
    const message = (payload as { message?: string } | null)?.message ?? res.statusText;
    throw new BackendHttpError(res.status, code, message);
  }
  return payload as T;
}
