# Verification — Spec 004 Chooser 2 Jalur Scan

**Reviewed against:** spec rev 1 (SPECIFIED), plan PLANNED, design DESIGNED, ADR-0006 Accepted
**Lifecycle:** VERIFIED (kode + gate hijau + bundle dev backend-mode); kamera fisik PARTIAL (manual pemilik)
**Tanggal:** 2026-11-23

## Bukti otomatis (hijau)

- `pnpm lint` = `tsc --noEmit` + `lint:arch` OK (domain zero-IO, application inward-only, presentation no-direct-IO, no `any`).
- `pnpm test` = **203 test / 29 file passed** (baseline 200 + 3 vektor pesan lintas jalur T406).
- `git diff` unit 004: `qrRouting.ts`, `BatchQrScannerModal.tsx`, `ScanLaneChooser.tsx` (baru), `qrRouting.test.ts`, `useOeeDashboard.ts` (1 baris: deklarasi `authenticated` FAT-252 yang tertinggal — plumbing tipe, bukan perilaku).
- Nol file live monitor tersentuh: `git diff --name-only` tidak memuat `OverviewPage*`, `Fullscreen*`, `DashboardPage*`, `FloorPushButtonsPanel`.

## Bukti kode per jalur

| Alur | Bukti (file:baris) |
|------|--------------------|
| Chooser gate | `scanLane` init `CHOOSER` bila backend (`BatchQrScannerModal.tsx:195`), reset `CHOOSER` saat modal buka (`:213-218`); `showChooser` (`:607`) menyembunyikan stepper/kamera/input/body zona |
| Kartu chooser | `ScanLaneChooser.tsx:32-62`: 2 `<button>` native (Tab+Enter/Space), `aria-label`, `focus:ring-2`, tema gelap/terang via `themeTokens`; hint START di `:31` |
| Gating Jalur A | `:522-530`: `zone` → `applyZoneBadge` + re-arm `cameraKey++`; `wo` → `WO_LANE_WRONG_MESSAGE`; lainnya pesan route |
| Gating Jalur B | `:532-539`: `wo` → `resolveWo`; `zone` → `ZONE_LANE_WRONG_MESSAGE`; lainnya pesan route. Textfield WO-saja + zona ditolak arah Jalur A (`:495-497`) |
| Pesan lintas jalur | `qrRouting.ts:39-44`; `WO_LANE_WRONG_MESSAGE` arah Jalur B, `ZONE_LANE_WRONG_MESSAGE` arah Jalur A; 3 vektor di `qrRouting.test.ts` |
| Config-only | Tombol Jalur B = "Konfigurasi Edge Device" (`:980-985`, title START = tombol fisik); `START_EDGE_HINT` di chooser + footer (`:1004`); tak ada frasa HMI-START (grep bersih) |
| Kembali ke chooser | Footer "Pilihan Jalur" tiap jalur (`:892-904`) → `chooseLane('CHOOSER')` reset draft/scannedWo/step/kamera (`:544-555`) |
| Simulasi tak berubah | `showChooser`/`laneActive` bergantung `backendMode` (`:607-610`); cabang `!backendMode` wizard lama utuh |

## Bukti bundle dev (backend-mode, tanpa mock)

- Build `VITE_USE_BACKEND=true`; bundle `index-Cepz0eVU.js` memuat keempat string kunci: `Jalur A — 4 QR Bertahap`, `Jalur B — Scan WO Existing`, `Konfigurasi Edge Device`, `tekan tombol fisik di Edge OEE`.
- Deploy `rsync` → `apps/hmi/dist` (bind-mount nginx, FR-006 tanpa restart); `http://localhost:3002/` → 200.
- Stack hidup: backend `/health` `db_connected:true`, `ws_clients:1`, telemetry live (valid ingested > 1900); proxy `:3002/api/v1/machines` → 200, `/api/v1/work-orders` → 200. Tidak ada jalur mock (`useBackend` baked true, penanda "Mode simulasi aktif" nol).

## Matriks AC

| AC | Bukti | Status |
|----|-------|--------|
| AC-001 chooser 2 kartu, kamera belum aktif | Kode `showChooser` gate + kartu fokusabel native; bundle memuat string chooser; kamera dirender hanya `laneActive` (`:803`) | **PASS** kode+bundle; visual fisik manual |
| AC-002 Jalur A gating + arah B | Kode `:522-530`; vektor `WO_LANE_WRONG_MESSAGE`; lifecycle init/ACK spec 003 masih berlaku | **PASS** kode; scan fisik 4 zona manual (warisan AC-009 003) |
| AC-003 Jalur B gating + arah A | Kode `:532-539` + textfield `:495-497`; vektor `ZONE_LANE_WRONG_MESSAGE`; preview `resolveWo` spec 003 | **PASS** kode; resolve fisik manual |
| AC-004 config-only copy | Relabel + `START_EDGE_HINT` chooser/footer; grep tak ada klaim HMI-START | **PASS** kode+bundle |
| AC-005 kembali ke pilihan jalur | Footer "Pilihan Jalur" + `chooseLane('CHOOSER')` reset penuh | **PASS** kode; visual manual |
| AC-006 simulasi tak berubah | Gate `backendMode`; cabang `!backendMode` tak disentuh | **PASS** kode (runtime simulasi tak dinyalakan — dev kini backend-mode) |
| AC-007 gate + diff live monitor | `pnpm lint` hijau, `pnpm test` 203/203, diff nol file live monitor | **PASS** |

## Batasan

- Verifikasi kamera fisik (secure context, badge cetak, arah lintas jalur di perangkat) tetap manual pemilik; kode gating + pesan arah sudah teruji unit dan ter-render di bundle dev.
- OQ-401 (tombol START HMI `FloorPushButtonsPanel`) dan OQ-402 (Jalur B: Setup Produksi vs inline) tetap terbuka, bukan bagian unit ini.