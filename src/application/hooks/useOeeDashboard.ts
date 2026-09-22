// /src/application/hooks/useOeeDashboard.ts
// Application orchestration hook — composes use-cases over repository ports.
// LAYER RULES (enforced):
// - MUST NOT import infrastructure/* (concrete DI container, adapters)
// - MUST NOT import seed/mock data (data/*, infrastructure/seeds)
// - MUST NOT touch document/window (DOM lives in presentation/hooks)
// Presentation injects collaborators via the deps argument (see
// presentation/pages/DashboardPage.tsx). Pure domain + use-case composition only.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { MachineConfig, MachineStatus, DowntimeReasonItem } from '../../domain/entities/Machine';
import type { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import type { AuthSession, IAuthGateway } from '../../domain/ports/IOeeBackend';
import type { DowntimeCategory, DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import type { CalculateOeeUseCase } from '../use-cases/CalculateOeeUseCase';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { UpdateMachineStatusUseCase } from '../use-cases/UpdateMachineStatusUseCase';
import type { LogDowntimeUseCase } from '../use-cases/LogDowntimeUseCase';
import type { LogRejectUseCase } from '../use-cases/LogRejectUseCase';
import type { SimulateMachinePulseUseCase } from '../use-cases/SimulateMachinePulseUseCase';
import type { ManageAlarmsUseCase } from '../use-cases/ManageAlarmsUseCase';
import type { MqttEdgeCommandUseCase } from '../use-cases/MqttEdgeCommandUseCase';
import type { GetDowntimeReasonsUseCase } from '../use-cases/GetDowntimeReasonsUseCase';
import type { GetHourlyTrendsUseCase } from '../use-cases/GetHourlyTrendsUseCase';
import type { SubscribeTelemetryUseCase } from '../use-cases/SubscribeTelemetryUseCase';
import type { ListLabelableDowntimesUseCase } from '../use-cases/ListLabelableDowntimesUseCase';
import type { LabelDowntimeReasonUseCase } from '../use-cases/LabelDowntimeReasonUseCase';
import type { ConfigureDeviceUseCase } from '../use-cases/ConfigureDeviceUseCase';
import type { ListWorkOrdersUseCase } from '../use-cases/ListWorkOrdersUseCase';
import type { DeviceRecord, MachineRecord } from '../../domain/entities/backend/Device';
import type { WorkOrderListItem, WorkOrderResolveResult } from '../../domain/entities/backend/WorkOrder';
import { buildJobConfigPayload, deriveActualRate } from '../use-cases/MqttEdgeCommandUseCase';

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
  getHourlyTrendsUseCase: GetHourlyTrendsUseCase;
  subscribeTelemetryUseCase: SubscribeTelemetryUseCase;
  listLabelableDowntimesUseCase: ListLabelableDowntimesUseCase;
  labelDowntimeReasonUseCase: LabelDowntimeReasonUseCase;
  configureDeviceUseCase: ConfigureDeviceUseCase;
  listWorkOrdersUseCase: ListWorkOrdersUseCase;
  authGateway: IAuthGateway;
  useBackend: boolean;
}

export type BackendDowntimeLabelInput = Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'> & {
  backendEventId?: number;
  notes?: string;
};

export interface UseOeeDashboardReturn {
  machines: MachineConfig[];
  currentMachine: MachineConfig | null;
  currentMetrics: CalculatedOeeMetrics | null;
  currentMachineId: string;
  selectedPlant: string;
  selectedLine: string;
  selectedShift: string;
  selectedDate: string;
  viewMode: 'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT';
  isSimulating: boolean;
  useBackend: boolean;
  teepEnabled: boolean;
  alarms: MachineAlarmEvent[];
  isLoading: boolean;
  isLogModalOpen: boolean;
  isHelpModalOpen: boolean;
  isMqttModalOpen: boolean;
  isAuthModalOpen: boolean;
  isDeviceConfigModalOpen: boolean;
  isProductionSetupModalOpen: boolean;
  authSession: AuthSession | null;
  authError: string;
  labelableDowntimes: DowntimeEvent[];
  deviceRegistry: { devices: DeviceRecord[]; machines: MachineRecord[] } | null;
  deviceRegistryError: string;
  pendingWorkOrders: WorkOrderListItem[];
  workOrderError: string;
  workOrderPreview: { woId: string; result: WorkOrderResolveResult } | null;
  productionSetupError: string;
  productionSetupBusy: boolean;
  formulaMetricHighlight: string;
  setViewMode: (mode: 'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT') => void;
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
  openDeviceConfigModal: () => void;
  closeDeviceConfigModal: () => void;
  refreshDeviceRegistry: () => Promise<void>;
  saveDeviceMetadata: (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => Promise<void>;
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
    getHourlyTrendsUseCase,
    subscribeTelemetryUseCase,
    listLabelableDowntimesUseCase,
    labelDowntimeReasonUseCase,
    configureDeviceUseCase,
    listWorkOrdersUseCase,
    authGateway,
    useBackend,
  } = deps;

  const [machines, setMachines] = useState<MachineConfig[]>([]);
  const [currentMachineId, setCurrentMachineId] = useState<string>('');
  const [selectedPlant] = useState<string>('Plant 1');
  const [selectedLine, setSelectedLine] = useState<string>('Line 1');
  const [selectedShift, setSelectedShift] = useState<string>('Shift 1');
  const [selectedDate] = useState<string>('18 Sep 2026');

  const [viewMode, setViewMode] = useState<'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT'>('FULLSCREEN_IMAGE');
  const [isSimulating, setIsSimulating] = useState<boolean>(!useBackend);
  const [teepEnabled, setTeepEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [alarms, setAlarms] = useState<MachineAlarmEvent[]>([]);

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isMqttModalOpen, setIsMqttModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [labelableDowntimes, setLabelableDowntimes] = useState<DowntimeEvent[]>([]);
  const [isDeviceConfigModalOpen, setIsDeviceConfigModalOpen] = useState<boolean>(false);
  const [isProductionSetupModalOpen, setIsProductionSetupModalOpen] = useState<boolean>(false);
  const [deviceRegistry, setDeviceRegistry] = useState<{ devices: DeviceRecord[]; machines: MachineRecord[] } | null>(null);
  const [deviceRegistryError, setDeviceRegistryError] = useState<string>('');
  const [pendingWorkOrders, setPendingWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [workOrderError, setWorkOrderError] = useState<string>('');
  const [workOrderPreview, setWorkOrderPreview] = useState<{ woId: string; result: WorkOrderResolveResult } | null>(null);
  const [productionSetupError, setProductionSetupError] = useState<string>('');
  const [productionSetupBusy, setProductionSetupBusy] = useState<boolean>(false);
  const [formulaMetricHighlight, setFormulaMetricHighlight] = useState<string>('OEE');
  const pendingProtectedActionRef = useRef<(() => Promise<void>) | null>(null);

  // Sync simulation state with data source mode
  useEffect(() => {
    if (useBackend) {
      setIsSimulating(false);
    }
  }, [useBackend]);

  // Load machines and alarms on mount or when useBackend changes
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | undefined;

    async function loadData() {
      abortController?.abort();
      abortController = new AbortController();
      try {
        const machineList = await getMachinesUseCase.executeAll();
        const alarmList = await manageAlarmsUseCase.getAllAlarms();
        if (isMounted) {
          setMachines(machineList);
          if (machineList.length > 0) setCurrentMachineId((prev) => prev || machineList[0].id);
          setAlarms(alarmList);
        }
      } catch (err) {
        if (!isMounted) return;
        // Only log if not aborted
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to initialize dashboard data:', err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
      abortController?.abort();
    };
  }, [getMachinesUseCase, manageAlarmsUseCase, useBackend]);

  const currentMachine = useMemo(() => {
    return machines.find((m) => m.id === currentMachineId) ?? machines[0] ?? null;
  }, [machines, currentMachineId]);

  const currentDeviceId = currentMachine?.deviceId ?? currentMachineId;

  const isUnauthorizedError = useCallback((err: unknown): boolean => {
    return !!err && typeof err === 'object' && (
      (err as { status?: unknown }).status === 401 ||
      (err as { code?: unknown }).code === 'UNAUTHORIZED'
    );
  }, []);

  const hasAuthToken = useCallback((): boolean => {
    return !useBackend || !!authGateway.getToken();
  }, [authGateway, useBackend]);

  const runProtected = useCallback(async (action: () => Promise<void>): Promise<void> => {
    if (useBackend && !hasAuthToken()) {
      pendingProtectedActionRef.current = action;
      setAuthError('');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await action();
    } catch (err) {
      if (useBackend && isUnauthorizedError(err)) {
        pendingProtectedActionRef.current = action;
        setAuthError('Sesi operator diperlukan atau sudah kedaluwarsa.');
        setIsAuthModalOpen(true);
        return;
      }
      throw err;
    }
  }, [hasAuthToken, isUnauthorizedError, useBackend]);

  // Load supplemental data (downtime reasons, hourly trends) when current machine changes
  useEffect(() => {
    if (!useBackend || !currentDeviceId) return;
    let isMounted = true;

    async function loadSupplementalData() {
      try {
        const [downtimeReasons, hourlyTrends, labelable] = await Promise.all([
          getDowntimeReasonsUseCase.execute(currentDeviceId),
          getHourlyTrendsUseCase.execute(currentDeviceId),
          listLabelableDowntimesUseCase.execute(currentDeviceId).catch(() => []),
        ]);

        if (!isMounted) return;
        setLabelableDowntimes(labelable);

        setMachines((prev) =>
          prev.map((m) =>
            m.id === currentMachineId
              ? {
                  ...m,
                  downtimeReasons,
                  hourlyTrends,
                  // Derive reject reasons from downtime + reject count
                  rejectReasons:
                    m.rejectCount > 0
                      ? [
                          { id: 'rej-1', label: 'Process Defect', count: Math.round(m.rejectCount * 0.6) },
                          { id: 'rej-2', label: 'Material Issue', count: Math.round(m.rejectCount * 0.3) },
                          { id: 'rej-3', label: 'Other', count: Math.round(m.rejectCount * 0.1) },
                        ]
                      : [],
                }
              : m
          )
        );
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load supplemental data:', err);
        }
      }
    }

    loadSupplementalData();
    return () => {
      isMounted = false;
    };
  }, [useBackend, currentMachineId, currentDeviceId, getDowntimeReasonsUseCase, getHourlyTrendsUseCase, listLabelableDowntimesUseCase]);

  // WebSocket real-time updates — backend mode only
  useEffect(() => {
    if (!useBackend) return;
    let isMounted = true;

    const unsubscribe = subscribeTelemetryUseCase.subscribe({
      onTelemetry: (frame) => {
        if (!isMounted) return;
        // Update the matching machine in state with live telemetry
        setMachines((prev) =>
          prev.map((m) => {
            if (m.deviceId !== frame.deviceId && m.id !== frame.machineId) return m;
            return {
              ...m,
              totalCount: frame.counters.total,
              goodCount: frame.counters.good,
              rejectCount: frame.counters.reject,
              actualCycleTimeSec: frame.counters.lastCycleSec,
              telemetry: {
                ...m.telemetry,
                ts: frame.timestamp,
                tot: frame.counters.total,
                rej: frame.counters.reject,
                cyc: Math.round(frame.counters.lastCycleSec * 10),
                run: frame.timeMetricsSec.runTime,
                dt: frame.timeMetricsSec.downtime,
                oee: Math.round(frame.oee.totalOee * 100),
                p: Math.round(frame.oee.performance * 100),
                q: Math.round(frame.oee.quality * 100),
                alm: frame.plcModbus.alarmCode,
                rpm: frame.plcModbus.spindleRpm,
                tmp: Math.round(frame.plcModbus.tempC * 10),
                is_buffered: frame.isBuffered,
              },
              health: {
                ...m.health,
                timestamp: frame.timestamp,
                uptimeSec: frame.hwDiag.uptimeSec,
                heap_free: frame.hwDiag.freeHeap,
              },
              lastTelemetryTs: frame.timestamp,
            };
          })
        );
      },
      onLifecycle: (event) => {
        if (!isMounted) return;
        // Convert lifecycle events to alarm entries for AlarmsZone
        const machineId = 'machineId' in event ? event.machineId : 'unknown';
        const alarmEntry: MachineAlarmEvent = {
          id: `alm-${Date.now()}-${event.type}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'Warning',
          machineId,
          durationMinutes: 1,
          status: 'In Progress',
          description: `${event.type}`,
          operator: 'System',
        };
        setAlarms((prev) => [alarmEntry, ...prev]);
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [useBackend, subscribeTelemetryUseCase]);

  const currentMetrics = useMemo(() => {
    if (!currentMachine) return null;
    return calculateOeeUseCase.execute(currentMachine);
  }, [calculateOeeUseCase, currentMachine]);

  // Simulation ticker — only active in simulation mode
  useEffect(() => {
    if (!isSimulating || !currentMachine || useBackend) return;
    const interval = setInterval(async () => {
      if (currentMachine.status !== 'RUNNING') return;
      const updated = await simulateMachinePulseUseCase.execute(currentMachine);
      if (updated) {
        setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isSimulating, currentMachine, simulateMachinePulseUseCase, useBackend]);

  const selectLine = useCallback((line: string) => {
    setSelectedLine(line);
    const firstMachineInLine = machines.find((m) => m.line === line);
    if (firstMachineInLine) {
      setCurrentMachineId(firstMachineInLine.id);
    }
  }, [machines]);

  const selectMachine = useCallback((machineId: string) => {
    setCurrentMachineId(machineId);
    const target = machines.find((m) => m.id === machineId);
    if (target?.line) {
      setSelectedLine(target.line);
    }
  }, [machines]);

  const selectShift = useCallback((shift: string) => {
    setSelectedShift(shift);
  }, []);

  const updateMachineStatus = useCallback(async (newStatus: MachineStatus) => {
    await runProtected(async () => {
      const { updatedMachine, createdAlarm } = await updateMachineStatusUseCase.execute(
        currentMachineId,
        newStatus
      );
      setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
      if (createdAlarm) {
        setAlarms((prev) => [createdAlarm, ...prev]);
      }
    });
  }, [runProtected, updateMachineStatusUseCase, currentMachineId]);

  const logDowntime = useCallback(async (event: BackendDowntimeLabelInput) => {
    if (useBackend) {
      if (typeof event.backendEventId !== 'number') return;
      await runProtected(async () => {
        await labelDowntimeReasonUseCase.execute(
          event.backendEventId as number,
          event.category as DowntimeCategory,
          event.label,
          event.notes,
        );
        setLabelableDowntimes((prev) => prev.filter((item) => item.id !== event.backendEventId));
        setMachines((prev) =>
          prev.map((m) =>
            m.id === currentMachineId
              ? {
                  ...m,
                  downtimeReasons: [
                    ...(m.downtimeReasons ?? []),
                    {
                      id: `dt-${event.backendEventId}`,
                      label: event.label,
                      category: String(event.category),
                      durationMinutes: event.durationMinutes,
                      type: 'UNPLANNED',
                    },
                  ],
                }
              : m
          )
        );
      });
      return;
    }

    const { updatedMachine, createdAlarm } = await logDowntimeUseCase.execute(
      currentMachineId,
      event
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
    setAlarms((prev) => [createdAlarm, ...prev]);
  }, [currentMachineId, labelDowntimeReasonUseCase, logDowntimeUseCase, runProtected, useBackend]);

  const logReject = useCallback(async (reasonLabel: string, count: number) => {
    if (useBackend) return;
    const updatedMachine = await logRejectUseCase.execute(
      currentMachineId,
      reasonLabel,
      count
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
  }, [logRejectUseCase, currentMachineId, useBackend]);

  const acknowledgeAlarm = useCallback(async (alarmId: string) => {
    const updated = await manageAlarmsUseCase.acknowledgeAlarm(alarmId);
    setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
  }, [manageAlarmsUseCase]);

  const resolveAlarm = useCallback(async (alarmId: string) => {
    const updated = await manageAlarmsUseCase.resolveAlarm(alarmId);
    setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
  }, [manageAlarmsUseCase]);

  const dispatchMqttCommand = useCallback(async (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => {
    await runProtected(async () => {
      const { updatedMachine } = await mqttEdgeCommandUseCase.dispatchCommand(
        currentMachineId,
        command
      );
      if (updatedMachine) {
        setMachines((prev) => prev.map((m) => (m.id === updatedMachine.id ? updatedMachine : m)));
      }
    });
  }, [runProtected, mqttEdgeCommandUseCase, currentMachineId]);

  const dispatchMqttJobConfig = useCallback(async (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number,
    shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number }
  ) => {
    if (!currentMachine) return;
    const stdCycleSec = cycleTimeSec ?? currentMachine.idealCycleTimeSec ?? currentMachine.jobConfig?.standardCycleTimeSec ?? 9.0;
    const payload = buildJobConfigPayload({
      workOrder: wo,
      productName: product,
      operatorDisplay: operator,
      targetQty: target,
      stdCycleTimeSec: stdCycleSec,
      shiftOverride,
      fallbackShiftStart: currentMachine.jobConfig?.shiftStart,
      fallbackShiftEnd: currentMachine.jobConfig?.shiftEnd,
      fallbackPlannedBreakMin: currentMachine.plannedDowntimeMinutes,
      fallbackPlannedOperatingSec: (currentMachine.shiftDurationMinutes - currentMachine.plannedDowntimeMinutes) * 60,
    });

    await runProtected(async () => {
      const { updatedMachine } = await mqttEdgeCommandUseCase.setJobConfig(currentMachineId, payload);

      const syncedMachine: MachineConfig = {
        ...updatedMachine,
        idealCycleTimeSec: stdCycleSec,
        actualHourlyRate: deriveActualRate(stdCycleSec),
        jobConfig: { ...updatedMachine.jobConfig, standardCycleTimeSec: stdCycleSec },
      };

      setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? syncedMachine : m)));
      setIsMqttModalOpen(false);
    });
  }, [runProtected, mqttEdgeCommandUseCase, currentMachineId, currentMachine]);

  // ===== Device configuration (§E PUT /devices/:id, §F bind/unbind) =====
  const refreshDeviceRegistry = useCallback(async () => {
    if (!useBackend) return;
    setDeviceRegistryError('');
    try {
      const registry = await configureDeviceUseCase.loadRegistry();
      setDeviceRegistry(registry);
    } catch (err) {
      setDeviceRegistryError(err instanceof Error ? err.message : 'Gagal memuat registry perangkat.');
      throw err;
    }
  }, [configureDeviceUseCase, useBackend]);

  const openDeviceConfigModal = useCallback(() => {
    setDeviceRegistryError('');
    setIsDeviceConfigModalOpen(true);
    void refreshDeviceRegistry().catch(() => undefined);
  }, [refreshDeviceRegistry]);

  const closeDeviceConfigModal = useCallback(() => setIsDeviceConfigModalOpen(false), []);

  const saveDeviceMetadata = useCallback(async (deviceId: string, patch: { ipAddress?: string; firmwareVersion?: string }) => {
    if (!useBackend) throw new Error('Konfigurasi perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.updateDeviceMetadata(deviceId, patch);
      const registry = await configureDeviceUseCase.loadRegistry();
      setDeviceRegistry(registry);
    });
  }, [configureDeviceUseCase, runProtected, useBackend]);

  const bindDeviceToMachine = useCallback(async (machineId: string, deviceId: string) => {
    if (!useBackend) throw new Error('Binding perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.bindDeviceToMachine(machineId, deviceId);
      const [registry, machineList] = await Promise.all([
        configureDeviceUseCase.loadRegistry(),
        getMachinesUseCase.executeAll(),
      ]);
      setDeviceRegistry(registry);
      setMachines(machineList);
    });
  }, [configureDeviceUseCase, getMachinesUseCase, runProtected, useBackend]);

  const unbindDeviceFromMachine = useCallback(async (machineId: string) => {
    if (!useBackend) throw new Error('Unbind perangkat hanya tersedia pada mode backend.');
    await runProtected(async () => {
      await configureDeviceUseCase.unbindDeviceFromMachine(machineId);
      const [registry, machineList] = await Promise.all([
        configureDeviceUseCase.loadRegistry(),
        getMachinesUseCase.executeAll(),
      ]);
      setDeviceRegistry(registry);
      setMachines(machineList);
    });
  }, [configureDeviceUseCase, getMachinesUseCase, runProtected, useBackend]);

  const openFormulaModal = useCallback((metricName: string) => {
    setFormulaMetricHighlight(metricName);
    setIsHelpModalOpen(true);
  }, []);

  const closeFormulaModal = useCallback(() => setIsHelpModalOpen(false), []);
  const openLogModal = useCallback(() => setIsLogModalOpen(true), []);
  const closeLogModal = useCallback(() => setIsLogModalOpen(false), []);
  const openMqttModal = useCallback(() => setIsMqttModalOpen(true), []);
  const closeMqttModal = useCallback(() => setIsMqttModalOpen(false), []);

  // ===== Production setup (§C list/resolve/dispatch/complete/cancel) =====
  const openProductionSetupModal = useCallback(() => {
    setProductionSetupError('');
    setWorkOrderPreview(null);
    setIsProductionSetupModalOpen(true);
  }, []);

  const closeProductionSetupModal = useCallback(() => setIsProductionSetupModalOpen(false), []);

  const loadPendingWorkOrders = useCallback(async () => {
    if (!useBackend) return;
    setWorkOrderError('');
    try {
      const pending = await listWorkOrdersUseCase.list({ status: 'PENDING', limit: 50 });
      setPendingWorkOrders(pending);
    } catch (err) {
      setWorkOrderError(err instanceof Error ? err.message : 'Gagal memuat work order.');
      throw err;
    }
  }, [listWorkOrdersUseCase, useBackend]);

  const previewWorkOrder = useCallback(async (woId: string) => {
    if (!useBackend) throw new Error('Preview work order hanya tersedia pada mode backend.');
    if (!currentDeviceId) throw new Error('Perangkat belum terikat pada mesin ini.');
    setWorkOrderError('');
    try {
      const result = await listWorkOrdersUseCase.resolve(woId, currentDeviceId);
      setWorkOrderPreview({ woId, result });
    } catch (err) {
      setWorkOrderPreview(null);
      throw err;
    }
  }, [currentDeviceId, listWorkOrdersUseCase, useBackend]);

  const clearWorkOrderPreview = useCallback(() => setWorkOrderPreview(null), []);

  const dispatchWorkOrder = useCallback(async (woId: string, deviceId: string) => {
    if (!useBackend) throw new Error('Dispatch work order hanya tersedia pada mode backend.');
    setProductionSetupBusy(true);
    try {
      await runProtected(async () => {
        await listWorkOrdersUseCase.dispatch(woId, deviceId, 'Dispatch dari Production Setup dashboard');
        const machineList = await getMachinesUseCase.executeAll();
        setMachines(machineList);
        const pending = await listWorkOrdersUseCase.list({ status: 'PENDING', limit: 50 });
        setPendingWorkOrders(pending);
        setWorkOrderPreview(null);
      });
    } catch (err) {
      setProductionSetupError(err instanceof Error ? err.message : 'Dispatch gagal.');
      throw err;
    } finally {
      setProductionSetupBusy(false);
    }
  }, [getMachinesUseCase, listWorkOrdersUseCase, runProtected, useBackend]);

  const completeWorkOrder = useCallback(async (woId: string, finalRejectCount: number) => {
    if (!useBackend) throw new Error('Complete work order hanya tersedia pada mode backend.');
    setProductionSetupBusy(true);
    try {
      await runProtected(async () => {
        await listWorkOrdersUseCase.complete(woId, finalRejectCount);
        const machineList = await getMachinesUseCase.executeAll();
        setMachines(machineList);
      });
    } catch (err) {
      setProductionSetupError(err instanceof Error ? err.message : 'Complete work order gagal.');
      throw err;
    } finally {
      setProductionSetupBusy(false);
    }
  }, [getMachinesUseCase, listWorkOrdersUseCase, runProtected, useBackend]);

  const cancelWorkOrder = useCallback(async (woId: string, reason?: string) => {
    if (!useBackend) throw new Error('Cancel work order hanya tersedia pada mode backend.');
    setProductionSetupBusy(true);
    try {
      await runProtected(async () => {
        await listWorkOrdersUseCase.cancel(woId, reason);
        const machineList = await getMachinesUseCase.executeAll();
        setMachines(machineList);
      });
    } catch (err) {
      setProductionSetupError(err instanceof Error ? err.message : 'Cancel work order gagal.');
      throw err;
    } finally {
      setProductionSetupBusy(false);
    }
  }, [getMachinesUseCase, listWorkOrdersUseCase, runProtected, useBackend]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError('');
    pendingProtectedActionRef.current = null;
  }, []);
  const loginWithPin = useCallback(async (pin: string, operatorId?: string) => {
    setAuthError('');
    try {
      const session = await authGateway.loginWithPin(pin, operatorId, currentDeviceId || currentMachineId);
      setAuthSession(session);
      setIsAuthModalOpen(false);
      const pending = pendingProtectedActionRef.current;
      pendingProtectedActionRef.current = null;
      if (pending) await pending();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PIN operator tidak valid.';
      setAuthError(message);
      throw err;
    }
  }, [authGateway, currentDeviceId, currentMachineId]);
  const logoutOperator = useCallback(() => {
    authGateway.logout();
    setAuthSession(null);
  }, [authGateway]);
  const toggleSimulate = useCallback(() => setIsSimulating((prev) => !prev), []);
  const toggleTeep = useCallback(() => setTeepEnabled((prev) => !prev), []);

  return {
    machines,
    currentMachine,
    currentMetrics,
    currentMachineId,
    selectedPlant,
    selectedLine,
    selectedShift,
    selectedDate,
    viewMode,
    isSimulating,
    useBackend,
    teepEnabled,
    alarms,
    isLoading,
    isLogModalOpen,
    isHelpModalOpen,
    isMqttModalOpen,
    isAuthModalOpen,
    authSession,
    authError,
    labelableDowntimes,
    formulaMetricHighlight,
    setViewMode,
    toggleSimulate,
    toggleTeep,
    selectMachine,
    selectLine,
    selectShift,
    updateMachineStatus,
    logDowntime,
    logReject,
    acknowledgeAlarm,
    resolveAlarm,
    dispatchMqttCommand,
    dispatchMqttJobConfig,
    openFormulaModal,
    closeFormulaModal,
    openLogModal,
    closeLogModal,
    openMqttModal,
    closeMqttModal,
    isDeviceConfigModalOpen,
    isProductionSetupModalOpen,
    deviceRegistry,
    deviceRegistryError,
    pendingWorkOrders,
    workOrderError,
    workOrderPreview,
    productionSetupError,
    productionSetupBusy,
    openDeviceConfigModal,
    closeDeviceConfigModal,
    refreshDeviceRegistry,
    saveDeviceMetadata,
    bindDeviceToMachine,
    unbindDeviceFromMachine,
    openProductionSetupModal,
    closeProductionSetupModal,
    loadPendingWorkOrders,
    previewWorkOrder,
    clearWorkOrderPreview,
    dispatchWorkOrder,
    completeWorkOrder,
    cancelWorkOrder,
    closeAuthModal,
    loginWithPin,
    logoutOperator,
  };
}
