// /src/infrastructure/index.ts
// Canonical infrastructure barrel — adapters, backend clients, DI, config.

export * from './backend/services/InMemoryMachineRepository';
export * from './backend/services/InMemoryAlarmRepository';
// NOTE: LocalStorageThemeAdapter canonical path is ./storage — the old
// adapters/ shim was removed; only the storage canonical file is exported
// here to avoid duplicate-symbol barrels.
export * from './storage/LocalStorageThemeAdapter';
export * from './simulation/data-generation/seedData';
export * from './backend/api-clients/endpoints';
export * from './backend/api-clients/httpClient';
export * from './backend/api-clients/oeeApiClient';
export * from './realtime/telemetryWsClient';
export * from './config/env';
export * from './di/Container';
