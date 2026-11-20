# Plan — Spec 003 Dual-Lane Inisiasi QR

> Turunan spec 003 rev 2 + ADR-0005 (Accepted 2026-11-20). Gate implementasi terpenuhi: OQ-201..204 resolved + design DESIGNED + tasks READY.

**Lifecycle:** PLANNED
**Health:** VALID
**Reviewed against:** spec revision 2

## 1. Strategi

Perubahan terkonsentrasi di modal QR + lapisan domain/application yang sudah ada; bukan perombakan. Pipa initiate unit 002 (`useWorkOrders.initiateFromZones`, ports, endpoint) dipakai apa adanya. Yang disambung: **scan → draft zona → initiate**, plus **tunggu ACK** bersama untuk kedua jalur. Jalur simulasi tidak disentuh.

## 2. Komponen terdampak (perkiraan)

| File | Perubahan | Trace |
|---|---|---|
| `src/domain/entities/QrZoneBadge.ts` (baru) | parser badge zona cermin `qr-zone-parser.ts` + tipe hasil per zona (pure) | FR-001 |
| `src/domain/entities/BatchQr.ts` | draft zona nullable + `shiftDate`/`targetQty` dari badge shift; katalog demo tetap untuk simulasi | FR-003/004 |
| `src/application/qrZones.ts` | `buildZoneStrings` terima nilai badge (LINE/DATE/TARGET) tanpa substitusi lokal bila zona dari scan | FR-004 |
| `BatchQrScannerModal.tsx` | routing tunggal auto-deteksi (zona via kamera vs WO via kamera/textfield); draft awal kosong di backend; stepper 4 zona backend; panel konfirmasi konfigurasi pra-initiate; footer sadar-lane; guard MID; hapus klaim "aktif" pra-ACK | FR-002/003/005 |
| `QrScanInput.tsx` | textfield backend-mode hanya jalur WO: submit → resolve; badge zona paste → error arah kamera | FR-002 |
| `src/application/hooks/useWorkOrderAckWait.ts` (baru) | poll bounded detail WO (interval 2s, cap 20s; berhenti ACTIVE/ABORTED/timeout) via port detail existing | FR-005/006, NFR-002 |
| `useWorkOrders.ts` / Setup Produksi | pasang ACK wait pasca initiate & dispatch; status ACK/timeout/retry tampil | FR-005/006 |
| test domain parser + routing + ACK wait | vektor dari test backend `qr-zone-parser`; retry idempoten; timeout | AC-001/006 |

Tidak berubah: `FloorPushButtonsPanel`, `OverviewPage`/`FullscreenOeeView`/`DashboardPage` layout, ports/endpoints initiate, backend.

## 3. Fase

- **F1 — Parser + tipe (T201–T203):** `QrZoneBadge.ts` + test vektor backend; draft zona nullable + shiftDate; `buildZoneStrings` hormati nilai badge.
- **F2 — Routing + draft nyata (T204–T207):** routing auto-deteksi (zona wajib kamera; textfield hanya WO); draft kosong backend-mode + pilih master; stepper zona backend; panel konfirmasi konfigurasi 4 zona; footer lane-aware; guard MID dini.
- **F3 — ACK wait (T208–T210):** hook bounded poll; UI status menunggu-ACK/ACTIVE/ABORTED/timeout + retry idempoten di modal QR & Setup Produksi; hapus klaim sukses pra-ACK.
- **F4 — Verifikasi + deploy (T211–T213):** `pnpm lint` + `pnpm test`; E2E stack hidup (jalur A scan kamera 4 badge via localhost → konfirmasi → ACK → START; jalur B; timeout edge-sim offline; OID mismatch); verification.md per AC; sync `apps/hmi` + rebuild dist (pola unit 002).

## 4. Risiko & mitigasi

- **Parser drift vs backend** → vektor uji disalin dari test backend `qr-zone-parser`; kunci/alias/validasi dicocokkan baris per baris saat design.
- **ACK tak terdeteksi** → poll bounded deterministik (OQ-203); WS resync eksisting jaring pengaman; cap 20s > watchdog 15s backend.
- **Layout beku tersentuh** → perubahan hanya modal QR/Setup; AC-008 diff nol komponen live monitor.
- **Regresi jalur simulasi** → `parseQrString`/`draftFromMachine` lama tetap; test simulasi existing hijau.

## 5. Catatan drift dokumen (LOW, intent-preserving)

Spec 002 FR-004 menulis "→ `POST /:wo_id/dispatch`" terpisah; implementasi benar meniadakannya (initiate sudah dispatch — komentar `useWorkOrders.ts:199-200`). Intent sama (WO ter-dispatch); wording 002 dikoreksi pada revisi berikutnya tanpa cascade STALE unit ini.
