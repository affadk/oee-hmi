# Tasks — Spec 002 Separasi Surface

> Turunan design.md + spec.md rev 2. **Gate:** ADR-0004 Accepted + design DESIGNED/VALID sebelum READY.

**Lifecycle:** DRAFT
**Health:** REVIEW_REQUIRED
**Traces to:** `design.md`, `spec.md` (unit ini)
**Reviewed against:** spec revision 2, design DRAFT

## Fase 1 — Surface mode & kiosk lock

- [ ] T101 `application/surfaceMode.ts` pure resolver + test [FR-001]
- [ ] T102 `useOeeDashboard` boot select stationId + selectMachine no-op kiosk + expose surface [FR-002] (depends T101)
- [ ] T103 `DashboardPage` switcher conditional kiosk + label mode andon/station [FR-002/008] (depends T102)
- [ ] T104 Test fase 1 + lint [AC-001/007] (depends T101..T103)

## Fase 2 — QR initiate-from-zones

- [ ] T105 endpoints + port + repo `validateZone`/`initiateFromZones` + dto [FR-004]
- [ ] T106 `application/qrZones.ts` builder zona dari draft BatchQr + test [FR-004] (depends T105)
- [ ] T107 `useWorkOrders.initiateFromZones` (validate per zona → initiate → dispatch) + error per zona [FR-004] (depends T106)
- [ ] T108 `BatchQrScannerModal` wiring initiate + konfirmasi mismatch OID [FR-004/005] (depends T107)
- [ ] T109 Test fase 2 + lint [AC-002/003/004] (depends T105..T108)

## Fase 3 — Station fleet & login-first

- [ ] T110 `FleetCardsPanel` kartu RUNNING + klik → live view [FR-006]
- [ ] T111 Station login-first gate (tanpa sesi → modal login untuk mutasi; browse kartu publik) + capability gate reuse [FR-006/007] (depends T110)
- [ ] T112 Test fase 3 + lint [AC-005/006] (depends T110..T111)

## Fase 4 — Historical exit & auto-lock

- [ ] T113 `App.tsx` redirect /audit → /overview + nav exit (kode arsip) [FR-009]
- [ ] T114 `useInactivityLock` 5 menit env + gate mutasi + pesan re-login [FR-010]
- [ ] T115 Test fase 4 (fake timers) + lint [AC-008/009] (depends T113..T114)

## Verifikasi & dokumen

- [ ] T116 E2E stack hidup: kiosk lock, scan→initiate→dispatch→RUNNING, mismatch konfirmasi, station kartu, andon publik, auto-lock; bukti verification.md [AC semua] (depends T115)
- [ ] T117 Diff-review freeze + sync apps/hmi + rebuild + commit/push + TODO/README [AC-010] (depends T116)
