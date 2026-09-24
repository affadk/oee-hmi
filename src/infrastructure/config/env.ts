// /src/infrastructure/config/env.ts
// Single place to read backend endpoints. Presentation/application must NOT
// read import.meta.env directly — import from here instead.
//
// Coexistence: v1 frontend dev :3000, v2 (this repo) dev :3002, backend
// daemon :3001 (docker-internal), nginx gateway :80.
// Empty VITE_API_BASE_URL means same-origin relative calls (e.g. `/api/...`),
// which in dev go through vite server.proxy to the gateway — no CORS change
// needed on the backend stack.

type EnvKey = 'VITE_API_BASE_URL' | 'VITE_WS_TELEMETRY_URL' | 'VITE_API_TOKEN' | 'VITE_USE_BACKEND';

// PENTING: tiap variabel WAJIB diakses sebagai `import.meta.env.VITE_X`
// statis per-baris. Akses dinamis (`meta.env?.[key]`) TIDAK diganti Vite
// saat transform/build — hasilnya selalu fallback (bug: flag backend
// tidak pernah bisa true). Lihat docs/audits/simulation-backend-lane.md.
function readEnv(key: EnvKey, fallback = ''): string {
  try {
    const v =
      key === 'VITE_API_BASE_URL' ? import.meta.env.VITE_API_BASE_URL :
      key === 'VITE_WS_TELEMETRY_URL' ? import.meta.env.VITE_WS_TELEMETRY_URL :
      key === 'VITE_API_TOKEN' ? import.meta.env.VITE_API_TOKEN :
      import.meta.env.VITE_USE_BACKEND;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function resolveWsUrl(raw: string): string {
  if (raw) return raw;
  try {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.host}/ws/telemetry`;
  } catch {
    return 'ws://localhost/ws/telemetry';
  }
}

const rawApiBaseUrl = readEnv('VITE_API_BASE_URL', '');

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

export const env = {
  /** REST base. '' = same-origin relative (via vite proxy in dev). */
  apiBaseUrl: normalizeBaseUrl(rawApiBaseUrl),
  /** WS relay. '' = same-origin /ws/telemetry (via vite proxy in dev). */
  wsTelemetryUrl: resolveWsUrl(readEnv('VITE_WS_TELEMETRY_URL', '').trim()),
  /** Bearer token injected at runtime (HMI operator session). */
  apiToken: readEnv('VITE_API_TOKEN', ''),
  /** Toggle between simulation lane (false) and real backend lane (true). */
  useBackend: readEnv('VITE_USE_BACKEND', 'false') === 'true',
} as const;
