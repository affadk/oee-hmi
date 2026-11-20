# ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST

**Status:** Accepted
**Tanggal:** 2026-11-20
**Acceptance:** pemilik repo, directive "mulai implementasikan" (2026-11-20)
**Unit terkait:** `specs/001-hmi-data-transfer-refresh`
**Acuan kontrak:** `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` §4, §6, §7A/7B/7E

## Konteks

HMI kini menggabungkan boot REST (`GET /live-state` + `/machines`) dengan merge WS `TELEMETRY_UPDATE`/`HEALTH_UPDATE`. Audit 20 Nov 2026 (`docs/specs/hmi-data-transfer-2026-11.md` P1-1..P1-4) menemukan: (1) `fsm_state` frame WS dibuang sehingga status mesin tidak berubah live; (2) hanya 5 dari 26 tipe envelope lifecycle dipetakan — badge online, downtime aktif, dan WO selesai basi sampai reload manual; (3) tidak ada rekonsiliasi setelah reconnect WS (frame terlewat hilang); (4) close code `4403`/`4429` tidak dibaca sehingga reconnect buta. Backend menyediakan relay WS < 50ms dan `GET /live-state` sub-2ms yang memang dirancang untuk initial load HMI/Andon.

## Keputusan

1. **WS tetap satu-satunya hot-path live.** Tidak ada polling agresif pengganti WS.
2. **`GET /live-state` = kanal rekonsiliasi**: dipanggil saat boot, setiap WS (re)connect sukses, dan poll jaring-pengaman frekuensi rendah (konstanta 60s, satu tempat di application layer).
3. **Frame `TELEMETRY_UPDATE` memperbarui status FSM mesin** (normalisasi kanonis 6 nilai; `STANDBY` sudah dinormalisasi server → `READY`), bukan hanya counters/OEE.
4. **`DEVICE_STATUS_UPDATE` memperbarui `connectionStatus` langsung** (proyeksi TTL `isOnline` backend, §7E).
5. **Envelope lifecycle tipis → debounced refetch REST (≤ 2s), bukan fabrikasi state.** Payload WS lifecycle tidak membawa state lengkap; klien membaca ulang sumber kebenaran terkait (fleet/registry/labelable/WO) setelah debounce.
6. **Kebijakan close code**: `4403` (origin dilarang) → berhenti reconnect + error konfigurasi eksplisit ke UI; `4429` (rate limit 120 koneksi/menit/IP) → backoff mulai ≥ 60s + jitter; selain itu → backoff eksisting 1s→30s + resync butir 2.
7. **Staleness jujur**: indikator umur data memakai `lastTelemetryAt`/`updatedAt` dari snapshot; tanpa data → tampil kosong/`—`, bukan angka tebakan.

## Alternatif yang Dipertimbangkan

- **Polling REST penuh (tanpa WS)** — ditolak: latensi > relay < 50ms, beban nginx (100r/s) dan kehilangan desain hot-path backend.
- **Bangun state lengkap dari payload WS lifecycle** — ditolak: payload tipis (mis. `MACHINE_UPDATED` hanya `machine_id`); menurunkannya = fabrikasi, melanggar prinsip kejujuran data repo.
- **SSE / long-poll** — ditolak: backend tidak menyediakan; menambah infrastruktur tanpa kebutuhan.
- **Resync tiap frame WS** — ditolak: N+1, melanggar NFR tanpa fetch-loop (riwayat regresi G11).

## Konsekuensi

- Positif: status/online/WO/downtime live tanpa reload; reconnect pulih sendiri dengan rekonsiliasi deterministik; beban REST tetap rendah (boot + reconnect + 60s + debounce event).
- Negatif/biaya: dependensi pada kestabilan kontrak envelope WS (26 tipe, casing campuran — mapper harus defensif); debounce menambah latensi ≤ 2s untuk state turunan (dapat diterima untuk data non-hot-path).
- Netral: arsitektur hexagonal tidak berubah — semua di adapter WS/DTO + hooks application; layout live monitor beku.
