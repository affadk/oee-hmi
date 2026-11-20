# Gap Register — HMI OEE vs Backend (Nov 2026)

> Tanggal: 20 Nov 2026 · Status: **AKTIF** (register kerja terkini).
> Otoritas requirement: `specs/001-hmi-data-transfer-refresh/spec.md` (rev 2). Dokumen ini = **peta gap + status**, bukan requirement; tiap gap merujuk FR/ADR/task, tidak mendefinisikan ulang perilaku.
> Bukti audit: `docs/specs/hmi-data-transfer-2026-11.md`. Register lama `docs/specs/backend-gaps.md` (G1–G22, Sep 2026) = historis; item yang sudah ditutup backend diringkas di §C.
> Jawaban Open Questions (OQ-001..004) otoritatif di spec §11 rev 2 — diringkas di §D untuk navigasi.

## A. Gap frontend (perombakan data transfer — repo ini)

Semua OPEN sampai task terkait selesai + AC terverifikasi (`verification.md`). Kolom fase = plan.md §5.

| ID | Gap | Bukti (file:baris) | Prioritas | Trace | Task | Fase | Status |
|---|---|---|---|---|---|---|---|
| GAP-F01 | Login PIN → endpoint dihapus backend (404); wajib `/auth/login` password | `endpoints.ts:39`, `oeeApiClient.ts:326`, `AuthPinModal.tsx:67` | P0 | FR-001/003 · ADR-0002 · AC-001/003 | T002–T006 | 1 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F02 | Gerbang `must_change_password` / 403 `PASSWORD_ROTATION_REQUIRED` tak ditangani (error buta) | `useAuthSession.ts:43-48` (hanya 401) | P0 | FR-004/005 · ADR-0002 · AC-004 | T005 | 1 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F03 | `PENDING_CLOSE` absen dari union WO; alur konfirmasi batch-finished mati | `WorkOrder.ts:4` | P0 | FR-016 · ADR-0003 · AC-015 | T007 | 1 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F04 | `station_id` fallback ke `machineId` → 400 `STATION_NOT_FOUND` | `useOeeDashboard.ts:230` | P0 | FR-002 · ADR-0002 · AC-002 | T004 | 1 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F05 | `fsm_state` frame WS dibuang → status mesin tak berubah live | `useTelemetrySubscription.ts:34-69` | P1 | FR-009 · ADR-0001 · AC-008 | T011 | 2 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F06 | Hanya 5/26 envelope WS dipetakan; online/downtime/WO/master basi sampai reload | `telemetry.dto.ts:321-345` | P1 | FR-010/011 · ADR-0001 · AC-009/010 | T010, T012 | 2 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F07 | Tanpa resync `GET /live-state` pasca reconnect WS | `telemetryWsClient.ts:77-79` | P1 | FR-012 · ADR-0001 · AC-011 | T013 | 2 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F08 | Close code 4403/4429 diabaikan → reconnect buta | `telemetryWsClient.ts:80-84` | P1 | FR-013 · ADR-0001 · AC-012 | T009 | 2 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F09 | Perintah 3/6 enum; `COUNT_ADJUST` tanpa `count`; PLANNED_DT absen | `Device.ts:44`, `oeeApiClient.ts:119-122` | P1 | FR-015 · AC-014 | T014 | 2 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F10 | DTO hourly/aggregate belum baca kanonis `*Pct` → risiko bucket 0 | `telemetry.dto.ts:203-227` | P2 | FR-017 · ADR-0003 · AC-016 | T016 | 3 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F11 | `toFiniteNumber(null)` → 0; null kontrak (tanpa sampel) jadi fabrikasi nol | `LiveState.ts:33`, pemakai DTO | P2 | FR-018 · ADR-0003 · AC-017 | T016, T017 | 3 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F12 | Fallback OEE klien pakai semantik availability lama (planned mengurangi A) | `OeeCalculator.ts` / `CalculateOeeUseCase.ts` | P2 | FR-019 · ADR-0003 · AC-018 | T018 | 3 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F13 | Capability `/auth/me` + `access-mode` tak dipakai → tombol tak di-gate RBAC; tunnel tak read-only | `useAuthSession.ts` (runProtected hanya cek token) | P2 | FR-007/008 · ADR-0002 · AC-006/007 | T019 | 3 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F14 | `refreshSession` catch-all → `AUTHZ_STALE`/subjek nonaktif jadi loop modal | `oeeApiClient.ts:357-375` | P2 | FR-006 · ADR-0002 · AC-005 | T003, T005 | 1 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F15 | Ack kirim `operator_id` deprecated (diabaikan backend; aktor dari JWT) | `oeeApiClient.ts:270-274` | P2 | FR-020 · AC-019 | T020 | 3 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F16 | `OperatorRole` enum statis; role backend = string bebas (ABAC-first) | `Device.ts:33` | P2 | FR-007 · ADR-0002 | T019 | 3 | CLOSED 2026-11-20 (F1-F3 + test) |
| GAP-F17 | QR backend lane v2 = cocokkan zona ke WO pending → resolve → dispatch; `initiate-from-zones` (buat WO dari 4 QR) belum di-wire | `BatchQrScannerModal/steps/BackendReviewStep.tsx`, audit B4; v1 `MultiZoneWizardModal` sebagai pola | P1 (unit 002) | 002/FR-004 · ADR-0004 · AC-002/003 | unit 002 tasks (belum dibuat) | 002 | OPEN |
| GAP-F18 | Tanpa lock kiosk single-device; switcher fleet terbuka di semua mode | `App.tsx:36-41`, `DashboardPage` switcher | P1 (unit 002) | 002/FR-001/002 · ADR-0004 · AC-001 | unit 002 tasks | 002 | OPEN |
| GAP-F19 | Tanpa gate login surface Station; fleet bukan kartu device RUNNING | `useMachinesQuery` (fleet tanpa sesi), `OverviewPage` | P1 (unit 002) | 002/FR-006/007 · ADR-0004 · AC-005/006 | unit 002 tasks | 002 | OPEN |
| GAP-F20 | Historical/audit/export hidup di HMI (`/audit`, export, LogEventModal histori) — harus ke admin-panel | `App.tsx:39`, `AuditPage`, `ExportTelemetryUseCase` pemakai UI | P2 (unit 002) | 002/FR-009 · ADR-0004 · AC-008 | unit 002 tasks | 002 | OPEN |

## B. Gap backend / dokumentasi (tim `iiot-oee` atau verifikasi bersama)

Klien tidak mengubah backend; gap ini dicatat + diprobe, bukan di-workaround diam-diam.

| ID | Gap | Bukti | Aksi | Pemilik | Trace | Status |
|---|---|---|---|---|---|---|
| GAP-B01 | Payload hidup hourly/aggregate: kanonis `*Pct` vs legacy `avg*` belum terverifikasi pasca-spec 019; alias DTO butuh kriteria sunset | docs §7J kanonis vs audit G17 (payload `avg*` 30 Sep) | Probe T001/T022; bila kanonis penuh → hapus alias (design §Migration); bila masih `avg*` → backend konfirmasi timeline kanonis | backend + FE probe | FR-017 · ADR-0003 | CLOSED 2026-11-20: live kanonis penuh; alias di-sunset |
| GAP-B02 | Bentuk respons `GET /auth/me` tidak konsisten antar bagian docs: §L `{operator, authz}` vs §3.4 nested `{access, operator, authz}` | API_DOCUMENTATION §L vs tabel §3.4 | Klien defensif dua bentuk (T003); backend samakan docs + nyatakan bentuk kanonis | backend (docs) | FR-007/008 · ADR-0002 | CLOSED (client; docs amendment pending) |
| GAP-B03 | §4 docs masih menampilkan contoh frame telemetri **flat**, padahal relay mengirim envelope (§7A, G21) | API_DOCUMENTATION §4 vs §7A | Docs: tandai flat sebagai legacy/contoh lama; envelope kanonis di §4 | backend (docs, non-breaking) | FR-009/011 · ADR-0001 | OPEN (docs) |
| GAP-B04 | Guard auth/LAN `validate-zone` + `initiate-from-zones` tidak terdokumentasi (absen dari tabel §7H) | kode `work-orders.ts:272-275,308-311` = `[enforceSubnetOrigin, authorize("dispatch","work_order")]`; probe LAN noauth 401 | **CLOSED untuk klien** (kontrak diketahui dari kode+probe 2026-11-20). Sisa docs: backend lengkapi tabel §7H | backend (docs) | 002/FR-004 · ADR-0004 | CLOSED (client) |
| GAP-B05 | Atribusi operator: OID zona QR vs subjek JWT sesi tidak diatur kontrak | kode `multi-zone-work-order.ts:326,404,466-467`: resolve strict dari zona + audit subjek sesi terpisah, tanpa cross-check | **CLOSED**: backend izinkan mismatch dengan atribusi ganda; aturan UX = peringatan+konfirmasi (OQ-102 resolved, spec 002 rev 2) | produk (resolved) | 002/FR-005 · ADR-0004 | CLOSED |
| GAP-B06 | **Deployment publik berperilaku dev**: `oee.fadik.web.id` me-mount override dev (`tunnel.d-dev/full-api.conf` + `remote-docs-dev/dev.conf`, hanya ada di `podman-compose.dev.yml:162-164`) → `/docs` 200 publik + vhost full-api tanpa restriksi read-only nginx; docs §1/§D basi (klaim nginx 403, enforcement aktual di backend `X-Ingress-Source`) | probe tunnel: `/docs/` 200, POST login/validate-zone 401 (reachable), POST command 403 (backend block); root tunnel 404 (tanpa SPA) | **ESKALASI PEMILIK backend/deploy**: jalankan compose produksi untuk tunnel publik atau batasi dev override di belakang Cloudflare Access; aktuasi remote tetap terblok backend (terverifikasi) | pemilik backend/deploy | keamanan deployment · ADR-0004 konteks | **OPEN (security posture)** |

| GAP-B07 | Anomali data sim: hourly `performancePct` 6626.98 + `operatingSec` ~131 hari (akumulasi seed) | probe live 2026-11-20 | Backend/sim perbaiki akumulasi operatingSec seed; klien tampil apa adanya | backend/sim | kualitas data · FR-018 | OPEN |

## C. Sudah ditutup (jangan diinvestigasi ulang)

- **Backend menutup G1–G22 sebagian besar** per API docs Nov 2026: reject pareto (§R), edge health (§E), ack (§I), feed global (§I), refresh (§L), `targetPerHour/state/planned` (§6E), `active_only/unlabeled_only` (§7G), heartbeat (§4), tabel 204-vs-body (§6B), FSM+STANDBY (§6A/§7D), live-state array (§6C), key waktu (§7B), `isOnline` TTL 300s (§7E), auth `/operators` (§7H), envelope WS (§7A), `active_wo_id` 409 (§7F), good eksplisit (§7J).
- **G13 berubah bentuk**: PIN dihapus total → bukan "refresh sudah cocok" lagi; lihat GAP-F01/F14.
- **Keputusan produk D1/D2/D3** (25 Sep 2026) tetap mengikat: reject UNCLASSIFIED final; grafik hanya produksi+istirahat; badge Edge minimal Overview.
- **G22 downtime/reject kosong** = konsistensi data edge/backend, bukan gap kontrak.

## D. Jawaban Open Questions (ringkasan navigasi; otoritas: spec §11 rev 2)

| OQ | Jawaban (2026-11-20, pemilik repo) |
|---|---|
| OQ-001 | env `VITE_STATION_ID` per deployment + store override + query commissioning; validasi `GET /devices`; kosong bila invalid; bukan `machineId` |
| OQ-002 | poll jaring-pengaman 60s, konstanta tunggal |
| OQ-003 | tunnel dipakai (observasi remote) → FR-008 in-scope fase 3 |
| OQ-004 | capability `unknown` → fail-closed nonaktif + alasan |

## Cara pakai

1. Ambil gap dari §A sesuai fase plan.md; kerjakan task tertaut; jangan menambah perilaku di luar FR.
2. Setelah task selesai + AC pass dengan bukti → update status gap di sini (OPEN→CLOSED + tanggal + bukti verification.md).
3. Gap §B: probe saat T001/T022; hasil dicatat di verification.md; eskalasi backend bila payload menyimpang dari docs.
4. Register ini bukan backlog produk: fitur baru (P3 audit) tetap out-of-scope sampai masuk spec.
