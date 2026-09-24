// /src/domain/index.ts
// Canonical domain barrel — pure contracts only (no IO, no React).

// Entities (legacy simulation lane)
export * from './entities/Machine';
export * from './entities/OeeMetrics';
export * from './entities/Alarm';
export * from './entities/MqttContracts';
export * from './entities/BatchQr';

// Entities (backend lane — mirrors API_DOCUMENTATION.md)
export * from './entities/backend/LiveState';
export * from './entities/backend/WorkOrder';
export * from './entities/backend/Telemetry';
export * from './entities/backend/Device';

// Domain Services
export * from './services/OeeCalculator';
export * from './services/ShiftTimeline';

// Ports (legacy simulation lane)
export * from './ports/IMachineRepository';
export * from './ports/IAlarmRepository';
export * from './ports/IMqttGateway';
export * from './ports/IThemeStorage';
export * from './ports/IAuthTokenStorage';

// Ports (backend lane — REST + WS)
export * from './ports/IOeeBackend';
export * from './ports/IShiftSummary';
