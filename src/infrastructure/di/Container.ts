// /src/infrastructure/di/Container.ts
// Composition root: the ONLY place that wires concrete adapters to use-cases.
// Presentation obtains the container via presentation/providers/DiProvider.
// Application layers must NOT import this file (dependency points inward).

import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { IAlarmRepository } from '../../domain/ports/IAlarmRepository';
import { IMqttGateway } from '../../domain/ports/IMqttGateway';
import { IThemeStoragePort } from '../../domain/ports/IThemeStorage';
import type {
  IAuthGateway,
  IDeviceCommandGateway,
  ILiveStateRepository,
  IMasterDataRepository,
  IRealtimeGateway,
  ITelemetryRepository,
  IWorkOrderRepository,
} from '../../domain/ports/IOeeBackend';

import { InMemoryMachineRepository } from '../adapters/InMemoryMachineRepository';
import { InMemoryAlarmRepository } from '../adapters/InMemoryAlarmRepository';
import { MqttEdgeSimulatorAdapter } from '../adapters/MqttEdgeSimulatorAdapter';
import { LocalStorageThemeAdapter } from '../storage/LocalStorageThemeAdapter';
import {
  OeeHttpAuthGateway,
  OeeHttpDeviceCommandGateway,
  OeeHttpLiveStateRepository,
  OeeHttpMasterDataRepository,
  OeeHttpTelemetryRepository,
  OeeHttpWorkOrderRepository,
} from '../api/oeeApiClient';
import { TelemetryWsClient } from '../realtime/telemetryWsClient';

import { CalculateOeeUseCase } from '../../application/use-cases/CalculateOeeUseCase';
import { GetMachinesUseCase } from '../../application/use-cases/GetMachinesUseCase';
import { UpdateMachineStatusUseCase } from '../../application/use-cases/UpdateMachineStatusUseCase';
import { LogDowntimeUseCase } from '../../application/use-cases/LogDowntimeUseCase';
import { LogRejectUseCase } from '../../application/use-cases/LogRejectUseCase';
import { SimulateMachinePulseUseCase } from '../../application/use-cases/SimulateMachinePulseUseCase';
import { ManageAlarmsUseCase } from '../../application/use-cases/ManageAlarmsUseCase';
import { MqttEdgeCommandUseCase } from '../../application/use-cases/MqttEdgeCommandUseCase';
import { GetLiveStateUseCase } from '../../application/use-cases/GetLiveStateUseCase';
import { ListWorkOrdersUseCase } from '../../application/use-cases/ListWorkOrdersUseCase';
import { SendDeviceCommandUseCase } from '../../application/use-cases/SendDeviceCommandUseCase';
import { SubscribeTelemetryUseCase } from '../../application/use-cases/SubscribeTelemetryUseCase';

export interface AppContainer {
  // Ports / Repositories (legacy in-memory simulation lane)
  machineRepository: IMachineRepository;
  alarmRepository: IAlarmRepository;
  mqttGateway: IMqttGateway;
  themeStorage: IThemeStoragePort;

  // Ports / Backend lane (real IIoT OEE REST + WS, see API_DOCUMENTATION.md)
  liveStateRepository: ILiveStateRepository;
  workOrderRepository: IWorkOrderRepository;
  deviceCommandGateway: IDeviceCommandGateway;
  masterDataRepository: IMasterDataRepository;
  telemetryRepository: ITelemetryRepository;
  authGateway: IAuthGateway;
  realtimeGateway: IRealtimeGateway;

  // Use cases (legacy simulation lane)
  calculateOeeUseCase: CalculateOeeUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  updateMachineStatusUseCase: UpdateMachineStatusUseCase;
  logDowntimeUseCase: LogDowntimeUseCase;
  logRejectUseCase: LogRejectUseCase;
  simulateMachinePulseUseCase: SimulateMachinePulseUseCase;
  manageAlarmsUseCase: ManageAlarmsUseCase;
  mqttEdgeCommandUseCase: MqttEdgeCommandUseCase;

  // Use cases (backend lane)
  getLiveStateUseCase: GetLiveStateUseCase;
  listWorkOrdersUseCase: ListWorkOrdersUseCase;
  sendDeviceCommandUseCase: SendDeviceCommandUseCase;
  subscribeTelemetryUseCase: SubscribeTelemetryUseCase;
}

/**
 * Creates and wires the dependency injection container.
 * In a Hexagonal Architecture, this Composition Root instantiates
 * infrastructure adapters and injects them into application use cases.
 */
export function createContainer(): AppContainer {
  // 1. Adapters (Infrastructure) — simulation lane (default UI data source)
  const machineRepository = new InMemoryMachineRepository();
  const alarmRepository = new InMemoryAlarmRepository();
  const mqttGateway = new MqttEdgeSimulatorAdapter();
  const themeStorage = new LocalStorageThemeAdapter();

  // 1b. Adapters (Infrastructure) — backend lane (real REST + WS)
  const liveStateRepository = new OeeHttpLiveStateRepository();
  const workOrderRepository = new OeeHttpWorkOrderRepository();
  const deviceCommandGateway = new OeeHttpDeviceCommandGateway();
  const masterDataRepository = new OeeHttpMasterDataRepository();
  const telemetryRepository = new OeeHttpTelemetryRepository();
  const authGateway = new OeeHttpAuthGateway();
  const realtimeGateway = new TelemetryWsClient();

  // 2. Use Cases (Application) with Injected Adapters
  const calculateOeeUseCase = new CalculateOeeUseCase();
  const getMachinesUseCase = new GetMachinesUseCase(machineRepository);
  const updateMachineStatusUseCase = new UpdateMachineStatusUseCase(machineRepository, alarmRepository);
  const logDowntimeUseCase = new LogDowntimeUseCase(machineRepository, alarmRepository);
  const logRejectUseCase = new LogRejectUseCase(machineRepository);
  const simulateMachinePulseUseCase = new SimulateMachinePulseUseCase(machineRepository);
  const manageAlarmsUseCase = new ManageAlarmsUseCase(alarmRepository);
  const mqttEdgeCommandUseCase = new MqttEdgeCommandUseCase(mqttGateway, machineRepository);
  const getLiveStateUseCase = new GetLiveStateUseCase(liveStateRepository);
  const listWorkOrdersUseCase = new ListWorkOrdersUseCase(workOrderRepository);
  const sendDeviceCommandUseCase = new SendDeviceCommandUseCase(deviceCommandGateway);
  const subscribeTelemetryUseCase = new SubscribeTelemetryUseCase(realtimeGateway);

  return {
    machineRepository,
    alarmRepository,
    mqttGateway,
    themeStorage,
    liveStateRepository,
    workOrderRepository,
    deviceCommandGateway,
    masterDataRepository,
    telemetryRepository,
    authGateway,
    realtimeGateway,
    calculateOeeUseCase,
    getMachinesUseCase,
    updateMachineStatusUseCase,
    logDowntimeUseCase,
    logRejectUseCase,
    simulateMachinePulseUseCase,
    manageAlarmsUseCase,
    mqttEdgeCommandUseCase,
    getLiveStateUseCase,
    listWorkOrdersUseCase,
    sendDeviceCommandUseCase,
    subscribeTelemetryUseCase,
  };
}

// Default singleton instance
export const defaultContainer = createContainer();
