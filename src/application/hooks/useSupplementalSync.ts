// /src/application/hooks/useSupplementalSync.ts
// Focused hook: backend-lane supplemental load (downtime reasons, hourly
// trends, labelable downtimes) merged into the matching machine.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useEffect, useState } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { DowntimeEvent } from '../../domain/entities/backend/Telemetry';
import type { ShiftWindowIso } from '../../domain/services/ShiftTimeline';
import type { GetDowntimeReasonsUseCase } from '../use-cases/GetDowntimeReasonsUseCase';
import type { GetActiveDowntimesUseCase } from '../use-cases/GetActiveDowntimesUseCase';
import type { GetHourlyTrendsUseCase } from '../use-cases/GetHourlyTrendsUseCase';
import type { GetRejectBreakdownUseCase } from '../use-cases/GetRejectBreakdownUseCase';
import type { ListLabelableDowntimesUseCase } from '../use-cases/ListLabelableDowntimesUseCase';
import type { IErrorReporter } from '../../domain/ports/IErrorReporter';

export interface SupplementalSyncDeps {
  useBackend: boolean;
  currentMachineId: string;
  currentDeviceId: string;
  /** Shift window for hourly trends (G11); null = unwindowed fallback. */
  shiftWindow: ShiftWindowIso | null;
  getDowntimeReasonsUseCase: GetDowntimeReasonsUseCase;
  getActiveDowntimesUseCase: GetActiveDowntimesUseCase;
  getHourlyTrendsUseCase: GetHourlyTrendsUseCase;
  getRejectBreakdownUseCase: GetRejectBreakdownUseCase;
  listLabelableDowntimesUseCase: ListLabelableDowntimesUseCase;
  errorReporter: IErrorReporter;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export interface SupplementalSyncApi {
  labelableDowntimes: DowntimeEvent[];
  setLabelableDowntimes: React.Dispatch<React.SetStateAction<DowntimeEvent[]>>;
  /** Non-empty when the last supplemental load failed; shown data may be stale/empty. */
  supplementalError: string;
  /** Global active-downtime count (§J.1); null when unknown/failed. */
  activeDowntimeCount: number | null;
}

export function useSupplementalSync(deps: SupplementalSyncDeps): SupplementalSyncApi {
  const {
    useBackend,
    currentMachineId,
    currentDeviceId,
    shiftWindow,
    getDowntimeReasonsUseCase,
    getActiveDowntimesUseCase,
    getHourlyTrendsUseCase,
    getRejectBreakdownUseCase,
    listLabelableDowntimesUseCase,
    errorReporter,
    setMachines,
  } = deps;

  const [labelableDowntimes, setLabelableDowntimes] = useState<DowntimeEvent[]>([]);
  const [supplementalError, setSupplementalError] = useState<string>('');
  const [activeDowntimeCount, setActiveDowntimeCount] = useState<number | null>(null);

  // Load supplemental data (downtime reasons, hourly trends) when current machine changes
  useEffect(() => {
    if (!useBackend || !currentDeviceId) return;
    let isMounted = true;

    async function loadSupplementalData() {
      try {
        const [downtimeReasons, hourlyTrends, labelable, activeDowntimes, rejectReasons] = await Promise.all([
          getDowntimeReasonsUseCase.execute(currentDeviceId),
          // G11: windowed hourly scoped to the shift; falls back to last-72 unwindowed.
          shiftWindow
            ? getHourlyTrendsUseCase.execute(currentDeviceId, shiftWindow.from, shiftWindow.to, 24)
            : getHourlyTrendsUseCase.execute(currentDeviceId),
          listLabelableDowntimesUseCase.execute(currentDeviceId).catch(() => []),
          // B3: global active count must not fail the per-device supplemental.
          getActiveDowntimesUseCase.execute().then((list) => list.length).catch(() => null),
          // G1: pareto nyata (window shift bila ada); [] jujur bila backend kosong.
          (shiftWindow
            ? getRejectBreakdownUseCase.execute(currentDeviceId, shiftWindow.from, shiftWindow.to)
            : getRejectBreakdownUseCase.execute(currentDeviceId)
          ).catch(() => []),
        ]);

        if (!isMounted) return;
        setLabelableDowntimes(labelable);
        setActiveDowntimeCount(activeDowntimes);
        setSupplementalError('');

        setMachines((prev) =>
          prev.map((m) =>
            m.id === currentMachineId
              ? {
                  ...m,
                  downtimeReasons,
                  hourlyTrends,
                  rejectReasons,
                }
              : m
          )
        );
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name !== 'AbortError') {
          errorReporter.captureException(err, { hook: 'useSupplementalSync' });
          // Surface partial-data state instead of failing silently:
          // tren/downtime yang tampil mungkin basi atau kosong.
          setSupplementalError(err.message || 'Gagal memuat data tren/downtime.');
        }
      }
    }

    loadSupplementalData();
    return () => {
      isMounted = false;
    };
  }, [useBackend, currentMachineId, currentDeviceId, shiftWindow, getDowntimeReasonsUseCase, getActiveDowntimesUseCase, getHourlyTrendsUseCase, getRejectBreakdownUseCase, listLabelableDowntimesUseCase, errorReporter, setMachines]);

  return { labelableDowntimes, setLabelableDowntimes, supplementalError, activeDowntimeCount };
}
