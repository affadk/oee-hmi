# Spec 001 — Pembaruan Data Transfer HMI (Refresh Kontrak Backend Nov 2026)

> Kontrak perilaku unit ini. Menyatakan APA yang harus dilakukan HMI, bukan bagaimana dibangunnya.
> Nama endpoint/field wire disebut di FR karena kontrak backend adalah **hard requirement eksternal**
> (unit ini = penyelarasan kontrak); detail teknis solusi tetap di `design.md`.
> Bukti audit: `docs/specs/hmi-data-transfer-2026-11.md` (20 Nov 2026). Kontrak wire otoritatif:
> `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` (dirujuk per bagian, tidak disalin).

**Lifecycle:** SPECIFIED
**Health:** VALID
**Revision:** 2
**Authority:** Dokumen ini otoritas utama perilaku fungsional unit ini. `design.md` dan `tasks.md` turunan; tidak boleh mendefinisikan ulang requirement.

## 1. Purpose

Menyelaraskan lapisan data transfer HMI OEE (REST + WS + auth + DTO) dengan kontrak backend terbaru, sehingga monitoring live, aksi operator, dan agregat shift benar dan jujur — **tanpa mengubah tampilan/layout OEE live monitor**.

## 2. Scope

### In Scope
- Auth: login password, station context, gerbang rotasi password, refresh sliding, capability gating, access-mode read-only (FR-001..FR-008).
- Realtime: merge FSM, cakupan envelope lifecycle, resync snapshot, close-code WS, staleness (FR-009..FR-014).
- Perintah perangkat 6 jenis + `count` (FR-015).
- Lifecycle WO `PENDING_CLOSE` + guard complete (FR-016).
- DTO kanonis `*Pct`, null-preserving, `provisional`, semantik availability fallback, ack bersih (FR-017..FR-020).
- Perubahan presentasi terbatas: `AuthPinModal` → form password (gaya visual tetap).

### Out of Scope
- Perubahan layout/komponen visual live monitor, zona audit, panel, gauge (constraint keras).
- Endpoint admin infra: provisioning/revoke/credentials devices, `/mqtt/*`, `/access-control/*` mutasi, `/health/detail` (domain Admin Panel).
- Fitur baru: rollup multi-mesin, status-history, export tambahan, dropdown shift master (P3 audit — YAGNI sampai produk meminta).
- Perubahan backend (`iiot-oee`) — unit ini klien saja.

## 3. Actors

- **Operator** (OPERATOR): login kiosk, label downtime, konfirmasi WO, PAUSE/RESUME/PLANNED_DT/COUNT_ADJUST.
- **Supervisor/Admin**: RESET_COUNTER, cancel WO, export; capability lebih luas.
- **Maintenance**: label downtime; tanpa RESUME (kontrak §D).
- **Pengamat tunnel** (Cloudflare Access): read-only, tanpa mutasi.
- **Backend iiot-oee**: sumber kebenaran state, auth, policy.
- **Edge STM32**: sumber telemetri via MQTT → relay WS (tidak langsung diakses HMI).

## 4. User/System Scenarios

1. Operator shift pagi login di tablet kiosk terikat `STM32-OEE-01` → password + station otomatis → dashboard live; aksi sesuai hak.
2. Mesin breakdown: edge kirim FSM `UNPLANNED_DOWNTIME` → status di layar berubah < 1s tanpa reload; downtime terbuka muncul di daftar labelable; operator melabeli.
3. Batch selesai: telemetri `BATCH_FINISHED` → WO `PENDING_CLOSE` → operator konfirmasi `finalRejectCount` → WO `COMPLETED`, layar kembali tanpa WO aktif.
4. WS putus (jaringan flap) → reconnect backoff → resync `GET /live-state` → angka kembali konsisten; frame backlog tidak menggerakkan gauge.
5. Sesi idle 20 menit → refresh berkala memperpanjang token; role dicabut admin → `AUTHZ_STALE` → logout paksa + modal login.
6. HMI dibuka via tunnel → `mutations_allowed=false` → semua tombol aksi nonaktif + penanda read-only; pengamat tetap melihat live data.

## 5. Functional Requirements

**Auth**
- **FR-001** Login HMI memakai `POST /api/v1/auth/login {operator_id, password, station_id?}`; tidak ada jalur PIN. Respons `operator.must_change_password` disimpan. (§L)
- **FR-002** `station_id` diturunkan dari konteks kiosk: explicit → query → store → registry → env; hanya `deviceId` terdaftar; tanpa konteks valid → dikirim kosong. Tidak pernah `machineId`. (spec 044)
- **FR-003** `429` login → UI menampilkan countdown `Retry-After` dan menonaktifkan submit selama jendela; tanpa lockout paralel klien. (§L)
- **FR-004** `must_change_password=true` → dialog ganti password wajib (`POST /auth/password/change {current_password, new_password}`); sukses → login ulang otomatis. (spec 043)
- **FR-005** `403 PASSWORD_ROTATION_REQUIRED` dari rute terproteksi mana pun → gerbang FR-004 yang sama (bukan error generik). (spec 043)
- **FR-006** Refresh sliding: pre-action bila `exp` < 120s + berkala ≤ 5 menit selama sesi aktif; `401 AUTHZ_STALE`/subjek nonaktif → logout paksa + modal login; refresh hanya kanal LAN. (§6D, §L)
- **FR-007** `GET /auth/me` setelah login/refresh → capability `<domain>.<action>` meng-gate aksi terproteksi: `allow` aktif; `deny`/`unknown` nonaktif + alasan (fail-closed). Role tampil apa adanya (string bebas). (§L, §3.4)
- **FR-008** `GET /system/access-mode` → `mutations_allowed=false` → mode read-only: semua mutasi nonaktif + penanda pada elemen eksisting. (§I)

**Realtime**
- **FR-009** Frame `TELEMETRY_UPDATE` live (non-buffered) memperbarui counters, OEE, waktu, **dan status FSM mesin** (normalisasi kanonis) pada mesin yang cocok. (§4, §6A, §7D)
- **FR-010** `DEVICE_STATUS_UPDATE` memperbarui status koneksi (`connectionStatus`) mesin/device terkait secara live. (§4, §7E)
- **FR-011** Envelope lifecycle yang dikenal (`DOWNTIME_EVENT_OPENED/CLOSED`, `DOWNTIME_REASON_LABELED`, `WORK_ORDER_COMPLETED/CANCELLED`, `MACHINE_*`, `PRODUCT_*`, `PRODUCTION_LINE_*`, `SHIFT_*`, `SHIFT_SCHEDULE_*`, `DEVICE_EVENT`) memicu refetch REST state terkait dengan debounce ≤ 2s; `type` tak dikenal diabaikan aman. (§4)
- **FR-012** Setiap WS (re)connect sukses → satu `GET /live-state` rekonsiliasi fleet; poll jaring-pengaman 60s (konstanta tunggal). (§B, ADR-0001)
- **FR-013** Close WS: `4403` → berhenti reconnect + error konfigurasi eksplisit; `4429` → backoff ≥ 60s + jitter; lainnya → backoff 1s→30s eksisting. (§4)
- **FR-014** Umur data (`lastTelemetryAt`/`updatedAt`) tersedia untuk indikator staleness eksisting; tanpa data → kosong/`—`, bukan fabrikasi. (§7B)

**Perintah & WO**
- **FR-015** Perintah mendukung 6 enum (`PAUSE|RESUME|RESET_COUNTER|PLANNED_DT_START|PLANNED_DT_END|COUNT_ADJUST`); `COUNT_ADJUST` wajib `count` 0..999999; `reason` ≥ 5 karakter; gating RBAC per FR-007 (RESET_COUNTER supervisor+). (§D)
- **FR-016** Status WO mencakup `PENDING_CLOSE`; alur complete menerima `ACTIVE|PENDING_CLOSE`; guard klien `finalRejectCount ≤ totalCount`; `409 UNCLASSIFIED_DOWNTIME_CONFLICT` → arahkan pelabelan downtime dulu. (§C, ADR-0021)

**Kontrak data**
- **FR-017** DTO hourly/aggregate membaca skema kanonis (`*Pct`, `totalCount/goodCount/rejectCount`, `operatingSec/runSec`, `sampleCount`, `provisional`); alias legacy hanya fallback transisi; kanonis menang bila keduanya ada. (§7J)
- **FR-018** Field nullable kontrak dipertahankan `null` sampai domain (tidak coerce 0); presentation eksisting menampilkan `—`/menyembunyikan. (§K, 016/ADR-019)
- **FR-019** Fallback komposisi OEE klien memakai semantik backend: `availability = run/(run+unplanned)`; performance basis `operatingSec`; agregat server tetap menang bila ada. (§K, §7B D1)
- **FR-020** Ack operational-event mengirim `{note?}` saja (aktor dari subjek JWT); idempoten. (§I)

## 6. Business Rules

- **BR-001** Aktuasi mesin hanya LAN pabrik; tunnel read-only mutlak (backend menegakkan; klien tidak boleh mencoba mutasi via tunnel). (§1, §D)
- **BR-002** Tanpa fabrikasi data: kosong/null/`—` lebih benar daripada angka tebakan (prinsip repo, audit G1/G3).
- **BR-003** Layout OEE live monitor beku (directive produk 2026-11-20).
- **BR-004** Satu WO per mesin per shift instance; shift tengah malam satu instance (ADR-0021 backend).
- **BR-005** Throttle auth otoritatif di backend; klien tidak membuat lockout paralel. (§L)

## 7. Non-Functional Requirements

- **NFR-001** Tanpa fetch-loop mandiri (riwayat regresi G11): identitas deps hook stabil; resync hanya pemicu FR-012.
- **NFR-002** Frame `is_buffered=true` tidak pernah menggerakkan gauge 60fps (defense-in-depth gateway + hook). (§4)
- **NFR-003** Boot tetap memakai `GET /live-state` (sub-2ms) — bukan fan-out per device. (§B)
- **NFR-004** Token tidak pernah dilog; password tidak persist; kredensial tidak masuk error reporter.
- **NFR-005** Lint arsitektur eksisting (`pnpm lint:arch`) tetap lulus: domain zero-IO, application inward-only, presentation tanpa IO langsung.

## 8. Constraints

Lihat `.sdd/context/constraints.md` (berlaku repo-wide). Khusus unit: perubahan presentasi hanya `AuthPinModal` (FR-001); dual-lane `VITE_USE_BACKEND` dipertahankan; semua perubahan kontrak di infrastructure + application.

## 9. Acceptance Criteria

- **AC-001** (FR-001) Given backend hidup, When operator login password valid, Then sesi tercipta dari `/auth/login` (bukan 404 PIN) dan dashboard termuat.
- **AC-002** (FR-002) Given kiosk terikat device terdaftar, When login, Then body memuat `station_id=deviceId` itu; given tanpa konteks, Then `station_id` kosong dan login tetap sukses; tidak pernah `machineId`.
- **AC-003** (FR-003) Given 5 login gagal dalam 60s, When percobaan ke-6, Then UI menampilkan countdown `Retry-After` dan submit nonaktif sampai jendela lewat.
- **AC-004** (FR-004/005) Given `must_change_password=true` (atau 403 `PASSWORD_ROTATION_REQUIRED`), When aksi terproteksi dicoba, Then dialog ganti password muncul; after sukses, Then login ulang otomatis dan aksi dilanjutkan.
- **AC-005** (FR-006) Given sesi idle > TTL tanpa aksi, When timer refresh jalan, Then token diperpanjang tanpa interaksi; given `AUTHZ_STALE`, Then logout + modal login (bukan retry buta).
- **AC-006** (FR-007) Given capability `device_command.reset` = deny untuk OPERATOR, When dashboard tampil, Then tombol RESET nonaktif + alasan; given allow (SUPERVISOR), Then aktif.
- **AC-007** (FR-008) Given `mutations_allowed=false`, When HMI dibuka, Then semua tombol mutasi nonaktif + penanda read-only; data live tetap mengalir.
- **AC-008** (FR-009) Given mesin RUNNING, When edge transisi ke `UNPLANNED_DOWNTIME`, Then status layar berubah < 1s tanpa reload.
- **AC-009** (FR-010) Given device online, When LWT offline → `DEVICE_STATUS_UPDATE`, Then badge koneksi jadi OFFLINE tanpa reload.
- **AC-010** (FR-011) Given downtime terbuka via WS, When event diterima, Then daftar labelable + count aktif ter-refresh ≤ 2s; given `WORK_ORDER_COMPLETED`, Then state WO ter-refresh; type tak dikenal tidak memicu error.
- **AC-011** (FR-012) Given WS putus 10s dengan telemetri terlewat, When reconnect, Then satu `GET /live-state` dikirim dan angka konsisten dengan backend.
- **AC-012** (FR-013) Given close 4403, Then tidak ada reconnect + error konfigurasi tampil; given 4429, Then reconnect berikutnya ≥ 60s.
- **AC-013** (FR-014) Given telemetri berhenti > TTL, Then indikator staleness eksisting menandai data basi (bukan angka palsu).
- **AC-014** (FR-015) Given COUNT_ADJUST, When dikirim, Then body memuat `count` valid + reason ≥ 5; given reason < 5, Then ditolak klien sebelum fetch.
- **AC-015** (FR-016) Given WO `PENDING_CLOSE`, When operator konfirmasi dengan `finalRejectCount ≤ totalCount`, Then complete 200 dan WO hilang dari daftar aktif; given reject > total, Then guard klien menolak; given 409 unclassified, Then UI mengarahkan pelabelan.
- **AC-016** (FR-017) Given respons hourly kanonis `*Pct`, Then grafik terisi benar; given respons legacy `avg*`, Then tetap terisi (fallback); given keduanya, Then kanonis menang.
- **AC-017** (FR-018) Given bucket `availabilityPct: null`, Then domain menerima null dan UI tampil `—` (bukan 0).
- **AC-018** (FR-019) Given shift-summary server absen (404), Then fallback klien menghasilkan availability `run/(run+unplanned)` identik dengan contoh terdokumentasi backend.
- **AC-019** (FR-020) When ack dikirim, Then body hanya `{note?}`; ack kedua idempoten tanpa error.
- **AC-020** (BR-003/NFR-005) After seluruh perubahan, Then `pnpm lint` + `pnpm test` lulus dan tidak ada diff pada komponen layout live monitor (kecuali `AuthPinModal`).

## 10. Dependencies

- Kontrak: `API_DOCUMENTATION.md` backend (versi Nov 2026, spec 043/044/045 terbaru).
- Keputusan: ADR-0001, ADR-0002, ADR-0003 (repo ini, **Proposed — perlu acceptance**).
- Stack hidup `iiot-oee` (docker) untuk verifikasi E2E.
- Unit ini tidak bergantung unit lain (pertama di repo).

## 11. Open Questions — RESOLVED (2026-11-20)

Dijawab oleh pemilik repo (delegasi eksplisit "bantu jawab disini", 2026-11-20). Jawaban mengikat; perubahan jawaban = revisi spec + review downstream.

| OQ | Jawaban | Alasan | Otoritas |
|---|---|---|---|
| OQ-001 station context | **env `VITE_STATION_ID` per deployment tablet** + override store (localStorage adapter) + query `?station=` untuk commissioning; nilai divalidasi ke `GET /devices`; tak ada/invalid → kirim kosong (throttle `<ip>:default`). Tidak pernah `machineId`. | Kiosk = instalasi tetap; env per deploy termurah, store = override lapangan tanpa rebuild, query = setup awal. Rantai spec 044 (explicit→query→store→registry→env) dipertahankan dengan env sebagai sumber deployment. | produk, delegasi 2026-11-20 |
| OQ-002 poll 60s | **Ya, 60s** acceptable; konstanta tunggal di application layer; resync reconnect tetap pemicu utama. | 1 req/menit/klien ≪ nginx 100r/s; jaring pengaman WS mati total, bukan pengganti WS. | engineering, design review 2026-11-20 |
| OQ-003 deployment tunnel | **Ya**, HMI disajikan via tunnel untuk observasi remote → FR-008 tetap in-scope (fase 3). | Backend sudah membangun perimeter dual-vhost (:8080 read-only) dan `GET /system/access-mode` memang untuk keputusan UI read-only; mengabaikannya = mutasi 403 buta di remote. | produk, delegasi 2026-11-20 |
| OQ-004 capability unknown | **Fail-closed**: `unknown` → aksi nonaktif + alasan tampil + fallback login ulang. | Aktuasi mesin = safety-relevant; katalog capability backend lengkap (§3.4) sehingga `unknown` hanya kondisi transisi/cache basi. | engineering, design review 2026-11-20 |

**Tidak ada OQ material tersisa.** Gate implementasi berikutnya: acceptance ADR-0001/0002/0003 (pemilik repo).

### Revision history

- **Rev 2 (2026-11-20):** OQ-001..004 resolved (tabel di atas); FR tidak berubah (jawaban sesuai usulan spec). Downstream wajib review terhadap rev 2.
- **Rev 1 (2026-11-20):** spec awal dari audit `docs/specs/hmi-data-transfer-2026-11.md`.
