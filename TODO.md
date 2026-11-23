# Project Implementation Status — oee-dashboard-aistudio

> Ledger eksekusi repo. Melaporkan state, bukan mendefinisikan requirement/backlog (itu `specs/` dan produk).

## Current Position

Phase: 1 (unit 003 terimplementasi + terdeploy; verifikasi kode/smoke hijau)
Unit: `specs/003-qr-dual-lane-initiation` (VERIFIED kode+smoke, lifecycle fisik PARTIAL) · `specs/002-hmi-station-surfaces` (verifikasi visual manual pending) · `specs/001-hmi-data-transfer-refresh` (verifikasi visual manual pending)
Stage: Done — unit 003 T201–T213 selesai; `pnpm lint` hijau, `pnpm test` 200/29 hijau, dist sync `iiot-oee/apps/hmi` (`index-CANDx4b_.js`), nginx :3002 200; FAT-252 (b) gate aksi sensitif + ADR-0004 §A amandemen (FAT-248/260) — commit `542965f`
Current Task: — (AC lifecycle penuh jalur A/B + kamera fisik + timeout edge-sim offline = manual pemilik; GAP-F21..F26 CLOSED)

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

- [>] E2E manual (scan kamera + visual) unit 001/002 — bagian executable T116 dieksekusi (probe 2026-11-23); sisa pemilik: scan kamera dual-lane 4 badge → RUNNING, visual countdown/rotation/staleness/mismatch/station/andon/auto-lock — verification.md T116. T117: diff-review + sync OK, lint+test 199 hijau, root apps/hmi tidak berubah.

## Next

- [x] **Unit 003**: OQ-201..204 resolved + ADR-0005 Accepted (2026-11-20) → spec SPECIFIED rev 2 + design DESIGNED + tasks READY
- [x] **Unit 003 implementasi**: T201–T213 selesai — parser badge zona (cermin backend), routing dual-lane (kamera zona / textfield WO), draft backend kosong fail-closed, panel konfirmasi 4 zona, ACK wait bounded (2s/20s), E2E smoke (validate 3 zona 200, resolve 200, initiate 409 fail-closed), deploy dist `index-CUoL8a90.js`. lint+199 test hijau; GAP-F21..F26 CLOSED. Sisa manual: lifecycle 200→ACK→ACTIVE + kamera fisik + timeout edge-offline.
- [x] **Unit 002 executable — T116 (dieksekusi 2026-11-23)**: probes GET (`/auth/me`, `/system/access-mode`, `/live-state`, `/fleet`, `/machines`) 200, HMI :3002 200; mutasi POST → 405 sandbox (guard kode enforced T111/T114); bukti verification.md T116. **T117 (2026-11-23)**: diff-review freeze 0 perubahan (hanya additive prop pass-through 3 file/14 baris); `diff -rq aistudio/dist iiot-oee/apps/hmi/dist` SYNC_OK; build ✓; lint+test 29/199 hijau; root apps/hmi tidak berubah (commit/push no-op) — bukti verification.md T117.
- [ ] Skenario visual manual unit 00001 (browser): countdown 429, rotation dialog, badge staleness/online, gap chart → AC PARTIAL jadi PASS (sisa pemilik, T116)
- [ ] E2E scan fisik 4-zona QR → initiate → dispatch → RUNNING (kamera); OID-mismatch konfirmasi; station kartu klik→live; andon publik; auto-lock 5m
- [ ] **Pemilik backend/deploy**: GAP-B06 (posture dev tunnel publik) + GAP-B07 (anomali data sim operatingSec/performancePct)

## Blocked

- [!] AC visual unit 001/002 butuh browser/manual pemilik — bukan blocker kode.

## Direction

Perombakan lapisan data transfer saja (auth password, realtime WS lengkap, DTO kanonis) dengan layout live monitor beku. Fase 1 auth/WO dulu karena blocking (PIN endpoint sudah 404 di backend); realtime lalu kontrak data. Semua perubahan traceable FR→ADR→task→bukti.

## Progress History

### 2026-11-20
- Audit selesai: P0 auth PIN→404, PENDING_CLOSE hilang, rotation gate tak ditangani; P1 FSM/lifecycle/resync/close-code/perintah; P2 DTO kanonis/capability/access-mode.
- SDD diinisiasi (governance 1.0, profile minimal-adapted); unit 001 + 3 ADR dibuat; implementasi belum dimulai (gate acceptance).
- **Unit 003 (2026-11-20):** implementasi penuh T201–T213 — parser `QrZoneBadge.ts` cermin backend (alias/CT/overnight/BREAK/TARGET/DATE), routing dual-lane kamera-vs-textfield (`qrRouting.ts`), draft backend kosong fail-closed + panel konfirmasi 4 zona (`BackendZoneStep`/`BackendReviewStep`), ACK wait bounded (`useWorkOrderAckWait` 2s/20s) di modal QR + Setup, `AckStatusPanel`. Fix bug deteksi multi-zone (NAME bukan kunci diskriminatif). lint hijau + 199 test/29 file; E2E smoke: validate PRODUCT/OPERATOR/SHIFT 200 (DATE badge menang, plannedOperatingSec 28800), jalur B resolve 200, initiate 409 fail-closed (BR-002). Nuansa: CT-vs-master ditegak di initiate (bukan validate). Deploy dist `index-CUoL8a90.js` → apps/hmi, nginx :3002 200. GAP-F21..F26 CLOSED. Diff live-monitor beku = plumbing `ackWait` (nol visual). Sisa manual: lifecycle penuh + kamera fisik + timeout edge-offline.
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
- Unit 002 implementasi selesai (T101–T117): surfaceMode resolver (kiosk device-bound, station login-first, andon publik read-only); DashboardPage switcher hide kiosk + label mode; FleetCardsPanel kartu RUNNING station-only klik→live; BatchQrScannerModal initiate-from-zones (validate 4 zona → initiate → dispatch, OID-mismatch konfirmasi); qrZones builder §C.8; MachineRecord.lineId; runProtected generic; App.tsx /audit→/overview redirect + nav exit; useInactivityLock (5m VITE_INACTIVITY_TIMEOUT_MS, pause tab hidden, soft logout, kiosk dikecualikan). Live monitor layout beku (hanya additive prop pass-through 3 file/14 baris). tests 169/26 hijau; lint:arch OK; sdd-check 0 FAIL (Spec: refs ditambahkan ke tasks). Build + sync apps/hmi + rebuild dist; podman iiot-oee-hmi-dev menyajikan index-D7JkFG_1.js (unit 002). E2E smoke: /auth/login 200 (snake_case), /work-orders/validate-zone + /initiate-from-zones route live (400/UNAUTHORIZED, bukan 404). Commit: repo ini 3636a84, iiot-oee b73346d (apps/hmi saja). AC scan kamera fisik + visual manual pending pemilik.
- Unit 003 direncanakan (CLARIFYING): analisis sinkronisasi scan 4 badge fisik → GAP-F21..F26 (parser tak kenal PID/MID/OID/SID; semua scan backend-mode → resolve WO, draft tak terisi badge; fallback katalog demo → MASTER_NOT_FOUND fiktif; LINE/DATE/TARGET sintesis lokal; footer tak sadar-lane; klaim "WO aktif" pra-ACK). Artefak: specs/003-qr-dual-lane-initiation/{spec,plan}.md + ADR-0005 Proposed (parser zona cermin backend, routing auto-deteksi dual-lane A/B, draft fail-closed, tunggu ACK bounded 2s/20s). GAP-F17 CLOSED (pipa initiate wired unit 002). Temuan: guard START sudah ACK-aware via data (jobConfig hanya dari WO ACTIVE, BackendMachineRepository.ts:371) → panel beku tak perlu ubah. OQ-201..204 menunggu pemilik; implementasi belum dimulai (gate).
- Unit 003 gate terpenuhi: OQ-201..204 resolved pemilik (auto-deteksi lane; **textfield hanya jalur WO, badge zona wajib kamera**; **panel konfirmasi konfigurasi sebelum tulisan ke edge**; draft kosong+blok; ACK poll bounded 2s/20s; kiosk localhost). Spec rev 2 SPECIFIED + plan PLANNED + design DESIGNED + tasks READY (T201–T213); ADR-0005 Accepted. Implementasi belum dimulai.
