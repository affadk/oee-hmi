# Laporan Kekurangan Endpoint Backend (untuk Peningkatan `iiot-oee/apps/backend`)

> Tanggal: 23 Sep 2026 · Disusun dari audit migrasi total frontend `oee-dashboard-aistudio` ke lane backend.
> Acuan kontrak existing: `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md`.
> Prinsip: setiap gap di bawah ini **sudah ada workaround jujur di frontend** (tampilkan kosong/`—`/0, bukan data fabrikasi). Daftar ini agar backend bisa menutupnya bertahap.

---

## G1 — Rincian reject / scrap per alasan (Prioritas: TINGGI)

- **Kebutuhan UI:** `LossAnalysisZone` → panel "Reject & Scrap Breakdown" (paralel dengan Downtime Pareto).
- **Kondisi kini:** tidak ada endpoint. Frontend menampilkan daftar kosong + `Total: <rejectCount> pcs` dari `live-state`.
- **Dampak:** analisis defect per shift tidak bisa diaudit; sebelumnya ditutup dengan fabrikasi 60/30/10 — sudah dihapus.
- **Usulan:**
  ```http
  GET /api/v1/quality/rejects/:device_id?from=&to=&limit=&cursor=&envelope=
  → { data: [{ reason: string, count: number, pct: number }], meta }
  ```
  Sumber: kolom `reject_count` delta per `wo_id`/per jam dari `oee_telemetry_logs`, atau tabel `quality_events` baru bila alasan perlu input operator (sejajar `POST /downtime-events/:id/reason`).
- **Alternatif tanpa skema baru:** `GET /telemetry/:id/aggregate` diperkaya `rejectDelta` per bucket — frontend agregasi per alasan tetap butuh kolom alasan.

## G2 — Target produksi per jam (Prioritas: SEDANG)

- **Kebutuhan UI:** `TrendZone` Hourly Production (`Target N pcs/hr`), `EChartsProdVsTarget`.
- **Kondisi kini:** `GET /telemetry/:id/hourly` tidak membawa target. Workaround frontend: `target_per_jam = target_qty(WO) / jam_shift`, dihitung di `BackendMachineRepository`.
- **Usulan:** sertakan `target_per_hour` pada respons `shift-summary` Fase 2 (sudah dispec di `OEE_SHIFT_OVERVIEW_AND_AUDIT_API_SPEC.md §3.1`), atau field `hourly_target` di `work-orders/:id/resolve`.
- **Workaround kini:** cukup akurat; endpoint hanya untuk konsistensi antar layar.

## G3 — Status kesehatan edge controller (Prioritas: SEDANG)

- **Kebutuhan UI:** badge `Edge: OK/WARN`, panel `heap/tasks/stale`, tombol Edge I/O (disembunyikan di lane backend).
- **Kondisi kini:** health hanya via MQTT `oee/device/{id}/health` QoS0 tiap 5 dtk, tidak dipersist (FR-MQTT-006). Frontend backend menampilkan `0/0` → badge disembunyikan.
- **Usulan:**
  ```http
  GET /api/v1/devices/:deviceId/health
  → { timestamp, heap_free, tasks_healthy, tasks_total, stale_count, stale_tasks[], event_flags, age_sec }
  ```
  Implementasi ringan: cache payload health terakhir di memori/Redis saat relay MQTT masuk (tanpa migrasi DB), `age_sec` menandakan stale.
- **Workaround kini:** badge + tombol Edge I/O disembunyikan saat `useBackend=true`.

## G4 — Acknowledge / resolve alarm (Prioritas: RENDAH)

- **Kebutuhan UI:** `AlarmsZone` ack/resolve.
- **Kondisi kini:** tanpa endpoint; ack tersimpan lokal saja (`BackendAlarmRepository.updateAlarmStatus` memalsukan objek).
- **Usulan:** `PATCH /api/v1/operational-events/:id/ack {operator_id}` atau terima keputusan "alarm read-only, ack lokal saja" sebagai kontrak resmi.
- **Workaround kini:** lokal saja; antar sesi tidak sinkron.

## G5 — Umpan audit global lintas device (Prioritas: RENDAH)

- **Kebutuhan UI:** `AlarmsZone` agregat semua mesin tanpa N+1.
- **Kondisi kini:** `GET /operational-events/:deviceId` mewajibkan `deviceId` (path param). Frontend loop per device dari registry.
- **Usulan:**
  ```http
  GET /api/v1/operational-events?machine_id=&event_type=&from=&to=&limit=&cursor=&envelope=
  ```
  (query global, konsisten dengan pola cursor `{data,meta}` yang sudah ada).
- **Workaround kini:** fan-out per device di `BackendAlarmRepository.getAllAlarms` (50/event/device, cap 200).

## G6 — Penyelarasan nama state FSM (Prioritas: RENDAH, non-breaking)

- **Kondisi:** backend mengirim `PLANNED_DOWNTIME`/`UNPLANNED_DOWNTIME`; kontrak lama frontend memakai `PLANNED_DT`/`UNPLANNED_DT`.
- **Status:** sudah dinormalkan sisi klien (`live-state.dto.ts:normalizeState`). Tidak perlu perubahan backend; dicatat agar dokumentasi backend (§B/§4) dan skema `LiveStateResponseSchema` (`routes/live-state.ts`) menyebut himpunan FSM kanonis secara eksplisit.

## G7 — Pencatatan reject manual & pulsa counting (Prioritas: RENDAH — keputusan produk)

- **Kebutuhan UI lama:** tombol REJECT (+1), COUNT (+1), SPARE di `FloorPushButtonsPanel` (disembunyikan di lane backend).
- **Kondisi kini:** backend hanya kenal `finalRejectCount` saat `POST /work-orders/:id/complete`. Tidak ada endpoint "tambah 1 reject" / "pulsa counting" (benar: counting adalah domain edge/sensor, bukan REST).
- **Usulan:** nyatakan resmi bahwa lantai fisik/PLC adalah satu-satunya sumber counting; `LogEventModal` tab defect tetap disembunyikan di backend. Jika dibutuhkan, tambah `POST /work-orders/:id/reject {count, reason}` yang tervalidasi terhadap `totalCount`.
- **Workaround kini:** disembunyikan; reject hanya via complete WO.

## G8 — Pemicu UI untuk RESET_COUNTER di lane backend (Prioritas: SEDANG)

- **Kondisi:** `POST /devices/:id/command` mendukung `RESET_COUNTER` (SUPERVISOR/ADMIN, LAN), dan `BackendMachineRepository.resetCounters` sudah memanggilnya — tetapi satu-satunya pemicu UI (`FloorPushButtonsPanel`, `MqttEdgeInspectorModal`) disembunyikan di lane backend.
- **Usulan (frontend, tanpa backend baru):** tambahkan aksi Reset (dengan guard konfirmasi + RBAC) di `MachineStatusZone`/`DeviceConfigModal` saat backend. Dicatat di sini agar tidak terlupakan.

---

## Ringkasan prioritas

| ID | Endpoint/usulan | Prioritas | Status frontend sementara |
|---|---|---|---|
| G1 | `GET /quality/rejects/:device_id` | TINGGI | Daftar kosong + total reject nyata |
| G2 | `target_per_hour` di shift-summary/resolve | SEDANG | Diturunkan klien dari WO |
| G3 | `GET /devices/:id/health` (cache) | SEDANG | Badge disembunyikan |
| G8 | Pemicu RESET_COUNTER di UI backend | SEDANG | Aksi tersedia di API, tanpa tombol |
| G4 | `PATCH /operational-events/:id/ack` | RENDAH | Ack lokal |
| G5 | `GET /operational-events` global | RENDAH | Fan-out per device |
| G6 | Dokumentasikan himpunan FSM | RENDAH | Dinormalkan klien |
| G7 | `POST /work-orders/:id/reject` (opsional) | RENDAH | Disembunyikan |
