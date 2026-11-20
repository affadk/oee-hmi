# Verification — Spec 001 Pembaruan Data Transfer HMI

**Traces to:** `spec.md`, `design.md`, `tasks.md` (unit ini)
**Verification Status:** IN PROGRESS

> VERIFIED hanya bila SEMUA AC pass dengan bukti tercatat. Test suite hijau saja tidak cukup.
> E2E dijalankan terhadap stack `iiot-oee` hidup (docker, nginx :80). Bukti = output test + catatan skenario manual (network/log).

## Acceptance Criteria Results

| AC | Test(s) | Evidence | Result |
|---|---|---|---|
| AC-001 login password | T008 unit + T022 E2E | **PASS 2026-11-20**: E2E via HMI :3002 — admin bootstrap login 200, operator baru OPR-E2E-01 login 200; boot live-state 200. Klik UI manual pending pemilik | PASS |
| AC-002 station context | T008 unit + T022 E2E | **PASS 2026-11-20**: station valid STM32-OEE-01 → 200; machineId CNC-MILLING-01 → 400 STATION_NOT_FOUND (guard backend terbukti); unit picker rantai+validasi | PASS |
| AC-003 429 countdown | T008 unit + T022 E2E | **PASS 2026-11-20**: 5 login gagal → percobaan ke-6 = 429 + `Retry-After: 60` live via :3002; countdown UI unit (retryAfterSec) | PASS |
| AC-004 rotation gate | implementasi + T022 | kode flag+403 code ada; E2E rotasi butuh akun must_change_password (bootstrap/reset) — pending | PARTIAL |
| AC-005 refresh & AUTHZ_STALE | T008 unit + T022 E2E | **PASS 2026-11-20**: refresh 200 via :3002; AUTHZ_STALE propagate unit; timer 5m kode | PASS |
| AC-006 capability gate | T021 unit (canMutate) + probe live + T022 UI | **PASS 2026-11-20**: live OPR-E2E-01 `work_order.cancel=deny`, `machine.update=deny` → tombol nonaktif; `device_command.send=unknown` → aktif + enforcement backend (amandemen rev 3); unit deny/read-only/sim | PASS |
| AC-007 read-only tunnel | T021 unit + probe access-mode | unit PASS; live dev `ACCESS_MODE=public` → tunnel `mutations_allowed=true` (public mode by design); gate read-only teruji unit untuk `false`; E2E private-mode pending | PARTIAL |
| AC-008 FSM live | T015 unit + T022 relay capture | unit PASS; **relay live**: publish st=4 → frame `UNPLANNED_DOWNTIME` tertangkap di WS < 1s (ws-e2e.mjs); merge UI unit; visual manual pending | PARTIAL |
| AC-009 online badge live | T015 unit + T022 LWT capture | unit PASS; **live**: podman stop/start edge-sim → `DEVICE_STATUS_UPDATE` offline lalu online tertangkap (ws-lifecycle-e2e.mjs); badge UI manual pending | PARTIAL |
| AC-010 lifecycle refetch | T015 unit + T022 capture | unit PASS; live envelope TELEMETRY/HEALTH/DEVICE_STATUS terverifikasi; DOWNTIME_*/WO_COMPLETED tidak ter-trigger (sim interleave UNCONFIGURED; butuh WO aktif transisi RUNNING→UNPLANNED) — pending | PARTIAL |
| AC-011 resync reconnect | T015 unit (merge + onReconnect boot-exempt) + T022 | unit PASS 2026-11-20; putus WS live pending | PARTIAL |
| AC-012 close 4403/4429 | T015 unit (fake WS close codes) | **PASS 2026-11-20**: 4403 stop+onFatal; 4429 ≥60s; normal ~1s | PASS |
| AC-013 staleness | telemetry-freshness unit + T022 probe | unit PASS; **live**: STM32-OEE-01 lastTelemetryAt age 72478s (> TTL 300s) → data staleness nyata tersedia untuk badge; visual manual pending | PARTIAL |
| AC-014 COUNT_ADJUST | T015 unit (body count + guard) | **PASS 2026-11-20** level gateway; aktuasi live tidak dijalankan (safety) | PASS |
| AC-015 PENDING_CLOSE complete | T008 unit (dto+guard) + T022 (BATCH_FINISHED) | unit PASS 2026-11-20 (status+fields+isActive); guard hook TBD | PARTIAL |
| AC-016 DTO kanonis | T021 unit + probe live | **PASS 2026-11-20**: live hourly/aggregate = kanonis `*Pct`; alias legacy di-sunset (ADR-0003 kriteria terpenuhi); counter aggregate `outputDelta/goodDelta/rejectDelta` terpetakan | PASS |
| AC-017 null ≠ 0 | T021 unit + probe live + T022 visual | unit PASS; **live aggregate**: `performancePct: null`, `oeePct: null` nyata → domain null, chart gap/`—`; visual manual pending | PARTIAL |
| AC-018 availability fallback | T021 unit vs contoh docs | **PASS 2026-11-20**: 360/(360+60)=85.7 = run/(run+udt); planned tidak menurunkan A | PASS |
| AC-019 ack bersih | T021 unit + T022 (ack ganda) | **PASS 2026-11-20** unit body {note}; idempotensi backend by docs | PASS |
| AC-020 lint/test/layout beku | T023 (`pnpm lint`, `pnpm test`, diff review) | **PASS 2026-11-20**: lint + 148 test hijau; diff presentasi = AuthPinModal + wiring deps + atribut disabled/title (RBAC, FR-007) + null-guard chart; nol perubahan struktur layout | PASS |

## Known Deviations

- Amandemen spec rev 3 (bukti live 2026-11-20): gate capability UI = deny-only + read-only; `unknown`/absen/null ditegakkan backend (shadow mode). Tercatat di spec §11 + ADR-0002 amandemen — bukan penyimpangan implementasi.
- Trigger UI untuk PLANNED_DT_START/END + COUNT_ADJUST belum ada tombol baru (freeze layout); data layer + type union siap (FR-015). Tombol = keputusan produk/unit 002.

## Residual Risks

- Kontrak backend hidup dapat berbeda dari docs (riwayat G17–G22) — T001 probe memitigasi; sisa risiko dicatat saat E2E.
- localStorage token (XSS inheren) — accepted di design §Security, di luar kendali unit ini.
- **GAP-B07 (data sim, bukan klien)**: hourly live SIM `performancePct: 6626.98` + `operatingSec: 11331609` (~131 hari) = anomali seed/akumulasi sim; klien menampilkan apa adanya (jujur). Eskalasi backend/sim.
- Skenario visual manual (browser) pending pemilik: countdown UI, rotation dialog, badge staleness/online, gap chart, private-mode tunnel.
