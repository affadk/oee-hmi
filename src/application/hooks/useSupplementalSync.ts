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
import type { ListLabelableDowntimesUseCase } from '../use-cases/ListLabelableDowntimesUseCase';

export interface SupplementalSyncDeps {
  useBackend: boolean;
  currentMachineId: string;
  currentDeviceId: string;
  /** Shift window for hourly trends (G11); null = unwindowed fallback. */
  shiftWindow: ShiftWindowIso | null;
  getDowntimeReasonsUseCase: GetDowntimeReasonsUseCase;
  getActiveDowntimesUseCase: GetActiveDowntimesUseCase;
  getHourlyTrendsUseCase: GetHourlyTrendsUseCase;
  listLabelableDowntimesUseCase: ListLabelableDowntimesUseCase;
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
    listLabelableDowntimesUseCase,
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
        const [downtimeReasons, hourlyTrends, labelable, activeDowntimes] = await Promise.all([
          getDowntimeReasonsUseCase.execute(currentDeviceId),
          // G11: windowed hourly scoped to the shift; falls back to last-72 unwindowed.
          shiftWindow
            ? getHourlyTrendsUseCase.execute(currentDeviceId, shiftWindow.from, shiftWindow.to, 24)
            : getHourlyTrendsUseCase.execute(currentDeviceId),
          listLabelableDowntimesUseCase.execute(currentDeviceId).catch(() => []),
          // B3: global active count must not fail the per-device supplemental.
          getActiveDowntimesUseCase.execute().then((list) => list.length).catch(() => null),
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
                  // Backend belum punya endpoint reject-breakdown (GAP G1):
                  // jangan fabrikasi 60/30/10 — kosongkan sampai endpoint ada.
                  rejectReasons: [],
                }
              : m
          )
        );
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load supplemental data:', err);
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
  }, [useBackend, currentMachineId, currentDeviceId, shiftWindow, getDowntimeReasonsUseCase, getActiveDowntimesUseCase, getHourlyTrendsUseCase, listLabelableDowntimesUseCase, setMachines]);

  return { labelableDowntimes, setLabelableDowntimes, supplementalError, activeDowntimeCount };
}
