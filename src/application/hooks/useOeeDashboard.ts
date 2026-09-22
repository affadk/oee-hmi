// /src/application/hooks/useOeeDashboard.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDiContainer } from '../../infrastructure/di/DiContext';
import { MachineConfig, MachineStatus, DowntimeReasonItem } from '../../domain/entities/Machine';
import { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import { MachineAlarmEvent } from '../../domain/entities/Alarm';
import { INITIAL_MACHINES, INITIAL_ALARMS } from '../../data/mockData';

export interface UseOeeDashboardReturn {
  // Machines state
  machines: MachineConfig[];
  currentMachine: MachineConfig;
  currentMetrics: CalculatedOeeMetrics;
  currentMachineId: string;
  selectedPlant: string;
  selectedLine: string;
  selectedShift: string;
  selectedDate: string;

  // View mode
  viewMode: 'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT';
  isFullscreen: boolean;
  isSimulating: boolean;
  teepEnabled: boolean;

  // Alarms
  alarms: MachineAlarmEvent[];

  // Modals state
  isLogModalOpen: boolean;
  isHelpModalOpen: boolean;
  isMqttModalOpen: boolean;
  formulaMetricHighlight: string;

  // Actions
  setViewMode: (mode: 'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT') => void;
  toggleBrowserFullscreen: () => void;
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

export function useOeeDashboard(): UseOeeDashboardReturn {
  const container = useDiContainer();

  // State initialized with repository values
  const [machines, setMachines] = useState<MachineConfig[]>(INITIAL_MACHINES);
  const [currentMachineId, setCurrentMachineId] = useState<string>('MC-SODIUM');
  const [selectedPlant] = useState<string>('Plant 1');
  const [selectedLine, setSelectedLine] = useState<string>('Line 1');
  const [selectedShift, setSelectedShift] = useState<string>('Shift 1');
  const [selectedDate] = useState<string>('18 Sep 2026');

  const [viewMode, setViewMode] = useState<'FULLSCREEN_IMAGE' | 'DETAILED_AUDIT'>('FULLSCREEN_IMAGE');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [teepEnabled, setTeepEnabled] = useState<boolean>(false);

  const [alarms, setAlarms] = useState<MachineAlarmEvent[]>(INITIAL_ALARMS);

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isMqttModalOpen, setIsMqttModalOpen] = useState<boolean>(false);
  const [formulaMetricHighlight, setFormulaMetricHighlight] = useState<string>('OEE');

  // Load initial data through Use Cases
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const machineList = await container.getMachinesUseCase.executeAll();
        const alarmList = await container.manageAlarmsUseCase.getAllAlarms();
        if (isMounted) {
          if (machineList.length > 0) setMachines(machineList);
          if (alarmList.length > 0) setAlarms(alarmList);
        }
      } catch (err) {
        console.error('Failed to initialize dashboard data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [container]);

  // Active machine resolution
  const currentMachine = useMemo(() => {
    return machines.find((m) => m.id === currentMachineId) || machines[0] || INITIAL_MACHINES[0];
  }, [machines, currentMachineId]);

  // Calculated OEE metrics via Domain Service / Use Case
  const currentMetrics = useMemo(() => {
    return container.calculateOeeUseCase.execute(currentMachine);
  }, [container, currentMachine]);

  // Fullscreen management
  const toggleBrowserFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'f' || e.key === 'F') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        toggleBrowserFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleBrowserFullscreen]);

  // Live simulation effect via SimulateMachinePulseUseCase
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(async () => {
      if (currentMachine.status !== 'RUNNING') return;
      const updated = await container.simulateMachinePulseUseCase.execute(currentMachine);
      if (updated) {
        setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating, currentMachine, container]);

  // Machine and Line selection
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

  // Update Machine Status via Use Case
  const updateMachineStatus = useCallback(async (newStatus: MachineStatus) => {
    const { updatedMachine, createdAlarm } = await container.updateMachineStatusUseCase.execute(
      currentMachineId,
      newStatus
    );

    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));

    if (createdAlarm) {
      setAlarms((prev) => [createdAlarm, ...prev]);
    }
  }, [container, currentMachineId]);

  // Log Downtime via Use Case
  const logDowntime = useCallback(async (event: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'>) => {
    const { updatedMachine, createdAlarm } = await container.logDowntimeUseCase.execute(
      currentMachineId,
      event
    );

    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
    setAlarms((prev) => [createdAlarm, ...prev]);
  }, [container, currentMachineId]);

  // Log Reject via Use Case
  const logReject = useCallback(async (reasonLabel: string, count: number) => {
    const updatedMachine = await container.logRejectUseCase.execute(
      currentMachineId,
      reasonLabel,
      count
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
  }, [container, currentMachineId]);

  // Alarms management via Use Case
  const acknowledgeAlarm = useCallback(async (alarmId: string) => {
    const updated = await container.manageAlarmsUseCase.acknowledgeAlarm(alarmId);
    setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
  }, [container]);

  const resolveAlarm = useCallback(async (alarmId: string) => {
    const updated = await container.manageAlarmsUseCase.resolveAlarm(alarmId);
    setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
  }, [container]);

  // MQTT Edge interactions via Use Case
  const dispatchMqttCommand = useCallback(async (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => {
    const { updatedMachine } = await container.mqttEdgeCommandUseCase.dispatchCommand(
      currentMachineId,
      command
    );
    if (updatedMachine) {
      setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
    }
  }, [container, currentMachineId]);

  const dispatchMqttJobConfig = useCallback(async (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number,
    shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number }
  ) => {
    const stdCycleSec = cycleTimeSec ?? currentMachine.idealCycleTimeSec ?? currentMachine.jobConfig?.standardCycleTimeSec ?? 9.0;
    const theoreticalRate = stdCycleSec > 0 ? Math.round(3600 / stdCycleSec) : 400;
    // Scale actual rate based on current speed efficiency (~50.7%)
    const newActualRate = Math.round(theoreticalRate * 0.5075);

    // Operator tiba sebagai display "Nama (ID)" dari modal QR — pecah kembali
    // agar operator.id asli (mis. OP-4021) terkirim, bukan hardcoded OP-EDGE.
    const opMatch = operator.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    const operatorName = opMatch ? opMatch[1].trim() || operator : operator;
    const operatorId = opMatch ? opMatch[2].trim() || 'OP-EDGE' : 'OP-EDGE';

    const shiftStart = shiftOverride?.shiftStart ?? currentMachine.jobConfig?.shiftStart ?? '06:00';
    const shiftEnd = shiftOverride?.shiftEnd ?? currentMachine.jobConfig?.shiftEnd ?? '14:00';
    const plannedBreakMin = shiftOverride?.breakMin ?? currentMachine.plannedDowntimeMinutes;

    const payload = {
      command: 'SET_JOB_CONFIG' as const,
      transaction_id: `tx-${Date.now()}`,
      work_order: wo,
      product: {
        id: `PRD-${product.replace(/\s+/g, '-').toUpperCase()}`,
        name: product,
        std_cycle_time_sec: stdCycleSec,
      },
      operator: {
        id: operatorId,
        name: operatorName,
      },
      shift_plan: {
        shift_start: shiftStart,
        shift_end: shiftEnd,
        planned_break_min: plannedBreakMin,
        planned_operating_sec: (currentMachine.shiftDurationMinutes - currentMachine.plannedDowntimeMinutes) * 60,
        target_qty: target,
        ...(shiftOverride?.breakWindow ? { break_window: shiftOverride.breakWindow } : {}),
      },
    };

    const { updatedMachine } = await container.mqttEdgeCommandUseCase.setJobConfig(
      currentMachineId,
      payload
    );

    const syncedMachine: MachineConfig = {
      ...updatedMachine,
      idealCycleTimeSec: stdCycleSec,
      actualHourlyRate: newActualRate,
      jobConfig: {
        ...updatedMachine.jobConfig,
        standardCycleTimeSec: stdCycleSec,
      },
    };

    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? syncedMachine : m)));
    setIsMqttModalOpen(false);
  }, [container, currentMachineId, currentMachine]);

  // Modals & UI Toggles
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
    isFullscreen,
    isSimulating,
    teepEnabled,
    alarms,
    isLogModalOpen,
    isHelpModalOpen,
    isMqttModalOpen,
    formulaMetricHighlight,
    setViewMode,
    toggleBrowserFullscreen,
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
