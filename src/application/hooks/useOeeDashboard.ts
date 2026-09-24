// /src/application/hooks/useOeeDashboard.ts
// Application orchestration hook — composes focused hooks over use-case ports.
// LAYER RULES (enforced):
// - MUST NOT import infrastructure/* (concrete DI container, adapters)
// - MUST NOT import seed/mock data (data/*, infrastructure/seeds)
// - MUST NOT touch document/window (DOM lives in presentation/hooks)
// Presentation injects collaborators via the deps argument (see
// presentation/pages/DashboardPage.tsx). Pure domain + use-case composition only.
//
// Decomposition (one responsibility per hook):
// - useDashboardUi: simulation toggle, TEEP, modal visibility
// - useAuthSession: PIN session, runProtected gating, pending-action replay
// - useMachinesQuery: fleet load, selection, alarms, loading/error/retry
// - useSupplementalSync: downtime/trend/labelable merge (backend lane)
// - useTelemetrySubscription: WS realtime merge (backend lane, stateless)
// - useSimulationTicker: 3.5s pulse ticker (simulation lane, stateless)
// - useMachineActions: status/downtime/reject/alarm/MQTT mutations
// - useDeviceRegistry: device registry + bind/unbind (backend lane)
// - useWorkOrders: work-order lifecycle + production-setup modal (backend lane)

import { useMemo } from 'react';
import type { MachineConfig, MachineStatus } from '../../domain/entities/Machine';
import type { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import type { AuthSession, IAuthGateway } from '../../domain/ports/IOeeBackend';
import type { DeviceRecord, MachineRecord } from '../../domain/entities/backend/Device';
import type { WorkOrderListItem, WorkOrderResolveResult } from '../../domain/entities/backend/WorkOrder';
import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import type { TimelineSegment } from '../../domain/services/ShiftTimeline';
import type { CalculateOeeUseCase } from '../use-cases/CalculateOeeUseCase';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { UpdateMachineStatusUseCase } from '../use-cases/UpdateMachineStatusUseCase';
import type { LogDowntimeUseCase } from '../use-cases/LogDowntimeUseCase';
import type { LogRejectUseCase } from '../use-cases/LogRejectUseCase';
import type { SimulateMachinePulseUseCase } from '../use-cases/SimulateMachinePulseUseCase';
import type { ManageAlarmsUseCase } from '../use-cases/ManageAlarmsUseCase';
import type { MqttEdgeCommandUseCase } from '../use-cases/MqttEdgeCommandUseCase';
import type { GetDowntimeReasonsUseCase } from '../use-cases/GetDowntimeReasonsUseCase';
import type { GetActiveDowntimesUseCase } from '../use-cases/GetActiveDowntimesUseCase';
import type { GetHourlyTrendsUseCase } from '../use-cases/GetHourlyTrendsUseCase';
import type { GetTelemetryAggregateUseCase } from '../use-cases/GetTelemetryAggregateUseCase';
import type { GetTelemetryHistoryUseCase } from '../use-cases/GetTelemetryHistoryUseCase';
import { useLiveTrend } from './useLiveTrend';
import type { LiveTrendPoint } from './useLiveTrend';
import type { SubscribeTelemetryUseCase } from '../use-cases/SubscribeTelemetryUseCase';
import type { ListLabelableDowntimesUseCase } from '../use-cases/ListLabelableDowntimesUseCase';
import type { LabelDowntimeReasonUseCase } from '../use-cases/LabelDowntimeReasonUseCase';
import type { ConfigureDeviceUseCase } from '../use-cases/ConfigureDeviceUseCase';
import type { ListWorkOrdersUseCase } from '../use-cases/ListWorkOrdersUseCase';
import type { GetShiftSummaryUseCase } from '../use-cases/GetShiftSummaryUseCase';
import type { GetShiftTimelineUseCase } from '../use-cases/GetShiftTimelineUseCase';
import { useAuthSession } from './useAuthSession';
import { useMachinesQuery } from './useMachinesQuery';
import { useSupplementalSync } from './useSupplementalSync';
import { useTelemetrySubscription } from './useTelemetrySubscription';
import { useSimulationTicker } from './useSimulationTicker';
import { useMachineActions } from './useMachineActions';
import type { BackendDowntimeLabelInput } from './useMachineActions';
import { useDeviceRegistry } from './useDeviceRegistry';
import { useWorkOrders } from './useWorkOrders';
import { useDashboardUi } from './useDashboardUi';
import { useShiftServerData, mergeShiftSummary } from './useShiftServerData';
import { resolveShiftWindowIso } from '../../domain/services/ShiftTimeline';

export type { BackendDowntimeLabelInput };

export interface OeeDashboardDeps {
  calculateOeeUseCase: CalculateOeeUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  updateMachineStatusUseCase: UpdateMachineStatusUseCase;
  logDowntimeUseCase: LogDowntimeUseCase;
  logRejectUseCase: LogRejectUseCase;
  simulateMachinePulseUseCase: SimulateMachinePulseUseCase;
  manageAlarmsUseCase: ManageAlarmsUseCase;
  mqttEdgeCommandUseCase: MqttEdgeCommandUseCase;
  getDowntimeReasonsUseCase: GetDowntimeReasonsUseCase;
  getActiveDowntimesUseCase: GetActiveDowntimesUseCase;
  getHourlyTrendsUseCase: GetHourlyTrendsUseCase;
  getAggregateUseCase: GetTelemetryAggregateUseCase;
  getHistoryUseCase: GetTelemetryHistoryUseCase;
  subscribeTelemetryUseCase: SubscribeTelemetryUseCase;
  listLabelableDowntimesUseCase: ListLabelableDowntimesUseCase;
  labelDowntimeReasonUseCase: LabelDowntimeReasonUseCase;
  configureDeviceUseCase: ConfigureDeviceUseCase;
  listWorkOrdersUseCase: ListWorkOrdersUseCase;
  getShiftSummaryUseCase: GetShiftSummaryUseCase;
  getShiftTimelineUseCase: GetShiftTimelineUseCase;
  authGateway: IAuthGateway;
  useBackend: boolean;
}

export interface UseOeeDashboardReturn {
  machines: MachineConfig[];
  currentMachine: MachineConfig | null;
  currentMetrics: CalculatedOeeMetrics | null;
  currentMachineId: string;
  selectedPlant: string;
  selectedLine: string;
  selectedShift: string;
  selectedDate: string;
  isSimulating: boolean;
  useBackend: boolean;
  teepEnabled: boolean;
  alarms: MachineAlarmEvent[];
  isLoading: boolean;
  loadError: string;
  retryLoad: () => void;
  isLogModalOpen: boolean;
  isHelpModalOpen: boolean;
  isMqttModalOpen: boolean;
  isAuthModalOpen: boolean;
  authSession: AuthSession | null;
  authError: string;
  labelableDowntimes: DowntimeEvent[];
  supplementalError: string;
  /** Live 5m overlay points (B5/B2); null = hidden. */
  liveTrend: LiveTrendPoint[] | null;
  /** Global active-downtime count (§J.1); null when unknown. */
  activeDowntimeCount: number | null;
  /** Fase 2 server timeline segments (§3.2); null = client buildShiftTimeline. */
  shiftSegments: TimelineSegment[] | null;
  deviceRegistry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  deviceRegistryError: string;
  pendingWorkOrders: WorkOrderListItem[];
  workOrderError: string;
  workOrderPreview: { woId: string; result: WorkOrderResolveResult } | null;
  productionSetupError: string;
  productionSetupBusy: boolean;
  formulaMetricHighlight: string;
  toggleSimulate: () => void;
  toggleTeep: () => void;
  selectMachine: (machineId: string) => void;
  selectLine: (line: string) => void;
  selectShift: (shift: string) => void;
  updateMachineStatus: (status: MachineStatus) => Promise<void>;
  logDowntime: (event: BackendDowntimeLabelInput) => Promise<void>;
  logReject: (reasonLabel: string, count: number) => Promise<void>;
  acknowledgeAlarm: (alarmId: string) => Promise<void>;
  resolveAlarm: (alarmId: string) => Promise<void>;
  dispatchMqttCommand: (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => Promise<void>;
  resetCounters: () => Promise<void>;
  dispatchMqttJobConfig: (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number,
    shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number }
  ) => Promise<void>;
  openFormulaModal: (metricName: string) => void;
  closeFormulaModal: () => void;
  openLogModal: () => void;
  closeLogModal: () => void;
  openMqttModal: () => void;
  closeMqttModal: () => void;
  isDeviceConfigModalOpen: boolean;
  isProductionSetupModalOpen: boolean;
  openDeviceConfigModal: () => void;
  closeDeviceConfigModal: () => void;
  refreshDeviceRegistry: () => Promise<void>;
  saveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
  saveMachineMetadata: (machineId: string, patch: { machineName?: string; modbusSlaveId?: number }) => Promise<void>;
  bindDeviceToMachine: (machineId: string, deviceId: string) => Promise<void>;
  unbindDeviceFromMachine: (machineId: string) => Promise<void>;
  openProductionSetupModal: () => void;
  closeProductionSetupModal: () => void;
  loadPendingWorkOrders: () => Promise<void>;
  previewWorkOrder: (woId: string) => Promise<void>;
  clearWorkOrderPreview: () => void;
  dispatchWorkOrder: (woId: string, deviceId: string) => Promise<void>;
  completeWorkOrder: (woId: string, finalRejectCount: number) => Promise<void>;
  cancelWorkOrder: (woId: string, reason?: string) => Promise<void>;
  closeAuthModal: () => void;
  openAuthModal: () => void;
  loginWithPin: (pin: string, operatorId?: string) => Promise<void>;
  logoutOperator: () => void;
}

export function useOeeDashboard(deps: OeeDashboardDeps): UseOeeDashboardReturn {
  const {
    calculateOeeUseCase,
    getMachinesUseCase,
    updateMachineStatusUseCase,
    logDowntimeUseCase,
    logRejectUseCase,
    simulateMachinePulseUseCase,
    manageAlarmsUseCase,
    mqttEdgeCommandUseCase,
    getDowntimeReasonsUseCase,
    getActiveDowntimesUseCase,
    getHourlyTrendsUseCase,
    getAggregateUseCase,
    getHistoryUseCase,
    subscribeTelemetryUseCase,
    listLabelableDowntimesUseCase,
    labelDowntimeReasonUseCase,
    configureDeviceUseCase,
    listWorkOrdersUseCase,
    getShiftSummaryUseCase,
    getShiftTimelineUseCase,
    authGateway,
    useBackend,
  } = deps;

  const ui = useDashboardUi(useBackend);

  const auth = useAuthSession({
    authGateway,
    useBackend,
    getStationId: () => machines.currentDeviceId || machines.currentMachineId,
    onAuthenticated: () => machines.retryLoad(),
  });

  const machines = useMachinesQuery({
    getMachinesUseCase,
    manageAlarmsUseCase,
    useBackend,
    onUnauthorized: () => auth.notifyUnauthorized(),
  });

  // G11: windowed hourly scoped to the shift; memoized per machine so the
  // supplemental effect refires only on machine change (null = unwindowed fallback).
  const shiftWindow = useMemo(
    () => resolveShiftWindowIso(
      machines.currentMachine?.jobConfig?.shiftStart,
      machines.currentMachine?.jobConfig?.shiftEnd,
    ),
    [machines.currentMachine],
  );

  const supplemental = useSupplementalSync({
    useBackend,
    currentMachineId: machines.currentMachineId,
    currentDeviceId: machines.currentDeviceId,
    shiftWindow,
    getDowntimeReasonsUseCase,
    getActiveDowntimesUseCase,
    getHourlyTrendsUseCase,
    listLabelableDowntimesUseCase,
    setMachines: machines.setMachines,
  });

  useTelemetrySubscription({
    useBackend,
    subscribeTelemetryUseCase,
    setMachines: machines.setMachines,
    setAlarms: machines.setAlarms,
  });

  useSimulationTicker({
    isSimulating: ui.isSimulating,
    currentMachine: machines.currentMachine,
    useBackend,
    simulateMachinePulseUseCase,
    setMachines: machines.setMachines,
  });

  // B5/B2: live 5m overlay (aggregate, raw-history fallback); null = hide.
  const liveTrend = useLiveTrend({
    useBackend,
    currentDeviceId: machines.currentDeviceId,
    shiftWindow,
    getAggregateUseCase,
    getHistoryUseCase,
  });

  const actions = useMachineActions({
    useBackend,
    currentMachineId: machines.currentMachineId,
    currentMachine: machines.currentMachine,
    updateMachineStatusUseCase,
    logDowntimeUseCase,
    logRejectUseCase,
    manageAlarmsUseCase,
    mqttEdgeCommandUseCase,
    labelDowntimeReasonUseCase,
    runProtected: auth.runProtected,
    setMachines: machines.setMachines,
    setAlarms: machines.setAlarms,
    setLabelableDowntimes: supplemental.setLabelableDowntimes,
    closeMqttModal: ui.closeMqttModal,
  });

  const registry = useDeviceRegistry({
    useBackend,
    configureDeviceUseCase,
    getMachinesUseCase,
    runProtected: auth.runProtected,
    setMachines: machines.setMachines,
  });

  const orders = useWorkOrders({
    useBackend,
    currentDeviceId: machines.currentDeviceId,
    listWorkOrdersUseCase,
    getMachinesUseCase,
    runProtected: auth.runProtected,
    setMachines: machines.setMachines,
  });

  // Fase 1 server aggregates (§3.1/§3.2); null until the backend implements them.
  const shiftServer = useShiftServerData({
    useBackend,
    currentMachineId: machines.currentMachineId,
    currentDeviceId: machines.currentDeviceId,
    shiftWindow,
    getShiftSummaryUseCase,
    getShiftTimelineUseCase,
  });

  const currentMetrics = useMemo(() => {
    if (!machines.currentMachine) return null;
    const clientMetrics = calculateOeeUseCase.execute(machines.currentMachine);
    // Fase 1: server summary wins when the backend implements §3.1,
    // otherwise the §2 client composition above (identical shape).
    if (!shiftServer.shiftSummary) return clientMetrics;
    return mergeShiftSummary(shiftServer.shiftSummary, clientMetrics, {
      targetOee: machines.currentMachine.targetOee,
      targetAvailability: machines.currentMachine.targetAvailability,
      targetPerformance: machines.currentMachine.targetPerformance,
      targetQuality: machines.currentMachine.targetQuality,
    });
  }, [calculateOeeUseCase, machines.currentMachine, shiftServer.shiftSummary]);

  return {
    machines: machines.machines,
    currentMachine: machines.currentMachine,
    currentMetrics,
    currentMachineId: machines.currentMachineId,
    selectedPlant: machines.selectedPlant,
    selectedLine: machines.selectedLine,
    selectedShift: machines.selectedShift,
    selectedDate: machines.selectedDate,
    isSimulating: ui.isSimulating,
    useBackend,
    teepEnabled: ui.teepEnabled,
    alarms: machines.alarms,
    isLoading: machines.isLoading,
    loadError: machines.loadError,
    retryLoad: machines.retryLoad,
    isLogModalOpen: ui.isLogModalOpen,
    isHelpModalOpen: ui.isHelpModalOpen,
    isMqttModalOpen: ui.isMqttModalOpen,
    isAuthModalOpen: auth.isAuthModalOpen,
    authSession: auth.authSession,
    authError: auth.authError,
    labelableDowntimes: supplemental.labelableDowntimes,
    supplementalError: supplemental.supplementalError,
    liveTrend,
    activeDowntimeCount: supplemental.activeDowntimeCount,
    shiftSegments: shiftServer.shiftSegments,
    deviceRegistry: registry.deviceRegistry,
    deviceRegistryError: registry.deviceRegistryError,
    pendingWorkOrders: orders.pendingWorkOrders,
    workOrderError: orders.workOrderError,
    workOrderPreview: orders.workOrderPreview,
    productionSetupError: orders.productionSetupError,
    productionSetupBusy: orders.productionSetupBusy,
    formulaMetricHighlight: ui.formulaMetricHighlight,
    toggleSimulate: ui.toggleSimulate,
    toggleTeep: ui.toggleTeep,
    selectMachine: machines.selectMachine,
    selectLine: machines.selectLine,
    selectShift: machines.selectShift,
    updateMachineStatus: actions.updateMachineStatus,
    logDowntime: actions.logDowntime,
    logReject: actions.logReject,
    acknowledgeAlarm: actions.acknowledgeAlarm,
    resolveAlarm: actions.resolveAlarm,
    dispatchMqttCommand: actions.dispatchMqttCommand,
    resetCounters: actions.resetCounters,
    dispatchMqttJobConfig: actions.dispatchMqttJobConfig,
    openFormulaModal: ui.openFormulaModal,
    closeFormulaModal: ui.closeFormulaModal,
    openLogModal: ui.openLogModal,
    closeLogModal: ui.closeLogModal,
    openMqttModal: ui.openMqttModal,
    closeMqttModal: ui.closeMqttModal,
    isDeviceConfigModalOpen: registry.isDeviceConfigModalOpen,
    isProductionSetupModalOpen: orders.isProductionSetupModalOpen,
    openDeviceConfigModal: registry.openDeviceConfigModal,
    closeDeviceConfigModal: registry.closeDeviceConfigModal,
    refreshDeviceRegistry: registry.refreshDeviceRegistry,
    saveDeviceMetadata: registry.saveDeviceMetadata,
    saveMachineMetadata: registry.saveMachineMetadata,
    bindDeviceToMachine: registry.bindDeviceToMachine,
    unbindDeviceFromMachine: registry.unbindDeviceFromMachine,
    openProductionSetupModal: orders.openProductionSetupModal,
    closeProductionSetupModal: orders.closeProductionSetupModal,
    loadPendingWorkOrders: orders.loadPendingWorkOrders,
    previewWorkOrder: orders.previewWorkOrder,
    clearWorkOrderPreview: orders.clearWorkOrderPreview,
    dispatchWorkOrder: orders.dispatchWorkOrder,
    completeWorkOrder: orders.completeWorkOrder,
    cancelWorkOrder: orders.cancelWorkOrder,
    closeAuthModal: auth.closeAuthModal,
    openAuthModal: auth.openAuthModal,
    loginWithPin: auth.loginWithPin,
    logoutOperator: auth.logoutOperator,
  };
}
