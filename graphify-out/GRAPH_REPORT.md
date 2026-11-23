# Graph Report - oee-dashboard-aistudio  (2026-11-23)

## Corpus Check
- 254 files · ~136,260 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .lock 1)

## Summary
- 1620 nodes · 4438 edges · 92 communities (87 shown, 5 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 345 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f5b148e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkOrder.ts
- ShiftTimeline.ts
- MachineAlarmEvent
- package.json
- react
- MqttEdgeInspectorModal.tsx
- IOeeBackend.ts
- BatchQrModalContext
- qrRouting.ts
- parseQrString
- useOeeDashboard.ts
- MachineConfig
- Container.ts
- useTheme
- IThemeStoragePort
- useTelemetrySubscription.ts
- BackendMachineRepository
- TelemetryWsClient
- Telemetry.ts
- QrZoneBadge.ts
- Spec RestAPI + WebSocket — OEE Shift Overview & Detailed Audit Dashboard
- BatchQrScannerModal.tsx
- telemetry.dto.ts
- compilerOptions
- 2. Data Inconsistencies (schema mismatches)
- ITelemetryRepository
- oeeApiClient.ts
- Audit Layered Architecture & Kualitas Kode — OEE Dashboard
- useLiveTrend.ts
- lucide-react
- vitest
- BatchQr.ts
- OeeHttpTelemetryRepository
- master-data.dto.ts
- FullscreenOeeView.tsx
- FullscreenViewModel.ts
- BackendMachineRepository.ts
- toFiniteNumber
- Gap Register — HMI OEE vs Backend (Nov 2026)
- OeeHttpAuthGateway
- verify
- Spec 001 — Pembaruan Data Transfer HMI (Refresh Kontrak Backend Nov 2026)
- OeeCalculator
- useOeeDashboard
- Laporan Kekurangan Endpoint Backend (untuk Peningkatan `iiot-oee/apps/backend`)
- GetShiftSummaryUseCase
- layout
- Spec 002 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel
- AuthTokenStorageAdapter
- live-state.dto.ts
- Spec 003 — Dual-Lane Inisiasi QR: 4 Badge Fisik (Jalur A) + Resolve WO Existing (Jalur B)
- Spec 004 — Chooser 2 Jalur Scan: "4 QR Bertahap" vs "Scan WO Existing"
- Tasks — Spec 004 Chooser 2 Jalur Scan
- Machine.ts
- Implementation Plan — Spec 001 Pembaruan Data Transfer HMI
- Implementation Plan — Spec 002 Separasi Surface HMI/Station/Andon/Admin
- useAuthSession.ts
- inactivityPolicy.ts
- OeeHttpMasterDataRepository
- GetHealthUseCase
- Governance — SDD oee-dashboard-aistudio
- IAuthGateway
- HeaderZone.tsx
- Design — Spec 001 Pembaruan Data Transfer HMI
- Design — Spec 002 Separasi Surface
- EChartsOeeTrend.tsx
- Project Implementation Status — oee-dashboard-aistudio
- AGENTS.md — oee-dashboard-aistudio (HMI OEE)
- capabilityGate.ts
- Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)
- Verification — Spec 002 Separasi Surface
- Verification — Spec 003 Dual-Lane Inisiasi QR
- surfaceMode.ts
- PasXDonutGauge.tsx
- ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel
- Tasks — Spec 002 Separasi Surface
- Verification — Spec 004 Chooser 2 Jalur Scan
- ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST
- ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif
- Rencana Penyesuaian Integrasi Frontend ↔ Backend IIoT OEE
- Engineering Constitution — oee-dashboard-aistudio (HMI)
- Tasks — Spec 003 Dual-Lane Inisiasi QR
- SectionCard.tsx
- MemoryTokenStorage
- Standing Constraints — oee-dashboard-aistudio
- Domain Context — HMI OEE
- Verification — Spec 001 Pembaruan Data Transfer HMI
- allowBuilds
- types.ts
- 2. Scope
- glossary.md

## God Nodes (most connected - your core abstractions)
1. `MachineConfig` - 108 edges
2. `react` - 83 edges
3. `useTheme()` - 53 edges
4. `lucide-react` - 45 edges
5. `ITelemetryRepository` - 45 edges
6. `createContainer()` - 40 edges
7. `AppContainer` - 37 edges
8. `MachineAlarmEvent` - 35 edges
9. `BatchQrModalContext` - 33 edges
10. `vitest` - 32 edges

## Surprising Connections (you probably didn't know these)
- `Amandemen FAT-248/252/260 (2026-11-23, ADR-0004 §A)` --references--> `useAuthSession()`  [INFERRED]
  specs/002-hmi-station-surfaces/spec.md → src/application/hooks/useAuthSession.ts
- `Aturan keras` --references--> `useOeeDashboard()`  [INFERRED]
  ARCHITECTURE.md → src/application/hooks/useOeeDashboard.ts
- `Fase 1 — Surface mode & kiosk lock` --references--> `useOeeDashboard()`  [INFERRED]
  specs/002-hmi-station-surfaces/tasks.md → src/application/hooks/useOeeDashboard.ts
- `Fase 3 — Tunggu ACK bersama` --references--> `useWorkOrders()`  [INFERRED]
  specs/003-qr-dual-lane-initiation/tasks.md → src/application/hooks/useWorkOrders.ts
- `2. Komponen terdampak (perkiraan)` --references--> `buildZoneStrings()`  [INFERRED]
  specs/003-qr-dual-lane-initiation/plan.md → src/application/qrZones.ts

## Import Cycles
- None detected.

## Communities (92 total, 5 thin omitted)

### Community 0 - "WorkOrder.ts"
Cohesion: 0.05
Nodes (41): P0 — RUSAK terhadap backend sekarang (blocking), 1. Route Code Splitting — Reduce Bundle Size, 4. Work Order Detail UI — Use Existing `GET /work-orders/:id` (B1), 5. Products/Operators Registry — Use Existing Endpoints (B4), 6. Coverage Tooling, 7. Replace `console.error` with Error Boundary / Reporter, Execution Order (Dependencies), Frontend Actionable Items — Implementation Plan (+33 more)

### Community 1 - "ShiftTimeline.ts"
Cohesion: 0.07
Nodes (40): G10 — Jendela istirahat terstruktur (Prioritas: SEDANG), mergeShiftSummary(), ShiftServerDataApi, isPlannedDowntimeCategory(), IShiftSummaryRepository, IShiftTimelineRepository, ShiftSummary, ShiftSummaryOee (+32 more)

### Community 2 - "MachineAlarmEvent"
Cohesion: 0.07
Nodes (24): 1. Jawaban singkat, 2.1 Seleksi lane (satu pintu), 2.2 Jalur SIMULASI (aktif penuh saat `useBackend=false`), 2.4 Jalur MATI / no-op di mode backend (jebakan "kok tidak terjadi apa-apa"), 2. Peta total jalur koneksi, 3. Mengapa "sudah diubah tapi tetap simulasi" — 5 penyebab konkret, 5. Cara mematikan simulasi total (checklist enforcement), 6. Referensi silang berkas (+16 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (49): dependencies, echarts@^6.1.0, html5-qrcode@^2.3.8, lucide-react@^0.546.0, react@^19.0.1, react-dom@^19.0.1, react-router-dom@^7.18.4, @tailwindcss/vite@^4.3.3 (+41 more)

### Community 4 - "react"
Cohesion: 0.12
Nodes (26): react, react-router-dom, App(), OverviewPage, RouteFallback(), AuthPinModal(), AuthPinModalProps, FormulaHelpModal() (+18 more)

### Community 5 - "MqttEdgeInspectorModal.tsx"
Cohesion: 0.15
Nodes (29): MqttConsole(), MqttConsoleProps, MqttEdgeInspectorModal(), JaringanTab(), JaringanTabProps, KesehatanTab(), KesehatanTabProps, KontrolTab() (+21 more)

### Community 6 - "IOeeBackend.ts"
Cohesion: 0.13
Nodes (17): DeviceRegistryApi, DeviceRegistryDeps, ConfigureDeviceUseCase, DeviceRecord, MachineRecord, OperatorRecord, ProductRecord, ApiErrorShape (+9 more)

### Community 7 - "BatchQrModalContext"
Cohesion: 0.15
Nodes (27): BatchQrModalContext, BatchQrStepperProps, QrDraftSummary(), QrDraftSummaryProps, QrScanInput(), QrScanInputProps, BackendReviewStep(), BackendReviewStepProps (+19 more)

### Community 8 - "qrRouting.ts"
Cohesion: 0.07
Nodes (31): ADR-0006 — Chooser 2 Jalur Scan Eksplisit + Semantik Config-Only (START di Edge), Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks, Domain Model, Alternatives Considered, Architecture (+23 more)

### Community 9 - "parseQrString"
Cohesion: 0.07
Nodes (29): ADR-0005 — Dual-Lane Inisiasi QR: Parser Zona Cermin Backend + Draft Fail-Closed + Tunggu ACK Terbatas, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks, 16. Alur QR backend standar-kamera (24 Sep 2026) — ✅ SELESAI, Alternatives Considered, Architecture (+21 more)

### Community 10 - "useOeeDashboard.ts"
Cohesion: 0.12
Nodes (19): Domain Model, DashboardUiApi, LiveTrendPoint, BackendDowntimeLabelInput, MachineActionsApi, ADR-0004, UseOeeDashboardReturn, SurfaceMode (+11 more)

### Community 11 - "MachineConfig"
Cohesion: 0.12
Nodes (8): SimulationTickerDeps, useSimulationTicker(), SimulateMachinePulseUseCase, MachineConfig, IMachineRepository, InMemoryMachineRepository, MqttEdgeInspectorModalProps, FloorPushButtonsPanelProps

### Community 12 - "Container.ts"
Cohesion: 0.18
Nodes (21): MachineActionsDeps, OeeDashboardDeps, CalculateOeeUseCase, ExportTelemetryUseCase, GetDowntimeReasonsUseCase, GetShiftTimelineUseCase, LabelDowntimeReasonUseCase, LogDowntimeUseCase (+13 more)

### Community 13 - "useTheme"
Cohesion: 0.22
Nodes (15): CalculatedOeeMetrics, formatNumber(), AuditPage(), AlarmsZone(), HeroKpiZone(), HeroKpiZoneProps, LossAnalysisZone(), LossAnalysisZoneProps (+7 more)

### Community 14 - "IThemeStoragePort"
Cohesion: 0.12
Nodes (11): Aturan keras, Frontend Layered Architecture (OEE Dashboard), Shim deprecated (dihapus 23 Sep 2026 — jangan buat lagi), Struktur `src/`, 1. Kepatuhan layered architecture, IThemeStoragePort, ThemeMode, ThemePreference (+3 more)

### Community 15 - "useTelemetrySubscription.ts"
Cohesion: 0.12
Nodes (19): mergeSnapshotsIntoMachines(), RESYNC_POLL_MS, ADR-0001, FleetResyncApi, FleetResyncDeps, ADR-0001, useFleetResync(), ALARM_EVENT_TYPES (+11 more)

### Community 16 - "BackendMachineRepository"
Cohesion: 0.15
Nodes (11): G2 — Target produksi per jam (Prioritas: SEDANG), LiveStateSnapshot, BackendMachineRepository, buildJobConfigFromResolve(), mapLiveStateToMachineStatus(), mapLiveStateToTelemetry(), emptyPage, machineRecord (+3 more)

### Community 17 - "TelemetryWsClient"
Cohesion: 0.11
Nodes (9): G15 — Heartbeat WS + idle timeout (Prioritas: RENDAH, klarifikasi), RealtimeListener, env, EnvKey, rawApiBaseUrl, TelemetryWsClient, ADR-0001, connectClient() (+1 more)

### Community 18 - "Telemetry.ts"
Cohesion: 0.17
Nodes (11): SupplementalSyncApi, SupplementalSyncDeps, GetActiveDowntimesUseCase, GetRejectBreakdownUseCase, ListLabelableDowntimesUseCase, DowntimeEvent, PLANNED_DOWNTIME_CATEGORIES, RejectBreakdownItem (+3 more)

### Community 19 - "QrZoneBadge.ts"
Cohesion: 0.17
Nodes (21): detectZones(), isWoLanePayload(), looksLikeZoneBadge(), parseKeyValue(), parseMachineBadge(), parseOperatorBadge(), parseProductBadge(), parseShiftBadge() (+13 more)

### Community 20 - "Spec RestAPI + WebSocket — OEE Shift Overview & Detailed Audit Dashboard"
Cohesion: 0.09
Nodes (22): 0. Ringkasan eksekutif, 1. Looping analisa 3x (wajib dibaca reviewer), 2.1 OEE Shift Overview — komposisi panggilan, 2.2 Detailed Audit Dashboard — komposisi panggilan, 2. Kontrak REST yang di-reuse (v1 frontend — tanpa perubahan backend), 3.1 `GET /api/v1/oee/shift-summary`, 3.2 `GET /api/v1/oee/shift-timeline`, 3. Kontrak REST baru yang diusulkan (Fase 2 — aditif, tidak wajib untuk v1) (+14 more)

### Community 21 - "BatchQrScannerModal.tsx"
Cohesion: 0.13
Nodes (18): emptyBatchDraft(), formatOperatorDisplay(), QR_OPERATOR_CATALOG, scheduleToShiftOverride(), QrCameraScanner(), QrCameraScannerProps, AckStatusPanel(), AckStatusPanelProps (+10 more)

### Community 22 - "telemetry.dto.ts"
Cohesion: 0.10
Nodes (18): ADR-0003, ALL_DOWNTIME_CATEGORIES, DowntimeCategory, WsTelemetryFrame, EdgeHealthPayload, HourlyTrendPoint, RawDeviceHealth, RawDowntime (+10 more)

### Community 23 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+13 more)

### Community 24 - "2. Data Inconsistencies (schema mismatches)"
Cohesion: 0.10
Nodes (20): 1. Missing Endpoints, 2. Data Inconsistencies (schema mismatches), 3. Missing Logic / Functionality, Backend Gap Analysis — Frontend Requirements, D1. `hourly`/`aggregate` use `avg*` keys; spec names unprefixed keys — HIGH, D2. Raw history uses `recordedAt`; WS/docs imply `timestamp` — MEDIUM, D3. WS relay wraps frames in `{type, device_id, data}` but docs show flat frames — HIGH (client fixed), D4. `GET /telemetry/:id/hourly` ignores `from`/`to` — MEDIUM (+12 more)

### Community 25 - "ITelemetryRepository"
Cohesion: 0.11
Nodes (4): 2. Export Button — Use Existing `/telemetry/:id/export` (B6), GetHourlyTrendsUseCase, DeviceHealth, ITelemetryRepository

### Community 26 - "oeeApiClient.ts"
Cohesion: 0.18
Nodes (10): IAuthTokenStorage, BackendHttpError, httpDownload(), HttpOptions, httpRequest(), resolveToken(), tokenStorage, OeeHttpWorkOrderRepository (+2 more)

### Community 27 - "Audit Layered Architecture & Kualitas Kode — OEE Dashboard"
Cohesion: 0.11
Nodes (18): 0. Metrik terverifikasi (shell, bukan estimasi), 11. Lint tanpa typescript-eslint (24 Sep 2026) — diblokir TS 7, diganti jujur, 14. Fase 1 shift-summary/shift-timeline (24 Sep 2026) — slice + fallback, ✅ SELESAI, 17. Audit UX inisiasi batch via tombol fisik (24 Sep 2026) — temuan, belum dieksekusi, 18. Perbaikan UX tombol fisik (24 Sep 2026) — U2–U6 ✅ SELESAI, 2. Penguatan temuan lama (terverifikasi ulang), 3. Temuan baru (belum ada di audit sebelumnya), 5. Perintah verifikasi (+10 more)

### Community 28 - "useLiveTrend.ts"
Cohesion: 0.22
Nodes (11): 15. Integrasi B-scope telemetry + device + QR-WO (24 Sep 2026) — ✅ SELESAI, G18 — `GET /telemetry/:id` (raw history) memakai key `recordedAt` (Prioritas: SEDANG — sudah ditutup klien), Matriks cakupan fungsi → backend, LiveTrendDeps, toLivePoints(), useLiveTrend(), GetTelemetryAggregateUseCase, GetTelemetryHistoryUseCase (+3 more)

### Community 29 - "lucide-react"
Cohesion: 0.24
Nodes (12): lucide-react, BackendHealth, HealthFooter(), HealthFooterProps, DeviceConfigModal(), DeviceListPanel(), DraftMap, MachineBindPanel() (+4 more)

### Community 30 - "vitest"
Cohesion: 0.16
Nodes (9): vitest, base64UrlToString(), decodeJwtExpMs(), isTokenExpiringSoon(), EDGE_HEALTH_STALE_AFTER_SEC, endpoints, mapDeviceHealthDto(), mapOperationalEventDto() (+1 more)

### Community 31 - "BatchQr.ts"
Cohesion: 0.19
Nodes (14): buildZoneStrings(), ZoneExtras, BatchDraft, isDraftComplete(), ParsedQrKind, ParsedQrResult, QR_PRODUCT_CATALOG, QR_SCHEDULE_CATALOG (+6 more)

### Community 32 - "OeeHttpTelemetryRepository"
Cohesion: 0.21
Nodes (10): OperationalEventsQuery, PageMeta, OeeHttpTelemetryRepository, withQuery(), mapDowntimeEventDto(), mapDowntimeResultDto(), mapHourlyTrendResultDto(), mapOperationalEventResultDto() (+2 more)

### Community 33 - "master-data.dto.ts"
Cohesion: 0.26
Nodes (15): asRecord(), mapDeviceDto(), mapDeviceListDto(), mapMachineDto(), mapMachineListDto(), mapOperatorDto(), mapOperatorListDto(), mapProductDto() (+7 more)

### Community 34 - "FullscreenOeeView.tsx"
Cohesion: 0.24
Nodes (12): FloorPushButtonsPanel(), FullscreenOeeView(), TimeSummaryPanel(), FullscreenHeader(), FullscreenHeaderProps, buildFullscreenViewModel(), EChartsOeeTrend, KpiCard() (+4 more)

### Community 35 - "FullscreenViewModel.ts"
Cohesion: 0.26
Nodes (9): WorkOrdersApi, AckWaitState, InitiateFromZonesResult, WorkOrderResolveResult, ZoneRawStrings, buildResolveResultFromDetail(), BatchQrScannerModalProps, ProductionSetupModalProps (+1 more)

### Community 36 - "BackendMachineRepository.ts"
Cohesion: 0.28
Nodes (10): Public Interfaces / Types, P1 — Data live tidak lengkap / basi tanpa reload, Domain Model, assertCountAdjust(), assertDeviceCommandReason(), DeviceCommandInput, DeviceCommandKind, WsLifecycleEvent (+2 more)

### Community 37 - "toFiniteNumber"
Cohesion: 0.21
Nodes (14): Amandemen 30 Sep 2026 — audit metadata respons API (G17–G20), Amandemen 30 Sep 2026 — audit payload lengkap + frame WS live (G21–G22), G17 — Skema key `hourly`/`aggregate` memakai prefiks `avg*` (Prioritas: TINGGI — sudah ditutup klien), G19 — Staleness flag `isOnline` di registry devices/machines (Prioritas: TINGGI), G21 — Frame WS relay ber-envelope, `HEALTH_UPDATE` sempat masuk jalur telemetri (Prioritas: TINGGI — sudah ditutup klien), G22 — Recovery WO basi + kelengkapan per-bucket hourly (Prioritas: SEDANG — sebagian klien, sebagian backend), Components, toFiniteNumber() (+6 more)

### Community 38 - "Gap Register — HMI OEE vs Backend (Nov 2026)"
Cohesion: 0.12
Nodes (15): A. Gap frontend (perombakan data transfer — repo ini), B. Gap backend / dokumentasi (tim `iiot-oee` atau verifikasi bersama), C. Sudah ditutup (jangan diinvestigasi ulang), Cara pakai, D. Jawaban Open Questions (ringkasan navigasi; otoritas: spec §11 rev 2), Gap Register — HMI OEE vs Backend (Nov 2026), 1. Kondisi kini (yang sudah benar — jangan dirombak), 2. Temuan — kebutuhan pembaruan (prioritas) (+7 more)

### Community 39 - "OeeHttpAuthGateway"
Cohesion: 0.14
Nodes (3): Backend lane (siap konsumsi API), G13 — Refresh / revoke token operator (Prioritas: SEDANG), OeeHttpAuthGateway

### Community 40 - "verify"
Cohesion: 0.12
Nodes (15): jobs, verify, name, on, pull_request, push, run, uses (+7 more)

### Community 41 - "Spec 001 — Pembaruan Data Transfer HMI (Refresh Kontrak Backend Nov 2026)"
Cohesion: 0.12
Nodes (15): 10. Dependencies, 11. Open Questions — RESOLVED (2026-11-20), 1. Purpose, 2. Scope, 3. Actors, 4. User/System Scenarios, 5. Functional Requirements, 6. Business Rules (+7 more)

### Community 42 - "OeeCalculator"
Cohesion: 0.17
Nodes (9): Fase 1 — Auth & WO (P0), Fase 2 — Realtime & perintah (P1), Fase 3 — Kontrak data & otorisasi (P2), Tasks — Spec 001 Pembaruan Data Transfer HMI, Verifikasi & dokumen, OeeCalculator, makeHealth(), makeMachine() (+1 more)

### Community 43 - "useOeeDashboard"
Cohesion: 0.30
Nodes (12): 10. Pecah God Hook (24 Sep 2026) — `useOeeDashboard` 841 → komposisi 333 + 8 hook fokus, 4. Rencana remediasi (prioritas), Components, canMutate(), useBackendHealth(), useDashboardUi(), useDeviceRegistry(), useMachineActions() (+4 more)

### Community 44 - "Laporan Kekurangan Endpoint Backend (untuk Peningkatan `iiot-oee/apps/backend`)"
Cohesion: 0.15
Nodes (13): 12. Badge data parsial (24 Sep 2026) — N11 tertutup sebagian, G11 — Seri per-jam terlingkup shift (Prioritas: RENDAH), G14 — Dukungan `active_only` + `unlabeled_only` di downtimes (Prioritas: TINGGI), G16 — Bentuk `GET /live-state` array-vs-envelope (Prioritas: SEDANG), G1 — Rincian reject / scrap per alasan (Prioritas: TINGGI), G3 — Status kesehatan edge controller (Prioritas: SEDANG), G7 — Pencatatan reject manual & pulsa counting (Prioritas: RENDAH — keputusan produk), G8 — Pemicu UI untuk RESET_COUNTER di lane backend (Prioritas: SEDANG) — ✅ SELESAI SISI FRONTEND 24 Sep 2026 (+5 more)

### Community 45 - "GetShiftSummaryUseCase"
Cohesion: 0.16
Nodes (8): 2.3 Jalur BACKEND (aktif saat `useBackend=true`), Status Dokumen `docs/` — OEE Dashboard, Urutan baca yang disarankan, 7. Strategi integrasi frontend (`oee-dashboard-aistudio`), ShiftServerDataDeps, GetShiftSummaryUseCase, SubscribeTelemetryUseCase, IRealtimeGateway

### Community 46 - "layout"
Cohesion: 0.14
Nodes (13): created, date, features, plan_required_above_complexity, verification_artifact, governance_version, layout, constitution (+5 more)

### Community 47 - "Spec 002 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel"
Cohesion: 0.14
Nodes (13): 10. Dependencies, 11. Open Questions — RESOLVED (2026-11-20, tinjauan backend hidup + kode), 1. Purpose, 3. Actors, 4. User/System Scenarios, 5. Functional Requirements, 6. Business Rules, 7. Non-Functional Requirements (+5 more)

### Community 48 - "AuthTokenStorageAdapter"
Cohesion: 0.15
Nodes (7): ADR-0002 — Auth Password + Station Context + UI Ber-gate Capability, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks, Data Model, AuthTokenStorageAdapter

### Community 49 - "live-state.dto.ts"
Cohesion: 0.22
Nodes (9): 13. Frontend follow-up terencana (24 Sep 2026) — tidak dieksekusi, tercatat, 4. Cacat backend-lane yang ditemukan saat audit (wajib diperbaiki sebelum enforcement penuh), G6 — Penyelarasan nama state FSM (Prioritas: RENDAH, non-breaking), OeeHttpLiveStateRepository, KNOWN_STATES, mapLiveStateDto(), mapLiveStateListDto(), normalizeState() (+1 more)

### Community 50 - "Spec 003 — Dual-Lane Inisiasi QR: 4 Badge Fisik (Jalur A) + Resolve WO Existing (Jalur B)"
Cohesion: 0.15
Nodes (12): 10. Dependencies, 11. Open Questions — RESOLVED (2026-11-20, pemilik repo), 1. Purpose, 3. Actors, 4. User/System Scenarios, 5. Functional Requirements, 6. Business Rules, 7. Non-Functional Requirements (+4 more)

### Community 51 - "Spec 004 — Chooser 2 Jalur Scan: "4 QR Bertahap" vs "Scan WO Existing""
Cohesion: 0.15
Nodes (12): 10. Open Questions, 11. Revision History, 1. Problem, 2. In Scope, 3. Out of Scope, 4. Actors, 5. Scenarios, 6. Functional Requirements (+4 more)

### Community 52 - "Tasks — Spec 004 Chooser 2 Jalur Scan"
Cohesion: 0.15
Nodes (12): T401 — State scanLane + chooser gate (Spec: FR-001), T402 — komponen ScanLaneChooser (Spec: FR-001, NFR-001/002), T403 — navigasi pilih jalur (Spec: FR-005), T405 — gating Jalur B (Spec: FR-003, AC-003), T406 — pesan arah lintas jalur (Spec: FR-002/003), T407 — semantik config-only (Spec: FR-004, AC-004), T408 — navigasi "Kembali ke pilihan jalur" (Spec: FR-005, AC-005), T409 — guard simulasi tak berubah (Spec: FR-006, AC-006) (+4 more)

### Community 53 - "Machine.ts"
Cohesion: 0.24
Nodes (8): MachinesQueryApi, MachinesQueryDeps, WorkOrdersDeps, GetMachinesUseCase, isTelemetryStale(), TELEMETRY_STALE_AFTER_SEC, telemetryAgeSec(), FullscreenViewModel

### Community 54 - "Implementation Plan — Spec 001 Pembaruan Data Transfer HMI"
Cohesion: 0.17
Nodes (11): 10. Verification Strategy, 1. Approach, 2. Implementation Strategy, 3. Affected Areas, 4. Dependencies, 5. Sequence / Phases, 6. Risks, 7. Assumptions (+3 more)

### Community 55 - "Implementation Plan — Spec 002 Separasi Surface HMI/Station/Andon/Admin"
Cohesion: 0.17
Nodes (11): 10. Verification Strategy, 1. Approach, 2. Implementation Strategy, 3. Affected Areas, 4. Dependencies, 5. Sequence / Phases, 6. Risks, 7. Assumptions (+3 more)

### Community 56 - "useAuthSession.ts"
Cohesion: 0.26
Nodes (8): AuthMode, errorCode(), errorRetryAfter(), errorStatus(), useAuthSession(), pickStationId(), AccessMode, REGISTERED

### Community 57 - "inactivityPolicy.ts"
Cohesion: 0.38
Nodes (9): IdleState, isLockableSurface(), resetIdle(), resolveInactivityTimeoutMs(), tickIdleLock(), touchIdle(), InactivityLock, useInactivityLock() (+1 more)

### Community 58 - "OeeHttpMasterDataRepository"
Cohesion: 0.20
Nodes (3): G12 — Kontrak 204-vs-body endpoint mutasi (Prioritas: SEDANG, klarifikasi), G20 — `GET /operators` mewajibkan auth tapi tak terdokumentasi (Prioritas: SEDANG), OeeHttpMasterDataRepository

### Community 59 - "GetHealthUseCase"
Cohesion: 0.27
Nodes (6): 3. Health Endpoint — Footer Reconciliation (B7), BackendHealthApi, BackendHealthDeps, GetHealthUseCase, IHealthRepository, OeeHttpHealthRepository

### Community 60 - "Governance — SDD oee-dashboard-aistudio"
Cohesion: 0.18
Nodes (10): 1.0 — 2026-11-20, ADR supersession, Artifact Authority Matrix, Change impact classification, Conflict Resolution Protocol, Deviation Protocol (implementasi menyimpang dari design), Governance — SDD oee-dashboard-aistudio, Governance versioning (+2 more)

### Community 62 - "HeaderZone.tsx"
Cohesion: 0.29
Nodes (7): isEdgeHealthOk(), HeaderZone(), HeaderZoneProps, FullscreenSubHeader(), FullscreenSubHeaderProps, MachineIdentity(), MachineIdentityProps

### Community 63 - "Design — Spec 001 Pembaruan Data Transfer HMI"
Cohesion: 0.20
Nodes (9): Alternatives Considered, Architecture, Design — Spec 001 Pembaruan Data Transfer HMI, Error Handling, Integration, Interfaces, Migration Strategy, Security (+1 more)

### Community 64 - "Design — Spec 002 Separasi Surface"
Cohesion: 0.22
Nodes (8): Alternatives Considered, Architecture, Design — Spec 002 Separasi Surface, Error Handling, Interfaces, Migration Strategy, Security, State Transitions

### Community 65 - "EChartsOeeTrend.tsx"
Cohesion: 0.39
Nodes (7): HourlyDataPoint, EChartsOeeTrend(), EChartsOeeTrendProps, TrendZoneProps, containerScale(), scaledFont(), streamWord()

### Community 66 - "Project Implementation Status — oee-dashboard-aistudio"
Cohesion: 0.22
Nodes (8): Blocked, Completed, Current Position, Direction, In Progress, Next, Progress History, Project Implementation Status — oee-dashboard-aistudio

### Community 67 - "AGENTS.md — oee-dashboard-aistudio (HMI OEE)"
Cohesion: 0.25
Nodes (7): AGENTS.md — oee-dashboard-aistudio (HMI OEE), Authoritative sources (link, jangan duplikat), Finding active work, Gates (sebelum implementasi unit), Mandatory rules, Reading order (sebelum mengubah apa pun), Verifikasi

### Community 68 - "capabilityGate.ts"
Cohesion: 0.29
Nodes (6): ADR-0002, MutationGateInput, MutationGateResult, SENSITIVE_KEYS, AuthSessionApi, CapabilityMap

### Community 69 - "Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)"
Cohesion: 0.25
Nodes (7): 1. Pengertian HMI (sumber eksternal), 2. Preseden repo v1 (`iiot-oee/apps/frontend`) — workflow usulan SUDAH ada bentuknya, 3. Kontrak backend untuk workflow usulan (API_DOCUMENTATION Nov 2026), 4. Pemetaan ke repo v2 (kondisi kini), 5. Rekomendasi tinjauan, 6. Tinjauan backend HIDUP (2026-11-20, probe + kode) — dasar jawaban OQ, Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)

### Community 70 - "Verification — Spec 002 Separasi Surface"
Cohesion: 0.25
Nodes (7): AC status, Bukti E2E stack hidup (smoke), Bukti otomatis (hijau), Pending pemilik (bukan blocker kode), T116 — E2E stack hidup: bagian executable dieksekusi (2026-11-23), T117 — Diff-review + sync + rebuild + commit/push (2026-11-23), Verification — Spec 002 Separasi Surface

### Community 71 - "Verification — Spec 003 Dual-Lane Inisiasi QR"
Cohesion: 0.25
Nodes (7): Batasan / sisa manual (pemilik), Bukti E2E stack hidup (smoke, nginx :8080, OPR-1001/STM32-OEE-SIM), Bukti otomatis (hijau), Diff live monitor beku (AC-008, rinci), Lifecycle jalur A via API (AC-002/AC-003, bukti 2026-11-23), Matriks AC, Verification — Spec 003 Dual-Lane Inisiasi QR

### Community 72 - "surfaceMode.ts"
Cohesion: 0.32
Nodes (5): resolveSurfaceMode(), SurfaceInput, ADR-0004, ADR-0004, fleet

### Community 73 - "PasXDonutGauge.tsx"
Cohesion: 0.57
Nodes (4): PasXDonutGauge(), PasXDonutGaugeProps, PasXTachometerGauge(), PasXTachometerGaugeProps

### Community 74 - "ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel"
Cohesion: 0.29
Nodes (6): §A — Amandemen 2026-11-23 (FAT-248 / FAT-252 / FAT-260), ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 75 - "Tasks — Spec 002 Separasi Surface"
Cohesion: 0.29
Nodes (6): Fase 1 — Surface mode & kiosk lock, Fase 2 — QR initiate-from-zones, Fase 3 — Station fleet & login-first, Fase 4 — Historical exit & auto-lock, Tasks — Spec 002 Separasi Surface, Verifikasi & dokumen

### Community 76 - "Verification — Spec 004 Chooser 2 Jalur Scan"
Cohesion: 0.29
Nodes (6): Batasan, Bukti bundle dev (backend-mode, tanpa mock), Bukti kode per jalur, Bukti otomatis (hijau), Matriks AC, Verification — Spec 004 Chooser 2 Jalur Scan

### Community 77 - "ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST"
Cohesion: 0.33
Nodes (5): ADR-0001 — Strategi Data Transfer Realtime: WS Hot-Path + Resync Snapshot REST, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 78 - "ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif"
Cohesion: 0.33
Nodes (5): ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif, Alternatif yang Dipertimbangkan, Keputusan, Konsekuensi, Konteks

### Community 79 - "Rencana Penyesuaian Integrasi Frontend ↔ Backend IIoT OEE"
Cohesion: 0.33
Nodes (5): Assumptions, Key Changes, Rencana Penyesuaian Integrasi Frontend ↔ Backend IIoT OEE, Summary, Test Plan

### Community 80 - "Engineering Constitution — oee-dashboard-aistudio (HMI)"
Cohesion: 0.33
Nodes (5): Amending this document, Boundary rules, Engineering Constitution — oee-dashboard-aistudio (HMI), Principles, Single source of truth

### Community 81 - "Tasks — Spec 003 Dual-Lane Inisiasi QR"
Cohesion: 0.33
Nodes (5): Fase 1 — Parser zona + tipe draft, Fase 2 — Routing dual-lane + draft nyata + panel konfirmasi, Fase 3 — Tunggu ACK bersama, Tasks — Spec 003 Dual-Lane Inisiasi QR, Verifikasi & deploy

### Community 82 - "SectionCard.tsx"
Cohesion: 0.40
Nodes (3): SectionCard(), sectionCardClass(), SectionHeader()

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

### Community 89 - "2. Scope"
Cohesion: 0.67
Nodes (3): 2. Scope, In Scope, Out of Scope

## Knowledge Gaps
- **17 isolated node(s):** `ADR-0002`, `ADR-0001`, `ADR-0001`, `ADR-0004`, `ADR-0001` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 526 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `WorkOrder.ts`, `ShiftTimeline.ts`, `package.json`, `MqttEdgeInspectorModal.tsx`, `IOeeBackend.ts`, `BatchQrModalContext`, `useOeeDashboard.ts`, `MachineConfig`, `useTheme`, `useTelemetrySubscription.ts`, `Telemetry.ts`, `BatchQrScannerModal.tsx`, `useLiveTrend.ts`, `lucide-react`, `BatchQr.ts`, `FullscreenOeeView.tsx`, `FullscreenViewModel.ts`, `Machine.ts`, `useAuthSession.ts`, `inactivityPolicy.ts`, `GetHealthUseCase`, `HeaderZone.tsx`, `EChartsOeeTrend.tsx`, `PasXDonutGauge.tsx`, `SectionCard.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ITelemetryRepository` (e.g. with `7. Status eksekusi refactoring (23 Sep 2026, berurutan, semua lolos `tsc --noEmit` + `pnpm build`)` and `2. Export Button — Use Existing `/telemetry/:id/export` (B6)`) actually correct?**
  _`ITelemetryRepository` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ADR-0002`, `ADR-0001`, `ADR-0001` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkOrder.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051360842844600525 - nodes in this community are weakly interconnected._
- **Why does `MachineConfig` connect `MachineConfig` to `ShiftTimeline.ts`, `MachineAlarmEvent`, `react`, `MqttEdgeInspectorModal.tsx`, `IOeeBackend.ts`, `BatchQrModalContext`, `useOeeDashboard.ts`, `Container.ts`, `useTheme`, `useTelemetrySubscription.ts`, `BackendMachineRepository`, `Telemetry.ts`, `BatchQrScannerModal.tsx`, `telemetry.dto.ts`, `BatchQr.ts`, `FullscreenOeeView.tsx`, `FullscreenViewModel.ts`, `BackendMachineRepository.ts`, `OeeCalculator`, `Machine.ts`, `HeaderZone.tsx`, `surfaceMode.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `ShiftTimeline.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06557377049180328 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `WorkOrder.ts`, `ShiftTimeline.ts`, `package.json`, `qrRouting.ts`, `parseQrString`, `useTelemetrySubscription.ts`, `BackendMachineRepository`, `TelemetryWsClient`, `Telemetry.ts`, `QrZoneBadge.ts`, `oeeApiClient.ts`, `useLiveTrend.ts`, `BatchQr.ts`, `master-data.dto.ts`, `toFiniteNumber`, `OeeCalculator`, `live-state.dto.ts`, `Machine.ts`, `useAuthSession.ts`, `inactivityPolicy.ts`, `surfaceMode.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._