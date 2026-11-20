# Project Implementation Status — oee-dashboard-aistudio

> Ledger eksekusi repo. Melaporkan state, bukan mendefinisikan requirement/backlog (itu `specs/` dan produk).

## Current Position

Phase: 0 (inisiasi SDD)
Unit: `specs/001-hmi-data-transfer-refresh` (aktif) · `specs/002-hmi-station-surfaces` (CLARIFYING)
Stage: Verifying — unit 001 T001–T024 selesai; unit 002 plan/design/tasks DRAFT menunggu ADR-0004
Current Task: — (gate: ADR-0004 Accepted → unit 002 READY)

## Completed

- [x] Audit data transfer HMI vs API_DOCUMENTATION Nov 2026 → `docs/specs/hmi-data-transfer-2026-11.md`
- [x] Inisiasi SDD: konstitusi, context, governance, manifest, AGENTS.md
- [x] ADR-0001/0002/0003 ditulis (Proposed)
- [x] Rantai unit 001: spec + plan + design + tasks + verification
- [x] OQ-001..004 dijawab pemilik repo (delegasi 2026-11-20) → spec rev 2; downstream reviewed rev 2
- [x] Gap register aktif → `docs/specs/gap-register-2026-11.md` (20 gap FE + 5 gap backend/docs)
- [x] Tinjauan workflow HMI/Station/admin-panel (directive produk 2026-11-20) → `specs/002-hmi-station-surfaces/research.md` + spec CLARIFYING + ADR-0004 Proposed; gap F17–F20, B04–B05 dicatat
- [x] OQ-101..105 determined dari backend HIDUP (probe oee.fadik.web.id + 8080/8081 + kode) → spec 002 rev 2; GAP-B04/B05 CLOSED; GAP-B06 (posture dev publik) dieskalasi

## In Progress

- [>] Menunggu acceptance ADR-0004 (unit 002) + skenario visual manual unit 001 (pemilik)

## Next

- [ ] Acceptance ADR-0004 → design 002 DESIGNED/VALID → tasks READY → Fase 1 unit 002 (T101..)
- [ ] Skenario visual manual unit 001 (browser): countdown 429, rotation dialog, badge staleness/online, gap chart → AC PARTIAL jadi PASS
- [ ] **Pemilik backend/deploy**: GAP-B06 (posture dev tunnel publik) + GAP-B07 (anomali data sim operatingSec/performancePct)

## Blocked

- [!] Unit 002 implementasi terblokir ADR-0004 Proposed (gate konstitusi).
- [!] AC visual unit 001 butuh browser/manual pemilik — bukan blocker kode.

## Direction

Perombakan lapisan data transfer saja (auth password, realtime WS lengkap, DTO kanonis) dengan layout live monitor beku. Fase 1 auth/WO dulu karena blocking (PIN endpoint sudah 404 di backend); realtime lalu kontrak data. Semua perubahan traceable FR→ADR→task→bukti.

## Progress History

### 2026-11-20
- Audit selesai: P0 auth PIN→404, PENDING_CLOSE hilang, rotation gate tak ditangani; P1 FSM/lifecycle/resync/close-code/perintah; P2 DTO kanonis/capability/access-mode.
- SDD diinisiasi (governance 1.0, profile minimal-adapted); unit 001 + 3 ADR dibuat; implementasi belum dimulai (gate acceptance).
- OQ-001..004 dijawab (delegasi pemilik repo): env VITE_STATION_ID+store+query; poll 60s; tunnel in-scope; unknown fail-closed. Spec rev 2; plan/design/tasks reviewed rev 2; constraint station context dicatat.
- Gap register aktif dibuat: `docs/specs/gap-register-2026-11.md` (GAP-F01..F16, GAP-B01..B03).
- Tinjauan workflow surface (directive produk): definisi HMI standar mendukung HMI lokal per-device vs Station operator-interface; preseden v1 (StationPage/AndonPage/SupervisorPage/MultiZoneWizardModal) dipetakan; unit 002 CLARIFYING + ADR-0004 Proposed; GAP-F17..F20 + GAP-B04..B05 ditambah; QR ≠ autentikasi (dispatch wajib Bearer) dicatat sebagai temuan kritis.
- Probe backend hidup (8080=LAN vhost, 8081=loopback tunnel vhost, oee.fadik.web.id=tunnel): v1 frontend live di LAN; guard validate-zone/initiate = Bearer+LAN (kode); atribusi ganda QR/sesi (kode); OQ-101..105 resolved → spec 002 SPECIFIED rev 2; GAP-B06 dibuka: deployment publik me-mount override dev (docs publik + full-api tunnel) — eskalasi pemilik backend/deploy.
- Implementasi Fase 1 unit 001 (T001–T008): ADR-0001/0002/0003 Accepted via directive; proxy vite → http://localhost:8080 (lokal); auth password + station context + rotation gate + refresh timer + capability/access-mode fetch; PENDING_CLOSE + guard complete; AuthPinModal → password (visual parity); 3 file test baru; `pnpm lint` + `pnpm test` hijau (115 test); smoke proxy :3002 → live-state 200, login invalid 401 generik. Dev server dimatikan setelah smoke.
- Deploy HMI ke stack: codebase dicopy ke `iiot-oee/apps/hmi` (rsync, exclude .git/node_modules/coverage/agent dirs; dist ikut); service `hmi` (nginx:alpine, host 3002) ditambah ke `docker/podman-compose.dev.yml` + `docker/nginx/hmi.conf`; grup podman `iiot-oee-dev` kini 7 container (`iiot-oee-hmi-dev` Up). Verifikasi: live-state/machines 200, login invalid 401, WS upgrade 101. Fix: header ingress kanonik `factory-lan` (bukan `lan`) + restart container (inode bind mount). `apps/hmi` punya node_modules sendiri (install --ignore-workspace + rebuild esbuild) → rebuild mandiri `cd apps/hmi && pnpm build`.
- Fase 2 unit 001 (T009–T015): WS close 4403 stop+onFatal / 4429 backoff ≥60s+jitter / onReconnect resync; mapper lifecycle 26 tipe; merge FSM→status+statusSince (domain `fsmToMachineStatus`); DEVICE_STATUS_UPDATE→connectionStatus; scheduler debounced refetch 1.5s dedupe (fleet/registry/supplemental); `useFleetResync` poll 60s; perintah 6 enum + COUNT_ADJUST count (guard 0..999999); type-only union di presentasi (nol JSX). 3 file test baru; lint + 137 test hijau.
- E2E kredensial (directive pemilik): bootstrap ADM-001 dari docker/.env → login 200 via :3002 → create OPR-E2E-01 (201, password dev saat pembuatan) → login+station valid 200, /auth/me nested {access,operator,authz} (konfirmasi GAP-B02 bentuk live), refresh 200, station machineId → 400 STATION_NOT_FOUND. AC-001/002/005/012/014/020 PASS; sisanya PARTIAL (skenario UI/live manual).
- Sync Fase 2 ke apps/hmi (rsync src) + rebuild dist → container menyajikan build baru tanpa restart.
- Fase 3 unit 001 (T016–T021): DTO kanonis `*Pct` menang + null-preserving + provisional/operatingSec/runSec/sampleCount; TrendZone gap null + tooltip `—`, ECharts null guard; parity availability fallback terbukti (85.7 = run/(run+udt), tanpa ubah formula); capabilityGate + gate boolean dashboard + disable tombol (FloorPushButtons/KontrolTab/ProductionSetup/LogEvent/Alarms/DeviceConfig) + title alasan; ack body {note} saja. Amandemen OQ-004/FR-007/AC-006 (spec rev 3 + ADR-0002): live OPERATOR `device_command.send=unknown` (shadow) → UI deny-only, enforcement backend; dev ACCESS_MODE=public → tunnel mutations_allowed=true (private-mode E2E pending). 147 test hijau; sync+build apps/hmi.
- Commit & push: repo ini (docs SDD + feat F1-F2) dan iiot-oee (apps/hmi + compose hmi) — perubahan backend lain milik pemilik TIDAK disentuh.
- T022–T024: E2E 429+Retry-After 60 live; capture WS relay transisi FSM (st=4 → UNPLANNED_DOWNTIME) + DEVICE_STATUS_UPDATE offline/online via stop/start edge-sim; null aggregate live (performancePct/oeePct null); staleness age 72478s; **sunset alias legacy DTO** (live kanonis penuh) + map counter aggregate outputDelta/goodDelta/rejectDelta; test legacy diperbarui; 148 test hijau. GAP-B01/B02 CLOSED; GAP-B07 dibuka (anomali data sim). Unit 002 plan/design/tasks DRAFT dibuat (gate ADR-0004).
