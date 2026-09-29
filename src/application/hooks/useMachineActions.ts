// /src/application/hooks/useMachineActions.ts
// Focused hook: machine mutations (status, downtime, reject, alarms, MQTT
// edge commands + job config). Thin use-case composition over repository ports.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useCallback } from 'react';
import type { MachineConfig, MachineStatus, DowntimeReasonItem } from '../../domain/entities/Machine';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import type { DowntimeCategory, DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import { isPlannedDowntimeCategory } from '../../domain/entities/backend/Telemetry';
import type { UpdateMachineStatusUseCase } from '../use-cases/UpdateMachineStatusUseCase';
import type { LogDowntimeUseCase } from '../use-cases/LogDowntimeUseCase';
import type { LogRejectUseCase } from '../use-cases/LogRejectUseCase';
import type { ManageAlarmsUseCase } from '../use-cases/ManageAlarmsUseCase';
import type { MachineCommandUseCase } from '../use-cases/MachineCommandUseCase';
import { buildJobConfigPayload, deriveActualRate } from '../use-cases/MachineCommandUseCase';
import type { LabelDowntimeReasonUseCase } from '../use-cases/LabelDowntimeReasonUseCase';
import type { ExportTelemetryUseCase, TelemetryExportFormat } from '../use-cases/ExportTelemetryUseCase';

export type BackendDowntimeLabelInput = Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'> & {
  backendEventId?: number;
  notes?: string;
};

export interface MachineActionsDeps {
  useBackend: boolean;
  currentMachineId: string;
  currentMachine: MachineConfig | null;
  updateMachineStatusUseCase: UpdateMachineStatusUseCase;
  logDowntimeUseCase: LogDowntimeUseCase;
  logRejectUseCase: LogRejectUseCase;
  manageAlarmsUseCase: ManageAlarmsUseCase;
  machineCommandUseCase: MachineCommandUseCase;
  labelDowntimeReasonUseCase: LabelDowntimeReasonUseCase;
  exportTelemetryUseCase: ExportTelemetryUseCase;
  runProtected: (action: () => Promise<void>) => Promise<void>;
  /** Operator id untuk atribusi ack server (G4); null = ack lokal saja. */
  getOperatorId?: () => string | null;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
  setAlarms: React.Dispatch<React.SetStateAction<MachineAlarmEvent[]>>;
  setLabelableDowntimes: React.Dispatch<React.SetStateAction<DowntimeEvent[]>>;
  closeMqttModal: () => void;
}

export interface MachineActionsApi {
  updateMachineStatus: (status: MachineStatus) => Promise<void>;
  logDowntime: (event: BackendDowntimeLabelInput) => Promise<void>;
  logReject: (reasonLabel: string, count: number) => Promise<void>;
  acknowledgeAlarm: (alarmId: string) => Promise<void>;
  resolveAlarm: (alarmId: string) => Promise<void>;
  /** Counter reset via edge command (RESET_COUNTER). Caller owns the confirm guard. */
  resetCounters: () => Promise<void>;
  dispatchMachineCommand: (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => Promise<void>;
  /** B6: returns raw export Blob; presentation owns the object-URL download. */
  exportTelemetry: (format?: TelemetryExportFormat) => Promise<Blob | null>;
  applyJobConfig: (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number,
    shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number }
  ) => Promise<void>;
}

export function useMachineActions(deps: MachineActionsDeps): MachineActionsApi {
  const {
    useBackend,
    currentMachineId,
    currentMachine,
    updateMachineStatusUseCase,
    logDowntimeUseCase,
    logRejectUseCase,
    manageAlarmsUseCase,
    machineCommandUseCase,
    labelDowntimeReasonUseCase,
    exportTelemetryUseCase,
    runProtected,
    getOperatorId,
    setMachines,
    setAlarms,
    setLabelableDowntimes,
    closeMqttModal,
  } = deps;

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
  }, [runProtected, updateMachineStatusUseCase, currentMachineId, setMachines, setAlarms]);

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
                      type: isPlannedDowntimeCategory(event.category) ? 'PLANNED' : 'UNPLANNED',
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
  }, [currentMachineId, labelDowntimeReasonUseCase, logDowntimeUseCase, runProtected, setLabelableDowntimes, setAlarms, setMachines, useBackend]);

  const logReject = useCallback(async (reasonLabel: string, count: number) => {
    if (useBackend) return;
    const updatedMachine = await logRejectUseCase.execute(
      currentMachineId,
      reasonLabel,
      count
    );
    setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? updatedMachine : m)));
  }, [logRejectUseCase, currentMachineId, useBackend, setMachines]);

  const acknowledgeAlarm = useCallback(async (alarmId: string) => {
    await runProtected(async () => {
      const updated = await manageAlarmsUseCase.acknowledgeAlarm(alarmId, getOperatorId?.() ?? undefined);
      setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
    });
  }, [runProtected, manageAlarmsUseCase, getOperatorId, setAlarms]);

  const resolveAlarm = useCallback(async (alarmId: string) => {
    await runProtected(async () => {
      const updated = await manageAlarmsUseCase.resolveAlarm(alarmId, getOperatorId?.() ?? undefined);
      setAlarms((prev) => prev.map((a) => (a.id === alarmId ? updated : a)));
    });
  }, [runProtected, manageAlarmsUseCase, getOperatorId, setAlarms]);

  const dispatchMachineCommand = useCallback(async (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => {
    await runProtected(async () => {
      const { updatedMachine } = await machineCommandUseCase.dispatchCommand(
        currentMachineId,
        command
      );
      if (updatedMachine) {
        setMachines((prev) => prev.map((m) => (m.id === updatedMachine.id ? updatedMachine : m)));
      }
    });
  }, [runProtected, machineCommandUseCase, currentMachineId, setMachines]);

  const resetCounters = useCallback(async () => {
    await dispatchMachineCommand('RESET_COUNTER');
  }, [dispatchMachineCommand]);

  const exportTelemetry = useCallback(async (format: TelemetryExportFormat = 'csv'): Promise<Blob | null> => {
    if (!useBackend) return null;
    const deviceId = currentMachine?.deviceId ?? currentMachineId;
    if (!deviceId) return null;
    return exportTelemetryUseCase.execute(deviceId, format);
  }, [useBackend, currentMachine, currentMachineId, exportTelemetryUseCase]);

  const applyJobConfig = useCallback(async (
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
      const { updatedMachine } = await machineCommandUseCase.setJobConfig(currentMachineId, payload);

      const syncedMachine: MachineConfig = {
        ...updatedMachine,
        idealCycleTimeSec: stdCycleSec,
        actualHourlyRate: deriveActualRate(stdCycleSec),
        jobConfig: { ...updatedMachine.jobConfig, standardCycleTimeSec: stdCycleSec },
      };

      setMachines((prev) => prev.map((m) => (m.id === currentMachineId ? syncedMachine : m)));
      closeMqttModal();
    });
  }, [runProtected, machineCommandUseCase, currentMachineId, currentMachine, setMachines, closeMqttModal]);

  return {
    updateMachineStatus,
    logDowntime,
    logReject,
    acknowledgeAlarm,
    resolveAlarm,
    resetCounters,
    dispatchMachineCommand,
    exportTelemetry,
    applyJobConfig,
  };
}
