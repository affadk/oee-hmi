# Verification — Spec 003 Dual-Lane Inisiasi QR

**Reviewed against:** spec revision 2, design DESIGNED/VALID, ADR-0005 Accepted
**Lifecycle:** VERIFIED (kode + smoke stack hidup); AC lifecycle penuh + scan fisik PARTIAL (manual pemilik)
**Tanggal:** 2026-11-20

## Bukti otomatis (hijau)

- `pnpm lint` = `tsc --noEmit` + `lint:arch` OK (domain zero-IO, application inward-only, presentation no-direct-IO, no `any`).
- `pnpm test` = **199 test / 29 file passed**. Unit 003 baru: `qrZoneBadge` (14), `qrRouting` (9), `qrZones` (rewrite fail-closed), `ackWait` (5 poll bounded).
- Parser `QrZoneBadge.ts` = cermin pure backend `qr-zone-parser.ts`; vektor uji dari `test/multi-zone-work-order.test.ts` + `qr-zone-parser.test.ts` (CT desimal, alias `PRODUCT_ID/CYCLE`, overnight, BREAK>window, DATE invalid, mixed-zona error).
- Deteksi zona pakai kunci diskriminatif unik (`PID/CT`, `MID/MCH/LINE`, `OID/OP`, `SID/DATE/...`); `NAME` bukan kunci deteksi (dipakai produk + fallback operator) — bug multi-zone false-positive diperbaiki.

## Bukti E2E stack hidup (smoke, nginx :8080, OPR-1001/STM32-OEE-SIM)

Login `POST /api/v1/auth/login` → 200 token JWT + operator (`device_id STM32-OEE-SIM`). Edge-sim online (`device_online:true` meski seed FALSE).

| Cek | Request | Hasil | AC |
|-----|---------|-------|----|
| validate PRODUCT | `PID=PRD-GEAR-BOX-12;CT=12;NAME=Helical Gearbox 12mm` | 200 `valid:true`, parsed CT 12 + productId | AC-001 |
| validate OPERATOR | `OID=OPR-1001;OP=Budi Santoso` | 200 `valid:true`, operatorId OPR-1001 | AC-001/007 |
| validate SHIFT | `SID=PAGI;DATE=2026-11-20;START=07:00;END=16:00;BREAK=60;TARGET=500` | 200 `valid:true`; `shiftDate:2026-11-20` (badge, bukan lokal), `targetQty:500`, `plannedOperatingSec:28800` | AC-005 |
| validate MACHINE | `MID=CNC-MILLING-SIM;MCH=...;LINE=LINE-01` | **409 CONFLICT** — mesin running WO-SIM-20260906-01 (BR-002 nyata) | BR-002 |
| initiate-from-zones | komposit 4 zona valid | **409 CONFLICT** — fail-closed, nol WO dibuat (active WO existing) | AC-006/010, BR-002 |
| jalur B resolve | `GET /WO-SIM-20260906-01/resolve?device_id=STM32-OEE-SIM` | 200 WO penuh (CT 12, target 500, shift_plan) → preview data backend nyata | AC-003 |

**Nuansa kontrak (bukan gap):** CT-vs-master (tol 0.01s) ditegak di **initiate-from-zones**, bukan `validate-zone`. Probe validate PRODUCT `CT=99` → 200 `valid:true` (validate hanya cek CT numerik > 0 + parse + device online + binding). Spec skenario 2 menyebut "saat validate" — enforcement nyata di initiate; HMI menampilkan `CT_MISMATCH` dari respons initiate. Dicatat, tanpa perubahan backend.

## Matriks AC

| AC | Bukti | Status |
|----|-------|--------|
| AC-001 parse badge | `qrZoneBadge.test.ts` 14 vektor hijau + validate PRODUCT/OPERATOR/SHIFT 200 | **PASS** |
| AC-002 jalur A full (scan kamera 4 → initiate 200 → ACK → ACTIVE → START → RUNNING) | smoke: validate 3 zona 200; initiate 409 karena active WO dev. Lifecycle 200→ACK→ACTIVE butuh clear active WO + badge fisik + kamera localhost | **PARTIAL** (manual pemilik) |
| AC-003 jalur B resolve + textfield zona→error | resolve 200 (bukti); `qrRouting.test.ts`: kamera WO→`kind:'wo'`, paste badge→`isZonePaste` error arah kamera | **PASS** kode+smoke; dispatch→ACK→START manual |
| AC-004 draft kosong fail-closed | `qrZones.test.ts`: throw bila 4 zona tak lengkap; katalog demo `PRD-FLANGE-B20` dihapus dari backend lane; initiate disabled sampai lengkap | **PASS** |
| AC-005 DATE badge menang + MID mismatch dini | validate SHIFT pertahankan `shiftDate:2026-11-20`; `qrZones.ts` tanpa substitusi lokal; guard MID klien dini | **PASS** |
| AC-006 timeout/ABORTED/retry idempoten | `ackWait.test.ts` 5: ACTIVE/ABORTED berhenti, cap 20s→TIMEOUT (≤10 read), transient lanjut, cancel→null; initiate 409 fail-closed | **PASS** kode; timeout edge-sim offline + `is_idempotent_duplicate` manual |
| AC-007 OID mismatch konfirmasi | paritas unit 002 FR-005 dipertahankan di `BackendReviewStep` (konfirmasi sebelum initiate) | **PASS** kode; visual manual |
| AC-008 diff live monitor beku = nol | `git diff` `OverviewPage`/`FullscreenOeeView`/`DashboardPage`/`FullscreenViewModel` = murni plumbing prop `ackWait` (lapisan transfer), **nol JSX/visual/layout** | **PASS** |
| AC-009 kamera non-secure-context pesan jujur | pesan error kamera + textfield jalur WO tetap fungsi (kode modal); secure-context fisik = deployment localhost (OQ-204) | **PARTIAL** (manual kamera) |
| AC-010 panel konfirmasi 4 zona + batal=no request | `BackendReviewStep` tampilkan nilai 4 zona; initiate hanya pasca konfirmasi eksplisit; initiate 409 smoke = nol WO pada konflik | **PASS** kode; visual manual |

## Diff live monitor beku (AC-008, rinci)

```
DashboardPage.tsx        +1  ackWait={dashboard.ackWait}  (prop pass-through)
OverviewPage.tsx         +1  ackWait={dashboard.ackWait}  (prop pass-through)
FullscreenOeeView.tsx    +2  destructure default + ackWait={ackWait} ke modal QR
FullscreenViewModel.ts   +3/-1  tipe AckWaitState + prop opsional ackWait
```

Semua = lapisan transfer (prop/tipe), bukan perubahan tampilan. `ackWait` hanya dikonsumsi `BatchQrScannerModal` + `ProductionSetupModal` (modal, diizinkan). Komponen gauge/panel/zona audit: nol diff.

## Batasan / sisa manual (pemilik)

- Lifecycle penuh jalur A (initiate 200 → ACK → ACTIVE → START → RUNNING) + jalur B dispatch → ACK butuh: clear/complete WO ACTIVE dev (`WO-SIM-20260906-01`) + badge fisik + kamera localhost. Bukan blocker kode.
- Timeout `TIMEOUT_UNACKNOWLEDGED` nyata + `is_idempotent_duplicate` <5s: butuh edge-sim offline saat initiate (aksi pemilik).
- AC-009 kamera secure-context: verifikasi browser fisik (OQ-204 kiosk localhost).
- GAP-B06/B07 (posture deploy publik) = aksi pemilik backend/deploy, di luar unit ini.
