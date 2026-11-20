# Tasks — Spec 001 Pembaruan Data Transfer HMI

> Turunan `design.md` + `spec.md` rev 1. Urut dependensi. Gap requirement → perbaiki spec, bukan diam-diam di sini.
> **Gate terpenuhi 2026-11-20:** ADR-0001/0002/0003 Accepted + design DESIGNED/VALID + OQ resolved. Fase 1 IMPLEMENTING.

**Lifecycle:** IMPLEMENTING
**Health:** VALID
**Traces to:** `design.md`, `spec.md` (unit ini)
**Reviewed against:** spec revision 3, design DESIGNED/VALID (review rev 3: amandemen capability gate sesuai bukti live; T019 memakai canMutate deny-only)

## Fase 1 — Auth & WO (P0)

- [x] T001 Probe backend hidup: `/auth/login`, `/auth/me`, `/system/access-mode`, `/auth/password/change` — catat payload nyata vs docs (design §Migration) [FR-001..FR-008] — probe 2026-11-20: LAN 8080 health ok; validate-zone noauth 401 (guard kode `[enforceSubnetOrigin, authorize]`); login reachable; bentuk respons dari docs (kredensial uji tidak tersedia → E2E login penuh = T022)
- [x] T002 `endpoints.ts` + `httpClient.ts`: path auth baru; `BackendHttpError.retryAfterSec` + code propagate [FR-001/003/004/005/006] (depends T001)
- [x] T003 `IAuthGateway` + `OeeHttpAuthGateway` rewrite: loginWithPassword, changePassword, getCapabilities, getAccessMode, refreshSession error-aware [FR-001/004/006/007/008] (depends T002)
- [x] T004 Station context resolver (rantai query→store→env; hanya deviceId terdaftar) + persist store [FR-002, OQ-001] (depends T003)
- [x] T005 `useAuthSession`: password login, rotation gate (flag + 403 code), refresh timer ≤5m + pre-action, AUTHZ_STALE logout paksa, countdown 429 [FR-003/004/005/006] (depends T003, T004)
- [x] T006 `AuthPinModal` → form password + mode ganti password, visual parity; wiring DashboardPage → loginWithPassword [FR-001, BR-003] (depends T005)
- [x] T007 `WorkOrder.ts` + dto: `PENDING_CLOSE`, field workflow aditif; guard complete `finalRejectCount ≤ totalCount`; 409 unclassified → arah pelabelan [FR-016] (depends T002)
- [x] T008 Test fase 1: auth-gateway (login/station/429/refresh/rotasi/capability/access-mode), station-context, work-order-pending-close, endpoints; `pnpm lint` + `pnpm test` hijau (115 test) [AC-001..AC-005, AC-015, AC-020] (depends T002..T007)

## Fase 2 — Realtime & perintah (P1)

- [x] T009 `TelemetryWsClient`: close-code 4403/4429 policy, `onReconnect`/`onFatal` listener [FR-013] (depends T008)
- [x] T010 `WsLifecycleEvent` union + `mapWsLifecycleEventDto` lengkap (26 tipe, casing defensif, ignore-unknown) [FR-011] (depends T009)
- [x] T011 `useTelemetrySubscription`: merge FSM→status+statusSince; DEVICE_STATUS_UPDATE→connectionStatus [FR-009/010] (depends T010)
- [x] T012 Scheduler debounced refetch (≤2s, dedupe per jenis state) untuk lifecycle → fleet/registry/supplemental [FR-011, NFR-001] (depends T011)
- [x] T013 Hook resync: onReconnect → `GET /live-state` merge; poll 60s konstanta tunggal; abort cleanup [FR-012] (depends T009)
- [x] T014 `Device.ts` union 6 perintah + `count`; gateway body count; validasi reason eksisting; wiring aksi PLANNED_DT/COUNT_ADJUST via panel eksisting [FR-015] (depends T008) — data layer + type union presentasi (type-only, nol JSX); trigger UI tombol baru = out-of-scope freeze (unit 002/produk)
- [x] T015 Test fase 2: ws-realtime (close-code/reconnect/mapper), fleet-resync (FSM map/merge/scheduler), device-command (count/guard); lint+test hijau (137 test) [AC-008..AC-014] (depends T009..T014)

## Fase 3 — Kontrak data & otorisasi (P2)

- [x] T016 DTO kanonis `*Pct` + null-preserving + `provisional` + `operatingSec/runSec/sampleCount` (hourly/aggregate/live-state); alias legacy fallback bertanda sunset [FR-017/018] (depends T015)
- [x] T017 Penyisiran pemakai tipe nullable di presentation — adaptasi nilai `—`/sembunyi, TANPA ubah layout [FR-018, BR-003] (depends T016)
- [x] T018 `OeeCalculator` fallback availability `run/(run+unplanned)` + parity lane simulasi [FR-019] (depends T016)
- [x] T019 Capability gate aksi (useMachineActions/useDeviceRegistry/useWorkOrders) + access-mode read-only state + penanda elemen eksisting [FR-007/008, OQ-004] (depends T005, T015)
- [x] T020 Ack body `{note?}` saja [FR-020] (depends T002)
- [x] T021 Test fase 3: DTO dua skema + null, calculator parity, capability gate, access-mode; lint+test hijau [AC-006/007, AC-016..AC-019] (depends T016..T020)

## Verifikasi & dokumen

- [ ] T022 E2E stack hidup: skenario AC-001..AC-019 + bukti ke `verification.md`; probe sunset alias legacy [AC semua] (depends T021)
- [ ] T023 Diff-review layout: nol perubahan komponen live monitor kecuali AuthPinModal; `pnpm lint`+`pnpm test` final [AC-020] (depends T022)
- [ ] T024 Update `docs/README.md`, cross-ref `docs/specs/backend-gaps.md` → spec ini; TODO.md final; status ADR/design/tasks/verification diperbarui [governance] (depends T023)
