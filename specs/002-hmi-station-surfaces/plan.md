# Implementation Plan — Spec 002 Separasi Surface HMI/Station/Andon/Admin

**Lifecycle:** PLANNED
**Health:** VALID
**Traces to:** `spec.md` (unit ini, rev 2)
**Reviewed against:** spec revision 2

## 1. Approach

Bangun surface di atas lapisan data unit 001 (sudah selesai F1–F3): mode surface dari konteks deployment, kiosk lock, alur QR initiate-from-zones, fleet kartu Station, andon publik, historical keluar HMI, auto-lock kiosk. Reuse komponen eksisting; komponen baru hanya untuk surface yang belum ada (fleet cards). Layout live monitor beku.

## 2. Implementation Strategy

- Mode surface pure resolver (application) + wiring presentasi minimal (switcher disembunyikan di kiosk, bukan dirombak).
- QR: wire `validate-zone` + `initiate-from-zones` (kontrak §C.7/8, guard Bearer+LAN terverifikasi kode) ke stepper 4 zona eksisting; dispatch tetap via alur unit 001.
- Station: fleet kartu RUNNING dari live-state (public read) + login-first untuk mutasi; pilih kartu → live view eksisting.
- Historical: rute `/audit` keluar dari nav HMI (admin-panel v1 live = tanpa vacuum); kode AuditPage diarsipkan di repo (tidak dihapus sampai produk konfirmasi).
- Auto-lock: hook inactivity 5 menit (env paritas v1) mengunci mutasi, bukan data live.

## 3. Affected Areas

application (surfaceMode, qrZones, useInactivityLock, useWorkOrders initiate), infrastructure (endpoints/dto/work-order repo zones), domain (ports IWorkOrderRepository + BatchQr zones builder), presentation (DashboardPage switcher conditional, FleetCardsPanel baru, BatchQrScannerModal wiring initiate, App.tsx route audit, OverviewPage mode label).

## 4. Dependencies

- Unit 001 F1–F3 selesai (✓ 2026-11-20).
- ADR-0004 **Accepted** (gate; masih Proposed).
- Backend guard initiate = Bearer+LAN (terverifikasi kode `work-orders.ts:272-275,308-311`); sesi operator kiosk wajib sebelum scan (FR-003/004).

## 5. Sequence / Phases

1. Surface mode + kiosk lock + label andon (FR-001/002/008).
2. QR initiate-from-zones end-to-end (FR-004/005).
3. Station login-first + fleet kartu → live (FR-006/007).
4. Historical exit + auto-lock (FR-009/010).
5. Verifikasi E2E + dokumen.

## 6. Risks

- Kiosk lock salah binding → tablet menampilkan device lain (mitigasi: station resolver tervalidasi registry, unit 001).
- Initiate menolak master absen (MASTER_NOT_FOUND) → UX stepper harus menampilkan error per zona (kontrak sudah menyediakan).
- Menghapus nav audit sebelum admin-panel terkonfirmasi = vacuum (mitigasi: OQ-103 resolved v1 live; tetap archive bukan delete).

## 7. Assumptions

- v1 frontend tetap deployed sebagai admin-panel (terverifikasi live 2026-11-20).
- Tablet kiosk deploy dengan `VITE_STATION_ID` terisi; station/andon tanpa binding.

## 8. Architectural Questions

Sudah dijawab ADR-0004 (Proposed → perlu acceptance). Tidak ada pertanyaan baru.

## 9. Required Decisions

| Keputusan | Pembuat | Status |
|---|---|---|
| Acceptance ADR-0004 | pemilik repo | **terbuka (gate implementasi)** |
| OQ-101..105 | produk/engineering | resolved 2026-11-20 (spec §11) |

## 10. Verification Strategy

Unit: surfaceMode resolver, qrZones builder, inactivity lock; E2E: kiosk boot lock, scan 4 zona valid → WO PENDING → dispatch → RUNNING; mismatch OID → konfirmasi; station login → kartu RUNNING → live; andon tanpa auth; nav audit absen; auto-lock 5 menit (fake timers).
