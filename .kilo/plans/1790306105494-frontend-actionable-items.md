# Frontend Actionable Items — Implementation Plan

**Scope**: Only items that can be implemented in this frontend repo (`oee-dashboard-aistudio`). Backend gaps (G1, G3, G4, G5, G9, G10, G11, G13, G14, G15) require `iiot-oee` backend work and are **out of scope**.

---

## 1. Route Code Splitting — Reduce Bundle Size

**Problem**: 2.1 MB JS bundle (646 KB gzipped) — all routes eager-loaded.

**Files**: `src/App.tsx`, `src/presentation/pages/*`

**Changes**:
- Wrap `OverviewPage` and `AuditPage` in `React.lazy()`
- Add `<Suspense>` fallback in `DashboardPage` (the parent route)
- Verify `vite.config.ts` enables code splitting (default on)

**Validation**:
- Build shows separate chunks for `/overview` and `/audit`
- Initial bundle < 500 KB gzipped

---

## 2. Export Button — Use Existing `/telemetry/:id/export` (B6)

**Problem**: Endpoint exists, no UI button (DoD §8 requires CSV/NDJSON).

**Files**: 
- `src/infrastructure/api/endpoints.ts` — already has `telemetryExport`
- `src/infrastructure/api/oeeApiClient.ts` — needs `ITelemetryRepository.getExport`
- `src/domain/ports/IOeeBackend.ts` — add `getExport` to `ITelemetryRepository`
- `src/application/use-cases/ExportTelemetryUseCase.ts` — new use case
- `src/presentation/components/zones/MachineStatusZone.tsx` or new `ExportButton` — add button
- `src/application/hooks/useMachineActions.ts` — add `exportTelemetry` action

**Validation**: Click button → downloads CSV/NDJSON file

---

## 3. Health Endpoint — Footer Reconciliation (B7)

**Problem**: `GET /health` exists, never called; footer shows no backend status.

**Files**:
- `src/infrastructure/api/endpoints.ts` — already has `health()`
- `src/infrastructure/api/oeeApiClient.ts` — add `OeeHttpHealthRepository`
- `src/domain/ports/IOeeBackend.ts` — add `IHealthRepository`
- `src/application/use-cases/GetHealthUseCase.ts` — new use case
- `src/presentation/components/footer/HealthFooter.tsx` — new component
- `src/presentation/pages/DashboardPage.tsx` — integrate footer

**Validation**: Footer shows `ws_clients`, `buffer_pending`, uptime from backend

---

## 4. Work Order Detail UI — Use Existing `GET /work-orders/:id` (B1)

**Problem**: Adapter + `ListWorkOrdersUseCase.detail()` exist, 0 UI callers.

**Files**:
- `src/application/use-cases/ListWorkOrdersUseCase.ts` — already has `getDetail`
- `src/presentation/components/modals/WorkOrderDetailModal.tsx` — new modal
- `src/application/hooks/useWorkOrders.ts` — add `openWorkOrderDetail`, `closeWorkOrderDetail`, `workOrderDetail`
- `src/presentation/pages/OverviewPage.tsx` or `ProductionSetupModal` — add trigger

**Validation**: Click WO in pending list → modal shows full detail

---

## 5. Products/Operators Registry — Use Existing Endpoints (B4)

**Problem**: `GET /products`, `GET /operators` exist; QR uses static catalog.

**Files**:
- `src/infrastructure/api/oeeApiClient.ts` — already has `listProducts`, `listOperators`
- `src/application/use-cases/ConfigureDeviceUseCase.ts` — already has `loadRegistry` returning products/operators
- `src/presentation/components/modals/QRScannerModal.tsx` — replace static catalog with backend data

**Validation**: QR scan matches product/operator against backend registry

---

## 6. Coverage Tooling

**Problem**: No coverage enforcement; `@vitest/coverage-v8` not installed.

**Changes**:
- `pnpm add -D @vitest/coverage-v8`
- Update `vitest.config.ts` with coverage thresholds (e.g., 80% lines, 70% branches)
- Add `coverage` script to `package.json`

**Validation**: `npm test -- --coverage` passes with thresholds

---

## 7. Replace `console.error` with Error Boundary / Reporter

**Problem**: Two `console.error` calls in production code:
- `useMachinesQuery.ts:77`
- `useSupplementalSync.ts:100`

**Changes**:
- Create `src/infrastructure/monitoring/ErrorReporter.ts` (interface + noop impl)
- Wire into `DiProvider` (can swap for Sentry/logrocket later)
- Replace `console.error` calls with `errorReporter.captureException(err, context)`

**Validation**: Errors captured without console spam; ready for production monitoring

---

## Execution Order (Dependencies)

```
1. Coverage Tooling (independent)
2. Route Code Splitting (independent)
3. Error Reporter (independent)
4. Export Button (needs ITelemetryRepository + use-case)
5. Health Footer (needs IHealthRepository + use-case)
6. Work Order Detail (needs useWorkOrders extension)
7. Products/Operators QR (needs ConfigureDeviceUseCase already ready)
```

---

## Out of Scope (Backend Work Required)

| Gap | Endpoint | Note |
|-----|----------|------|
| G1 | `GET /quality/rejects/:device_id` | Backend must implement; frontend shows empty array |
| G3 | `GET /devices/:id/health` | Backend must implement; frontend health = zeros |
| G4 | `PATCH /operational-events/:id/ack` | Backend must implement; frontend ack is local-only |
| G5 | `GET /operational-events` global | Backend must implement; frontend uses N+1 fan-out |
| G9 | `state`+`planned` per hourly bucket | Backend must add fields; frontend ready |
| G10 | Structured break window | Backend must add `break` object; frontend parses string |
| G11 | Shift-scoped hourly | Frontend sends `from`/`to`; backend must honor |
| G13 | `POST /auth/refresh` | Backend must implement; frontend reactive 401 only |
| G14 | `active_only`/`unlabeled_only` flags | Frontend sends; backend must verify support |
| G15 | WS heartbeat doc | Backend must document protocol; client uses app-level ping |

---

## Risk Mitigation

- **Export button**: Endpoint may return CSV or NDJSON — handle both `Content-Type` responses
- **Health footer**: Polling interval — use 30s to avoid load; cancel on unmount
- **QR catalog**: Backend may return empty arrays — fallback to static catalog gracefully
- **Code splitting**: Test SSR not applicable (SPA); verify lazy chunks load on slow 3G