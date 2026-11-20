// Unit 003 (FR-002, ADR-0005): routing tunggal scan backend-mode, auto-deteksi.
// Badge zona (PID/MID/OID/SID) → jalur A (draft 4 zona).
// QR ber-WO (katalog/JSON/key-value WO=) → jalur B (resolve WO existing).
// Selain itu → error jujur. Pure: parse domain saja, tanpa IO.
// LAYER RULES: domain imports only — no infrastructure, no DOM.

import { parseZoneBadge, looksLikeZoneBadge, type ParsedZoneBadge } from '../domain/entities/QrZoneBadge';
import { parseQrString } from '../domain/entities/BatchQr';

export type QrRoute =
  | { kind: 'zone'; badge: ParsedZoneBadge }
  | { kind: 'wo'; woId: string }
  | { kind: 'error'; message: string };

/** Rutekan hasil scan kamera backend-mode (zona vs WO vs error). */
export function routeBackendQr(raw: string): QrRoute {
  let badge: ParsedZoneBadge | null;
  try {
    badge = parseZoneBadge(raw);
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Badge zona tidak valid.' };
  }
  if (badge) return { kind: 'zone', badge };
  try {
    const parsed = parseQrString(raw);
    const woId = parsed.kind === 'PRODUCT' && parsed.product ? parsed.product.workOrder.trim() : '';
    if (woId) return { kind: 'wo', woId };
    return {
      kind: 'error',
      message: 'QR ini tidak memuat nomor WO — pindai QR produk/WO (jalur WO), atau badge zona via kamera (jalur 4 badge).',
    };
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'QR tidak valid.' };
  }
}

/** Pesan tolak badge zona di textfield manual (directive pemilik: textfield hanya jalur WO). */
export const ZONE_PASTE_REJECT_MESSAGE =
  'Badge zona (PID/MID/OID/SID) wajib dipindai via kamera — textfield manual hanya untuk QR WO.';

/** True bila input textfield adalah badge zona (harus ditolak, arah kamera). */
export function isZonePaste(raw: string): boolean {
  return looksLikeZoneBadge(raw);
}
