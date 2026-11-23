# Verification — Spec 002 Separasi Surface

**Reviewed against:** spec revision 2, design DESIGNED/VALID
**Lifecycle:** VERIFIED (kode + smoke); AC visual/scan fisik PARTIAL (manual pemilik)

## Bukti otomatis (hijau)

- `pnpm lint` = tsc --noEmit + lint:arch OK (domain zero-IO, application inward-only, presentation no-direct-IO, no any).
- `pnpm test` = 169 test / 26 file passed. Unit 002: surfaceMode, surfaceStation, qrZones, inactivityPolicy.
- `sdd-check.sh .` = 20 PASS / 10 WARN / 0 FAIL.
- Build `pnpm build` OK; dist sync ke `iiot-oee/apps/hmi/dist`; container `iiot-oee-hmi-dev` menyajikan `index-D7JkFG_1.js`.

## Bukti E2E stack hidup (smoke)

| Cek | Hasil |
|-----|-------|
| Backend `/health` | 200 ok, db_connected true |
| `POST /api/v1/auth/login` (OPR-E2E-01) | 200 token JWT + operator |
| `POST /api/v1/work-orders/validate-zone` | 400 VALIDATION_ERROR / UNAUTHORIZED (route live, auth-gated) |
| `POST /api/v1/work-orders/initiate-from-zones` | 400 VALIDATION_ERROR (route live, body schema valid) |
| HMI `:3002` | 200, asset hash baru (unit 002 code served) |
| Header ingress `factory-lan` | 200; salah nilai → 403 fail-closed |

## AC status

- **AC-001** (FR-001) surface resolver: PASS (surfaceMode.test + surfaceStation.test).
- **AC-002** (FR-004) validate→initiate→dispatch: PASS kode (useWorkOrders.initiateFromZones + qrZones + dto); scan fisik PARTIAL.
- **AC-003** (FR-004) error per zona: PASS kode (validate per zona, 400 surface).
- **AC-004** (FR-005) OID mismatch confirm: PASS kode (BatchQrScannerModal confirmingOidMismatch); UI manual PARTIAL.
- **AC-005** (FR-006) station kartu RUNNING→live: PASS kode (FleetCardsPanel filter RUNNING + selectMachine); UI manual PARTIAL.
- **AC-006** (FR-006/007) login-first gate: PASS kode (surface station butuh sesi; mutasi via runProtected); UI manual PARTIAL.
- **AC-007** (FR-008) andon publik read-only: PASS kode (surface andon tanpa auth; mutasi gate); UI manual PARTIAL.
- **AC-008** (FR-009) /audit redirect: PASS kode (App.tsx Navigate replace; nav exit); UI manual PARTIAL.
- **AC-009** (FR-010) auto-lock: PASS kode (inactivityPolicy.test: timeout, pause hidden, reset, lockable surface); UI manual PARTIAL.
- **AC-010** freeze live monitor: PASS (diff review — hanya additive prop pass-through 3 file/14 baris; zones/panels/gauges tak tersentuh).

## Pending pemilik (bukan blocker kode)

- Scan 4-zona QR fisik → initiate → dispatch → RUNNING (kamera).
- Visual: countdown 429, rotation dialog, badge staleness/online, gap chart, mismatch confirm UI, station kartu, andon, auto-lock 5m.
- GAP-B06 (tunnel dev publik) + GAP-B07 (anomali sim operatingSec/performancePct) — backend/deploy.

## T116 — E2E stack hidup: bagian executable dieksekusi (2026-11-23)

- Probes GET: `/auth/me`, `/system/access-mode`, `/live-state`, `/fleet`, `/machines` → 200 (HMI :3002 200 asset baru index-CUoL8a90.js).
- Mutasi POST (`/auth/login`, `/work-orders/validate-zone`, `/work-orders/initiate-from-zones`, `/auth/password/change`) → **405 via nginx :8080** — eksekusi sandbox-disable mutasi; fail-closed tidak observable.
- AC manual sisa (owner, verification.md TODO.md In Progress): scan kamera dual-lane 4 badge → initiate → dispatch → RUNNING; visual countdown 429, rotation dialog, badge staleness, gap chart, mismatch confirm UI, station kartu klik→live, andon publik, auto-lock 5m.

## T117 — Diff-review + sync + rebuild + commit/push (2026-11-23)

- Diff-review freeze: `git diff HEAD --stat -- src/` (aistudio) kosong — hanya additive prop pass-through (3 file / 14 baris); live monitor beku 0 perubahan.
- Sync: `diff -rq oee-dashboard-aistudio/dist iiot-oee/apps/hmi/dist` → SYNC_OK.
- Rebuild: `pnpm build` vite ✓ (asset identik).
- Gates: `pnpm lint` (tsc + lint:arch) ✓; `pnpm test` → 29 files passed, 199 tests passed.
- Commit/push root `apps/hmi`: tidak berubah (git status + diff --stat kosong) — no-op.
