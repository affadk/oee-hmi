# Domain Context — HMI OEE

> Pengetahuan domain sistem. Dokumen ini PENUNJUK, bukan salinan — otoritas ada di sumber yang dirujuk (single source of truth).

## Sistem

HMI (Human-Machine Interface) OEE = SPA React pemantau Overall Equipment Effectiveness mesin produksi (CNC). Sesuai definisi standar (Wikipedia *User interface* §Terminology): HMI lokal satu mesin; operator interface multi-mesin via host. Sejak directive produk 2026-11-20 (ADR-0004, unit 002), sistem memiliki **empat surface**:

| Surface | Peran | Auth | Isi |
|---|---|---|---|
| HMI kiosk | live OEE satu device terikat + start produksi 4 QR | sesi operator (password + station_id) | live monitor per device, stepper QR, label downtime, complete WO |
| Station | operator interface supervisory | login kredensial admin-set | fleet kartu device RUNNING → pilih → live OEE |
| Andon | display publik/remote | tanpa auth (public read) | agregat plant read-only, tunnel-safe |
| Admin-panel | manajemen & historical | admin/supervisor | telemetry history, rollup, export, master, IAM (di luar HMI; rumah = OQ-105) |

Bagian dari sistem IIoT OEE multi-repo:

| Repo | Peran | Otoritas |
|---|---|---|
| `oee-dashboard-aistudio` (ini) | HMI/Andon frontend | perilaku unit: `specs/`; struktur: `ARCHITECTURE.md` |
| `iiot-oee/apps/backend` | Fastify ingestion daemon + MQTT engine + WS relay + REST | kontrak wire: `docs/API_DOCUMENTATION.md`; keputusan backend: `decisions/` |
| Edge STM32 (firmware, repo iiot-oee) | counting sensor, FSM, health, store-and-forward 72h | topik MQTT `oee/device/{id}/*` |

## Alur data inti

Edge → MQTT → backend (micro-batch → TimescaleDB; hot-path → WS relay < 50ms) → HMI (boot REST `live-state`, live WS, agregat CAgg `oee/*`). Aksi operator → REST (LAN-only, audited) → MQTT command → edge.

## Rujukan wajib sebelum kerja

1. `ARCHITECTURE.md` (repo ini) — layer hexagonal, dual-lane, aturan dependensi.
2. `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` — kontrak endpoint/WS/auth/error.
3. `.sdd/context/constraints.md` — constraint berdiri (layout beku, LAN-only, null≠0).
4. `docs/specs/hmi-data-transfer-2026-11.md` — audit gap terkini (bukti, bukan requirement; requirement otoritatif di `specs/001-*/spec.md`).
