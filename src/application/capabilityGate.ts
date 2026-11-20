// /src/application/capabilityGate.ts
// FR-007/FR-008 (ADR-0002): gate mutasi dari capability /auth/me + access-mode.
// Amandemen OQ-004 (bukti live 2026-11-20): UI nonaktif hanya untuk `deny`
// eksplisit / read-only; unknown/absen/null = coba dengan enforcement backend
// (shadow-mode unknown = baseline preset; fail-closed tetap di backend).
// Granularitas katalog backend = domain-level (mis. device_command.send);
// RBAC per-perintah (RESET_COUNTER supervisor+) tetap ditegakkan backend (403).
// LAYER RULES: pure — no IO, no DOM, no infrastructure imports.

import type { CapabilityMap } from '../domain/ports/IOeeBackend';

export interface MutationGateInput {
  useBackend: boolean;
  mutationsAllowed: boolean | null;
  capabilities: CapabilityMap | null;
  key: string;
}

export interface MutationGateResult {
  allowed: boolean;
  reason: string;
}

export function canMutate(input: MutationGateInput): MutationGateResult {
  if (!input.useBackend) return { allowed: true, reason: '' }; // lane simulasi
  if (input.mutationsAllowed === false) {
    return { allowed: false, reason: 'Mode read-only: mutasi dinonaktifkan pada kanal ini (tunnel).' };
  }
  // Amandemen OQ-004 (2026-11-20, bukti live): AUTHZ_MODE=shadow membuat
  // `unknown` = "policy dinamis belum evaluasi; baseline preset berlaku" —
  // backend tetap menegakkan RBAC per-rute (403). Maka UI hanya menonaktifkan
  // `deny` eksplisit / read-only; unknown/absen/null = coba dengan enforcement
  // backend (fail-closed tetap di backend, bukan di tebakan UI).
  if (input.capabilities !== null && input.capabilities[input.key] === 'deny') {
    return { allowed: false, reason: `Hak akses ${input.key} ditolak (deny).` };
  }
  return { allowed: true, reason: '' };
}
