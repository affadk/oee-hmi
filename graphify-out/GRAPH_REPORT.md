# Graph Report - oee-dashboard-aistudio  (2026-11-23)

## Corpus Check
- 255 files · ~134,893 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .lock 1)

## Summary
- 1634 nodes · 4416 edges · 95 communities (85 shown, 10 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 347 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a38fb3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkOrder.ts
- ShiftTimeline.ts
- MachineAlarmEvent
- package.json
- react
- MqttEdgeInspectorModal.tsx
- MachineRecord
- BatchQrScannerModal.tsx
- Design — Spec 004 Chooser 2 Jalur Scan
- Design — Spec 003 Dual-Lane Inisiasi QR
- Machine.ts
- MachineConfig
- useOeeDashboard.ts
- BatchQr.ts
- IThemeStoragePort
- useTelemetrySubscription.ts
- BackendMachineRepository
- TelemetryWsClient
- IOeeBackend.ts
- QrZoneBadge.ts
- Spec RestAPI + WebSocket — OEE Shift Overview & Detailed Audit Dashboard
- Frontend Actionable Items — Implementation Plan
- telemetry.dto.ts
- compilerOptions
- 2. Data Inconsistencies (schema mismatches)
- routeBackendQr
- httpClient.ts
- Audit Layered Architecture & Kualitas Kode — OEE Dashboard
- useLiveTrend.ts
- qrRouting.ts
- endpoints.ts
- ADR-0006 — Chooser 2 Jalur Scan Eksplisit + Semantik Config-Only (START di Edge)
- OeeHttpTelemetryRepository
- ADR-0007 — HMI non-aktuatif (aktuasi hanya di Edge OEE)
- MachineRecord
- noHmiActuation.test.ts
- work-order.dto.ts
- useWorkOrderAckWait.ts
- Gap Register — HMI OEE vs Backend (Nov 2026)
- OeeHttpAuthGateway
- verify
- Spec 001 — Pembaruan Data Transfer HMI (Refresh Kontrak Backend Nov 2026)
- vitest
- useOeeDashboard
- Amandemen 30 Sep 2026 — audit metadata respons API (G17–G20)
- GetShiftSummaryUseCase
- layout
- Spec 002 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel
- ADR-0002 — Auth Password + Station Context + UI Ber-gate Capability
- oeeApiClient.ts
- Spec 003 — Dual-Lane Inisiasi QR: 4 Badge Fisik (Jalur A) + Resolve WO Existing (Jalur B)
- Spec 004 — Chooser 2 Jalur Scan: "4 QR Bertahap" vs "Scan WO Existing"
- Tasks — Spec 004 Chooser 2 Jalur Scan
- FakeWebSocket
- Implementation Plan — Spec 001 Pembaruan Data Transfer HMI
- Implementation Plan — Spec 002 Separasi Surface HMI/Station/Andon/Admin
- useAuthSession.ts
- inactivityPolicy.ts
- Status Dokumen `docs/` — OEE Dashboard
- GetHealthUseCase
- Governance — SDD oee-dashboard-aistudio
- IAuthGateway
- Design — Spec 002 Separasi Surface
- Design — Spec 001 Pembaruan Data Transfer HMI
- useMachinesQuery.ts
- useTheme
- Project Implementation Status — oee-dashboard-aistudio
- AGENTS.md — oee-dashboard-aistudio (HMI OEE)
- surfaceMode.ts
- Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)
- Verification — Spec 002 Separasi Surface
- Verification — Spec 003 Dual-Lane Inisiasi QR
- capabilityGate.ts
- Tasks — Spec 002 Separasi Surface
- ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel
- AuthSession
- Verification — Spec 004 Chooser 2 Jalur Scan
- ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST
- ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif
- Tasks — Spec 001 Pembaruan Data Transfer HMI
- Engineering Constitution — oee-dashboard-aistudio (HMI)
- Tasks — Spec 003 Dual-Lane Inisiasi QR
- useTelemetrySubscription.ts
- BatchQrStepper.tsx
- Standing Constraints — oee-dashboard-aistudio
- Domain Context — HMI OEE
- Verification — Spec 001 Pembaruan Data Transfer HMI
- allowBuilds
- types.ts
- Frontend Layered Architecture (OEE Dashboard)
- glossary.md
- 2.1 Seleksi lane (satu pintu)
- QrCameraScanner.tsx
- 2. Scope

## God Nodes (most connected - your core abstractions)
1. `MachineConfig` - 93 edges
2. `react` - 82 edges
3. `useTheme()` - 51 edges
4. `ITelemetryRepository` - 45 edges
5. `lucide-react` - 44 edges
6. `createContainer()` - 40 edges
7. `AppContainer` - 37 edges
8. `MachineAlarmEvent` - 35 edges
9. `BatchQrModalContext` - 33 edges
10. `vitest` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Aturan keras` --references--> `useOeeDashboard()`  [INFERRED]
  ARCHITECTURE.md → src/application/hooks/useOeeDashboard.ts
- `Fase 1 — Surface mode & kiosk lock` --references--> `useOeeDashboard()`  [INFERRED]
  specs/002-hmi-station-surfaces/tasks.md → src/application/hooks/useOeeDashboard.ts
- `Loop 1 — Inventarisasi kebutuhan UI → pemetaan ke API existing` --references--> `FullscreenOeeView()`  [INFERRED]
  docs/specs/shift-overview-api.md → src/presentation/pages/overview/components/FullscreenOeeView.tsx
- `G15 — Heartbeat WS + idle timeout (Prioritas: RENDAH, klarifikasi)` --references--> `TelemetryWsClient`  [INFERRED]
  docs/specs/backend-gaps.md → src/infrastructure/realtime/telemetryWsClient.ts
- `3.1 `GET /api/v1/oee/shift-summary`` --references--> `OeeCalculator`  [INFERRED]
  docs/specs/shift-overview-api.md → src/domain/services/OeeCalculator.ts

## Import Cycles
- None detected.

## Communities (95 total, 10 thin omitted)

### Community 0 - "WorkOrder.ts"
Cohesion: 0.10
Nodes (26): LiveTrendPoint, UseOeeDashboardReturn, WorkOrdersApi, AckWaitState, InitiatedWorkOrder, InitiateFromZonesResult, ADR-0021, WorkOrderListItem (+18 more)

### Community 1 - "ShiftTimeline.ts"
Cohesion: 0.09
Nodes (31): G10 — Jendela istirahat terstruktur (Prioritas: SEDANG), mergeShiftSummary(), ShiftServerDataApi, isPlannedDowntimeCategory(), IShiftSummaryRepository, IShiftTimelineRepository, ShiftSummary, ShiftSummaryOee (+23 more)

### Community 2 - "MachineAlarmEvent"
Cohesion: 0.14
Nodes (11): G4 — Acknowledge / resolve alarm (Prioritas: RENDAH), ManageAlarmsUseCase, AlarmStatus, AlarmType, MachineAlarmEvent, IAlarmRepository, BackendAlarmRepository, TYPE_MAP (+3 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, echarts@^6.1.0, html5-qrcode@^2.3.8, lucide-react@^0.546.0, react@^19.0.1, react-dom@^19.0.1, @tailwindcss/vite@^4.3.3, vite@^8.3.0 (+40 more)

### Community 4 - "react"
Cohesion: 0.10
Nodes (31): react-router-dom@^7.18.4, lucide-react, react, react-router-dom, App(), OverviewPage, RouteFallback(), defaultContainer (+23 more)

### Community 5 - "MqttEdgeInspectorModal.tsx"
Cohesion: 0.14
Nodes (30): MqttConsole(), MqttConsoleProps, MqttEdgeInspectorModal(), MqttEdgeInspectorModalProps, JaringanTab(), JaringanTabProps, KesehatanTab(), KesehatanTabProps (+22 more)

### Community 6 - "MachineRecord"
Cohesion: 0.07
Nodes (31): G12 — Kontrak 204-vs-body endpoint mutasi (Prioritas: SEDANG, klarifikasi), G20 — `GET /operators` mewajibkan auth tapi tak terdokumentasi (Prioritas: SEDANG), G5 — Umpan audit global lintas device (Prioritas: RENDAH), DeviceRecord, OeeHttpMasterDataRepository, asRecord(), mapDeviceDto(), mapDeviceListDto() (+23 more)

### Community 7 - "BatchQrScannerModal.tsx"
Cohesion: 0.12
Nodes (39): BatchDraft, QR_OPERATOR_CATALOG, QrBatchStep, QrOperatorPreset, QrProductPreset, QrSchedulePreset, BatchQrModalContext, ScanLane (+31 more)

### Community 8 - "Design — Spec 004 Chooser 2 Jalur Scan"
Cohesion: 0.17
Nodes (11): Alternatives Considered, Architecture, Components, Copy config-only (FR-004), Design — Spec 004 Chooser 2 Jalur Scan, Error Handling, Navigation, Perilaku kamera (deliberate, lazy) (+3 more)

### Community 9 - "Design — Spec 003 Dual-Lane Inisiasi QR"
Cohesion: 0.18
Nodes (10): Alternatives Considered, Architecture, Design — Spec 003 Dual-Lane Inisiasi QR, Domain Model, Error Handling, Interfaces, Security, State Transitions (+2 more)

### Community 10 - "Machine.ts"
Cohesion: 0.16
Nodes (15): BackendDowntimeLabelInput, MachineActionsApi, TelemetryExportFormat, buildJobConfigPayload(), deriveActualRate(), JobConfigDraft, MachineEdgeCommand, DeviceCommandKind (+7 more)

### Community 11 - "MachineConfig"
Cohesion: 0.08
Nodes (11): Struktur `src/`, SimulationTickerDeps, useSimulationTicker(), SimulateMachinePulseUseCase, EdgeJobConfigPayload, MachineConfig, IMachineRepository, InMemoryMachineRepository (+3 more)

### Community 12 - "useOeeDashboard.ts"
Cohesion: 0.21
Nodes (28): Keputusan, ADR-0004, 7. Strategi integrasi frontend (`oee-dashboard-aistudio`), DeviceRegistryDeps, MachineActionsDeps, OeeDashboardDeps, ShiftServerDataDeps, SupplementalSyncDeps (+20 more)

### Community 13 - "BatchQr.ts"
Cohesion: 0.08
Nodes (34): ADR-0005 — Dual-Lane Inisiasi QR: Parser Zona Cermin Backend + Draft Fail-Closed + Tunggu ACK Terbatas, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks, 16. Alur QR backend standar-kamera (24 Sep 2026) — ✅ SELESAI, Components, Migration Strategy (+26 more)

### Community 14 - "IThemeStoragePort"
Cohesion: 0.17
Nodes (7): 1. Kepatuhan layered architecture, IThemeStoragePort, ThemeMode, ThemePreference, isPreference(), LocalStorageThemeAdapter, ThemeContextType

### Community 15 - "useTelemetrySubscription.ts"
Cohesion: 0.16
Nodes (14): mergeSnapshotsIntoMachines(), RESYNC_POLL_MS, ADR-0001, FleetResyncApi, FleetResyncDeps, ADR-0001, useFleetResync(), createRefetchScheduler() (+6 more)

### Community 16 - "BackendMachineRepository"
Cohesion: 0.06
Nodes (29): 12. Badge data parsial (24 Sep 2026) — N11 tertutup sebagian, 1. Jawaban singkat, 3. Mengapa "sudah diubah tapi tetap simulasi" — 5 penyebab konkret, 4. Cacat backend-lane yang ditemukan saat audit (wajib diperbaiki sebelum enforcement penuh), 5. Cara mematikan simulasi total (checklist enforcement), 6. Referensi silang berkas, Audit Jalur Koneksi: Simulasi vs Backend API, Assumptions (+21 more)

### Community 17 - "TelemetryWsClient"
Cohesion: 0.16
Nodes (19): P1 — divergensi & robustness, 2.3 Jalur BACKEND (aktif saat `useBackend=true`), G17 — Skema key `hourly`/`aggregate` memakai prefiks `avg*` (Prioritas: TINGGI — sudah ditutup klien), G21 — Frame WS relay ber-envelope, `HEALTH_UPDATE` sempat masuk jalur telemetri (Prioritas: TINGGI — sudah ditutup klien), Components, Fase 2 — Realtime & perintah (P1), useTelemetrySubscription(), toFiniteNumber() (+11 more)

### Community 18 - "IOeeBackend.ts"
Cohesion: 0.11
Nodes (15): SupplementalSyncApi, DeviceHealth, DowntimeCategory, DowntimeEvent, PLANNED_DOWNTIME_CATEGORIES, RejectBreakdownItem, WsTelemetryFrame, DowntimeReasonItem (+7 more)

### Community 19 - "QrZoneBadge.ts"
Cohesion: 0.17
Nodes (21): detectZones(), isWoLanePayload(), looksLikeZoneBadge(), parseKeyValue(), parseMachineBadge(), parseOperatorBadge(), parseProductBadge(), parseShiftBadge() (+13 more)

### Community 20 - "Spec RestAPI + WebSocket — OEE Shift Overview & Detailed Audit Dashboard"
Cohesion: 0.09
Nodes (22): 0. Ringkasan eksekutif, 1. Looping analisa 3x (wajib dibaca reviewer), 2.1 OEE Shift Overview — komposisi panggilan, 2.2 Detailed Audit Dashboard — komposisi panggilan, 2. Kontrak REST yang di-reuse (v1 frontend — tanpa perubahan backend), 3.1 `GET /api/v1/oee/shift-summary`, 3.2 `GET /api/v1/oee/shift-timeline`, 3. Kontrak REST baru yang diusulkan (Fase 2 — aditif, tidak wajib untuk v1) (+14 more)

### Community 21 - "Frontend Actionable Items — Implementation Plan"
Cohesion: 0.15
Nodes (10): 1. Route Code Splitting — Reduce Bundle Size, 2. Export Button — Use Existing `/telemetry/:id/export` (B6), 4. Work Order Detail UI — Use Existing `GET /work-orders/:id` (B1), 5. Products/Operators Registry — Use Existing Endpoints (B4), 6. Coverage Tooling, 7. Replace `console.error` with Error Boundary / Reporter, Execution Order (Dependencies), Frontend Actionable Items — Implementation Plan (+2 more)

### Community 22 - "telemetry.dto.ts"
Cohesion: 0.11
Nodes (20): ADR-0003, base64UrlToString(), decodeJwtExpMs(), isTokenExpiringSoon(), ALL_DOWNTIME_CATEGORIES, EdgeHealthPayload, mapDeviceHealthDto(), mapOperationalEventDto() (+12 more)

### Community 23 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+13 more)

### Community 24 - "2. Data Inconsistencies (schema mismatches)"
Cohesion: 0.10
Nodes (20): 1. Missing Endpoints, 2. Data Inconsistencies (schema mismatches), 3. Missing Logic / Functionality, Backend Gap Analysis — Frontend Requirements, D1. `hourly`/`aggregate` use `avg*` keys; spec names unprefixed keys — HIGH, D2. Raw history uses `recordedAt`; WS/docs imply `timestamp` — MEDIUM, D3. WS relay wraps frames in `{type, device_id, data}` but docs show flat frames — HIGH (client fixed), D4. `GET /telemetry/:id/hourly` ignores `from`/`to` — MEDIUM (+12 more)

### Community 25 - "routeBackendQr"
Cohesion: 0.29
Nodes (7): 1. Strategi, 2. Komponen terdampak, 3. Fase, 4. Risiko & mitigasi, Plan — Spec 004 Chooser 2 Jalur Scan, T404 — gating Jalur A (Spec: FR-002, AC-002), routeBackendQr()

### Community 26 - "httpClient.ts"
Cohesion: 0.12
Nodes (11): Backend lane (siap konsumsi API), BackendHttpError, httpDownload(), HttpOptions, httpRequest(), resolveToken(), tokenStorage, OeeHttpWorkOrderRepository (+3 more)

### Community 27 - "Audit Layered Architecture & Kualitas Kode — OEE Dashboard"
Cohesion: 0.12
Nodes (15): 0. Metrik terverifikasi (shell, bukan estimasi), 11. Lint tanpa typescript-eslint (24 Sep 2026) — diblokir TS 7, diganti jujur, 13. Frontend follow-up terencana (24 Sep 2026) — tidak dieksekusi, tercatat, 14. Fase 1 shift-summary/shift-timeline (24 Sep 2026) — slice + fallback, ✅ SELESAI, 17. Audit UX inisiasi batch via tombol fisik (24 Sep 2026) — temuan, belum dieksekusi, 18. Perbaikan UX tombol fisik (24 Sep 2026) — U2–U6 ✅ SELESAI, 2. Penguatan temuan lama (terverifikasi ulang), 3. Temuan baru (belum ada di audit sebelumnya) (+7 more)

### Community 28 - "useLiveTrend.ts"
Cohesion: 0.10
Nodes (14): 15. Integrasi B-scope telemetry + device + QR-WO (24 Sep 2026) — ✅ SELESAI, G18 — `GET /telemetry/:id` (raw history) memakai key `recordedAt` (Prioritas: SEDANG — sudah ditutup klien), Matriks cakupan fungsi → backend, LiveTrendDeps, toLivePoints(), useLiveTrend(), GetActiveDowntimesUseCase, GetTelemetryAggregateUseCase (+6 more)

### Community 29 - "qrRouting.ts"
Cohesion: 0.43
Nodes (5): isZonePaste(), QrRoute, ADR-0005, WO_LANE_WRONG_MESSAGE, ZONE_LANE_WRONG_MESSAGE

### Community 31 - "ADR-0006 — Chooser 2 Jalur Scan Eksplisit + Semantik Config-Only (START di Edge)"
Cohesion: 0.33
Nodes (5): ADR-0006 — Chooser 2 Jalur Scan Eksplisit + Semantik Config-Only (START di Edge), Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 32 - "OeeHttpTelemetryRepository"
Cohesion: 0.18
Nodes (10): OperationalEvent, PageMeta, OeeHttpTelemetryRepository, withQuery(), mapDowntimeEventDto(), mapDowntimeResultDto(), mapHourlyTrendResultDto(), mapOperationalEventResultDto() (+2 more)

### Community 33 - "ADR-0007 — HMI non-aktuatif (aktuasi hanya di Edge OEE)"
Cohesion: 0.40
Nodes (4): ADR-0007 — HMI non-aktuatif (aktuasi hanya di Edge OEE), Konsekuensi, Konteks, Verifikasi

### Community 34 - "MachineRecord"
Cohesion: 0.23
Nodes (6): DeviceRegistryApi, MachineRecord, OperatorRecord, ProductRecord, IMasterDataRepository, MachineMetadataPatch

### Community 36 - "work-order.dto.ts"
Cohesion: 0.18
Nodes (13): mapInitiateFromZonesDto(), mapWorkOrderDto(), mapWorkOrderListDto(), mapWorkOrderResolveDto(), mapZoneValidationDto(), normalizeStatus(), normalizeZoneType(), RawWorkOrder (+5 more)

### Community 37 - "useWorkOrderAckWait.ts"
Cohesion: 0.25
Nodes (7): ACK_POLL_INTERVAL_MS, ACK_WAIT_CAP_MS, AckPollDeps, AckWaitApi, pollWorkOrderAck(), ADR-0005, useWorkOrderAckWait()

### Community 38 - "Gap Register — HMI OEE vs Backend (Nov 2026)"
Cohesion: 0.11
Nodes (17): A. Gap frontend (perombakan data transfer — repo ini), B. Gap backend / dokumentasi (tim `iiot-oee` atau verifikasi bersama), C. Sudah ditutup (jangan diinvestigasi ulang), Cara pakai, D. Jawaban Open Questions (ringkasan navigasi; otoritas: spec §11 rev 2), Gap Register — HMI OEE vs Backend (Nov 2026), 1. Kondisi kini (yang sudah benar — jangan dirombak), 2. Temuan — kebutuhan pembaruan (prioritas) (+9 more)

### Community 39 - "OeeHttpAuthGateway"
Cohesion: 0.08
Nodes (9): 7. Status eksekusi refactoring (23 Sep 2026, berurutan, semua lolos `tsc --noEmit` + `pnpm build`), G13 — Refresh / revoke token operator (Prioritas: SEDANG), Data Model, IAuthTokenStorage, OeeHttpAuthGateway, API_TOKEN_STORAGE_KEY, AuthTokenStorageAdapter, STATION_ID_STORAGE_KEY (+1 more)

### Community 40 - "verify"
Cohesion: 0.12
Nodes (15): jobs, verify, name, on, pull_request, push, run, uses (+7 more)

### Community 41 - "Spec 001 — Pembaruan Data Transfer HMI (Refresh Kontrak Backend Nov 2026)"
Cohesion: 0.12
Nodes (15): 10. Dependencies, 11. Open Questions — RESOLVED (2026-11-20), 1. Purpose, 2. Scope, 3. Actors, 4. User/System Scenarios, 5. Functional Requirements, 6. Business Rules (+7 more)

### Community 42 - "vitest"
Cohesion: 0.19
Nodes (6): 8. Test awal (24 Sep 2026) — `tests/` tidak lagi kosong, vitest, OeeCalculator, makeHealth(), makeMachine(), makeTelemetry()

### Community 43 - "useOeeDashboard"
Cohesion: 0.31
Nodes (11): 10. Pecah God Hook (24 Sep 2026) — `useOeeDashboard` 841 → komposisi 333 + 8 hook fokus, 4. Rencana remediasi (prioritas), Components, canMutate(), DashboardUiApi, useDashboardUi(), useDeviceRegistry(), useMachineActions() (+3 more)

### Community 44 - "Amandemen 30 Sep 2026 — audit metadata respons API (G17–G20)"
Cohesion: 0.40
Nodes (4): Amandemen 30 Sep 2026 — audit metadata respons API (G17–G20), Amandemen 30 Sep 2026 — audit payload lengkap + frame WS live (G21–G22), G19 — Staleness flag `isOnline` di registry devices/machines (Prioritas: TINGGI), G22 — Recovery WO basi + kelengkapan per-bucket hourly (Prioritas: SEDANG — sebagian klien, sebagian backend)

### Community 46 - "layout"
Cohesion: 0.14
Nodes (13): created, date, features, plan_required_above_complexity, verification_artifact, governance_version, layout, constitution (+5 more)

### Community 47 - "Spec 002 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel"
Cohesion: 0.14
Nodes (13): 10. Dependencies, 11. Open Questions — RESOLVED (2026-11-20, tinjauan backend hidup + kode), 1. Purpose, 3. Actors, 4. User/System Scenarios, 5. Functional Requirements, 6. Business Rules, 7. Non-Functional Requirements (+5 more)

### Community 48 - "ADR-0002 — Auth Password + Station Context + UI Ber-gate Capability"
Cohesion: 0.33
Nodes (5): ADR-0002 — Auth Password + Station Context + UI Ber-gate Capability, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 49 - "oeeApiClient.ts"
Cohesion: 0.12
Nodes (20): G16 — Bentuk `GET /live-state` array-vs-envelope (Prioritas: SEDANG), P1 — Data live tidak lengkap / basi tanpa reload, assertCountAdjust(), assertDeviceCommandReason(), DeviceCommandInput, LiveMachineState, LiveStateSnapshot, IDeviceCommandGateway (+12 more)

### Community 50 - "Spec 003 — Dual-Lane Inisiasi QR: 4 Badge Fisik (Jalur A) + Resolve WO Existing (Jalur B)"
Cohesion: 0.15
Nodes (12): 10. Dependencies, 11. Open Questions — RESOLVED (2026-11-20, pemilik repo), 1. Purpose, 3. Actors, 4. User/System Scenarios, 5. Functional Requirements, 6. Business Rules, 7. Non-Functional Requirements (+4 more)

### Community 51 - "Spec 004 — Chooser 2 Jalur Scan: "4 QR Bertahap" vs "Scan WO Existing""
Cohesion: 0.15
Nodes (12): 10. Open Questions, 11. Revision History, 1. Problem, 2. In Scope, 3. Out of Scope, 4. Actors, 5. Scenarios, 6. Functional Requirements (+4 more)

### Community 52 - "Tasks — Spec 004 Chooser 2 Jalur Scan"
Cohesion: 0.15
Nodes (12): T401 — State scanLane + chooser gate (Spec: FR-001), T402 — komponen ScanLaneChooser (Spec: FR-001, NFR-001/002), T403 — navigasi pilih jalur (Spec: FR-005), T405 — gating Jalur B (Spec: FR-003, AC-003), T406 — pesan arah lintas jalur (Spec: FR-002/003), T407 — semantik config-only (Spec: FR-004, AC-004), T408 — navigasi "Kembali ke pilihan jalur" (Spec: FR-005, AC-005), T409 — guard simulasi tak berubah (Spec: FR-006, AC-006) (+4 more)

### Community 54 - "Implementation Plan — Spec 001 Pembaruan Data Transfer HMI"
Cohesion: 0.17
Nodes (11): 10. Verification Strategy, 1. Approach, 2. Implementation Strategy, 3. Affected Areas, 4. Dependencies, 5. Sequence / Phases, 6. Risks, 7. Assumptions (+3 more)

### Community 55 - "Implementation Plan — Spec 002 Separasi Surface HMI/Station/Andon/Admin"
Cohesion: 0.17
Nodes (11): 10. Verification Strategy, 1. Approach, 2. Implementation Strategy, 3. Affected Areas, 4. Dependencies, 5. Sequence / Phases, 6. Risks, 7. Assumptions (+3 more)

### Community 56 - "useAuthSession.ts"
Cohesion: 0.33
Nodes (7): AuthMode, errorCode(), errorRetryAfter(), errorStatus(), useAuthSession(), pickStationId(), REGISTERED

### Community 57 - "inactivityPolicy.ts"
Cohesion: 0.38
Nodes (9): IdleState, isLockableSurface(), resetIdle(), resolveInactivityTimeoutMs(), tickIdleLock(), touchIdle(), InactivityLock, useInactivityLock() (+1 more)

### Community 59 - "GetHealthUseCase"
Cohesion: 0.21
Nodes (7): 3. Health Endpoint — Footer Reconciliation (B7), BackendHealthApi, BackendHealthDeps, useBackendHealth(), GetHealthUseCase, IHealthRepository, OeeHttpHealthRepository

### Community 60 - "Governance — SDD oee-dashboard-aistudio"
Cohesion: 0.18
Nodes (10): 1.0 — 2026-11-20, ADR supersession, Artifact Authority Matrix, Change impact classification, Conflict Resolution Protocol, Deviation Protocol (implementasi menyimpang dari design), Governance — SDD oee-dashboard-aistudio, Governance versioning (+2 more)

### Community 62 - "Design — Spec 002 Separasi Surface"
Cohesion: 0.22
Nodes (8): Alternatives Considered, Architecture, Design — Spec 002 Separasi Surface, Error Handling, Interfaces, Migration Strategy, Security, State Transitions

### Community 63 - "Design — Spec 001 Pembaruan Data Transfer HMI"
Cohesion: 0.20
Nodes (9): Alternatives Considered, Architecture, Design — Spec 001 Pembaruan Data Transfer HMI, Error Handling, Integration, Interfaces, Migration Strategy, Security (+1 more)

### Community 64 - "useMachinesQuery.ts"
Cohesion: 0.33
Nodes (4): MachinesQueryApi, MachinesQueryDeps, IErrorReporter, NoopErrorReporter

### Community 65 - "useTheme"
Cohesion: 0.06
Nodes (63): EDGE_HEALTH_STALE_AFTER_SEC, isEdgeHealthOk(), HourlyDataPoint, CalculatedOeeMetrics, BackendHealth, formatNumber(), clockLabel(), formatDuration() (+55 more)

### Community 66 - "Project Implementation Status — oee-dashboard-aistudio"
Cohesion: 0.25
Nodes (7): Blocked, Completed, Current Position, Direction, In Progress, Next, Project Implementation Status — oee-dashboard-aistudio

### Community 67 - "AGENTS.md — oee-dashboard-aistudio (HMI OEE)"
Cohesion: 0.25
Nodes (7): AGENTS.md — oee-dashboard-aistudio (HMI OEE), Authoritative sources (link, jangan duplikat), Finding active work, Gates (sebelum implementasi unit), Mandatory rules, Reading order (sebelum mengubah apa pun), Verifikasi

### Community 68 - "surfaceMode.ts"
Cohesion: 0.28
Nodes (6): resolveSurfaceMode(), SurfaceInput, SurfaceMode, ADR-0004, ADR-0004, fleet

### Community 69 - "Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)"
Cohesion: 0.25
Nodes (7): 1. Pengertian HMI (sumber eksternal), 2. Preseden repo v1 (`iiot-oee/apps/frontend`) — workflow usulan SUDAH ada bentuknya, 3. Kontrak backend untuk workflow usulan (API_DOCUMENTATION Nov 2026), 4. Pemetaan ke repo v2 (kondisi kini), 5. Rekomendasi tinjauan, 6. Tinjauan backend HIDUP (2026-11-20, probe + kode) — dasar jawaban OQ, Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)

### Community 70 - "Verification — Spec 002 Separasi Surface"
Cohesion: 0.25
Nodes (7): AC status, Bukti E2E stack hidup (smoke), Bukti otomatis (hijau), Pending pemilik (bukan blocker kode), T116 — E2E stack hidup: bagian executable dieksekusi (2026-11-23), T117 — Diff-review + sync + rebuild + commit/push (2026-11-23), Verification — Spec 002 Separasi Surface

### Community 71 - "Verification — Spec 003 Dual-Lane Inisiasi QR"
Cohesion: 0.22
Nodes (8): Batasan / sisa manual (pemilik), Bukti E2E stack hidup (smoke, nginx :8080, OPR-1001/STM32-OEE-SIM), Bukti otomatis (hijau), Diff live monitor beku (AC-008, rinci), Lifecycle jalur A via API (AC-002/AC-003, bukti 2026-11-23), Matriks AC, Verification — Spec 003 Dual-Lane Inisiasi QR, FullscreenViewModel

### Community 72 - "capabilityGate.ts"
Cohesion: 0.29
Nodes (6): ADR-0002, MutationGateInput, MutationGateResult, SENSITIVE_KEYS, AuthSessionApi, CapabilityMap

### Community 73 - "Tasks — Spec 002 Separasi Surface"
Cohesion: 0.29
Nodes (6): Fase 1 — Surface mode & kiosk lock, Fase 2 — QR initiate-from-zones, Fase 3 — Station fleet & login-first, Fase 4 — Historical exit & auto-lock, Tasks — Spec 002 Separasi Surface, Verifikasi & dokumen

### Community 74 - "ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel"
Cohesion: 0.29
Nodes (6): §A — Amandemen 2026-11-23 (FAT-248 / FAT-252 / FAT-260), ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 75 - "AuthSession"
Cohesion: 0.33
Nodes (6): Public Interfaces / Types, Domain Model, Domain Model, WsLifecycleEvent, WorkOrderStatus, AuthSession

### Community 76 - "Verification — Spec 004 Chooser 2 Jalur Scan"
Cohesion: 0.29
Nodes (6): Batasan, Bukti bundle dev (backend-mode, tanpa mock), Bukti kode per jalur, Bukti otomatis (hijau), Matriks AC, Verification — Spec 004 Chooser 2 Jalur Scan

### Community 77 - "ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST"
Cohesion: 0.33
Nodes (5): ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 78 - "ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif"
Cohesion: 0.33
Nodes (5): ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 79 - "Tasks — Spec 001 Pembaruan Data Transfer HMI"
Cohesion: 0.40
Nodes (4): Fase 1 — Auth & WO (P0), Fase 3 — Kontrak data & otorisasi (P2), Tasks — Spec 001 Pembaruan Data Transfer HMI, Verifikasi & dokumen

### Community 80 - "Engineering Constitution — oee-dashboard-aistudio (HMI)"
Cohesion: 0.33
Nodes (5): Amending this document, Boundary rules, Engineering Constitution — oee-dashboard-aistudio (HMI), Principles, Single source of truth

### Community 81 - "Tasks — Spec 003 Dual-Lane Inisiasi QR"
Cohesion: 0.33
Nodes (5): Fase 1 — Parser zona + tipe draft, Fase 2 — Routing dual-lane + draft nyata + panel konfirmasi, Fase 3 — Tunggu ACK bersama, Tasks — Spec 003 Dual-Lane Inisiasi QR, Verifikasi & deploy

### Community 82 - "useTelemetrySubscription.ts"
Cohesion: 0.50
Nodes (4): ALARM_EVENT_TYPES, TelemetrySubscriptionDeps, ADR-0001, RefetchKind

### Community 83 - "BatchQrStepper.tsx"
Cohesion: 0.40
Nodes (4): BatchQrStepper(), BatchQrStepperProps, STEP_ICONS, STEPS

### Community 84 - "Standing Constraints — oee-dashboard-aistudio"
Cohesion: 0.40
Nodes (4): Business constraints, Organizational constraints, Standing Constraints — oee-dashboard-aistudio, Technical constraints

### Community 85 - "Domain Context — HMI OEE"
Cohesion: 0.40
Nodes (4): Alur data inti, Domain Context — HMI OEE, Rujukan wajib sebelum kerja, Sistem

### Community 86 - "Verification — Spec 001 Pembaruan Data Transfer HMI"
Cohesion: 0.40
Nodes (4): Acceptance Criteria Results, Known Deviations, Residual Risks, Verification — Spec 001 Pembaruan Data Transfer HMI

### Community 87 - "allowBuilds"
Cohesion: 0.50
Nodes (3): allowBuilds, esbuild, protobufjs

### Community 89 - "Frontend Layered Architecture (OEE Dashboard)"
Cohesion: 0.50
Nodes (3): Aturan keras, Frontend Layered Architecture (OEE Dashboard), Shim deprecated (dihapus 23 Sep 2026 — jangan buat lagi)

### Community 92 - "2.1 Seleksi lane (satu pintu)"
Cohesion: 0.50
Nodes (4): 2.1 Seleksi lane (satu pintu), 2.2 Jalur SIMULASI (aktif penuh saat `useBackend=false`), 2.4 Jalur MATI / no-op di mode backend (jebakan "kok tidak terjadi apa-apa"), 2. Peta total jalur koneksi

### Community 94 - "2. Scope"
Cohesion: 0.67
Nodes (3): 2. Scope, In Scope, Out of Scope

## Knowledge Gaps
- **17 isolated node(s):** `ADR-0004`, `ADR-0005`, `ADR-0021`, `ADR-0021`, `ADR-0001` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 538 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `WorkOrder.ts`, `ShiftTimeline.ts`, `package.json`, `MqttEdgeInspectorModal.tsx`, `MachineRecord`, `BatchQrScannerModal.tsx`, `Machine.ts`, `MachineConfig`, `useOeeDashboard.ts`, `useTelemetrySubscription.ts`, `IOeeBackend.ts`, `useLiveTrend.ts`, `MachineRecord`, `useWorkOrderAckWait.ts`, `useOeeDashboard`, `useAuthSession.ts`, `inactivityPolicy.ts`, `GetHealthUseCase`, `useMachinesQuery.ts`, `useTheme`, `useTelemetrySubscription.ts`, `BatchQrStepper.tsx`, `QrCameraScanner.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ITelemetryRepository` (e.g. with `7. Status eksekusi refactoring (23 Sep 2026, berurutan, semua lolos `tsc --noEmit` + `pnpm build`)` and `2. Export Button — Use Existing `/telemetry/:id/export` (B6)`) actually correct?**
  _`ITelemetryRepository` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ADR-0004`, `ADR-0005`, `ADR-0021` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkOrder.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10017730496453901 - nodes in this community are weakly interconnected._
- **Why does `MachineConfig` connect `MachineConfig` to `useMachinesQuery.ts`, `WorkOrder.ts`, `MachineRecord`, `MachineAlarmEvent`, `useTheme`, `ShiftTimeline.ts`, `surfaceMode.ts`, `BatchQrScannerModal.tsx`, `Machine.ts`, `vitest`, `useOeeDashboard.ts`, `useTelemetrySubscription.ts`, `BackendMachineRepository`, `oeeApiClient.ts`, `IOeeBackend.ts`, `useTelemetrySubscription.ts`, `telemetry.dto.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `ShiftTimeline.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0858843537414966 - nodes in this community are weakly interconnected._
- **Why does `parseQrString()` connect `BatchQr.ts` to `routeBackendQr`, `Spec 003 — Dual-Lane Inisiasi QR: 4 Badge Fisik (Jalur A) + Resolve WO Existing (Jalur B)`, `qrRouting.ts`, `BatchQrScannerModal.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._