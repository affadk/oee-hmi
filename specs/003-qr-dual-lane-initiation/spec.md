# Spec 003 — Dual-Lane Inisiasi QR: 4 Badge Fisik (Jalur A) + Resolve WO Existing (Jalur B)

> Kontrak perilaku penyambungan scan QR fisik ke konfigurasi edge device sebelum START.
> Kontrak wire otoritatif: `../iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` §C.7/§C.8 + parser backend `apps/backend/src/modules/production/services/work-order/qr-zone-parser.ts` (aturan parsezona).
> Keputusan arsitektur: ADR-0005 (Accepted 2026-11-20). Prasyarat: unit 002 (pipa initiate + surface) selesai.

**Lifecycle:** SPECIFIED
**Health:** VALID
**Revision:** 2
**Authority:** Otoritas perilaku unit ini. design/tasks dibuat setelah OQ-201..204 terjawab + ADR-0005 Accepted.

## 1. Purpose

Dua mekanisme sah mengkonfigurasi edge device sebelum tombol START fisik ditekan, sehingga logging OEE berjalan:

- **Jalur A (WO on-the-fly):** scan 4 badge fisik (produk → mesin → operator → shift, format `PID/MID/OID/SID` §C.8) → validate-zone per zona → `initiate-from-zones` (backend buat WO `PENDING` + dispatch `SET_JOB_CONFIG` MQTT) → ACK edge ≤15s → WO `ACTIVE` → START.
- **Jalur B (WO pra-dibuat admin):** QR produk ber-`workOrder` → resolve WO existing → preview → dispatch → ACK → `ACTIVE` → START.

Kondisi kini: pipa initiate HMI benar, tetapi scan backend-mode tidak feeding draft 4 zona (semua input → resolve WO; draft disintesis dari jobConfig + fallback katalog demo). Unit ini menyambungkan scan fisik ke initiate dan mempertahankan jalur B, tanpa mengubah backend dan tanpa menyentuh layout live monitor beku.

## 2. Scope

### In Scope
- Parser badge zona format backend di HMI (pure domain, cermin aturan `qr-zone-parser.ts`).
- Routing tunggal scan backend-mode auto-deteksi: badge zona (kamera) → draft per zona; QR ber-WO (kamera/textfield) → resolve (jalur B); textfield manual hanya jalur WO.
- Draft backend-mode hanya dari data nyata (scan kamera/pilih master); hapus fallback katalog demo di backend lane; initiate fail-closed sampai 4 zona lengkap.
- Panel konfirmasi konfigurasi 4 zona sebelum initiate (tulisan ke edge hanya setelah konfirmasi eksplisit operator).
- Nilai zona dari badge (LINE, DATE, window, BREAK, TARGET, CT), bukan sintesis lokal.
- Tunggu-ACK terbatas pasca initiate/dispatch: ACTIVE / ABORTED / timeout `TIMEOUT_UNACKNOWLEDGED` + retry idempoten.
- Footer modal QR sadar-lane (tombol initiate hanya untuk draft zona; tombol setup hanya untuk WO resolve).

### Out of Scope
- Perubahan backend/kontrak wire; perubahan layout live monitor (beku); guard START (sudah benar: `jobConfig.workOrder` hanya terisi dari WO ACTIVE — `BackendMachineRepository.ts:371`).
- Jalur simulasi (`VITE_USE_BACKEND=false`): `parseQrString` katalog + `draftFromMachine` tetap apa adanya.
- Pembuatan WO oleh admin (rumah admin-panel v1, OQ-105 unit 002).
- TLS/secure-context kamera = keputusan deployment (OQ-204), bukan fitur kode.

## 3. Actors

- **Operator** (kiosk/Station): login sesi unit 001; scan 4 badge atau QR WO; START fisik setelah WO ACTIVE.
- **Supervisor/Admin**: membuat WO di admin-panel (jalur B, di luar unit ini).
- **Edge STM32**: penerima `SET_JOB_CONFIG`, pengirim ACK (`SUCCESS`/error) via MQTT → backend.

## 4. User/System Scenarios

1. Jalur A: operator login → buka modal QR → scan kamera badge produk (`PID=..;CT=..;NAME=..`) → mesin (`MID=..;MCH=..;LINE=..`) → operator (`OID=..;OP=..`) → shift (`SID=..;DATE=..;START=..;END=..;BREAK=..;TARGET=..`) → tiap scan mengisi draft + maju stepper → panel konfirmasi konfigurasi 4 zona → konfirmasi eksplisit → validate 4×200 → WO PENDING + dispatch → tunggu ACK → ACTIVE → pesan sukses + START siap.
2. CT badge ≠ master (tol 0.01s) → `CT_MISMATCH` tampil di zona produk saat validate; WO tidak dibuat.
3. Jalur B: scan QR produk ber-WO → resolve → preview data backend → Setup Produksi → dispatch → tunggu ACK → ACTIVE → START.
4. Edge tanpa ACK ≤15s → backend `TIMEOUT_UNACKNOWLEDGED`; HMI menampilkan timeout + tombol retry (initiate ulang = idempotent duplicate <5s).
5. ACK error → WO `ABORTED` → HMI menampilkan kegagalan konfigurasi edge, bukan klaim sukses.
6. Kamera gagal (non-secure context / izin ditolak) → pesan jujur; jalur A tidak bisa lanjut tanpa kamera; textfield jalur WO tetap berfungsi.
7. Badge mesin `MID` ≠ mesin terikat device → error klien dini sebelum initiate (backend akan `MachineMismatch`).

## 5. Functional Requirements

- **FR-001** Parser badge zona backend di HMI (pure domain, terpisah dari `parseQrString` katalog): kenal 4 zona dari kunci `PID/CT/NAME`, `MID/MCH/LINE`, `OID/OP`, `SID/DATE/START/END/BREAK/TARGET`; aturan validasi cermin `qr-zone-parser.ts` (key wajib + alias `PRODUCT_ID/MACHINE_ID/OPERATOR_ID/SHIFT_ID/BREAK_AT`, CT > 0, waktu `HH:MM`, BREAK integer ≥ 0, TARGET integer > 0, DATE `YYYY-MM-DD`, shift overnight, planned operating > 0). Error ramah operator menyebut zona + key bermasalah.
- **FR-002** Satu routing scan untuk backend-mode, auto-deteksi dari isi QR (OQ-201 resolved): badge zona dari **kamera** → isi draft zona terkait + stepper ke zona itu; QR produk ber-WO (katalog/JSON/key-value `WO=`) → `submitWoForPreview` (jalur B, perilaku kini); bukan keduanya → error jujur. **TextField manual hanya untuk jalur WO** (directive pemilik): paste/key-value WO → resolve; badge zona yang ditempel ke textfield → error jujur arah kamera (badge zona = bukti fisik, tidak via paste).
- **FR-003** Draft backend-mode mulai kosong; hanya terisi dari scan kamera badge (jalur A) atau pilih master backend nyata (`catalog` prop). Tanpa fallback `QR_PRODUCT_CATALOG`/`QR_SCHEDULE_CATALOG` demo di backend lane. Tombol initiate disabled sampai 4 zona terisi (fail-closed pencegah `MASTER_NOT_FOUND` fiktif) (OQ-202 resolved).
- **FR-004** Nilai zona dikirim apa adanya dari badge: `LINE` dari badge mesin; `DATE/START/END/BREAK/TARGET` dari badge shift; `CT/PID/NAME` dari badge produk; `OID/OP` dari badge operator. `DATE` badge menang atas tanggal lokal; tanpa badge shift tidak ada substitusi hari-ini diam-diam. `MID` badge ≠ `machine.machineId` terikat → error klien dini + arah scan ulang.
- **FR-005** Jalur A: 4 zona lengkap → **panel konfirmasi konfigurasi** menampilkan nilai 4 zona hasil scan (produk/CT, mesin/LINE, operator, shift/DATE/TARGET) → operator konfirmasi eksplisit **sebelum** ditulis ke edge (directive pemilik) → `validate-zone` 4× berurutan (error per zona, kontrak unit 002 FR-004) → `initiate-from-zones` (sudah termasuk dispatch; tanpa `POST /:wo_id/dispatch` terpisah) → **tunggu ACK terbatas** (OQ-203 resolved: poll detail WO interval 2s, cap 20s, berhenti ACTIVE/ABORTED/timeout): `ACTIVE` → sukses + instruksi START; `ABORTED` → error ACK edge; lewat batas waktu → pesan `TIMEOUT_UNACKNOWLEDGED` + retry idempoten. Konfirmasi OID-mismatch (unit 002 FR-005) tetap berlaku sebelum initiate.
- **FR-006** Jalur B: resolve → preview → dispatch via Setup Produksi (Bearer, capability `work_order.dispatch`) → tunggu ACK yang sama dengan FR-005 → ACTIVE → START. Kontrak tidak berubah.
- **FR-007** Guard START tidak diubah (`FloorPushButtonsPanel`: START tanpa `jobConfig.workOrder` → arahkan ke QR/Setup); `jobConfig` hanya terisi dari WO ACTIVE hasil ACK. Diff komponen live monitor beku = nol; perubahan presentasi hanya modal QR + Setup Produksi.
- **FR-008** Kamera gagal secure-context/izin → pesan jujur; jalur A tidak tersedia tanpa kamera (badge zona wajib scan fisik, OQ-201); textfield paste tetap berfungsi untuk jalur WO. Deployment kiosk via `localhost` (OQ-204 resolved) agar secure context terpenuhi; keputusan TLS LAN tidak diambil.

## 6. Business Rules

- BR-001 master strict: PID/MID/OID/SID wajib ada di master backend; QR hanya merujuk, bukan auto-upsert (unit 002 BR-005).
- BR-002 satu WO aktif per mesin per shift instance; 409 `active_wo_id` ditampilkan jujur + arah ke WO existing.
- BR-003 tanpa fabrikasi data: draft kosong lebih baik daripada ID demo; null/kosong jujur.
- BR-004 LAN-only + Bearer untuk validate/initiate/dispatch (backend enforce; klien tidak mencoba via tunnel).
- BR-005 QR = data job, bukan autentikasi (ADR-0004); sesi operator unit 001 wajib.

## 7. Non-Functional Requirements

- NFR-001 tanpa dependensi baru; reuse stepper/modal/ports unit 002; parser pure + unit test vektor dari test backend.
- NFR-002 tunggu ACK = poll **bounded** (cap waktu + interval tetap, berhenti saat ACTIVE/ABORTED/timeout) — bukan fetch-loop permanen baru (constraint unit 001 NFR-001); resync WS/poll 60s eksisting tetap jaring pengaman.
- NFR-003 validate-zone per zona tidak memblokir UI > 2s (timeout + retry, unit 002 NFR-002).
- NFR-004 `pnpm lint` (tsc + lint:arch) hijau: parser di domain zero-IO, routing di presentation tanpa IO langsung.

## 8. Constraints

`.sdd/context/constraints.md` + freeze layout live monitor. Backend tidak diubah dari repo ini. Kontrak §C.7/§C.8 + `qr-zone-parser.ts` otoritatif; bila docs vs kode beda → probe + catat, jangan menebak.

## 9. Acceptance Criteria

- **AC-001** (FR-001) Given badge `PID=PRD-001;CT=60;NAME=Produk Uji`, When parse, Then zona PRODUCT terisi benar; given badge kurang key wajib, Then error menyebut zona + key; vektor uji mencakup kasus test backend `qr-zone-parser` (alias, overnight, BREAK/TARGET invalid).
- **AC-002** (FR-002/004/005) Given sesi operator + stack hidup, When 4 badge fisik dipindai kamera berurutan, Then draft terisi per zona dari badge → validate 4×200 → initiate 200 (PENDING) → ACK → ACTIVE → START enabled → RUNNING (E2E; test komponen boleh injeksi hasil scan).
- **AC-003** (FR-002/006) Given QR produk ber-WO di backend-mode (kamera atau textfield), When discan/ditempel, Then resolve WO existing (jalur B), bukan draft zona; dispatch → ACK → ACTIVE → START. Given badge zona ditempel ke textfield, Then error jujur arah kamera (bukan mengisi draft).
- **AC-004** (FR-003) Given modal backend-mode dibuka tanpa jobConfig, Then draft kosong + initiate disabled; tidak ada request initiate memuat ID katalog demo.
- **AC-005** (FR-004) Given badge shift `DATE` ≠ hari ini, Then zona shift mengirim DATE badge; given `MID` ≠ mesin terikat, Then error klien sebelum initiate.
- **AC-006** (FR-005) Given edge offline/tanpa ACK, When initiate, Then pesan `TIMEOUT_UNACKNOWLEDGED` + retry; retry <5s → `is_idempotent_duplicate` tampil benar; ACK error → pesan ABORTED (bukan sukses).
- **AC-007** (FR-005) Given OID badge ≠ sesi, Then konfirmasi mismatch muncul sebelum initiate (paritas unit 002 AC-004).
- **AC-008** (FR-007) After perubahan, Then diff komponen live monitor beku = nol.
- **AC-009** (FR-008) Given kamera non-secure-context, When modal dibuka, Then pesan error kamera jujur; textfield jalur WO tetap berfungsi.
- **AC-010** (FR-005) Given 4 zona lengkap hasil scan, Then panel konfirmasi menampilkan nilai 4 zona; initiate (tulisan ke edge) hanya jalan setelah konfirmasi eksplisit operator; batal → tidak ada request initiate.

## 10. Dependencies

- Unit 002 selesai (pipa `validateZone`/`initiateFromZones` + modal + surface ada; T101–T117).
- ADR-0005 Accepted (2026-11-20, via resolusi OQ-201..204 + directive tambahan pemilik).
- OQ-201..204 resolved (pemilik repo, 2026-11-20).
- Stack `iiot-oee` hidup untuk E2E (edge-sim cukup untuk ACK; badge fisik + kamera localhost = verifikasi manual pemilik).

## 11. Open Questions — RESOLVED (2026-11-20, pemilik repo)

| OQ | Jawaban | Dasar |
|---|---|---|
| OQ-201 deteksi lane | **Auto-deteksi isi QR** + tambahan pemilik: **textfield manual hanya untuk jalur WO** (badge zona wajib scan kamera — bukti fisik); **panel konfirmasi konfigurasi** begitu 4 scan selesai, konfirmasi eksplisit sebelum ditulis ke edge device | kunci zona deterministik (`qr-zone-parser.ts`) vs `WO=`/katalog; directive pemilik 2026-11-20 |
| OQ-202 draft awal | **Kosong + blok initiate** sampai 4 zona terisi; tanpa fallback demo; pilih master nyata tersedia | jobConfig ada = WO ACTIVE sudah ada → initiate pasti 409 (`BackendMachineRepository.ts:371`); BR-002 |
| OQ-203 tunggu ACK | **Poll bounded detail WO: interval 2s, cap 20s**, berhenti ACTIVE/ABORTED/timeout; resync WS eksisting jaring pengaman | `dispatch.ts:459-495` ACK ubah DB bukan broadcast WS; cap 20s > watchdog 15s |
| OQ-204 kamera LAN | **Kiosk via localhost** (deployment per-device, secure context terpenuhi); tanpa TLS LAN; textfield jalur WO tetap ada | constraint deployment LOKAL; ADR-0004 kiosk = HMI lokal per device |

**Tidak ada OQ material tersisa.** Gate implementasi: ADR-0005 Accepted (2026-11-20 via resolusi OQ-201..204 + directive tambahan) + design DESIGNED + tasks READY.

### Revision history

- **Rev 2 (2026-11-20):** OQ-201..204 resolved pemilik; FR-002 textfield hanya jalur WO + badge zona wajib kamera; FR-005 panel konfirmasi konfigurasi pra-initiate; FR-008/AC-009 disesuaikan (paste bukan fallback jalur A); AC-003/AC-010 baru.
- **Rev 1 (2026-11-20):** spec awal dari analisis gap sinkronisasi scan 4 badge (GAP-F21..F26) + directive pemilik "dukung 2 mekanisme inisiasi sebelum START".
