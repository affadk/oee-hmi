# Design — Spec 001 Pembaruan Data Transfer HMI

> Kontrak solusi teknis. Turunan `spec.md` rev 1 + ADR-0001/0002/0003.
> **Gate:** ADR masih Proposed → design ini DRAFT/REVIEW_REQUIRED. Jangan implementasi dari design ini sebelum ADR Accepted dan Health VALID.

**Lifecycle:** DESIGNED
**Health:** VALID
**Traces to:** `spec.md` (unit ini) · ADR-0001, ADR-0002, ADR-0003 (Accepted 2026-11-20)
**Reviewed against:** spec revision 3

> Gate terpenuhi 2026-11-20: ADR Accepted (directive pemilik "mulai implementasikan") + OQ resolved (rev 2). Implementasi Fase 1 berjalan.

## Architecture

Tetap hexagonal (lihat `ARCHITECTURE.md` — otoritas struktur). Arah perubahan searah dependensi:

```
presentation (AuthPinModal saja)
   ↓ inject deps
application hooks (useAuthSession, useTelemetrySubscription, useOeeDashboard, useWorkOrders, useMachineActions)
   ↓ ports
domain (entities/ports: union & tipe nullable melebar)
   ↑ implement
infrastructure (endpoints, oeeApiClient, httpClient, dto/*, telemetryWsClient)
```

Tidak ada layer baru, tidak ada dependensi baru. Dual-lane `VITE_USE_BACKEND` tetap; lane simulasi tidak tersentuh kontrak backend.

## Components

| Komponen | Perubahan | Trace |
|---|---|---|
| `endpoints.ts` | ganti `authOperatorPin` → `authLogin`, `authPasswordChange`, `authMe`, `systemAccessMode`; tambah path command count (body, bukan path) | FR-001/004/007/008 |
| `OeeHttpAuthGateway` | rewrite: `loginWithPassword(operatorId, password, stationId?)`, `changePassword(current, next)`, `getCapabilities()`, `getAccessMode()`, `refreshSession()` propagate error code (tidak catch-all) | FR-001..FR-008, ADR-0002 |
| `httpClient.ts` | `BackendHttpError` tambah `retryAfterSec?: number` (header `Retry-After`) dan expose `code` apa adanya (`PASSWORD_ROTATION_REQUIRED`, `AUTHZ_STALE`, `UNCLASSIFIED_DOWNTIME_CONFLICT`, `SCRAP_COUNT_INVALID`) | FR-003/005/006/016 |
| `TelemetryWsClient` | `onclose(e)` baca `e.code`: 4403 → stop + `listener.onFatal?.(reason)`; 4429 → base backoff 60s + jitter; lainnya tetap. `onopen` → `listener.onReconnect?.()` (boot pertama tidak memicu resync ganda — boot load sudah fetch). Heartbeat ping teks 25s tetap (kompatibel dua lapis, §4) | FR-012/013, ADR-0001 |
| `dto/telemetry.dto.ts` | `mapWsLifecycleEventDto` perluas union (tabel §4 docs, casing defensif); `mapHourlyTrendDto`/`mapTelemetryHistoryDto` baca `*Pct` kanonis menang + alias legacy; null dipertahankan; `provisional`, `operatingSec/runSec`, `sampleCount` dipetakan | FR-011/017/018, ADR-0003 |
| `dto/live-state.dto.ts` | `toFiniteNumber` nullable untuk `*Pct`/`oee` (tipe domain `number \| null`); normalisasi FSM tetap | FR-018, ADR-0003 |
| `dto/work-order.dto.ts` | `PENDING_CLOSE` + field workflow aditif (`dispatched_at`, `acked_at`, `actual_start_at`, `actual_end_at`, `provisional`, `count_uncertain`) | FR-016 |
| `domain/entities/backend/Device.ts` | `DeviceCommandKind` 6 enum; `DeviceCommandInput.count?: number`; `OperatorRole` → `string` (label bebas) | FR-015, ADR-0002 |
| `domain/entities/backend/WorkOrder.ts` | union status + `isActiveWorkOrder` ikut `PENDING_CLOSE` | FR-016 |
| `domain/entities/backend/Telemetry.ts` | `WsLifecycleEvent` diperluas; `HourlyTrendPoint` nullable + `provisional` | FR-011/017/018 |
| `domain/ports/IOeeBackend.ts` | `IAuthGateway` bentuk baru; `RealtimeListener` + `onReconnect`/`onFatal`; `IAuthGateway.getCapabilities/getAccessMode` | FR-006..FR-008/012/013 |
| `useAuthSession` | password login; station resolver (rantai OQ-001); rotation gate (flag login + 403 code); refresh timer ≤ 5 menit + pre-action 120s; `AUTHZ_STALE` → logout paksa; capabilities + access-mode state di application | FR-001..FR-008, ADR-0002 |
| `useTelemetrySubscription` | merge `fsmState` → `status` + `statusSince` saat transisi; `DEVICE_STATUS_UPDATE` → `connectionStatus`; lifecycle → scheduler debounced refetch (≤ 2s, dedupe per jenis: fleet / registry / labelable / WO) | FR-009/010/011, ADR-0001 |
| hook resync (baru, kecil) | `onReconnect` → `liveStateRepo.getAllSnapshots()` merge; interval 60s konstanta tunggal; abort on unmount | FR-012, ADR-0001 |
| `useWorkOrders` / `useMachineActions` | complete guard `finalRejectCount ≤ totalCount`; 409 unclassified → pesan arah pelabelan; capability gate sebelum `runProtected`; COUNT_ADJUST + PLANNED_DT via aksi eksisting | FR-007/015/016 |
| `OeeCalculator` (domain service) | fallback availability `run/(run+unplanned)` selaras 016/ADR-019; lane simulasi ikut (parity) | FR-019, ADR-0003 |
| `acknowledgeOperationalEvent` | body `{note?}` saja | FR-020 |
| `AuthPinModal` | input password (tanpa filter numerik), label "Password", gaya visual tetap; nama file/komponen boleh tetap (minimal diff) | FR-001, BR-003 |

## Domain Model

Perubahan tipe saja (tanpa entitas baru): `WorkOrderStatus` +1, `DeviceCommandKind` +3, `WsLifecycleEvent` +~20 varian, percent fields `number | null`, `OperatorRecord.role: string`, `AuthSession.operator.mustChangePassword: boolean`, capability map `{ [key: string]: 'allow'|'deny'|'unknown' }`, access mode `{ mode, channel, mutationsAllowed }`.

## Data Model

Tidak ada penyimpanan baru. Token tetap `AuthTokenStorageAdapter` (localStorage). Station context persist di store yang sama (key terpisah, nilai deviceId). Capability/access-mode **tidak persist** (no-store; fetch tiap login/refresh).

## Interfaces

Kontrak wire otoritatif = API_DOCUMENTATION.md (tidak disalin di sini). Pemetaan endpoint → FR ada di Components. Bentuk internal baru:

```ts
interface RealtimeListener {
  onTelemetry?, onHealth?, onLifecycle?,        // eksisting
  onReconnect?: () => void;                      // FR-012 (bukan boot pertama)
  onFatal?: (reason: 'FORBIDDEN_ORIGIN') => void; // FR-013
}
interface IAuthGateway {
  loginWithPassword(operatorId, password, stationId?): Promise<AuthSession>;
  changePassword(current, next): Promise<void>;
  refreshSession(): Promise<AuthSession | null>; // null hanya bila tak ada token; error code propagate
  getCapabilities(): Promise<CapabilityMap>;
  getAccessMode(): Promise<AccessMode>;
  logout(); getToken();
}
```

## State Transitions

Sesi operator:

```
ANONIM → (login 200) → AKTIF
AKTIF → (must_change_password / 403 PASSWORD_ROTATION_REQUIRED) → ROTASI_WAJIB
ROTASI_WAJIB → (change 200) → ANONIM (login ulang otomatis; token lama AUTHZ_STALE)
AKTIF → (refresh 200) → AKTIF (token baru)
AKTIF → (401 AUTHZ_STALE / subjek nonaktif / refresh 401) → ANONIM (modal login)
AKTIF → (logout) → ANONIM
```

WS: `CONNECTING → OPEN → (close) → BACKOFF → CONNECTING`; close 4403 → `FATAL` (stop, error UI); 4429 → `BACKOFF(≥60s+jitter)`; OPEN (bukan boot) → resync snapshot.

## Error Handling

| Kode/kondisi | Perilaku klien | Trace |
|---|---|---|
| 401 UNAUTHORIZED (aksi) | pending action + modal login (eksisting) | FR-006 |
| 401 AUTHZ_STALE | logout paksa + modal login, tanpa retry | FR-006 |
| 403 PASSWORD_ROTATION_REQUIRED | dialog ganti password | FR-005 |
| 403 FORBIDDEN (tunnel/role) | pesan read-only/role, bukan generik; akses-mode gate mencegah | FR-007/008 |
| 429 + Retry-After (login) | countdown + submit disabled | FR-003 |
| 400 SCRAP_COUNT_INVALID | guard klien mencegah; bila lolos → pesan validasi | FR-016 |
| 409 UNCLASSIFIED_DOWNTIME_CONFLICT | arahkan pelabelan downtime | FR-016 |
| 503 DEVICE_OFFLINE | pesan device offline; resolve fallback tetap jujur | FR-016 |
| WS 4403 / 4429 | sesuai ADR-0001 | FR-013 |
| Frame malformed / type tak dikenal | ignore (eksisting, by design §4) | FR-011 |

## Security

- Password tidak pernah persist/log; token hanya di adapter eksisting; `ErrorReporter` tidak menerima body auth.
- localStorage token = risiko XSS inheren (accepted, selaras backend stateless JWT; mitigasi: tanpa inline script pihak ketiga, deps minimal). HttpOnly cookie bukan opsi — kontrak backend Bearer.
- Semua mutasi tetap LAN-only di backend; klien menambah gate access-mode (defense-in-depth, bukan pengganti).
- `station_id` konteks, bukan kredensial (spec 044) — tidak diperlakukan sebagai secret.
- Fail-closed capability `unknown` → nonaktif (OQ-004, usulan).

## Integration

- Stack `iiot-oee` via nginx :80 (dev: vite proxy same-origin, `env.ts` tetap).
- WS `/ws/telemetry` same-origin; `VITE_WS_TELEMETRY_URL` override tetap.
- Lane simulasi: `InMemory*` tidak berubah kecuali parity semantik availability (FR-019).

## Migration Strategy

- **Breaking auth**: PIN dihapus backend → tidak ada masa transisi ganda; rilis klien fase 1 wajib berbarengan dengan backend yang sudah `/auth/login`. Sesi PIN lama (token) tetap valid sampai expiry (JWT stateless) — refresh masih jalan; login berikutnya password.
- **DTO transisi**: alias legacy dipertahankan; sunset setelah probe E2E membuktikan backend kanonis penuh (catat di verification.md).
- **Tipe nullable**: penyisiran pemakai `availability/oee/...` di presentation — hanya adaptasi nilai (`—`), bukan layout.
- Rollback: revert fase terkait; tidak ada migrasi data/skema klien.

## Alternatives Considered

Ringkas; alasan lengkap di ADR-0001/0002/0003: polling penuh (ditolak), state dari payload WS tipis (ditolak), enum role statis (ditolak), coerce null→0 (ditolak), rewrite frontend (ditolak — diff minimal, layout beku).
