# Tasks — Spec 004 Chooser 2 Jalur Scan

> Turunan design DESIGNED. Setiap task punya `Spec: FR-xxx` + langkah verifikasi. Frontend-only.

**Lifecycle:** VERIFIED (kode + gate hijau + bundle dev; kamera fisik manual)
**Health:** VALID

## T401 — State scanLane + chooser gate (Spec: FR-001)

- [x] Tambah state `scanLane: 'CHOOSER' | 'ZONE' | 'WO'` di `BatchQrScannerModal`; reset `CHOOSER` di effect `isOpen`.
- [x] Backend-mode `scanLane==='CHOOSER'`: render `ScanLaneChooser`; jangan render stepper/kamera/input/body zone.
- [x] Verifikasi: modal buka backend → chooser 2 kartu, kamera mati.

## T402 — komponen ScanLaneChooser (Spec: FR-001, NFR-001/002)

- [x] Buat `steps/ScanLaneChooser.tsx` presentational: 2 kartu (A: 4 QR Bertahap, B: Scan WO Existing), fokusabel keyboard (Enter/Space), ARIA label, tema gelap/terang, reuse `themeTokens`.
- [x] Verifikasi: Tab→Enter pada kartu memilih jalur; `pnpm lint:arch` hijau (tanpa IO/any).

## T403 — navigasi pilih jalur (Spec: FR-005)

- [x] Klik kartu → set `scanLane` ZONE/WO; draft A dari `emptyBatchDraft`, B `scannedWo=null`; `cameraKey++`.
- [x] Verifikasi: pilih A lalu B, draft/scannedWo reset benar.

## T404 — gating Jalur A (Spec: FR-002, AC-002)

- [x] `handleCameraScan` baca `routeBackendQr`; ZONE: `zone`→`applyZoneBadge`; `wo`→`WO_LANE_WRONG_MESSAGE`; else error route. Re-arm kamera tiap badge (`cameraKey++`).
- [x] Verifikasi: scan WO di Jalur A → pesan arah B, draft tak berubah; scan 4 badge → draft terisi.

## T405 — gating Jalur B (Spec: FR-003, AC-003)

- [x] WO: kamera `wo`→`resolveWo`; `zone`→`ZONE_LANE_WRONG_MESSAGE`; else error. Textfield WO-saja (`submitWoForPreview`).
- [x] Verifikasi: scan badge zona di Jalur B → pesan arah A; scan/tempel QR WO → preview.

## T406 — pesan arah lintas jalur (Spec: FR-002/003)

- [x] Tambah `WO_LANE_WRONG_MESSAGE`, `ZONE_LANE_WRONG_MESSAGE` di `qrRouting.ts`; test vektor di `qrRouting.test.ts`.
- [x] Verifikasi: unit test pesan hijau.

## T407 — semantik config-only (Spec: FR-004, AC-004)

- [x] Relabel tombol Jalur B "Mulai Setup Produksi" → "Konfigurasi Edge Device".
- [x] Konstanta `START_EDGE_HINT` ("START logging = tombol fisik di Edge OEE"); tampil di chooser + footer.
- [x] Verifikasi: grep copy tak ada frasa HMI-START; instruksi fisik tampil.

## T408 — navigasi "Kembali ke pilihan jalur" (Spec: FR-005, AC-005)

- [x] Tombol di header tiap jalur → `setScanLane('CHOOSER')` + reset draft/scannedWo + `cameraKey++`.
- [x] Verifikasi: dari A/B kembali ke chooser, ganti jalur tanpa tutup modal.

## T409 — guard simulasi tak berubah (Spec: FR-006, AC-006)

- [x] Pastikan chooser hanya `backendMode`; jalur simulasi tetap `ProductStep/MachineStep/...`.
- [x] Verifikasi: `VITE_USE_BACKEND=false` → chooser tak muncul, wizard lama utuh.

## T410 — gate + diff live monitor (Spec: FR-007, AC-007)

- [x] `pnpm lint` (tsc + lint:arch) + `pnpm test` hijau (baseline 200).
- [x] `git diff --stat` file live monitor (Fullscreen*/*Header/*FloorPushButtons) = nol.
- [x] Verifikasi: output gate hijau + diff nol.

## T411 — deploy dist dev (Spec: FR-001..005)

- [x] `pnpm build` → salin `dist/` ke volume HMI Podman `:3002`; smoke chooser tampil.
- [x] Verifikasi: `:3002` 200, chooser 2 kartu tampil di dev.

## T412 — verification.md (Spec: semua AC)

- [x] Catat bukti per AC-001..007 (kode/smoke; fisik kamera = PARTIAL menunggu owner).
- [x] Verifikasi: matrix AC lengkap + batasan jelas.