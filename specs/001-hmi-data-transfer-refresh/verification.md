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
| AC-003 429 countdown | T008 unit (retryAfterSec 42) + T022 | unit PASS; countdown UI manual pending | PARTIAL |
| AC-004 rotation gate | implementasi + T022 | kode flag+403 code ada; E2E rotasi butuh akun must_change_password (bootstrap/reset) — pending | PARTIAL |
| AC-005 refresh & AUTHZ_STALE | T008 unit + T022 E2E | **PASS 2026-11-20**: refresh 200 via :3002; AUTHZ_STALE propagate unit; timer 5m kode | PASS |
| AC-006 capability gate RESET | T021 + T022 | TBD | — |
| AC-007 read-only tunnel | T021 + T022 (via :8080) | TBD | — |
| AC-008 FSM live | T015 unit (fsm map + merge statusSince) + T022 UI | unit PASS 2026-11-20; transisi live UI pending | PARTIAL |
| AC-009 online badge live | T015 unit (mapper DEVICE_STATUS_UPDATE) + hook merge + T022 | unit PASS; LWT live pending | PARTIAL |
| AC-010 lifecycle refetch | T015 unit (mapper 26 tipe + scheduler dedupe) + T022 | unit PASS 2026-11-20; event live pending | PARTIAL |
| AC-011 resync reconnect | T015 unit (merge + onReconnect boot-exempt) + T022 | unit PASS 2026-11-20; putus WS live pending | PARTIAL |
| AC-012 close 4403/4429 | T015 unit (fake WS close codes) | **PASS 2026-11-20**: 4403 stop+onFatal; 4429 ≥60s; normal ~1s | PASS |
| AC-013 staleness | T022 (stop telemetri > TTL) | pending | — |
| AC-014 COUNT_ADJUST | T015 unit (body count + guard) | **PASS 2026-11-20** level gateway; aktuasi live tidak dijalankan (safety) | PASS |
| AC-015 PENDING_CLOSE complete | T008 unit (dto+guard) + T022 (BATCH_FINISHED) | unit PASS 2026-11-20 (status+fields+isActive); guard hook TBD | PARTIAL |
| AC-016 DTO dua skema | T021 unit | TBD | — |
| AC-017 null ≠ 0 | T021 unit + T022 visual `—` | TBD | — |
| AC-018 availability fallback | T021 unit vs contoh docs | TBD | — |
| AC-019 ack bersih | T021 + T022 (ack ganda) | TBD | — |
| AC-020 lint/test/layout beku | T023 (`pnpm lint`, `pnpm test`, diff review) | **PASS 2026-11-20**: lint+137 test hijau; diff presentasi = AuthPinModal (authorized) + 4 file type-only (import+union, nol JSX) + DashboardPage wiring | PASS |

## Known Deviations

None (belum implementasi).

## Residual Risks

- Kontrak backend hidup dapat berbeda dari docs (riwayat G17–G22) — T001 probe memitigasi; sisa risiko dicatat saat E2E.
- localStorage token (XSS inheren) — accepted di design §Security, di luar kendali unit ini.
