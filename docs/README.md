# Status Dokumen `docs/` — OEE Dashboard

> Diperbarui: 20 Nov 2026. Acuan verifikasi: kode `src/` pasca-refactor strict + 31 test hijau.
> Legenda: ✅ SELESAI (closed, historis) · 🟡 BUTUH TINDAKAN (ada aksi terbuka) · 📌 SPEC AKTIF (acuan berjalan)
>
> Struktur: `audits/` (audit + log eksekusi) · `specs/` (kontrak & kebutuhan backend) · `plans/` (arsip rencana selesai).
>
> **Lapisan SDD governed (20 Nov 2026):** unit kerja kini di `specs/NNN-slug/` (root) + `decisions/NNNN-slug.md` + `.sdd/`. Entry point: `AGENTS.md`, ledger: `TODO.md`, aturan: `.sdd/governance.md`. Dokumen `docs/` ini = audit/historis, bukan artefak governed. Requirement otoritatif unit berjalan: `specs/001-hmi-data-transfer-refresh/spec.md` (bukan `docs/specs/hmi-data-transfer-2026-11.md` — itu bukti audit).

| File | Jenis | Status | Keterangan & aksi tersisa |
|---|---|---|---|
| `audits/layered-architecture.md` | Audit + log eksekusi | ✅ SELESAI | Seluruh temuan P0/P1/P2 dieksekusi (§7–§12). Deferral tercatat jujur: ubah signature repository alarm, E2E lawan backend live. Tidak ada aksi kode tersisa dari dokumen ini. |
| `audits/simulation-backend-lane.md` | Audit dual-lane | ✅ SELESAI (sisi frontend) | F1–F5 + migrasi total dieksekusi. Tersisa §5 item 6: verifikasi E2E (badge biru → matikan gateway → banner → PIN → command → label → WS) — butuh docker stack, tidak bisa dari repo ini. |
| `plans/2026-09-frontend-backend-integration.md` | Rencana integrasi | ✅ SELESAI | Semua Key Changes + Test Plan terpenuhi (mapper DTO, deviceId, skala WS, auth PIN, LogEventModal backend, 31 test). Arsip historis — jangan diedit. |
| `specs/backend-gaps.md` | Tuntutan ke backend | 🗄 HISTORIS (superseded) | G1–G22 (Sep 2026). Sebagian besar sudah ditutup backend per API docs Nov 2026. Register kerja terkini: `specs/gap-register-2026-11.md`. |
| `specs/gap-register-2026-11.md` | Peta gap + status (FE & backend) | 📌 AKTIF | 20 gap frontend (GAP-F01..F20; F17–F20 = unit 002 surfaces) + 6 gap backend/docs (B04/B05 CLOSED via kode+probe; **B06 OPEN: posture dev di tunnel publik — eskalasi pemilik**). Requirement otoritatif: `specs/001-*/spec.md` rev 2 + `specs/002-*/spec.md` rev 2 (root). |
| `specs/hmi-data-transfer-2026-11.md` | Analisa kebutuhan HMI + rencana data transfer | 🗄 BUKTI AUDIT (superseded sebagai acuan kerja) | Audit 20 Nov 2026 lawan `API_DOCUMENTATION.md` terbaru: P0 auth PIN→password (404), `PENDING_CLOSE`, gerbang ganti password; P1 cakupan WS + resync + 6 perintah; P2 DTO kanonis `*Pct` + capability `/auth/me`. Requirement otoritatif kini: `specs/001-hmi-data-transfer-refresh/spec.md` (root). Layout OEE live monitor dibekukan. |
| `specs/shift-overview-api.md` | Spec `PROPOSED v1.0` | 📌 SPEC AKTIF, sebagian basi | Fase 0 (reuse) jalan di frontend. Fase 1 (`shift-summary`, `shift-timeline`) belum ada di backend maupun frontend (`GetShiftSummaryUseCase`/`IShiftOeeRepository` belum dibuat). Referensi basi pasca-hapus panel mati: `MachineTimelineStrip`, `RecentEventsPanel` (§0 tabel, §2.2, §3.2, §7) — baca sebagai "panel audit generik". `FloorPushButtonsPanel`, `EChartsOeeTrend`, `PasXProgressStrip` masih ada. |

## Urutan baca yang disarankan

0. Kerja baru (SDD): `AGENTS.md` → `TODO.md` → `.sdd/context/constraints.md` → `specs/001-hmi-data-transfer-refresh/` (root) → ADR terkait di `decisions/`.
1. `specs/shift-overview-api.md` — kontrak yang dituju (reuse §2 kini, aditif §3 nanti).
2. `specs/gap-register-2026-11.md` — gap terkini FE/backend + status (register lama: `specs/backend-gaps.md`, historis).
3. `audits/simulation-backend-lane.md` — konteks dual-lane + checklist E2E manual.
4. `audits/layered-architecture.md` — riwayat refactor frontend (§7–§12).
5. `plans/` — arsip rencana yang sudah selesai (referensi saja).
