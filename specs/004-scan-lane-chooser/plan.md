# Plan — Spec 004 Chooser 2 Jalur Scan

> Turunan spec 004 rev 1. Frontend-only (`oee-dashboard-aistudio`). Prasyarat: unit 003 selesai (dual-lane routing `routeBackendQr` ada).

**Lifecycle:** PLANNED
**Health:** VALID
**Reviewed against:** spec revision 1

## 1. Strategi

Pemisahan UI, bukan perombakan logika. Domain (`QrZoneBadge`, `parseQrString`) + application (`qrRouting`, `qrZones`) sudah memisah dua jenis payload; unit 004 hanya memaksa **operator memilih jalur dulu**, lalu membatasi input per jalur. Tak ada logika parse baru — hanya gating + copy. Semua state di `BatchQrScannerModal`, satu state `scanLane`.

## 2. Komponen terdampak

| File | Perubahan | Trace |
|---|---|---|
| `BatchQrScannerModal.tsx` | state `scanLane: 'CHOOSER'\|'ZONE'\|'WO'`; reset ke `CHOOSER` saat buka; gating kamera/input per jalur; tombol "Kembali ke pilihan jalur"; relabel tombol config-only | FR-001/002/003/004/005 |
| `steps/ScanLaneChooser.tsx` (baru) | 2 kartu besar (Jalur A 4 QR bertahap / Jalur B Scan WO) — presentational, keyboard fokus, ARIA | FR-001, NFR-001/002 |
| `QrScanInput.tsx` | placeholder per jalur; backend textfield hanya muncul di Jalur B | FR-003 |
| `application/qrRouting.ts` | helper pesan arah lintas jalur (`WO_LANE_WRONG_MESSAGE`, `ZONE_LANE_WRONG_MESSAGE`) | FR-002/003 |
| test `qrRouting.test.ts` | vektor pesan arah + `routeBackendQr` tetap | AC-002/003 |

Tidak berubah: `capabilityGate.ts` (FAT-252), `FloorPushButtonsPanel` (guard START), `ProductionSetupModal` (dispatch), layout live monitor, backend.

## 3. Fase

- **F1 — State + chooser (T401–T403):** state `scanLane`; komponen `ScanLaneChooser`; reset ke chooser saat buka; kamera/input/stepper tidak render sampai jalur dipilih.
- **F2 — Gating jalur (T404–T406):** Jalur A hanya terima badge zona (QR WO → pesan arah B); Jalur B hanya terima QR WO (badge zona → pesan arah A); textfield hanya Jalur B.
- **F3 — Semantik config-only + navigasi (T407–T409):** relabel tombol ("Konfigurasi Edge Device" bukan "Mulai"); instruksi START fisik di Edge OEE; "Kembali ke pilihan jalur" di kedua jalur.
- **F4 — Verifikasi + deploy (T410–T412):** `pnpm lint` + `pnpm test`; diff live monitor = nol; deploy dist :3002; verification.md per AC.

## 4. Risiko & mitigasi

- **Regresi jalur simulasi** → chooser hanya `backendMode`; simulasi tetap wizard 4 identitas (FR-006).
- **Sentuh layout beku** → perubahan hanya di modal QR + komponen chooser; AC-007 buktikan diff nol.
- **Duplikasi copy START** → satu konstanta instruksi dipakai di chooser + footer.
