# Frontend Layered Architecture (OEE Dashboard)

Target: konsumsi REST + WebSocket backend IIoT OEE (`iiot-oee/apps/backend/docs/API_DOCUMENTATION.md`)
melalui arsitektur berlapis. Dependency selalu menunjuk ke dalam (Context7 React guidance +
`layered-architecture` skill: domain murni, infrastructure mengimplementasi port milik domain).

```
presentation ──> application ──> domain  (murni: entities, services, ports)
                      ^              ^
                      └─ infrastructure implements ports ─┘
```

## Struktur `src/`

| Folder | Isi | Boleh import dari |
|---|---|---|
| `domain/entities`, `domain/services`, `domain/ports` | Kontrak murni: `Machine`, `OeeMetrics`, `Alarm`, `MqttContracts`, `BatchQr`, `backend/{LiveState,WorkOrder,Telemetry,Device}`, `OeeCalculator`, ports `IMachineRepository`, `IAlarmRepository`, `IMqttGateway`, `IThemeStorage`, `IOeeBackend` | `domain/*` saja (zero IO/framework) |
| `application/use-cases`, `application/hooks`, `application/dto` | Orkestrasi: 8 use-case simulasi + use-case backend (`ListWorkOrders`, `SubscribeTelemetry`, `ConfigureDevice`, downtime/trend label), `useOeeDashboard(deps)`, mapper DTO `live-state/work-order/telemetry` | `domain` saja (+ type-only deps interface) |
| `infrastructure/api`, `realtime`, `adapters`, `seeds`, `storage`, `config`, `di` | `endpoints`, `httpClient`, `oeeApiClient` (6 HTTP adapter), `telemetryWsClient`, `InMemory*`, `MqttEdgeSimulatorAdapter`, `seedData`, `LocalStorageThemeAdapter`, `env`, `Container` (composition root) | `domain`, `application/dto` |
| `presentation/pages`, `components`, `providers`, `hooks`, `styles` | `DashboardPage`, 30+ zona/panel/modal, `ThemeProvider`, `DiProvider`, `useFullscreen`, `themeTokens` | `application`, `domain`, `shared` |
| `shared/utils` | `cx` (bebas framework) | — |

## Aturan keras

1. `domain/` — tanpa `fetch`/`WebSocket`/`localStorage`/`window`/`document`/React.
2. `application/` — tanpa `infrastructure/*`, tanpa seed data, tanpa DOM. `useOeeDashboard` menerima kolaborator via argumen `deps` (diinjeksikan `DashboardPage` dari container).
3. `infrastructure/` — satu-satunya pemilik `fetch`, `WebSocket`, `localStorage`, `import.meta.env` (via `config/env`).
4. `presentation/` — tanpa `fetch` langsung, tanpa repository; mutasi via use-case, tema via provider.
5. DTO mapper (`application/dto`) adalah satu-satunya tempat yang tahu bentuk mentah JSON backend (snake_case, numerik string, envelope `{data,meta}`).

## Backend lane (siap konsumsi API)

- REST: `OeeHttpLiveStateRepository`, `OeeHttpWorkOrderRepository`, `OeeHttpDeviceCommandGateway`, `OeeHttpMasterDataRepository`, `OeeHttpTelemetryRepository`, `OeeHttpAuthGateway` (`infrastructure/api/oeeApiClient.ts`, path di `endpoints.ts`, error via `BackendHttpError` dengan kode domain backend).
- WS: `TelemetryWsClient` (`infrastructure/realtime/`) — heartbeat `ping/pong` + reconnect backoff, frame `is_buffered:true` dibuang di gateway dan difilter defensif via `isLiveTelemetryFrame` di hook.
- Konfigurasi: `VITE_API_BASE_URL`, `VITE_WS_TELEMETRY_URL`, `VITE_API_TOKEN` (lihat `.env.example`).
- Lane simulasi (`InMemory*` + `MqttEdgeSimulatorAdapter`) dipilih bila `VITE_USE_BACKEND` tidak `true`; `.env.example` bawaan repo = `"true"` (backend lane), fallback tanpa env = simulasi. Lane backend sudah di-wire di `Container` dan siap dipakai bertahap per use-case.

## Shim deprecated (dihapus 23 Sep 2026 — jangan buat lagi)

- ~~`src/types.ts`, `src/application/hooks/useTheme.ts`, `src/infrastructure/adapters/LocalStorageThemeAdapter.ts`, `src/infrastructure/di/DiContext.tsx`~~ — dihapus; kode yang mengimportnya dimigrasi ke path kanonis (`src/domain`, `presentation/providers/*`, `infrastructure/storage/*`).
