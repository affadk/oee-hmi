// /src/application/authToken.ts
// Pure JWT expiry helpers (no IO, no DOM) — G13 proactive refresh.

function base64UrlToString(b64url: string): string | null {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    if (typeof atob === 'function') return atob(padded);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/** Epoch-ms of the JWT `exp` claim, or null when absent/unparseable. */
export function decodeJwtExpMs(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const json = base64UrlToString(parts[1] ?? '');
  if (!json) return null;
  try {
    const payload = JSON.parse(json) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

/** True when the token expires within thresholdMs (or already expired). */
export function isTokenExpiringSoon(
  token: string | null | undefined,
  thresholdMs = 120_000,
  nowMs: number = Date.now(),
): boolean {
  const expMs = decodeJwtExpMs(token);
  if (expMs === null) return false;
  return expMs - nowMs <= thresholdMs;
}
