# Spec 002 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel

> Kontrak perilaku pemisahan surface monitoring OEE. Nama endpoint disebut karena kontrak backend = hard requirement eksternal.
> Bukti & tinjauan workflow: `research.md` unit ini. Keputusan arsitektur: ADR-0004 (Proposed).
> Prasyarat: unit 001 (data transfer) Fase 1 selesai — auth password/WS/DTO dipakai semua surface.

**Lifecycle:** SPECIFIED
**Health:** VALID
**Revision:** 2
**Authority:** Otoritas perilaku unit ini. `design.md`/`tasks.md` dibuat setelah OQ material terjawab + ADR-0004 Accepted.

## 1. Purpose

Menetapkan empat surface dengan peran tegas sesuai definisi HMI standar (HMI lokal satu mesin; operator interface multi-mesin via host): **HMI kiosk** (live OEE per device + start produksi via 4 QR), **Station** (login kredensial admin-set, fleet device berjalan, kartu → live OEE), **Andon** (agregat publik read-only), **Admin-panel** (historical/master/IAM — di luar HMI).

## 2. Scope

### In Scope
- Mode surface dari konteks deployment (kiosk terikat device vs station vs andon), bukan toggle bebas di kiosk.
- Kiosk: lock single-device, sesi operator, alur start produksi 4 QR → validate-zone → initiate-from-zones → dispatch.
- Station: login gate, fleet kartu device berjalan, pemilihan kartu membuka live OEE (layout live monitor v2 dipakai ulang, beku).
- Andon: mode publik read-only (tunnel-safe).
- Pemindahan historical/audit/export keluar surface HMI (bertahap, OQ-103).

### Out of Scope
- Perubahan layout live monitor (constraint beku berlaku untuk kiosk & detail Station).
- Pembangunan admin-panel itu sendiri (OQ-105 menentukan rumahnya; unit ini hanya mengeluarkan historical dari HMI).
- Perubahan kontrak backend; gap guard initiate-from-zones = probe + eskalasi (GAP-B04).
- Fitur unit 001 (auth/WS/DTO) — dikonsumsi, tidak didefinisikan ulang di sini.

## 3. Actors

- **Operator** (kiosk): login password sesi shift; scan 4 QR per batch; label downtime; konfirmasi complete.
- **Supervisor/Admin** (Station): login kredensial admin-set; fleet; aksi sesuai capability.
- **Pengamat publik/remote** (Andon/tunnel): read-only tanpa auth.
- **Admin-panel** (surface terpisah): historical, master, IAM, export.

## 4. User/System Scenarios

1. Kiosk terikat `STM32-OEE-01`: boot → live OEE device itu saja; operator login (password + station_id) → scan 4 QR → preflight per zona → initiate WO → dispatch → logging berjalan; gauge live via WS.
2. QR produk CT tidak cocok master → `CT_MISMATCH` tampil di stepper, WO tidak dibuat; operator perbaiki QR/master.
3. Station: supervisor login → kartu device RUNNING (live-state) → pilih kartu → live OEE device itu (layout sama dengan kiosk) + aksi sesuai capability.
4. Andon TV: agregat plant tanpa login; tunnel remote read-only.
5. Historical dicari operator di kiosk → tidak tersedia; diarahkan ke admin-panel (pesan, bukan fitur).

## 5. Functional Requirements

- **FR-001** Mode surface ditentukan konteks deployment: station context terikat (`VITE_STATION_ID`/query/store tervalidasi) → **kiosk**; tanpa binding + sesi station → **station**; mode publik → **andon**. Kiosk tidak menyediakan toggle pindah device/surface.
- **FR-002** Kiosk menampilkan live OEE hanya device terikat; switcher fleet disembunyikan/dinonaktifkan; layout live monitor tidak berubah.
- **FR-003** Kiosk memakai sesi operator unit 001 (login password + station_id, sliding refresh, rotation gate); QR bukan pengganti autentikasi.
- **FR-004** Start produksi kiosk: scan 4 zona (product/machine/operator/shift) → `POST /work-orders/validate-zone` per zona (preflight) → `POST /work-orders/initiate-from-zones` → `POST /:wo_id/dispatch` (Bearer). Error kontrak ditampilkan per zona/langkah: `MASTER_ID_REQUIRED`, `MASTER_NOT_FOUND`, `CT_MISMATCH`, `SHIFT_WINDOW_MISMATCH`, `INVALID_SHIFT_INSTANCE`, 409 `active_wo_id`, 503 `DEVICE_OFFLINE`.
- **FR-005** Bila zona operator QR ≠ operator sesi → tampilkan peringatan mismatch + konfirmasi eksplisit sebelum initiate (backend mengizinkan dengan atribusi ganda: WO.operator_id dari zona, audit aktor dari JWT; lihat research §6). Tidak ada tolak-keras klien.
- **FR-006** Station: login kredensial admin-set (`/auth/login`) membuka fleet kartu device ber-state RUNNING (filter live-state sisi klien); pilih kartu → live OEE device terpilih memakai layout live monitor eksisting.
- **FR-007** Aksi mutasi di Station/kiosk di-gate capability unit 001 FR-007; tanpa sesi → gate login (bukan error buta).
- **FR-008** Andon: agregat read-only tanpa auth (public read backend), tunnel-safe; tanpa tombol mutasi.
- **FR-009** Historical/audit/export/master/IAM tidak tersedia di surface HMI/Station/Andon; pesan pengarahan ke admin-panel; rute `/audit` v2 dikeluarkan bertahap sesuai OQ-103.
- **FR-010** Kiosk auto-lock aksi mutasi setelah inaktivitas: default **5 menit** paritas v1 (`VITE_INACTIVITY_TIMEOUT_MS`, env-configurable); pause saat tab hidden; buka kunci = login ulang; data live tetap tampil saat terkunci.

## 6. Business Rules

- BR-001 (unit 001) LAN-only aktuasi; tunnel read-only.
- BR-002 tanpa fabrikasi data; fleet kartu hanya dari live-state nyata.
- BR-003 layout live monitor beku.
- BR-004 satu WO aktif per mesin per shift instance; initiate menolak bila sudah ada (`active_wo_id`).
- BR-005 master tidak di-auto-upsert dari QR; QR hanya merujuk master existing.

## 7. Non-Functional Requirements

- NFR-001 reuse komponen eksisting (stepper 4 zona, live monitor, modal auth unit 001); tanpa dependensi baru.
- NFR-002 preflight validate-zone tidak memblokir UI > 2s per zona (timeout + pesan retry).
- NFR-003 mode surface tidak menambah fetch-loop (pola unit 001 NFR-001).

## 8. Constraints

`.sdd/context/constraints.md` + freeze layout. Binding kiosk memakai station context unit 001 (OQ-001 resolved). Admin-panel rumah decided OQ-105.

## 9. Acceptance Criteria

- **AC-001** (FR-001/002) Given `VITE_STATION_ID` valid, When boot, Then hanya device itu tampil live; switcher tidak ada; given tanpa binding, Then mode station/andon sesuai sesi.
- **AC-002** (FR-003/004) Given sesi operator aktif, When 4 zona valid dipindai, Then validate-zone 4×200 → initiate 200 (WO PENDING) → dispatch 200 → telemetri logging mulai (WS RUNNING).
- **AC-003** (FR-004) Given CT QR beda 0.02s dari master, When initiate, Then `CT_MISMATCH` tampil di langkah produk; tidak ada WO dibuat.
- **AC-004** (FR-005) Given OID QR ≠ operator sesi, When review, Then peringatan mismatch + konfirmasi eksplisit muncul; initiate hanya jalan setelah konfirmasi; audit backend memuat kedua atribusi.
- **AC-005** (FR-006) Given login station sukses, When fleet dimuat, Then kartu hanya device RUNNING; pilih kartu → live OEE device itu dengan layout unchanged.
- **AC-006** (FR-007) Given tanpa sesi, When aksi mutasi dicoba, Then gate login muncul (bukan 401 buta).
- **AC-007** (FR-008) Given tanpa auth via tunnel, When andon dibuka, Then agregat tampil; mutasi tidak ada.
- **AC-008** (FR-009) Given kiosk/station, When historical dicari, Then tidak ada rute/fitur audit; pesan arah admin-panel.
- **AC-009** (FR-010) Given kiosk idle > threshold, When aksi dicoba, Then terkunci → login ulang membuka; live tetap tampil.
- **AC-010** (BR-003) After perubahan, Then diff komponen live monitor = nol (kecuali wiring mode/lock tanpa ubah layout).

## 10. Dependencies

- Unit 001 Fase 1 (auth) + Fase 2 (WS live) selesai.
- ADR-0004 Accepted.
- Probe GAP-B04/B05 (guard initiate + atribusi operator).
- Keputusan OQ-105 (rumah admin-panel) untuk FR-009 sequencing.

## 11. Open Questions — RESOLVED (2026-11-20, tinjauan backend hidup + kode)

Ditentukan dari bukti backend saat ini (probe `oee.fadik.web.id` + local 8080/8081 + kode `apps/backend`); detail bukti: `research.md` §6. Otoritas jawaban: pemilik repo via delegasi "tinjau OQ berdasarkan backend saat ini".

| OQ | Jawaban | Bukti backend |
|---|---|---|
| OQ-101 auth kiosk + auto-lock | **Login per operator per shift** (bukan akun bersama); auto-lock **5 menit** default env `VITE_INACTIVITY_TIMEOUT_MS` (paritas v1), pause tab hidden | audit aktor = subjek JWT (`work-orders.ts:262`, `multi-zone-work-order.ts:466-467`); operator individual + `is_active`; v1 `config/env.ts:25` default 300000ms |
| OQ-102 OID QR vs sesi | **Diizinkan dengan peringatan + konfirmasi eksplisit** (bukan tolak keras); backend atribusi ganda by design | `resolveOperatorStrict` dari zona (:326,404) + audit username sesi (:466-467); tanpa cross-check |
| OQ-103 nasib `/audit` v2 | **Keluar dari nav HMI pada unit 002**; tanpa vacuum: admin-panel v1 (Supervisor history/audit) **sudah live** di LAN 8080 | root LAN 8080 = title v1; `SupervisorPage` hub `/supervisor/history` + `/supervisor/audit` wired |
| OQ-104 station login-first vs browse | **Station login-first** (directive); **Andon tetap publik read-only** terpisah | fleet read publik terkonfirmasi (`live-state` 200 noauth); mutasi backend-gate (command tunnel 403); v1 hybrid gate = preseden andon, bukan station |
| OQ-105 rumah admin-panel | **v1 frontend (`iiot-oee/apps/frontend`) lineage Supervisor** dipertahankan/ditingkatkan; v2 tidak membangun historical | v1 live deployed (title probe); HistoryPage/AuditPage/WorkOrdersPage/DevicesPage/MachinesPage/ProductsPage wired ke backend |

**Tidak ada OQ material tersisa di unit 002.** Gate implementasi: ADR-0004 Accepted + unit 001 Fase 1 selesai. Temuan keamanan deployment (GAP-B06) = aksi pemilik backend/deploy, bukan blocker unit klien.

### Revision history

- **Rev 2 (2026-11-20):** OQ-101..105 resolved dari backend hidup; FR-005 berubah tolak-keras → konfirmasi mismatch; FR-010 threshold 10 → 5 menit env-configurable; AC-004 disesuaikan.
- **Rev 1 (2026-11-20):** spec awal dari directive produk + tinjauan workflow.
