// /src/application/hooks/useMachinesQuery.ts
// Focused hook: fleet load (machines + alarms), current-machine selection,
// loading/error/retry surface.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.
// Presentation injects collaborators via the args object.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { ManageAlarmsUseCase } from '../use-cases/ManageAlarmsUseCase';
import type { IErrorReporter } from '../../domain/ports/IErrorReporter';

export interface MachinesQueryDeps {
  getMachinesUseCase: GetMachinesUseCase;
  manageAlarmsUseCase: ManageAlarmsUseCase;
  useBackend: boolean;
  errorReporter: IErrorReporter;
  /** Called when boot load fails with 401/UNAUTHORIZED (opens the PIN modal). */
  onUnauthorized: () => void;
}

export interface MachinesQueryApi {
  machines: MachineConfig[];
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
  currentMachineId: string;
  currentMachine: MachineConfig | null;
  currentDeviceId: string;
  alarms: MachineAlarmEvent[];
  setAlarms: React.Dispatch<React.SetStateAction<MachineAlarmEvent[]>>;
  isLoading: boolean;
  loadError: string;
  setLoadError: React.Dispatch<React.SetStateAction<string>>;
  retryLoad: () => void;
  selectedPlant: string;
  selectedLine: string;
  selectedShift: string;
  selectedDate: string;
  selectMachine: (machineId: string) => void;
  selectLine: (line: string) => void;
  selectShift: (shift: string) => void;
}

export function useMachinesQuery(deps: MachinesQueryDeps): MachinesQueryApi {
  const { getMachinesUseCase, manageAlarmsUseCase, useBackend, errorReporter, onUnauthorized } = deps;

  const [machines, setMachines] = useState<MachineConfig[]>([]);
  const [currentMachineId, setCurrentMachineId] = useState<string>('');
  // Tanpa data = string kosong (UI menampilkan "—"/0). Jangan hardcode
  // "Plant 1"/"Line 1"/tanggal — itu mock yang menyesatkan di lane backend.
  const [selectedPlant] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedDate] = useState<string>('');
  const [alarms, setAlarms] = useState<MachineAlarmEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [retrySeq, setRetrySeq] = useState<number>(0);

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
          const firstMachine = machineList[0];
          if (firstMachine) setCurrentMachineId((prev) => prev || firstMachine.id);
          setAlarms(alarmList);
          setLoadError('');
        }
      } catch (err) {
        if (!isMounted) return;
        // Only log if not aborted
        if (err instanceof Error && err.name !== 'AbortError') {
          errorReporter.captureException(err, { hook: 'useMachinesQuery' });
          // Backend 401 saat boot = sesi operator diperlukan: buka modal PIN
          // agar operator bisa login lalu retry.
          if (useBackend && !!err && typeof err === 'object'
            && ((err as { status?: unknown }).status === 401
              || (err as { code?: unknown }).code === 'UNAUTHORIZED')) {
            onUnauthorized();
          }
          // Backend tidak terjangkau / data kosong: tampilkan error eksplisit
          // alih-alih loading abadi (lihat F5 laporan audit).
          setLoadError(err.message || 'Gagal memuat data dashboard.');
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
  }, [getMachinesUseCase, manageAlarmsUseCase, useBackend, errorReporter, retrySeq, onUnauthorized]);

  const currentMachine = useMemo(() => {
    return machines.find((m) => m.id === currentMachineId) ?? machines[0] ?? null;
  }, [machines, currentMachineId]);

  const currentDeviceId = currentMachine?.deviceId ?? currentMachineId;

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

  const retryLoad = useCallback(() => {
    setLoadError('');
    setIsLoading(true);
    setRetrySeq((s) => s + 1);
  }, []);

  return {
    machines,
    setMachines,
    currentMachineId,
    currentMachine,
    currentDeviceId,
    alarms,
    setAlarms,
    isLoading,
    loadError,
    setLoadError,
    retryLoad,
    selectedPlant,
    selectedLine,
    selectedShift,
    selectedDate,
    selectMachine,
    selectLine,
    selectShift,
  };
}
