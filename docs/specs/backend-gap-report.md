# Backend Gap Analysis — Frontend Requirements

> Date: 30 Sep 2026 · Source: live audit against running stack (`iiot-oee` backend via nginx gateway)
> Frontend: `oee-dashboard-aistudio` (backend lane, `VITE_USE_BACKEND=true`)
> Audience: backend developers (`iiot-oee/apps/backend`). Frontend workarounds are noted
> for context, but each item below requires a backend-side change.
> Live payloads quoted verbatim from `http://localhost/api/v1/*` on 30 Sep 2026.

---

## 1. Missing Endpoints

### M1. `GET /api/v1/oee/shift-summary` — 404
- **Frontend need:** single-call shift aggregates (A/P/Q totals, operating time, target rate, shift window) for the OEE Shift Overview. Currently composed client-side from 4–5 calls (live-state + resolve + hourly + downtime/active), which drifts between clients.
- **Evidence:** `GET /api/v1/oee/shift-summary` → `{"message":"Route GET:/api/v1/oee/shift-summary not found",...}` (404).
- **Required contract (additive, non-breaking):**
  ```http
  GET /api/v1/oee/shift-summary?machine_id=&device_id=&from=&to=&date=&shift=
  → { oee, availability, performance, quality,
      time_sec: { operating, run, downtime },
      window: { from, to, tz },
      target_per_hour: number | null,
      hourly?: [...] }
  ```
- **Acceptance:** endpoint returns 200 with the fields above; `oee` matches the frontend-composed value for the same window within ±0.1; `window` reflects `shift_start/end` with overnight-shift handling.

### M2. `GET /api/v1/oee/shift-timeline` — 404
- **Frontend need:** state segments + downtime/changeover/break overlay per shift window for `PasXProgressStrip`/`MachineTimelineStrip` without client-side joins.
- **Evidence:** 404, same as M1.
- **Required contract:**
  ```http
  GET /api/v1/oee/shift-timeline?machine_id=&device_id=&from=&to=&bucket=
  → [{ start, end, state, planned: bool, downtime_id?: number }]
  ```
  `state` = dominant FSM per bucket (`RUNNING`/`DOWN`/…); `planned` marks scheduled stops. Changeover = `SETUP_AND_ADJUSTMENT` label, not a new FSM value.
- **Acceptance:** segments cover the full requested window contiguously; unplanned breakdown hours are distinguishable from scheduled breaks.

### M3. WS event stream is telemetry/health-only — no `DOWNTIME_*`/`SHIFT_*` lifecycle coverage
- **Frontend need:** realtime downtime start/end to mark the trend chart and alarm feed without polling `downtime-events/active`.
- **Evidence:** live WS capture shows only `TELEMETRY_UPDATE` and `HEALTH_UPDATE` types; the client ignores unknown types by design.
- **Required:** document that the server MAY add advisory types at any time; if downtime events are added, use `{type:"DOWNTIME_STARTED"|"DOWNTIME_ENDED", device_id, machine_id, data:{id, category, start_time, end_time?}}`. No WS versioning needed as long as unknown types stay ignorable.
- **Acceptance:** §4 of the API docs lists the reserved type namespace and the ignore-unknown rule.

---

## 2. Data Inconsistencies (schema mismatches)

### D1. `hourly`/`aggregate` use `avg*` keys; spec names unprefixed keys — HIGH
- **Frontend need:** per-bucket OEE/availability/performance/quality and per-hour actual/good/reject for the shift trend.
- **Evidence (`hourly?limit=1`):**
  ```json
  {"bucket":"...","avgAvailability":"90.0...","avgPerformance":"94.31...",
   "avgQuality":"98.73...","avgOee":"83.80...",
   "estHourlyOutput":8579,"estHourlyReject":0,
   "hourlyOperatingSec":0,"hourlyRunSec":0,"hourlyDowntimeSec":0,
   "sampleCount":22,"targetPerHour":63,"state":"RUNNING","planned":false}
  ```
  Older spec names: `oee/availability/performance/quality`, `totalCount/goodCount/rejectCount`. `aggregate` uses the same `avg*` set plus `outputDelta` (no `estHourlyOutput`).
- **Frontend status:** client maps both schemas (`avgOee ?? oee`, `estHourlyOutput` as hourly actual, `good = output − reject` when no explicit good). No client work needed once one schema is declared canonical.
- **Required:** declare ONE canonical schema in the API docs and remove the other names from documentation; keep serving the legacy aliases additively if cheap. Include explicit `good` per bucket (`estHourlyGood` or `goodCount`) so the client stops deriving it.
- **Acceptance:** a schema table per telemetry endpoint (key, type, unit); with a single schema enabled, the trend shows non-zero OEE matching `live-state` for the same hour (±0.1).
- **Suspected aggregation bug (verify while closing):** `hourlyOperatingSec/hourlyRunSec/hourlyDowntimeSec` return **0** while `live-state` for the same hour reports `runTimeSec: 24500` / `downtimeSec: 4300`.

### D2. Raw history uses `recordedAt`; WS/docs imply `timestamp` — MEDIUM
- **Frontend need:** a single timestamp key for the live-trend fallback path.
- **Evidence:** `GET /telemetry/:id` items carry `recordedAt` (ISO string); frame contract says `timestamp`; buckets use `bucket`.
- **Frontend status:** client accepts all three. No client work needed.
- **Required:** document the per-endpoint time key (`timestamp` = frame, `bucket` = aggregate, `recordedAt` = raw rows), or preferably unify on one name.
- **Acceptance:** no 1970-epoch points appear for a clean payload (client falls back to epoch only when all keys are absent).

### D3. WS relay wraps frames in `{type, device_id, data}` but docs show flat frames — HIGH (client fixed)
- **Frontend need:** realtime counters/OEE/health without polling.
- **Evidence (live capture):** `{"type":"TELEMETRY_UPDATE",...,"data":{counters, oee, plc_modbus, ...}}` and `{"type":"HEALTH_UPDATE",...,"data":{heap_free, tasks_healthy, ...}}`. `data.timestamp` is in **seconds** (e.g. `1790751450`).
- **Frontend status:** client unwraps `data` and routes by `type` (telemetry vs health). No client work needed.
- **Required (docs only, no wire change):** document the relay envelope in §4 — `{type, device_id?, machine_id?, data, received_at/timestamp}`, the seconds unit of `data.timestamp`, and the rule that unknown `type` values must stay ignorable.
- **Acceptance:** §4 shows both frame examples; dashboard gauges move < 5 s after connect and the Edge badge shows real `tasks_healthy/tasks_total`.

### D4. `GET /telemetry/:id/hourly` ignores `from`/`to` — MEDIUM
- **Frontend need:** shift-scoped hourly series (G11) so the client can drop its defensive re-filter.
- **Evidence:** `hourly?from=2026-09-30T00:00:00Z&to=2026-09-30T01:00:00Z&limit=5` → `[]`, while unwindowed `hourly?limit=1` returns current buckets. Also note `envelope=true` IS honored (returns `{data, meta}`).
- **Frontend status:** client sends the window and re-filters/sorts defensively.
- **Required:** honor `from`/`to` (inclusive bucket overlap) so the defensive client filter becomes a no-op; or document that the endpoint is unwindowed and the client filter is the contract.
- **Acceptance:** windowed query returns only buckets overlapping `[from, to]`; unwindowed behavior unchanged.

### D5. live-state `machineName` exists but is unused by contract — LOW
- **Frontend need:** display name fallback when registry is unreachable.
- **Evidence:** every live-state item includes `machineName` (e.g. `"Milling 5-Axis CNC #1"`); the client takes the name from `/machines` instead.
- **Required:** document `machineName` in live-state as informational-only (or drop it). No behavior change.
- **Acceptance:** one line in the live-state section stating the field's status.

### D6. `STANDBY` state is emitted but not in the FSM contract — LOW
- **Evidence:** `STM32-OEE-02` reports `currentState: "STANDBY"`, absent from `LiveStateResponseSchema`/docs (which also predate `PLANNED_DOWNTIME` naming).
- **Frontend status:** client maps `STANDBY → IDLE`; unknown states → `UNCONFIGURED`.
- **Required:** add `STANDBY` (and `READY`/`BATCH_FINISHED` if emitted) to the canonical FSM table, or stop emitting it.
- **Acceptance:** the FSM table enumerates every value `live-state` can return.

---

## 3. Missing Logic / Functionality

### L1. `isOnline` registry flag goes stale; `resolve` rejects with `DEVICE_OFFLINE` — HIGH
- **Frontend need:** correct ONLINE/OFFLINE badges and successful `resolve` for devices whose telemetry is flowing.
- **Evidence (30 Sep 2026, 08:50 UTC):**

  | deviceId | `isOnline` | `lastSeenAt` | latest live-state |
  |---|---|---|---|
  | `STM32-OEE-SIM` | `true` | 08:50:41Z | 08:50:46Z (`UNCONFIGURED`, `WO-SIM-20260906-01`) |
  | `STM32-OEE-01` | `false` | 2026-09-29T07:11:48Z | 2026-09-29T07:11:48Z (`RUNNING`, `WO-20260903-01`) |

  Presence TTL is 300 s (`"MQTT presence exceeded 300s TTL; device auto-marked OFFLINE"` in operational-events). `resolve` for a WO on an offline-flagged device fails: `{"error":"DEVICE_OFFLINE","message":"Edge controller … is currently offline"}` — even though telemetry for that device exists.
- **Frontend status:** client recovers via the machine's ACTIVE WO, then WO detail fallback.
- **Required:**
  1. Define the `isOnline` rule (§E): TTL on `last_seen_at` (recommend ≤ 3× telemetry interval) and update `last_seen_at` on **every** valid ingested frame, not only at registration.
  2. Separate `DEVICE_OFFLINE` (device truly silent) from stale-flag rejections; do not block `resolve` on a stale registry flag.
- **Acceptance:** with telemetry < 30 s old, `/devices` reports `isOnline: true`; `resolve` for the active WO returns 200. `isOnline: false` only when `last_seen_at` exceeds the documented TTL.

### L2. `resolve` 409 `CONFLICT` carries the replacement WO only inside free text — MEDIUM
- **Frontend need:** recover job metadata when `snapshot.woId` lags the machine's actual active WO, without an extra round-trip.
- **Evidence:** `resolve(WO-SIM-20260906-01)` → `409 {"error":"CONFLICT","message":"Machine CNC-MILLING-SIM is currently running active Work Order WO-SIM-20260906-02. Complete or abort it first."}` — the replacement id is embedded in prose.
- **Frontend status:** client lists `?status=ACTIVE&machine_id=` and re-resolves (verified live: recovers target 600, `targetPerHour` 83, shift 16:00).
- **Required:** add a structured field, e.g. `{error:"CONFLICT", active_wo_id:"WO-…", message:"…"}` (additive).
- **Acceptance:** 409 body contains `active_wo_id`; the id resolves successfully for the same `device_id`.

### L3. `active_only` + `unlabeled_only` downtime flags unverified — HIGH
- **Frontend need:** labelable-downtime list containing only active, unlabeled events (`LogEventModal`).
- **Evidence:** `downtime-events/:device` returns `data: []` on all probed devices, so flag support cannot be confirmed or denied from live data.
- **Required:** confirm `?active_only=true&unlabeled_only=true` is honored, or publish the canonical parameter names.
- **Acceptance:** the flagged query returns only items with `end_time == null` and no reason; the modal never offers an already-labeled event.

### L4. `GET /operators` requires auth while sibling master-data reads do not — MEDIUM
- **Evidence:** `GET /operators` without token → `401 {"error":"UNAUTHORIZED"}`; `/devices`, `/machines`, `/products` are open. Nothing in the docs marks `/operators` as a different class.
- **Frontend status:** operator registry stays empty; client mapper is ready.
- **Required:** either open read-only operator listing like the other master-data endpoints, or document "Bearer required (any role)" in §H plus an auth-per-endpoint table.
- **Acceptance:** the auth table covers `/operators`; with a PIN-login token the client loads operators without 401 (if open) or shows an explicit login state (if protected).

### L5. `POST /auth/refresh` rejects — sliding sessions unconfirmed — MEDIUM
- **Evidence:** `POST /auth/refresh {token:"invalid"}` → `401 {"error":"UNAUTHORIZED","message":"Invalid or expired token"}`. This only proves rejection of garbage, not whether valid-token refresh works. The client currently relies on reactive 401 → PIN modal.
- **Required:** document whether sliding refresh is supported: request/response shape, TTL, and whether the refreshed token invalidates the old one.
- **Acceptance:** documented refresh flow; test scenario login → act past TTL → no blind first-failure (silent renew or proactive PIN prompt).

### L6. Downtime/reject stores are empty on all devices — data, not contract — LOW
- **Evidence:** `downtime-events/:device` and `quality/rejects/:device` return `{data: [], meta: {...count: 0}}` for every probed device. Mapper tolerance verified; nothing is mis-mapped.
- **Required:** no API change. Seed or edge-drive at least one downtime/reject event so pareto, badges, and label flows can be end-to-end verified.
- **Acceptance:** one labeled and one unlabeled downtime exist; `downtime-events/active` reflects a genuinely active event during a downtime.

---

## Priority summary for backend planning

| # | Item | Type | Priority |
|---|---|---|---|
| L1 | `isOnline` staleness + `DEVICE_OFFLINE` on `resolve` | Logic | HIGH |
| D1 | Canonical `hourly`/`aggregate` schema (+ verify zeroed time fields) | Schema | HIGH |
| D3 | Document WS relay envelope | Schema/docs | HIGH |
| L3 | Verify `active_only`/`unlabeled_only` | Logic | HIGH |
| M1 | `shift-summary` endpoint | Endpoint | MEDIUM |
| M2 | `shift-timeline` endpoint | Endpoint | MEDIUM |
| D2 | Unify/document time keys | Schema/docs | MEDIUM |
| D4 | Honor `from`/`to` on `hourly` | Logic | MEDIUM |
| L2 | Structured `active_wo_id` on 409 | Logic | MEDIUM |
| L4 | `/operators` auth rule | Logic/docs | MEDIUM |
| L5 | Document refresh flow | Logic/docs | MEDIUM |
| M3 | Downtime/SHIFT WS types (advisory) | Endpoint/docs | LOW |
| D5 | `machineName` status in live-state | Docs | LOW |
| D6 | FSM table incl. `STANDBY` | Docs | LOW |
| L6 | Seed downtime/reject data | Data | LOW |
