// /src/application/hooks/useOeeDashboard.ts
// Application orchestration hook — composes use-cases over repository ports.
// LAYER RULES (enforced):
// - MUST NOT import infrastructure/* (concrete DI container, adapters)
// - MUST NOT import seed/mock data (data/*, infrastructure/seeds)
// - MUST NOT touch document/window (DOM lives in presentation/hooks)
// Presentation injects collaborators via the deps argument (see
// presentation/pages/DashboardPage.tsx). Pure domain + use-case composition only.

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { MachineConfig, MachineStatus, DowntimeReasonItem } from '../../domain/entities/Machine';
import type { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import type { CalculateOeeUseCase } from '../use-cases/CalculateOeeUseCase';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { UpdateMachineStatusUseCase } from '../use-cases/UpdateMachineStatusUseCase';
import type { LogDowntimeUseCase } from '../use-cases/LogDowntimeUseCase';
import type { LogRejectUseCase } from '../use-cases/LogRejectUseCase';
import type { SimulateMachinePulseUseCase } from '../use-cases/SimulateMachinePulseUseCase';
import type { ManageAlarmsUseCase } from '../use-cases/ManageAlarmsUseCase';
import type { MqttEdgeCommandUseCase } from '../use-cases/MqttEdgeCommandUseCase';
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
  viewMode: 'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT';
  isSimulating: boolean;
  teepEnabled: boolean;
  alarms: MachineAlarmEvent[];
  isLoading: boolean;
  isLogModalOpen: boolean;
  isHelpModalOpen: boolean;
  isMqttModalOpen: boolean;
  formulaMetricHighlight: string;
  setViewMode: (mode: 'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT') => void;
  toggleSimulate: () => void;
  toggleTeep: () => void;
  selectMachine: (machineId: string) => void;
  selectLine: (line: string) => void;
  selectShift: (shift: string) => void;
  updateMachineStatus: (status: MachineStatus) => Promise<void>;
  logDowntime: (event: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'>) => Promise<void>;
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
  } = deps;

  const [machines, setMachines] = useState<MachineConfig[]>([]);
  const [currentMachineId, setCurrentMachineId] = useState<string>('');
  const [selectedPlant] = useState<string>('Plant 1');
  const [selectedLine, setSelectedLine] = useState<string>('Line 1');
  const [selectedShift, setSelectedShift] = useState<string>('Shift 1');
  const [selectedDate] = useState<string>('18 Sep 2026');

  const [viewMode, setViewMode] = useState<'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT'>('FULLSCREEN_IMAGE');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [teepEnabled, setTeepEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [alarms, setAlarms] = useState<MachineAlarmEvent[]>([]);

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isMqttModalOpen, setIsMqttModalOpen] = useState<boolean>(false);
  const [formulaMetricHighlight, setFormulaMetricHighlight] = useState<string>('OEE');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const machineList = await getMachinesUseCase.executeAll();
        const alarmList = await manageAlarmsUseCase.getAllAlarms();
        if (isMounted) {
          setMachines(machineList);
          if (machineList.length > 0) setCurrentMachineId((prev) => prev || machineList[0].id);
          setAlarms(alarmList);
        }
      } catch (err) {
        console.error('Failed to initialize dashboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [getMachinesUseCase, manageAlarmsUseCase]);

  const currentMachine = useMemo(() => {
    return machines.find((m) => m.id === currentMachineId) ?? machines[0] ?? null;
  }, [machines, currentMachineId]);

  const currentMetrics = useMemo(() => {
    if (!currentMachine) return null;
    return calculateOeeUseCase.execute(currentMachine);
  }, [calculateOeeUseCase, currentMachine]);

  useEffect(() => {
    if (!isSimulating || !currentMachine) return;
    const interval = setInterval(async () => {
      if (currentMachine.status !== 'RUNNING') return;
      const updated = await simulateMachinePulseUseCase.execute(currentMachine);
      if (updated) {
        setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isSimulating, currentMachine, simulateMachinePulseUseCase]);

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
    const { updatedMachine, createdAlarm } = await updateMachineStatusUseCase.execute(
      currentMachineId,
      newStatus
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
    if (createdAlarm) {
      setAlarms((prev) => [createdAlarm, ...prev]);
    }
  }, [updateMachineStatusUseCase, currentMachineId]);

  const logDowntime = useCallback(async (event: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'>) => {
    const { updatedMachine, createdAlarm } = await logDowntimeUseCase.execute(
      currentMachineId,
      event
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
    setAlarms((prev) => [createdAlarm, ...prev]);
  }, [logDowntimeUseCase, currentMachineId]);

  const logReject = useCallback(async (reasonLabel: string, count: number) => {
    const updatedMachine = await logRejectUseCase.execute(
      currentMachineId,
      reasonLabel,
      count
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
  }, [logRejectUseCase, currentMachineId]);

  const acknowledgeAlarm = useCallback(async (alarmId: string) => {
    const updated = await manageAlarmsUseCase.acknowledgeAlarm(alarmId);
    setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
  }, [manageAlarmsUseCase]);

  const resolveAlarm = useCallback(async (alarmId: string) => {
    const updated = await manageAlarmsUseCase.resolveAlarm(alarmId);
    setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
  }, [manageAlarmsUseCase]);

  const dispatchMqttCommand = useCallback(async (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => {
    const { updatedMachine } = await mqttEdgeCommandUseCase.dispatchCommand(
      currentMachineId,
      command
    );
    if (updatedMachine) {
      setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
    }
  }, [mqttEdgeCommandUseCase, currentMachineId]);

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

    const { updatedMachine } = await mqttEdgeCommandUseCase.setJobConfig(currentMachineId, payload);

    const syncedMachine: MachineConfig = {
      ...updatedMachine,
      idealCycleTimeSec: stdCycleSec,
      actualHourlyRate: deriveActualRate(stdCycleSec),
      jobConfig: { ...updatedMachine.jobConfig, standardCycleTimeSec: stdCycleSec },
    };

    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? syncedMachine : m)));
    setIsMqttModalOpen(false);
  }, [mqttEdgeCommandUseCase, currentMachineId, currentMachine]);

  const openFormulaModal = useCallback((metricName: string) => {
    setFormulaMetricHighlight(metricName);
    setIsHelpModalOpen(true);
  }, []);

  const closeFormulaModal = useCallback(() => setIsHelpModalOpen(false), []);
  const openLogModal = useCallback(() => setIsLogModalOpen(true), []);
  const closeLogModal = useCallback(() => setIsLogModalOpen(false), []);
  const openMqttModal = useCallback(() => setIsMqttModalOpen(true), []);
  const closeMqttModal = useCallback(() => setIsMqttModalOpen(false), []);
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
    teepEnabled,
    alarms,
    isLoading,
    isLogModalOpen,
    isHelpModalOpen,
    isMqttModalOpen,
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
  };
}
