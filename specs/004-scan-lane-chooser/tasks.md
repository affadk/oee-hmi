# Tasks — Spec 004 Chooser 2 Jalur Scan

> Turunan design DESIGNED. Setiap task punya `Spec: FR-xxx` + langkah verifikasi. Frontend-only.

**Lifecycle:** READY
**Health:** VALID

## T401 — State scanLane + chooser gate (Spec: FR-001)

- [ ] Tambah state `scanLane: 'CHOOSER' | 'ZONE' | 'WO'` di `BatchQrScannerModal`; reset `CHOOSER` di effect `isOpen`.
- [ ] Backend-mode `scanLane==='CHOOSER'`: render `ScanLaneChooser`; jangan render stepper/kamera/input/body zone.
- [ ] Verifikasi: modal buka backend → chooser 2 kartu, kamera mati.

## T402 — komponen ScanLaneChooser (Spec: FR-001, NFR-001/002)

- [ ] Buat `steps/ScanLaneChooser.tsx` presentational: 2 kartu (A: 4 QR Bertahap, B: Scan WO Existing), fokusabel keyboard (Enter/Space), ARIA label, tema gelap/terang, reuse `themeTokens`.
- [ ] Verifikasi: Tab→Enter pada kartu memilih jalur; `pnpm lint:arch` hijau (tanpa IO/any).

## T403 — navigasi pilih jalur (Spec: FR-005)

- [ ] Klik kartu → set `scanLane` ZONE/WO; draft A dari `emptyBatchDraft`, B `scannedWo=null`; `cameraKey++`.
- [ ] Verifikasi: pilih A lalu B, draft/scannedWo reset benar.

## T404 — gating Jalur A (Spec: FR-002, AC-002)

- [ ] `handleCameraScan` baca `routeBackendQr`; ZONE: `zone`→`applyZoneBadge`; `wo`→`WO_LANE_WRONG_MESSAGE`; else error route. Re-arm kamera tiap badge (`cameraKey++`).
- [ ] Verifikasi: scan WO di Jalur A → pesan arah B, draft tak berubah; scan 4 badge → draft terisi.

## T405 — gating Jalur B (Spec: FR-003, AC-003)

- [ ] WO: kamera `wo`→`resolveWo`; `zone`→`ZONE_LANE_WRONG_MESSAGE`; else error. Textfield WO-saja (`submitWoForPreview`).
- [ ] Verifikasi: scan badge zona di Jalur B → pesan arah A; scan/tempel QR WO → preview.

## T406 — pesan arah lintas jalur (Spec: FR-002/003)

- [ ] Tambah `WO_LANE_WRONG_MESSAGE`, `ZONE_LANE_WRONG_MESSAGE` di `qrRouting.ts`; test vektor di `qrRouting.test.ts`.
- [ ] Verifikasi: unit test pesan hijau.

## T407 — semantik config-only (Spec: FR-004, AC-004)

- [ ] Relabel tombol Jalur B "Mulai Setup Produksi" → "Konfigurasi Edge Device".
- [ ] Konstanta `START_EDGE_HINT` ("START logging = tombol fisik di Edge OEE"); tampil di chooser + footer.
- [ ] Verifikasi: grep copy tak ada frasa HMI-START; instruksi fisik tampil.

## T408 — navigasi "Kembali ke pilihan jalur" (Spec: FR-005, AC-005)

- [ ] Tombol di header tiap jalur → `setScanLane('CHOOSER')` + reset draft/scannedWo + `cameraKey++`.
- [ ] Verifikasi: dari A/B kembali ke chooser, ganti jalur tanpa tutup modal.

## T409 — guard simulasi tak berubah (Spec: FR-006, AC-006)

- [ ] Pastikan chooser hanya `backendMode`; jalur simulasi tetap `ProductStep/MachineStep/...`.
- [ ] Verifikasi: `VITE_USE_BACKEND=false` → chooser tak muncul, wizard lama utuh.

## T410 — gate + diff live monitor (Spec: FR-007, AC-007)

- [ ] `pnpm lint` (tsc + lint:arch) + `pnpm test` hijau (baseline 200).
- [ ] `git diff --stat` file live monitor (Fullscreen*/*Header/*FloorPushButtons) = nol.
- [ ] Verifikasi: output gate hijau + diff nol.

## T411 — deploy dist dev (Spec: FR-001..005)

- [ ] `pnpm build` → salin `dist/` ke volume HMI Podman `:3002`; smoke chooser tampil.
- [ ] Verifikasi: `:3002` 200, chooser 2 kartu tampil di dev.

## T412 — verification.md (Spec: semua AC)

- [ ] Catat bukti per AC-001..007 (kode/smoke; fisik kamera = PARTIAL menunggu owner).
- [ ] Verifikasi: matrix AC lengkap + batasan jelas.