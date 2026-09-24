# Spec RestAPI + WebSocket — OEE Shift Overview & Detailed Audit Dashboard

> Repo: `oee-dashboard-aistudio` (frontend) mengkonsumsi backend `iiot-oee/apps/backend`
> Sumber acuan API existing: `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` (Fastify 5.x, §1–§5)
> Sumber timestamp PostgreSQL/TimescaleDB: `iiot-oee/apps/backend/src/db/schema.ts`
> Dokumen ini adalah **hasil rencana + 3x looping analisa** (reuse vs ubah vs baru).

Status: `PROPOSED v1.0` — tidak ada breaking change. Semua usulan baru bersifat aditif/opt-in.

---

## 0. Ringkasan eksekutif

Dua page di `src/presentation/pages/DashboardPage.tsx`:

| `viewMode` | Nama page | Karakter kebutuhan data |
|---|---|---|
| `FULLSCREEN_IMAGE` | **OEE Shift Overview** (`FullscreenOeeView.tsx`) | Read-heavy, live (<1–2 dtk), 1 mesin fokus + selector N mesin. Butuh: header shift (WO/produk/operator/jam/break), gauge OEE/AVA/PER/QUA, progress Actual vs Target, Production Rate, Time Summary, OEE Shift Trend, Shift Timeline (`PasXProgressStrip` — kanvas shift window + overlay downtime Active/Changeover/Breakdown/Waiting dari data nyata), status mesin + tombol lantai. |
| `DETAILED_AUDIT` | **Detailed Audit Dashboard** (`HeaderZone` + `HeroKpiZone` + `ProductionZone` + `MachineStatusZone` + `LossAnalysisZone` + `TrendZone` + `AlarmsZone`) | Audit-heavy, historis + filter waktu, pagination cursor, export bukti. Butuh: KPI A×P×Q, Six Big Losses waterfall, reject analysis, hourly trend, alarm/audit trail, footer rekonsiliasi. |

**Keputusan akhir setelah 3 looping (detail di §1):**

1. **Reuse 100% API existing untuk v1** — semua kebutuhan timestamp bisa dipenuhi komposisi endpoint yang sudah ada. Tidak ada endpoint yang perlu dihapus/diubah kontraknya.
2. **Usulkan 2 endpoint agregat baru (opsional, Fase 2)** untuk menghilangkan N+1 dan hitungan shift di klien: `GET /api/v1/oee/shift-summary` dan `GET /api/v1/oee/shift-timeline`. Keduanya aditif, tidak merusak kompatibilitas.
3. **WebSocket tidak diubah protokolnya** — hanya penegasan kontrak konsumsi (filter klien, skip `is_buffered:true` untuk render 60fps, heartbeat `ping/pong`, reconnect + resync REST, event lifecycle yang wajib di-listen).

---

## 1. Looping analisa 3x (wajib dibaca reviewer)

### Loop 1 — Inventarisasi kebutuhan UI → pemetaan ke API existing

Metode: baca `FullscreenOeeView.tsx`, `DashboardPage.tsx`, `useOeeDashboard.ts`, `Machine.ts`, `IOeeBackend.ts`, lalu cocokkan satu-per-satu ke §B–§K + §4 `API_DOCUMENTATION.md`.

| # | Kebutuhan UI | Komponen | API existing yang memenuhi | Status Loop 1 |
|---|---|---|---|---|
| 1 | Snapshot live semua mesin (initial load TV Andon <2ms) | Machine selector, `MachineStatusZone` | `GET /api/v1/live-state` (§B.1) | ✅ reuse langsung |
| 2 | Snapshot 1 mesin fokus | `FullscreenOeeView`, `HeroKpiZone` | `GET /api/v1/live-state/:deviceId` (§B.2) | ✅ reuse |
| 3 | Metadata shift: WO, produk, operator, `shift_start/end`, `planned_break_min`, `planned_operating_sec`, `std_cycle_time_sec` | Sub-header Shift Overview | `GET /api/v1/work-orders/:wo_id/resolve?device_id=` (§C.3) + `GET /api/v1/work-orders?status=ACTIVE&machine_id=` (§C.1) | ✅ reuse (resolve = safe read tanpa publish MQTT) |
| 4 | Trend OEE per jam shift | `EChartsOeeTrend`, `TrendZone` | `GET /api/v1/telemetry/:device_id/hourly?from&to&limit` (§K.2) | ✅ reuse |
| 5 | Trend resolusi fleksibel (5m/15m untuk `PasXProgressStrip` + spike) | Shift Trend detail | `GET /api/v1/telemetry/:device_id/aggregate?bucket&from&to` (§K.4) | ✅ reuse |
| 6 | Titik mentah untuk tooltip/rekonsiliasi | Audit drill-down | `GET /api/v1/telemetry/:device_id?from&to&limit&cursor&envelope` (§K.1) | ✅ reuse |
| 7 | Downtime aktif (badge Down/Active, `FloorPushButtonsPanel`) | Status + tombol lantai | `GET /api/v1/downtime-events/active` (§J.1) | ✅ reuse |
| 8 | Histori downtime + label Six Big Losses | `LossAnalysisZone`, waterfall | `GET /api/v1/downtime-events/:device_id?from&to&category&limit&cursor&envelope` (§J.2) + `POST /:id/reason` (§J.3) | ✅ reuse |
| 9 | Audit trail diskrit (alarm PLC, WO dispatch, command, mutasi master, shift) | `AlarmsZone`, `RecentEventsPanel` | `GET /api/v1/operational-events/:deviceId?from&to&event_type&limit&cursor&envelope` (§I) | ✅ reuse |
| 10 | Master mesin/device/produk/operator (nama, line, binding) | Header, footer, QR scanner | `GET /api/v1/machines`, `GET /api/v1/devices`, `GET /api/v1/products`, `GET /api/v1/operators` (§E–§H) | ✅ reuse |
| 11 | Aksi lantai (PAUSE/RESUME/RESET_COUNTER, complete/cancel WO) | `FloorPushButtonsPanel`, QR modal | `POST /api/v1/devices/:device_id/command` (§D) + `POST /work-orders/:id/complete|cancel|dispatch` (§C) | ✅ reuse, LAN-only |
| 12 | Export bukti audit offline | Tombol Export audit | `GET /api/v1/telemetry/:device_id/export?format=csv|ndjson&from&to` (§K.3) | ✅ reuse |
| 13 | Live push <50ms | Semua gauge/rate/progress | `WS /ws/telemetry` (§4) frame telemetri + lifecycle | ✅ reuse |
| 14 | Kesehatan sistem + jumlah WS client | Footer/diag | `GET /health` (§A) | ✅ reuse |

**Kesimpulan Loop 1:** tidak ada kebutuhan yang *mustahil* dengan API existing. Semua tabel timestamp (`oee_telemetry_logs`, `downtime_events`, `operational_events`, `device_live_state`, `oee_hourly_summary`) sudah terekspos via REST.

### Loop 2 — Verifikasi semantik timestamp PostgreSQL (umpan balik korektif)

Metode: verifikasi ulang terhadap `schema.ts`, `schemas/telemetry.ts`, `schemas/downtime.ts`, `routes/telemetry.ts`, `routes/downtime.ts`, `routes/operational-events.ts`, `websocket/relay.ts`. Ditemukan 6 risiko yang harus dipertegas di spec (bukan alasan bikin breaking change):

1. **Kolom waktu tidak seragam namanya:** `oee_telemetry_logs.recorded_at` vs `operational_events.recorded_at` vs `downtime_events.start_time/end_time` vs `device_live_state.last_telemetry_at/updated_at` vs `oee_hourly_summary.bucket`. → Spec §4 menyeragamkan parameter query tetap `from/to` (ISO8601 offset) tapi memetakan ke kolom yang benar per endpoint.
2. **Semantik `bucket` ganda:** `aggregate` memakai enum `1m|5m|15m|1h|1d` (`TelemetryAggregateQuerySchema`), sedangkan `hourly` memakai continuous aggregate `oee_hourly_summary` refresh 1 jam. → Spec §3 menegaskan: Shift Overview pakai `aggregate?bucket=5m` untuk live trend + `hourly` untuk konteks shift penuh; jangan polling `hourly` tiap detik.
3. **Cursor pagination heterogen:** work-orders `created_at+wo_id`, telemetry `recorded_at+device_id`, operational `recorded_at+id`, downtime `start_time+id`. Semua Base64URL, `envelope=true` → `{data,meta}`. → Spec §4 mewajibkan frontend selalu kirim `envelope=true` untuk page audit dan menyimpan `nextCursor` opaque (jangan parse di klien).
4. **Shiftข้าม malam (22:00–06:00):** `work_orders.shift_start/shift_end` bertipe `time` tanpa tanggal. Jika `shift_end <= shift_start` maka window lewat tengah malam. → Spec §5 mendefinisikan normalisasi window shift di klien + server (usulan baru).
5. **WS membedakan `is_buffered`:** relay meneruskan semua frame; doc §4 menegaskan frame `is_buffered:true` (backlog LittleFS ≤72 jam) **tidak boleh** menggerakkan gauge 60fps, hanya masuk buffer persistensi. Frontend sudah punya `isLiveTelemetryFrame()` — spec §6 mengunci perilaku ini sebagai kontrak.
6. **Bentuk WS aktual vs doc bisa beda lapis:** `relay.ts` membungkus payload sebagai `{type:"TELEMETRY_UPDATE", topic, device_id, machine_id, data:<TelemetryPayload>, received_at}`, sedangkan `API_DOCUMENTATION.md §4` mendokumentasikan frame datar. Klien existing (`telemetryWsClient.ts` + `mapTelemetryFrameDto`) sudah toleran terhadap keduanya (cek `device_id|deviceId|fsm_state` vs `type`). → Spec §6 mendefinisikan **penerimaan ganda** (dual-accept) dan melarang perubahan breaking di server sebelum klien dual-accept disebar.

**Kesimpulan Loop 2:** tidak perlu mengubah kontrak existing; yang dibutuhkan adalah **spesifikasi penggunaan timestamp yang presisi** (§3–§6) + 2 agregat server-side agar hitungan shift tidak drift antar klien.

### Loop 3 — Konfirmasi akhir: reuse vs ubah vs baru

| Kandidat | Keputusan | Alasan |
|---|---|---|
| Semua `GET` existing (§B,§C.1,§C.3,§I,§J,§K) | **REUSE tanpa perubahan** | Cukup untuk v1; sudah ada filter `from/to`, cursor, envelope, rate limit. |
| `POST` command/WO/reason (§C,§D,§J.3) | **REUSE tanpa perubahan** | Tetap LAN-only + RBAC + audit fail-closed. Page audit hanya read; aksi label downtime tetap via endpoint existing. |
| `GET /api/v1/oee/shift-summary` | **BARU (Fase 2, aditif)** | Satu panggilan ganti 4–5 panggilan (live-state + resolve + hourly/aggregate + downtime/active). Hitungan A/P/Q shift di server dari `oee_telemetry_logs` + `work_orders` sehingga konsisten antar TV Andon/HMI/remote. |
| `GET /api/v1/oee/shift-timeline` | **BARU (Fase 2, aditif)** | Segmen state + overlay downtime per shift window untuk `PasXProgressStrip`/`MachineTimelineStrip` tanpa join di klien. Changeover = label `SETUP_AND_ADJUSTMENT`, bukan FSM baru. |
| `GET /api/v1/downtime-events/summary?group_by=category` | **DITUNDA (opsional Fase 3)** | v1 cukup agregasi klien dari `GET /downtime-events/:device` (maks 100/page, cursor). Endpoint ini hanya optimasi saat loss waterfall跨 shift besar. |
| WS filter server-side `?device_id=&machine_id=` | **DITUNDA (opsional)** | v1 filter di klien (broadcast kecil, <120 koneksi/menit). Ditambahkan hanya jika traffic WS > ambang. |
| WS event `DOWNTIME_*`, `SHIFT_*` baru | **DOKUMENTASIKAN sebagai advisory** | Server boleh menambah `type` baru kapan saja; klien wajib ignore-unknown (sudah begitu di `telemetryWsClient`). Tidak perlu versi WS. |

**Definisi selesai Loop 3:** §2 = kontrak reuse baku; §3 = kontrak 2 endpoint baru (belum wajib diimplementasi backend untuk v1 frontend); §6 = kontrak WS konsumsi.

---

## 2. Kontrak REST yang di-reuse (v1 frontend — tanpa perubahan backend)

Base URL: `VITE_API_BASE_URL` (`http://localhost` via Nginx LAN, `http://localhost:3001` direct, `http://localhost:8080` remote read-only). Auth: read publik; mutasi Bearer JWT (`POST /api/v1/auth/operator-pin`) + LAN subnet. Error: `{error, message, issues?}`. Rate limit: general 100r/s, `export` 5/min, `reconciliation/refresh` 10/min, WS 120/menit (close `4429`).

### 2.1 OEE Shift Overview — komposisi panggilan

Urutan load awal (paralel, `AbortSignal` per page):

```
1. GET /api/v1/live-state                          → pilih device fokus (atau dari QR/machine selector)
2. GET /api/v1/live-state/:deviceId                → gauge + counter + plc + hw_diag fokus
3. GET /api/v1/work-orders?status=ACTIVE&machine_id=:m&limit=1&envelope=true
   └─ fallback: GET /work-orders/:wo_id/resolve?device_id=:d   (shift_start/end, break, std_cycle)
4. GET /api/v1/telemetry/:device_id/aggregate?bucket=5m&from=:shiftStart&to=:now
5. GET /api/v1/telemetry/:device_id/hourly?from=:shiftStart&to=:now&limit=24
6. GET /api/v1/downtime-events/active              → badge Active/Down + unclassified guard
7. WS /ws/telemetry                                → live tick (lihat §6)
8. GET /api/v1/oee/shift-timeline?machine_id=:m&from=:shiftStart&to=:now&bucket=5m&include_downtime=true&include_events=true&envelope=true
   └─ Fase 2; selama belum ada, fallback klien: buildShiftTimeline dari aggregate + downtime + operational-events (§3.2)
```

Polling: **jangan polling `hourly`/`aggregate` tiap detik.** Pola baku: WS untuk tick 1 dtk (gauge/rate/progress), REST `aggregate` refresh tiap 30–60 dtk, `hourly` tiap 5 menit, `live-state` hanya saat reconnect/fallback. `shift-timeline` refresh tiap 5–10 menit atau saat WS menerima `WORK_ORDER_*` lifecycle event.

Contoh (shift malam melewati tengah malam, WIB):

```http
GET /api/v1/telemetry/STM32-OEE-01/aggregate?bucket=5m&from=2026-09-21T22%3A00%3A00%2B07%3A00&to=2026-09-22T06%3A00%3A00%2B07%3A00
GET /api/v1/telemetry/STM32-OEE-01/hourly?from=2026-09-21T22%3A00%3A00%2B07%3A00&to=2026-09-22T06%3A00%3A00%2B07%3A00&limit=24&envelope=true
GET /api/v1/downtime-events/STM32-OEE-01?from=2026-09-21T22%3A00%3A00%2B07%3A00&to=2026-09-22T06%3A00%3A00%2B07%3A00&limit=50&envelope=true
```

### 2.2 Detailed Audit Dashboard — komposisi panggilan

```
HeroKpi/Production : GET /live-state/:d + GET /work-orders/:wo/resolve + GET /telemetry/:d/aggregate?bucket=15m
LossAnalysis       : GET /downtime-events/:d?from&to&limit=100&envelope=true (+ cursor sampai habis) → agregasi klien per category
TrendZone          : GET /telemetry/:d/hourly?from&to&limit=72&envelope=true
AlarmsZone         : GET /operational-events/:d?from&to&limit=100&cursor&envelope=true (+ filter event_type=COMMAND_*|WO_*|DOWNTIME_*|MASTER_*)
Footer rekonsiliasi: GET /health (ws_clients, buffer_pending) + GET /telemetry/reconciliation/jobs (opsional diag)
Export bukti       : GET /telemetry/:d/export?format=csv|ndjson&from&to&limit=5000  (rate 5/min)
Label downtime     : POST /downtime-events/:id/reason {category, reason, notes}  (OPERATOR/SUPERVISOR/MAINTENANCE/ADMIN, LAN)
```

Aturan audit: selalu `envelope=true`; iterasi `meta.nextCursor` sampai `hasMore=false`; tampilkan fallback `[deleted]` bila `deviceId/machineId/product/operator` null (history preservation `SET NULL`); jam tampilkan dalam zona pabrik (default `Asia/Jakarta`) dengan tooltip UTC ISO.

---

## 3. Kontrak REST baru yang diusulkan (Fase 2 — aditif, tidak wajib untuk v1)

> Prinsip: tidak mengubah endpoint existing. Jika backend belum mengimplementasikan §3, frontend tetap jalan dengan §2.

### 3.1 `GET /api/v1/oee/shift-summary`

Ringkasan 1 shift untuk 1 mesin, dihitung server dari `work_orders` + `oee_telemetry_logs` (+ `downtime_events` untuk split planned/unplanned). Mengganti hitungan `OeeCalculator` klien agar konsisten antar layar.

**Catatan:** `shift-summary` menghitung OEE berdasarkan shift window (shift_start sampai shift_end), sementara `shift-timeline` menggunakan production window. Kedua window boleh berbeda; production window biasanya lebih pendek dari shift window karena ada planned downtime (break, maintenance).

```http
GET /api/v1/oee/shift-summary?machine_id=CNC-MILLING-01&date=2026-09-21&shift=3
GET /api/v1/oee/shift-summary?device_id=STM32-OEE-01&from=2026-09-21T22:00:00+07:00&to=2026-09-22T06:00:00+07:00
```

Query (salah satu dari dua mode):

| Param | Wajib | Keterangan |
|---|---|---|
| `machine_id` / `device_id` | salah satu wajib | `device_id` regex `^STM32-[A-Za-z0-9_-]+$`; `machine_id` regex `^CNC-[A-Z0-9_-]{3,32}$` |
| `date` + `shift` | mode 1 | `date` = tanggal mulai shift (zona pabrik), `shift` = `1\|2\|3` atau nama `Shift 1` |
| `from` + `to` | mode 2 | ISO8601 offset; `to-from ≤ 24 jam`; default `to=now` |
| `tz` | opsional | IANA tz, default `Asia/Jakarta` |
| `wo_id` | opsional | kunci ke WO tertentu; default WO ACTIVE pada window |

Respons `200` (angka persen 0–100, detik integer, counter integer):

```json
{
  "machine_id": "CNC-MILLING-01",
  "device_id": "STM32-OEE-01",
  "wo_id": "WO-20260921-03",
  "window": { "from": "2026-09-21T22:00:00+07:00", "to": "2026-09-22T06:00:00+07:00", "tz": "Asia/Jakarta", "planned_break_min": 60, "planned_operating_sec": 25200 },
  "oee": { "availability": 88.4, "performance": 91.2, "quality": 98.1, "oee": 79.1 },
  "counters": { "target": 12500, "actual": 8721, "good": 8520, "reject": 201, "progress_pct": 69.8 },
  "rate": { "target_per_h": 400, "actual_per_h": 203, "actual_cycle_sec": 17.7, "ideal_cycle_sec": 9.0, "speed_eff_pct": 51 },
  "time_sec": { "planned": 25200, "run": 19800, "downtime": 5400, "planned_dt": 3600, "unplanned_dt": 1800 },
  "downtime_top": [{ "category": "EQUIPMENT_FAILURE", "sec": 1200, "count": 3 }],
  "source": { "sample_count": 96, "bucket": "5m", "last_telemetry_at": "2026-09-22T05:59:40+07:00", "is_stale": false }
}
```

Error: `400 VALIDATION_ERROR` (window >24 jam / format salah), `404 MACHINE_NOT_FOUND|WO_NOT_FOUND`, `429`, `500`. Publik read (tanpa auth), tunduk rate general.

### 3.2 `GET /api/v1/oee/shift-timeline`

Segmen timeline per shift window untuk `PasXProgressStrip`/`MachineTimelineStrip`: kanvas = shift window, overlay = downtime (`downtime_events` + label `[CATEGORY]`) + batas WO (`operational_events`). Sumber: `oee_telemetry_logs.current_state` (downsample) + `downtime_events` + `operational_events`.

**Prinsip: timeline mencerminkan shift window + overlay downtime.** Changeover (`SETUP_AND_ADJUSTMENT`) adalah label downtime (jalur amber), bukan FSM baru — firmware hanya mengirim `st 0..5`. Klien boleh fallback ke komposisi `aggregate + downtime + operational-events` bila endpoint ini belum ada (implementasi `buildShiftTimeline` saat ini memakai jalur fallback tersebut).

```http
GET /api/v1/oee/shift-timeline?machine_id=CNC-MILLING-01&from=2026-09-21T22:00:00%2B07:00&to=2026-09-22T06:00:00%2B07:00&bucket=5m&include_events=true&envelope=true
```

Respons `200`:

```json
{
  "data": [
    { "from": "2026-09-21T22:00:00+07:00", "to": "2026-09-21T22:05:00+07:00", "state": "RUNNING", "oee": 81.2 },
    { "from": "2026-09-21T22:05:00+07:00", "to": "2026-09-21T22:20:00+07:00", "state": "DOWN", "downtime_id": 42, "category": "SETUP_AND_ADJUSTMENT", "reason": "Ganti roll film", "planned": true }
  ],
  "meta": { "limit": 288, "hasMore": false, "nextCursor": null, "count": 2 }
}
```

Query: `bucket` enum `1m|5m|15m` default `5m`; `include_downtime`, `include_events` boolean default `true`; `envelope` boolean. Batas: maks 288 segmen (24 jam / 5 mnt); lebih granular pakai `aggregate?bucket=1m`.

**Production vs shift window:** OEE (`shift-summary`) dihitung per shift window; timeline memakai shift window yang sama sebagai kanvas dengan overlay downtime. Tidak ada kanvas "production window" terpisah.

**Kategori → timeline:** `SETUP_AND_ADJUSTMENT` (changeover) → jalur amber `Changeover`; `EQUIPMENT_FAILURE` dkk → `Breakdown` (merah); `MATERIAL_SHORTAGE`/waiting → `Waiting` (amber). Planned = `PLANNED_MAINTENANCE|REST_BREAK|CLEANING_5S|SETUP_AND_ADJUSTMENT`; sisanya unplanned. Backend tidak mengembalikan kolom `category` terpisah — klien mengekstrak prefix `[CATEGORY]` dari `operatorReason` (`mapDowntimeEventDto` + `parseCategoryFromReason`).

---

## 4. Kontrak timestamp PostgreSQL (aturan main semua endpoint waktu)

| Aspek | Aturan baku |
|---|---|
| Format I/O | ISO8601 dengan offset (`2026-09-21T22:00:00+07:00`). Backend menyimpan `timestamptz`; respons boleh string ISO atau Date JSON — klien anggap opaque lalu `new Date()` |
| Zona tampilan | Default `Asia/Jakarta` untuk shift; simpan mentah UTC. Kirim `tz` eksplisit bila memakai §3 |
| Kolom sumber | `telemetry.*` → `recorded_at`; `hourly` → `bucket`; `operational_events` → `recorded_at`; `downtime` → `start_time/end_time`; `live-state` → `last_telemetry_at/updated_at` (snapshot, bukan filter waktu) |
| Rentang default | Bila `from/to` kosong: Shift Overview = window shift aktif; Audit = 24 jam terakhir. Jangan pernah request open-ended tanpa `limit` |
| Limit | telemetry history maks 1000, hourly maks 500 (default 72), downtime/operational 50–200, export 50000 (default 5000), timeline 288 (production window only) |
| Cursor | Opaque Base64URL; loop `cursor → meta.nextCursor` sampai `hasMore=false`. Jangan konstruksi cursor manual |
| `envelope` | Audit/shift-timeline wajib `envelope=true`. Live gauge boleh array polos |
| Stale data | Jika `now - last_telemetry_at > 60 dtk` tampilkan badge STALE + tombol resync (`live-state` + `aggregate`); jangan menyembunyikan angka terakhir |
| History preservation | `deviceId/machineId/productId/operatorId` dapat `null` + nama `null` setelah hard delete — tampilkan `[deleted]`, jangan 404-kan baris historis |
| Rate limit | Hormati `429 TOO_MANY_REQUESTS` + `Retry-After`; `export` maks 5/min, `refresh` 10/min (SUPERVISOR/ADMIN LAN) |

---

## 5. Logika shift (harus identik di klien dan §3.1 server)

```
shift_start/shift_end: "HH:MM" dari work_orders (atau jobConfig fallback 22:00–06:00)
planned_break_min, planned_operating_sec dari WO resolve
Jika shift_end <= shift_start → to = date+1 (lewat tengah malam)
planned_sec   = planned_operating_sec
run_sec       = Σ run_time (telemetry) ∩ window − overlap break (disederhanakan: kurangi planned_break_min)
downtime_sec  = planned_sec − run_sec (dibatasi ≥0); split planned/unplanned dari kategori downtime
               (PLANNED_MAINTENANCE|REST_BREAK|CLEANING_5S|SETUP_AND_ADJUSTMENT → planned_dt, sisanya unplanned_dt).
               Kategori diekstrak dari prefix `[CATEGORY]` pada `downtime_events.operator_reason`
               karena API tidak mengembalikan kolom `category` terpisah.
availability  = run / planned × 100
performance   = (actual × ideal_cycle) / run × 100  (ideal_cycle = std_cycle_time_sec produk)
quality       = good / actual × 100
oee           = a × p × q / 10_000
```

Production window untuk timeline = shift window yang sama dengan overlay downtime (Active/Changeover/Breakdown/Waiting). Changeover (`SETUP_AND_ADJUSTMENT`) tampil sebagai segmen amber di timeline sekaligus baris planned di Loss Analysis waterfall.

Target default bila master tak ada: OEE 85, Ava 90, Per 95, Qua 98. Warna gauge: `≥target` emerald, `≥target−5` amber, else rose (kontrak `FullscreenOeeView` existing).

---

## 6. Spec WebSocket real-time (`WS /ws/telemetry`)

Tidak ada perubahan protokol. URL: `ws://localhost/ws/telemetry` (LAN :80), `ws://localhost:8080/ws/telemetry` (remote observasi), `ws://localhost:3001/ws/telemetry` (direct). Env frontend: `VITE_WS_TELEMETRY_URL`.

### 6.1 Koneksi & hardening

- Handshake RFC6455 `101`; validasi `Origin` (`localhost`, `127.0.0.1`, subnet RFC1918, host tunnel resmi) — `403` + tutup TCP bila asing.
- Rate limit 120 koneksi/menit/IP — tolak dengan close code `4429`. Klien wajib backoff eksponensial (1s→2s→4s…maks 30s) + jitter.
- `GET /health.ws_clients` = jumlah koneksi aktif (diag).
- Otorisasi: observasi publik; tidak ada token di WS. Aksi tetap via REST LAN+JWT (remote tunnel `403` untuk aktuasi).

### 6.2 Heartbeat

- Klien kirim teks `ping` tiap 25 dtk (`HEARTBEAT_MS=25_000` existing); server balas `pong` (abaikan di parser). Server juga `ping`/`pong` level socket 30 dtk + proteksi slow-client (`bufferedAmount > 1MB → terminate`).
- Klien anggap putus bila 2 heartbeat tanpa `pong`/frame → reconnect.

### 6.3 Frame yang wajib diterima (dual-accept)

Klien **wajib** menerima dua bentuk (transisi server):

A. Frame datar (terdokumentasi `API_DOCUMENTATION.md §4`):
```json
{ "timestamp": 1772629200, "device_id": "STM32-OEE-01", "machine_id": "CNC-MILLING-01", "wo_id": "WO-20260903-01", "fsm_state": "RUNNING", "counters": {"total":1420,"good":1402,"reject":18,"last_cycle_sec":4.48}, "time_metrics_sec": {"operating_time":14400,"run_time":12960,"downtime":1440}, "oee": {"availability":90.0,"performance":94.31,"quality":98.73,"total_oee":83.8}, "plc_modbus": {"spindle_rpm":1450.0,"temp_c":42.5,"alarm_code":0}, "hw_diag": {"uptime_sec":86420,"free_heap":48200}, "is_buffered": false }
```

B. Envelope relay (`relay.ts`):
```json
{ "type": "TELEMETRY_UPDATE", "topic": "oee/device/STM32-OEE-01/telemetry", "device_id": "STM32-OEE-01", "machine_id": "CNC-MILLING-01", "data": { "...TelemetryPayload..." }, "received_at": "2026-09-22T05:59:40.000Z" }
```

C. Lifecycle (tambah-tipe kapan saja, klien ignore-unknown):
```json
{"type":"MACHINE_BOUND","machine_id":"CNC-MILLING-03","device_id":"STM32-OEE-03"}
{"type":"MACHINE_UNBOUND","machine_id":"CNC-MILLING-01","device_id":"STM32-OEE-01"}
{"type":"MACHINE_DELETED","machine_id":"CNC-MILLING-03"}
{"type":"PRODUCT_DELETED","product_id":"PRD-GEAR-BOX-12"}
{"type":"WORK_ORDER_CANCELLED","device_id":"STM32-OEE-01","machine_id":"CNC-MILLING-01","data":{"wo_id":"WO-20260903-01","status":"ABORTED"}}
{"type":"DOWNTIME_REASON_LABELED","data":{"eventId":42}}
{"type":"WORK_ORDER_COMPLETED","data":{"wo_id":"WO-20260903-01"}}
```

Aturan render:

1. `is_buffered:true` → **jangan** gerakkan gauge/rate/progress 60fps; teruskan ke buffer (kontrak `isLiveTelemetryFrame()`).
2. Filter klien per `deviceId` fokus; frame mesin lain hanya untuk `MachineStatusZone`/badge (jangan re-render penuh).
3. Setiap `WORK_ORDER_*` / `MACHINE_*` / `DOWNTIME_REASON_LABELED` → invalidasi cache `shift-summary`/`resolve` + refetch ringan (bukan full reload).
4. Reconnect → refetch `GET /live-state/:device` + `aggregate?bucket=5m` sekali (resync), lalu lanjut WS.
5. Payload MQTT ringkas (`a/p/q`, `tot/rej`, dsb.) tetap dipetakan via `mapTelemetryFrameDto` — jangan fork mapper baru.

### 6.4 Pola konsumsi per page

| Page | WS | REST pendamping |
|---|---|---|
| Shift Overview | WAJIB connect; update gauge/rate/progress tiap frame live; skip buffered | `aggregate` 30–60 dtk, `hourly` 5 mnt, `shift-timeline` 5–10 mnt (atau saat event `WORK_ORDER_*`/`DOWNTIME_REASON_LABELED`), `downtime/active` 30 dtk untuk badge |
| Detailed Audit | OPSIONAL connect (badge live + tombol Refresh); default tampilkan snapshot REST agar stabil diaudit | Full pagination `hourly` + `downtime` + `operational-events`; `export` untuk bukti |

---

## 7. Strategi integrasi frontend (`oee-dashboard-aistudio`)

Tanpa mengubah arsitektur berlapis (`ARCHITECTURE.md`): DTO mapper tetap satu-satunya yang tahu snake_case/envelope; `TelemetryWsClient` tetap satu-satunya pemilik socket; use-case baru di `application/use-cases` (`GetShiftSummaryUseCase`, `GetShiftTimelineUseCase`, `SubscribeTelemetryUseCase` existing diperluas listener lifecycle); port baru di `domain/ports/IOeeBackend.ts` (`IShiftOeeRepository`); implementasi di `infrastructure/api/oeeApiClient.ts` + `endpoints.ts`.

Urutan implementasi:

- **Fase 0 (tanpa backend baru):** wire §2 ke `useOeeDashboard` bertahap per use-case; lane simulasi tetap default; tambah toggle `VITE_USE_BACKEND` bila perlu. Kriteria selesai: Shift Overview hidup dari `live-state`+`aggregate`+WS, Audit hidup dari `hourly`+`downtime`+`operational-events`+`export`.
- **Fase 1:** ganti hitungan shift klien dengan `GET /oee/shift-summary` + `shift-timeline` (fallback ke §2 bila 404). Kriteria: hapus drift A/P/Q antar layar, `PasXProgressStrip` dari server.
- **Fase 2 (opsional):** `downtime/summary?group_by`, WS filter server-side. Hanya bila profiling menunjukkan N+1 / traffic WS berlebih.

---

## 8. Checklist penerimaan (DoD)

- [ ] Shift 22:00–06:00 benar melewati tengah malam di kedua page (uji `from/to` + `shift=3`).
- [ ] Gauge tidak bergerak oleh frame `is_buffered:true` (uji backlog 72 jam).
- [ ] Audit cursor habis (`hasMore=false`) untuk 100+ downtime/operational events; `export csv|ndjson` terunduh.
- [ ] Baris historis dengan master terhapus tampil `[deleted]`, tidak 404.
- [ ] Reconnect WS ≤30 dtk dengan resync REST sekali; close `4429` di-backoff.
- [ ] Remote `:8080` tetap read-only (aksi `403`); mutasi hanya LAN+JWT.
- [ ] Tidak ada perubahan kontrak endpoint existing (uji regresi `endpoints.ts`).
- [ ] Timeline menampilkan shift window + overlay downtime (Active/Changeover/Breakdown/Waiting) dari data nyata, bukan mock.
- [ ] Saat mesin down, segmen downtime muncul di timeline + badge/panel; changeover (`SETUP_AND_ADJUSTMENT`) tampil sebagai segmen amber + baris PLANNED di Loss Analysis.
- [ ] Kategori downtime terisi dari prefix `[CATEGORY]` (`parseCategoryFromReason`); tidak ada `category: null` untuk event yang sudah di-label.

---

## 9. Referensi silang

- Backend REST/WS: `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` §1–§5.
- Skema DB: `iiot-oee/apps/backend/src/db/schema.ts` (`devices`, `machines`, `products`, `operators`, `work_orders`, `device_live_state`, `oee_telemetry_logs`, `operational_events`, `downtime_events`, `oee_hourly_summary`).
- Skema validasi: `src/schemas/telemetry.ts`, `src/schemas/downtime.ts`, `src/mqtt/schema.ts` (operational query), `src/utils/pagination.ts`.
- Relay: `src/websocket/relay.ts`, `src/plugins/ws-relay.ts`, route `src/routes/ws-telemetry.ts`.
- Frontend: `ARCHITECTURE.md`, `src/infrastructure/api/{endpoints,oeeApiClient,httpClient}.ts`, `src/infrastructure/realtime/telemetryWsClient.ts`, `src/application/dto/*.dto.ts`, `src/domain/ports/IOeeBackend.ts`, `src/presentation/pages/DashboardPage.tsx`, `src/presentation/components/fullscreen/FullscreenOeeView.tsx`.
