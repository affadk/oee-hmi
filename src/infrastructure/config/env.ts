// /src/infrastructure/config/env.ts
// Single place to read backend endpoints. Presentation/application must NOT
// read import.meta.env directly — import from here instead.

function readEnv(key: string, fallback = ''): string {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return meta.env?.[key] ?? fallback;
  } catch {
    return fallback;
  }
}

export const env = {
  /** REST base, e.g. http://localhost (LAN) or http://localhost:3001 (direct daemon). */
  apiBaseUrl: readEnv('VITE_API_BASE_URL', 'http://localhost:3001'),
  /** WS relay, e.g. ws://localhost/ws/telemetry */
  wsTelemetryUrl: readEnv('VITE_WS_TELEMETRY_URL', 'ws://localhost:3001/ws/telemetry'),
  /** Bearer token injected at runtime (HMI operator session). */
  apiToken: readEnv('VITE_API_TOKEN', ''),
} as const;
