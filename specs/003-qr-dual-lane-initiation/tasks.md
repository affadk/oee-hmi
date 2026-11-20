# Tasks — Spec 003 Dual-Lane Inisiasi QR

> Gate terpenuhi 2026-11-20: OQ-201..204 resolved + ADR-0005 Accepted + design DESIGNED/VALID.

**Lifecycle:** READY
**Health:** VALID
**Traces to:** `design.md`, `spec.md` (unit ini)
**Reviewed against:** spec revision 2, design DESIGNED

## Fase 1 — Parser zona + tipe draft

- [x] T201 `domain/entities/QrZoneBadge.ts` parser badge zona cermin `qr-zone-parser.ts` (key wajib+alias, validasi CT/waktu/BREAK/TARGET/DATE/overnight) + test vektor dari test backend [FR-001]
  - Spec: FR-001
- [x] T202 `BatchQr.ts` draft zona nullable + `shiftDate`; TARGET badge shift → targetQty; `draftFromMachine` hanya lane simulasi [FR-003/004] (depends T201)
  - Spec: FR-003/004
- [x] T203 `application/qrZones.ts` nilai badge menang (LINE/DATE/TARGET tanpa substitusi lokal) + guard draft lengkap + test [FR-004] (depends T202)
  - Spec: FR-004

## Fase 2 — Routing dual-lane + draft nyata + panel konfirmasi

- [x] T204 `BatchQrScannerModal` routing kamera auto-deteksi (zona → draft+stepper; WO → resolve); draft awal backend kosong; stepper backend travers 4 zona [FR-002/003] (depends T203)
  - Spec: FR-002/003
- [x] T205 `QrScanInput` backend-mode textfield hanya WO; badge zona paste → error arah kamera; placeholder WO [FR-002] (depends T204)
  - Spec: FR-002
- [x] T206 `BackendReviewStep` panel konfirmasi konfigurasi 4 zona + tombol konfirmasi eksplisit → initiate; footer sadar-lane; guard MID dini; hapus klaim "aktif" pra-ACK [FR-002/003/005] (depends T204)
  - Spec: FR-002/003/005
- [x] T207 Test fase 2 (routing zona vs WO vs invalid, draft kosong fail-closed, konfirmasi batal = tanpa request, MID mismatch) + lint [AC-003/004/005/010] (depends T204..T206)
  - Spec: FR-002/003/004/005

## Fase 3 — Tunggu ACK bersama

- [x] T208 `application/hooks/useWorkOrderAckWait.ts` poll bounded detail WO (2s/20s, berhenti ACTIVE/ABORTED/timeout, cleanup unmount) + test fake timers [FR-005/006]
  - Spec: FR-005/006
- [x] T209 `useWorkOrders` pasang ACK wait pasca initiate & dispatch + expose state ACK; retry idempoten [FR-005/006] (depends T208)
  - Spec: FR-005/006
- [x] T210 UI status ACK di modal QR + Setup Produksi (menunggu/ACTIVE+START siap/ABORTED/timeout+retry) + test [AC-006] (depends T209)
  - Spec: FR-005/006

## Verifikasi & deploy

- [x] T211 `pnpm lint` + `pnpm test` hijau; diff komponen live monitor beku = nol [AC-008, NFR-004] (depends T210)
  - Spec: FR-007
- [x] T212 E2E stack hidup: jalur A scan kamera 4 badge (localhost) → konfirmasi → validate → initiate → ACK → ACTIVE → START → RUNNING; jalur B resolve → dispatch → ACK → START; timeout edge-sim offline + retry idempoten; OID mismatch; bukti verification.md [AC-001..010] (depends T211)
  - Spec: FR-001..008
- [x] T213 Sync `apps/hmi` + rebuild dist + recreate nginx (pola unit 002); TODO/gap-register/verification update; AC manual pemilik (badge fisik + kamera) [AC semua] (depends T212)
  - Spec: FR-001..008
