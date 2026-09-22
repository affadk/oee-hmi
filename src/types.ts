// /src/types.ts
// DEPRECATED compatibility shim — canonical contracts live in src/domain.
// New code: import { ... } from './domain' (or './domain/entities/...').

export * from './domain/entities/Machine';
export * from './domain/entities/OeeMetrics';
export * from './domain/entities/Alarm';
export * from './domain/entities/MqttContracts';
export * from './domain/entities/BatchQr';
export * from './domain/ports/IMachineRepository';
export * from './domain/ports/IAlarmRepository';
export * from './domain/ports/IMqttGateway';
export * from './domain/ports/IThemeStorage';
