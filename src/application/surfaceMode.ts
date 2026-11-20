// Unit 002 (FR-001, ADR-0004): mode surface dari konteks deployment,
// bukan toggle in-app. Kiosk terikat device; station login-first; andon publik.
// LAYER RULES: pure — no IO, no DOM, no infrastructure imports.

export type SurfaceMode = 'kiosk' | 'station' | 'andon';

export interface SurfaceInput {
  /** Device terikat tervalidasi registry (stationContext); '' = tanpa binding. */
  stationId: string;
  /** Ada sesi operator/s supervisor aktif. */
  hasSession: boolean;
}

/**
 * Kiosk: station context tervalidasi → lock ke device itu.
 * Station: tanpa binding + sesi login → fleet + live.
 * Andon: tanpa binding + tanpa sesi → agregat publik read-only.
 */
export function resolveSurfaceMode(input: SurfaceInput): SurfaceMode {
  if (input.stationId.trim()) return 'kiosk';
  return input.hasSession ? 'station' : 'andon';
}