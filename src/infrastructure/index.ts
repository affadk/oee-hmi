// /src/infrastructure/index.ts
// Canonical infrastructure barrel — adapters, backend clients, DI, config.

export * from './adapters/InMemoryMachineRepository';
export * from './adapters/InMemoryAlarmRepository';
export * from './adapters/MqttEdgeSimulatorAdapter';
// NOTE: LocalStorageThemeAdapter canonical path is ./storage — the file in
// ./adapters is a deprecated re-export shim, intentionally NOT re-exported
// here to avoid duplicate-symbol barrels.
export * from './storage/LocalStorageThemeAdapter';
export * from './seeds/seedData';
export * from './api/endpoints';
export * from './api/httpClient';
export * from './api/oeeApiClient';
export * from './realtime/telemetryWsClient';
export * from './config/env';
export * from './di/Container';
