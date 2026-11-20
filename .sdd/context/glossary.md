# Glossary — HMI OEE

| Istilah | Arti |
|---|---|
| HMI | Human-Machine Interface — SPA monitoring + kontrol operator di lantai pabrik |
| Andon | TV/display status produksi publik (read-only, tanpa auth) |
| OEE | Overall Equipment Effectiveness = Availability × Performance × Quality |
| A/P/Q | Availability / Performance / Quality (persen) |
| FSM | Finite State Machine mesin; kanonis 6: UNCONFIGURED, READY, RUNNING, PLANNED_DOWNTIME, UNPLANNED_DOWNTIME, BATCH_FINISHED |
| WO | Work Order — perintah produksi per mesin per shift instance; status PENDING/ACTIVE/PENDING_CLOSE/COMPLETED/ABORTED |
| PENDING_CLOSE | WO selesai batch (telemetri BATCH_FINISHED), menunggu konfirmasi operator |
| Shift instance | WO terikat shift_id + shift_date; shift tengah malam tetap satu instance |
| Lane | Jalur data: simulasi (InMemory, dev) vs backend (REST+WS nyata) — `VITE_USE_BACKEND` |
| DTO boundary | Lapisan mapper infrastructure penerjemah wire→domain; satu-satunya tempat key kontrak disentuh |
| Station context | deviceId kiosk terdaftar tempat HMI terpasang; dikirim saat login (bukan kredensial) |
| Capability | Proyeksi hak `<domain>.<action>` dari `GET /auth/me`: allow/deny/unknown |
| Access mode | `GET /system/access-mode`: kanal lan/tunnel + mutations_allowed |
| CAgg | TimescaleDB Continuous Aggregate (hourly/daily summary); refresh policy 5 menit |
| Provisional | Bucket agregat belum final (CAgg belum refresh penuh) |
| UDT | Unplanned Downtime — basis availability baru: run/(run+UDT) |
| is_buffered | Frame backlog store-and-forward edge; tidak boleh menggerakkan gauge live |
| LWT | MQTT Last Will Testament — sinyal device offline |
| Dual-vhost | Perimeter backend: LAN :80 read-write vs tunnel :8080 read-only |
| Six Big Losses | Kategori downtime (EQUIPMENT_FAILURE, SETUP_AND_ADJUSTMENT, dst.) |
| Debounced refetch | Baca ulang REST tertunda ≤2s setelah event WS lifecycle (bukan fabrikasi state) |
| Resync | Rekonsiliasi fleet via `GET /live-state` setelah WS (re)connect |
