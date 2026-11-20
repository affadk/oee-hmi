// /src/application/hooks/useOeeDashboard.ts
import type { DeviceCommandKind } from '../../domain/entities/backend/Device';
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MachineConfig, MachineStatus } from '../../domain/entities/Machine';
import type { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import type { AuthSession, BackendHealth, IAuthGateway } from '../../domain/ports/IOeeBackend';
import type { DeviceRecord, MachineRecord, OperatorRecord, ProductRecord } from '../../domain/entities/backend/Device';
import type { WorkOrderListItem, WorkOrderResolveResult } from '../../domain/entities/backend/WorkOrder';
import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import type { TimelineSegment } from '../../domain/services/ShiftTimeline';
import type { CalculateOeeUseCase } from '../use-cases/CalculateOeeUseCase';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { UpdateMachineStatusUseCase } from '../use-cases/UpdateMachineStatusUseCase';
import type { LogDowntimeUseCase } from '../use-cases/LogDowntimeUseCase';
import type { LogRejectUseCase } from '../use-cases/LogRejectUseCase';
import type { ManageAlarmsUseCase } from '../use-cases/ManageAlarmsUseCase';
import type { MachineCommandUseCase } from '../use-cases/MachineCommandUseCase';
import type { GetDowntimeReasonsUseCase } from '../use-cases/GetDowntimeReasonsUseCase';
import type { GetActiveDowntimesUseCase } from '../use-cases/GetActiveDowntimesUseCase';
import type { GetHourlyTrendsUseCase } from '../use-cases/GetHourlyTrendsUseCase';
import type { GetRejectBreakdownUseCase } from '../use-cases/GetRejectBreakdownUseCase';
import type { GetTelemetryAggregateUseCase } from '../use-cases/GetTelemetryAggregateUseCase';
import type { GetTelemetryHistoryUseCase } from '../use-cases/GetTelemetryHistoryUseCase';
import { useLiveTrend } from './useLiveTrend';
import type { LiveTrendPoint } from './useLiveTrend';
import type { SubscribeTelemetryUseCase } from '../use-cases/SubscribeTelemetryUseCase';
import type { ListLabelableDowntimesUseCase } from '../use-cases/ListLabelableDowntimesUseCase';
import type { LabelDowntimeReasonUseCase } from '../use-cases/LabelDowntimeReasonUseCase';
import type { ConfigureDeviceUseCase } from '../use-cases/ConfigureDeviceUseCase';
import type { ListWorkOrdersUseCase } from '../use-cases/ListWorkOrdersUseCase';
import type { ExportTelemetryUseCase, TelemetryExportFormat } from '../use-cases/ExportTelemetryUseCase';
import type { GetHealthUseCase } from '../use-cases/GetHealthUseCase';
import type { IErrorReporter } from '../../domain/ports/IErrorReporter';
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
import { useBackendHealth } from './useBackendHealth';
import { useDashboardUi } from './useDashboardUi';
import { useShiftServerData, mergeShiftSummary } from './useShiftServerData';
import { resolveShiftWindowIso } from '../../domain/services/ShiftTimeline';
import { createRefetchScheduler, type RefetchKind } from '../lifecycleRefetch';
import { useFleetResync } from './useFleetResync';

export type { BackendDowntimeLabelInput };

export interface OeeDashboardDeps {
  calculateOeeUseCase: CalculateOeeUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  updateMachineStatusUseCase: UpdateMachineStatusUseCase;
  logDowntimeUseCase: LogDowntimeUseCase;
  logRejectUseCase: LogRejectUseCase;
  manageAlarmsUseCase: ManageAlarmsUseCase;
  machineCommandUseCase: MachineCommandUseCase;
  machineRepository: import('../../domain/ports/IMachineRepository').IMachineRepository;
  liveStateRepository: import('../../domain/ports/IOeeBackend').ILiveStateRepository;
  getDowntimeReasonsUseCase: GetDowntimeReasonsUseCase;
  getActiveDowntimesUseCase: GetActiveDowntimesUseCase;
  getHourlyTrendsUseCase: GetHourlyTrendsUseCase;
  getRejectBreakdownUseCase: GetRejectBreakdownUseCase;
  getAggregateUseCase: GetTelemetryAggregateUseCase;
  getHistoryUseCase: GetTelemetryHistoryUseCase;
  subscribeTelemetryUseCase: SubscribeTelemetryUseCase;
  listLabelableDowntimesUseCase: ListLabelableDowntimesUseCase;
  labelDowntimeReasonUseCase: LabelDowntimeReasonUseCase;
  configureDeviceUseCase: ConfigureDeviceUseCase;
  listWorkOrdersUseCase: ListWorkOrdersUseCase;
  exportTelemetryUseCase: ExportTelemetryUseCase;
  getHealthUseCase: GetHealthUseCase;
  errorReporter: IErrorReporter;
  getShiftSummaryUseCase: GetShiftSummaryUseCase;
  getShiftTimelineUseCase: GetShiftTimelineUseCase;
  authGateway: IAuthGateway;
  useBackend: boolean;
  /** env VITE_STATION_ID (composition root membaca env). */
  stationIdEnv: string;
  /** Query ?station= commissioning (presentation membaca router). */
  getQueryStationId?: () => string | null;
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
  catalog: { products: ProductRecord[]; operators: OperatorRecord[] } | null;
  backendHealth: BackendHealth | null;
  pendingWorkOrders: WorkOrderListItem[];
  workOrderError: string;
  workOrderPreview: { woId: string; result: WorkOrderResolveResult } | null;
  workOrderDetail: WorkOrderListItem | null;
  isWorkOrderDetailOpen: boolean;
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
  dispatchMachineCommand: (command: DeviceCommandKind, count?: number) => Promise<void>;
  resetCounters: () => Promise<void>;
  exportTelemetry: (format?: TelemetryExportFormat) => Promise<Blob | null>;
  applyJobConfig: (
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
  refreshCatalog: () => Promise<void>;
  saveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
  saveMachineMetadata: (machineId: string, patch: { machineName?: string; modbusSlaveId?: number }) => Promise<void>;
  bindDeviceToMachine: (machineId: string, deviceId: string) => Promise<void>;
  unbindDeviceFromMachine: (machineId: string) => Promise<void>;
  openProductionSetupModal: () => void;
  closeProductionSetupModal: () => void;
  loadPendingWorkOrders: () => Promise<void>;
  previewWorkOrder: (woId: string) => Promise<void>;
  clearWorkOrderPreview: () => void;
  openWorkOrderDetail: (woId: string) => Promise<void>;
  closeWorkOrderDetail: () => void;
  dispatchWorkOrder: (woId: string, deviceId: string) => Promise<void>;
  completeWorkOrder: (woId: string, finalRejectCount: number) => Promise<void>;
  cancelWorkOrder: (woId: string, reason?: string) => Promise<void>;
  closeAuthModal: () => void;
  openAuthModal: () => void;
  loginWithPassword: (operatorId: string, password: string) => Promise<void>;
  submitPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
  authMode: import('./useAuthSession').AuthMode;
  retryAfterSec: number;
  capabilities: import('../../domain/ports/IOeeBackend').CapabilityMap | null;
  mutationsAllowed: boolean | null;
  logoutOperator: () => void;
}

export function useOeeDashboard(deps: OeeDashboardDeps): UseOeeDashboardReturn {
  const {
    calculateOeeUseCase,
    getMachinesUseCase,
    updateMachineStatusUseCase,
    logDowntimeUseCase,
    logRejectUseCase,
    manageAlarmsUseCase,
    machineCommandUseCase,
    machineRepository,
    liveStateRepository,
    getDowntimeReasonsUseCase,
    getActiveDowntimesUseCase,
    getHourlyTrendsUseCase,
    getRejectBreakdownUseCase,
    getAggregateUseCase,
    getHistoryUseCase,
    subscribeTelemetryUseCase,
    listLabelableDowntimesUseCase,
    labelDowntimeReasonUseCase,
    configureDeviceUseCase,
    listWorkOrdersUseCase,
    exportTelemetryUseCase,
    getHealthUseCase,
    errorReporter,
    getShiftSummaryUseCase,
    getShiftTimelineUseCase,
    authGateway,
    useBackend,
    stationIdEnv,
    getQueryStationId,
  } = deps;

  const ui = useDashboardUi(useBackend);

  const auth = useAuthSession({
    authGateway,
    useBackend,
    stationIdEnv,
    getQueryStationId,
    // Registry dimuat paralel saat boot; kosong = station tak tervalidasi → ''.
    getRegisteredDeviceIds: () => registry.deviceRegistry?.devices.map((d) => d.deviceId) ?? [],
    onAuthenticated: () => machines.retryLoad(),
  });

  const machines = useMachinesQuery({
    getMachinesUseCase,
    manageAlarmsUseCase,
    useBackend,
    errorReporter,
    // Stabil: auth.notifyUnauthorized adalah useCallback — jangan bungkus
    // closure inline (identitas baru tiap render me-refire efek boot-load
    // useMachinesQuery menjadi fetch-loop ~28 req/s).
    onUnauthorized: auth.notifyUnauthorized,
  });

  // G11: windowed hourly scoped to the shift; memoized on primitive shift
  // strings + minute clock so identity is stable within a minute. Previously
  // memoized on machines.currentMachine (new object identity on every
  // setMachines incl. WS ticks) with an embedded render-time `now`, which
  // refired useSupplementalSync/useLiveTrend/useShiftServerData effects in
  // a self-sustaining refetch loop. Live edge (`to`) still advances per minute.
  const shiftStart = machines.currentMachine?.jobConfig?.shiftStart;
  const shiftEnd = machines.currentMachine?.jobConfig?.shiftEnd;
  const [nowMinute, setNowMinute] = useState(() => Math.floor(Date.now() / 60000));
  // FR-011: bump scheduler refetch → supplemental dimuat ulang (debounced).
  const [supplementalSeq, setSupplementalSeq] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowMinute(Math.floor(Date.now() / 60000)), 15000);
    return () => clearInterval(t);
  }, []);
  const shiftWindow = useMemo(
    () => resolveShiftWindowIso(shiftStart, shiftEnd, new Date(nowMinute * 60000)),
    [shiftStart, shiftEnd, nowMinute],
  );

  const supplemental = useSupplementalSync({
    useBackend,
    currentMachineId: machines.currentMachineId,
    currentDeviceId: machines.currentDeviceId,
    shiftWindow,
    getDowntimeReasonsUseCase,
    getActiveDowntimesUseCase,
    getHourlyTrendsUseCase,
    getRejectBreakdownUseCase,
    listLabelableDowntimesUseCase,
    refreshSeq: supplementalSeq,
    errorReporter,
    setMachines: machines.setMachines,
  });

  useSimulationTicker({
    isSimulating: ui.isSimulating,
    currentMachine: machines.currentMachine,
    useBackend,
    machineRepository,
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
    machineCommandUseCase,
    labelDowntimeReasonUseCase,
    exportTelemetryUseCase,
    runProtected: auth.runProtected,
    getOperatorId: () => auth.authSession?.operator.id ?? null,
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

  // FR-011: lifecycle WS tipis → debounced refetch REST (dedupe per jenis).
  const runRefetch = useCallback((kind: RefetchKind) => {
    if (kind === 'fleet') {
      getMachinesUseCase.executeAll().then(machines.setMachines).catch(() => {});
    } else if (kind === 'registry') {
      void registry.refreshDeviceRegistry().catch(() => {});
    } else {
      setSupplementalSeq((s) => s + 1);
    }
  }, [getMachinesUseCase, machines.setMachines, registry.refreshDeviceRegistry]);
  const refetchScheduler = useMemo(() => createRefetchScheduler(runRefetch), [runRefetch]);
  useEffect(() => () => refetchScheduler.dispose(), [refetchScheduler]);

  // FR-012: resync snapshot setelah reconnect + poll jaring-pengaman 60s.
  const resync = useFleetResync({
    useBackend,
    liveStateRepository,
    setMachines: machines.setMachines,
  });

  useTelemetrySubscription({
    useBackend,
    subscribeTelemetryUseCase,
    setMachines: machines.setMachines,
    setAlarms: machines.setAlarms,
    onRefetch: refetchScheduler.schedule,
    onReconnect: resync.triggerResync,
    onFatal: () => machines.setLoadError('WebSocket ditolak origin (close 4403) — periksa CORS_ORIGIN backend; reconnect dihentikan.'),
  });

  const orders = useWorkOrders({
    useBackend,
    currentDeviceId: machines.currentDeviceId,
    currentTotalCount: machines.currentMachine?.totalCount ?? null,
    listWorkOrdersUseCase,
    getMachinesUseCase,
    runProtected: auth.runProtected,
    setMachines: machines.setMachines,
  });

  const backendHealth = useBackendHealth({ useBackend, getHealthUseCase });

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
    catalog: registry.catalog,
    backendHealth: backendHealth.health,
    pendingWorkOrders: orders.pendingWorkOrders,
    workOrderError: orders.workOrderError,
    workOrderPreview: orders.workOrderPreview,
    workOrderDetail: orders.workOrderDetail,
    isWorkOrderDetailOpen: orders.isWorkOrderDetailOpen,
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
    dispatchMachineCommand: actions.dispatchMachineCommand,
    resetCounters: actions.resetCounters,
    exportTelemetry: actions.exportTelemetry,
    applyJobConfig: actions.applyJobConfig,
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
    refreshCatalog: registry.refreshCatalog,
    saveDeviceMetadata: registry.saveDeviceMetadata,
    saveMachineMetadata: registry.saveMachineMetadata,
    bindDeviceToMachine: registry.bindDeviceToMachine,
    unbindDeviceFromMachine: registry.unbindDeviceFromMachine,
    openProductionSetupModal: orders.openProductionSetupModal,
    closeProductionSetupModal: orders.closeProductionSetupModal,
    loadPendingWorkOrders: orders.loadPendingWorkOrders,
    previewWorkOrder: orders.previewWorkOrder,
    clearWorkOrderPreview: orders.clearWorkOrderPreview,
    openWorkOrderDetail: orders.openWorkOrderDetail,
    closeWorkOrderDetail: orders.closeWorkOrderDetail,
    dispatchWorkOrder: orders.dispatchWorkOrder,
    completeWorkOrder: orders.completeWorkOrder,
    cancelWorkOrder: orders.cancelWorkOrder,
    closeAuthModal: auth.closeAuthModal,
    openAuthModal: auth.openAuthModal,
    loginWithPassword: auth.loginWithPassword,
    submitPasswordChange: auth.submitPasswordChange,
    authMode: auth.authMode,
    retryAfterSec: auth.retryAfterSec,
    capabilities: auth.capabilities,
    mutationsAllowed: auth.mutationsAllowed,
    logoutOperator: auth.logoutOperator,
  };
}
