// /src/infrastructure/di/Container.ts

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import { IMqttGateway } from '../../domain/ports/IMqttGateway';
import { IThemeStoragePort } from '../../domain/ports/IThemeStorage';

import { InMemoryMachineRepository } from '../adapters/InMemoryMachineRepository';
import { InMemoryAlarmRepository } from '../adapters/InMemoryAlarmRepository';
import { MqttEdgeSimulatorAdapter } from '../adapters/MqttEdgeSimulatorAdapter';
import { LocalStorageThemeAdapter } from '../adapters/LocalStorageThemeAdapter';

import { CalculateOeeUseCase } from '../../application/use-cases/CalculateOeeUseCase';
import { GetMachinesUseCase } from '../../application/use-cases/GetMachinesUseCase';
import { UpdateMachineStatusUseCase } from '../../application/use-cases/UpdateMachineStatusUseCase';
import { LogDowntimeUseCase } from '../../application/use-cases/LogDowntimeUseCase';
import { LogRejectUseCase } from '../../application/use-cases/LogRejectUseCase';
import { SimulateMachinePulseUseCase } from '../../application/use-cases/SimulateMachinePulseUseCase';
import { ManageAlarmsUseCase } from '../../application/use-cases/ManageAlarmsUseCase';
import { MqttEdgeCommandUseCase } from '../../application/use-cases/MqttEdgeCommandUseCase';

export interface AppContainer {
  // Ports / Repositories
  machineRepository: IMachineRepository;
  alarmRepository: IAlarmRepository;
  mqttGateway: IMqttGateway;
  themeStorage: IThemeStoragePort;

  // Use cases
  calculateOeeUseCase: CalculateOeeUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  updateMachineStatusUseCase: UpdateMachineStatusUseCase;
  logDowntimeUseCase: LogDowntimeUseCase;
  logRejectUseCase: LogRejectUseCase;
  simulateMachinePulseUseCase: SimulateMachinePulseUseCase;
  manageAlarmsUseCase: ManageAlarmsUseCase;
  mqttEdgeCommandUseCase: MqttEdgeCommandUseCase;
}

/**
 * Creates and wires the dependency injection container.
 * In a Hexagonal Architecture, this Composition Root instantiates
 * infrastructure adapters and injects them into application use cases.
 */
export function createContainer(): AppContainer {
  // 1. Adapters (Infrastructure)
  const machineRepository = new InMemoryMachineRepository();
  const alarmRepository = new InMemoryAlarmRepository();
  const mqttGateway = new MqttEdgeSimulatorAdapter();
  const themeStorage = new LocalStorageThemeAdapter();

  // 2. Use Cases (Application) with Injected Adapters
  const calculateOeeUseCase = new CalculateOeeUseCase();
  const getMachinesUseCase = new GetMachinesUseCase(machineRepository);
  const updateMachineStatusUseCase = new UpdateMachineStatusUseCase(machineRepository, alarmRepository);
  const logDowntimeUseCase = new LogDowntimeUseCase(machineRepository, alarmRepository);
  const logRejectUseCase = new LogRejectUseCase(machineRepository);
  const simulateMachinePulseUseCase = new SimulateMachinePulseUseCase(machineRepository);
  const manageAlarmsUseCase = new ManageAlarmsUseCase(alarmRepository);
  const mqttEdgeCommandUseCase = new MqttEdgeCommandUseCase(mqttGateway, machineRepository);

  return {
    machineRepository,
    alarmRepository,
    mqttGateway,
    themeStorage,
    calculateOeeUseCase,
    getMachinesUseCase,
    updateMachineStatusUseCase,
    logDowntimeUseCase,
    logRejectUseCase,
    simulateMachinePulseUseCase,
    manageAlarmsUseCase,
    mqttEdgeCommandUseCase,
  };
}

// Default singleton instance
export const defaultContainer = createContainer();
