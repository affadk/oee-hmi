// /src/application/hooks/useLiveTrend.ts
// Focused hook: live 5m trend overlay (B5 aggregate, B2 raw-history fallback).
// Null = unavailable; callers render nothing extra.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useEffect, useState } from 'react';
import type { TelemetryHistoryPoint } from '../../domain/entities/backend/Telemetry';
import type { GetTelemetryAggregateUseCase } from '../use-cases/GetTelemetryAggregateUseCase';
import type { GetTelemetryHistoryUseCase } from '../use-cases/GetTelemetryHistoryUseCase';
import type { ShiftWindowIso } from '../../domain/services/ShiftTimeline';

export interface LiveTrendPoint {
  timestamp: string;
  oee: number;
}

export interface LiveTrendDeps {
  useBackend: boolean;
  currentDeviceId: string;
  shiftWindow: ShiftWindowIso | null;
  getAggregateUseCase: GetTelemetryAggregateUseCase;
  getHistoryUseCase: GetTelemetryHistoryUseCase;
}

const LIVE_POINTS = 48;

function toLivePoints(points: TelemetryHistoryPoint[]): LiveTrendPoint[] {
  return points.slice(-LIVE_POINTS).map((p) => ({ timestamp: p.timestamp, oee: p.oee }));
}

export function useLiveTrend(deps: LiveTrendDeps): LiveTrendPoint[] | null {
  const { useBackend, currentDeviceId, shiftWindow, getAggregateUseCase, getHistoryUseCase } = deps;
  const [livePoints, setLivePoints] = useState<LiveTrendPoint[] | null>(null);

  const windowFrom = shiftWindow?.from ?? null;
  const windowTo = shiftWindow?.to ?? null;

  useEffect(() => {
    if (!useBackend || !currentDeviceId) {
      setLivePoints(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const agg = await getAggregateUseCase.execute(currentDeviceId, '5m', windowFrom ?? undefined, windowTo ?? undefined, 96);
        if (alive) setLivePoints(toLivePoints(agg));
      } catch {
        try {
          const hist = await getHistoryUseCase.execute(currentDeviceId, windowFrom ?? undefined, windowTo ?? undefined, 200);
          if (alive) setLivePoints(toLivePoints(hist));
        } catch {
          if (alive) setLivePoints(null);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [useBackend, currentDeviceId, windowFrom, windowTo, getAggregateUseCase, getHistoryUseCase]);

  return livePoints;
}
