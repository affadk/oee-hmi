# Design — Spec 002 Separasi Surface

> Kontrak solusi teknis. Turunan spec 002 rev 2 + ADR-0004 (Proposed).
> Gate terpenuhi 2026-11-20: ADR-0004 Accepted (pemilik repo).

**Lifecycle:** DESIGNED
**Health:** VALID
**Traces to:** `spec.md` (unit ini) · ADR-0004
**Reviewed against:** spec revision 2

## Architecture

Mode surface = fungsi konteks deployment, bukan toggle in-app:

```
station context tervalidasi (VITE_STATION_ID/store/query ∈ registry)  → KIOSK
tanpa binding + sesi operator login                                  → STATION
tanpa binding + tanpa sesi (publik/tunnel)                             → ANDON
```

Semua surface memakai lapisan data unit 001 (auth/WS/DTO/capability). Historical tidak lives di HMI (admin-panel v1).

## Components

| Komponen | Tanggung jawab | Trace |
|---|---|---|
| `application/surfaceMode.ts` (baru, pure) | `resolveSurface({stationId, hasSession})` → 'kiosk'\|'station'\|'andon' | FR-001 |
| `useOeeDashboard` | boot select device = stationId bila kiosk; `selectMachine` no-op di kiosk; expose surface | FR-002 |
| `DashboardPage` | switcher fleet disembunyikan bila kiosk (conditional render, bukan rombak); label mode di header eksisting | FR-002/008 |
| `endpoints.ts` + `IWorkOrderRepository` + `OeeHttpWorkOrderRepository` | `validateZone(zone)`, `initiateFromZones(deviceId, zones)` (§C.7/8) | FR-004 |
| `application/qrZones.ts` (baru, pure) | builder string zona dari draft BatchQr eksisting (`PID=..;CT=..;NAME=..` dst sesuai §C.8) | FR-004 |
| `useWorkOrders` | `initiateFromZones`: validate 4 zona berurutan (error per zona) → initiate → dispatch (runProtected + capability work_order.dispatch) | FR-004/005 |
| `BatchQrScannerModal` (BackendReviewStep) | tampilkan hasil initiate (wo_id baru) + error zona; mismatch OID vs sesi → konfirmasi eksplisit sebelum initiate | FR-004/005 |
| `FleetCardsPanel` (baru) | kartu device RUNNING dari live-state (status, oee, count); klik → selectMachine → live view eksisting; hanya mode station | FR-006 |
| `useInactivityLock` (baru) | timer 5 menit (`VITE_INACTIVITY_TIMEOUT_MS`, pause tab hidden); expiry → lock mutasi (gate boolean) + pesan re-login; data live tetap | FR-010 |
| `App.tsx` | rute `/audit` dihapus dari nav HMI (kode AuditPage diarsipkan); redirect `/audit` → `/overview` | FR-009 |
| `capabilityGate` (unit 001) | dipakai apa adanya untuk gate mutasi station/kiosk | FR-007 |

## Domain Model

Tanpa entitas baru: reuse `BatchQr` draft, `WorkOrderListItem`, `LiveStateSnapshot`, `AuthSession`. `SurfaceMode` union baru di application.

## Interfaces

- `POST /api/v1/work-orders/validate-zone` `{zone_type, device_id, raw_string}` → 200/400/409/503 (Bearer+LAN).
- `POST /api/v1/work-orders/initiate-from-zones` `{device_id, zones:{product,machine,operator,shift}}` → 200 `{work_order}` / 400 MASTER_*/CT_MISMATCH/SHIFT_* / 409 / 503.
- Dispatch/complete/cancel: alur unit 001.

## State Transitions

Kiosk: `BOOT(lock device) → sesi operator → SCAN 4 zona → VALIDATE → INITIATE(WO PENDING) → DISPATCH(ACTIVE) → LIVE → BATCH_FINISHED(PENDING_CLOSE) → CONFIRM(COMPLETED)`.
Auto-lock: `UNLOCKED → (idle 5m) → LOCKED(mutasi) → (login ulang) → UNLOCKED`.

## Error Handling

Error zona ditampilkan per langkah stepper (MASTER_NOT_FOUND → "master belum ada, hubungi admin"; CT_MISMATCH → selisih CT ditampilkan; DEVICE_OFFLINE → retry); mismatch OID → dialog konfirmasi (FR-005); 403 capability → alasan gate unit 001.

## Security

Sesi operator wajib sebelum initiate/dispatch (Bearer+LAN backend); station_id konteks kiosk; auto-lock melindungi kiosk ditinggal; andon tanpa mutasi.

## Migration Strategy

Nav audit dihapus bertahap: redirect dulu, kode diarsipkan; admin-panel v1 tetap live (OQ-103). Tidak ada migrasi data.

## Alternatives Considered

Toggle surface in-app (ditolak: kiosk harus terkunci by deployment); bangun historical baru di v2 (ditolak: v1 admin live, YAGNI).
