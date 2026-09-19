// /src/domain/index.ts

// Entities
export * from './entities/Machine';
export * from './entities/OeeMetrics';
export * from './entities/Alarm';
export * from './entities/MqttContracts';

// Domain Services
export * from './services/OeeCalculator';

// Ports
export * from './ports/IMachineRepository';
export * from './ports/IAlarmRepository';
export * from './ports/IMqttGateway';
export * from './ports/IThemeStorage';
