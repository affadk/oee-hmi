// /src/types.ts
// Re-export domain contracts and entities for backwards compatibility

export * from './domain/entities/Machine';
export * from './domain/entities/OeeMetrics';
export * from './domain/entities/Alarm';
export * from './domain/entities/MqttContracts';
export * from './domain/ports/IMachineRepository';
export * from './domain/ports/IAlarmRepository';
export * from './domain/ports/IMqttGateway';
export * from './domain/ports/IThemeStorage';
