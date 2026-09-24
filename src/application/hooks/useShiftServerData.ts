// /src/application/hooks/useShiftServerData.ts
// Focused hook: Fase 2 server aggregates (§3.1 shift-summary, §3.2
// shift-timeline) with 404-fallback contract. Null = backend does not
// implement the endpoint (or no window) — callers use §2 client composition.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useEffect, useMemo, useState } from 'react';
import type { CalculatedOeeMetrics } from '../../domain/entities/OeeMetrics';
import type { ShiftSummary, ShiftTimelineSegment } from '../../domain/ports/IShiftSummary';
import type { TimelineSegment } from '../../domain/services/ShiftTimeline';
import { toTimelineSegments } from '../dto/shift.dto';
import type { GetShiftSummaryUseCase } from '../use-cases/GetShiftSummaryUseCase';
import type { GetShiftTimelineUseCase } from '../use-cases/GetShiftTimelineUseCase';
import type { ShiftWindowIso } from '../../domain/services/ShiftTimeline';

export interface ShiftServerDataDeps {
  useBackend: boolean;
  currentMachineId: string;
  currentDeviceId: string;
  shiftWindow: ShiftWindowIso | null;
  getShiftSummaryUseCase: GetShiftSummaryUseCase;
  getShiftTimelineUseCase: GetShiftTimelineUseCase;
}

export interface ShiftServerDataApi {
  shiftSummary: ShiftSummary | null;
  shiftSegments: TimelineSegment[] | null;
}

/**
 * Merge a server summary over client-computed metrics: A/P/Q/OEE and time
 * accounts come from the server; loss-PCS breakdown stays client-side until
 * the backend provides it (G1). Gaps are recomputed against machine targets.
 */
export function mergeShiftSummary(
  summary: ShiftSummary,
  fallback: CalculatedOeeMetrics,
  targets: { targetOee: number; targetAvailability: number; targetPerformance: number; targetQuality: number },
): CalculatedOeeMetrics {
  const availabilityPct = summary.oee.availability;
  const performancePct = summary.oee.performance;
  const qualityPct = summary.oee.quality;
  const oeePct = summary.oee.oee;
  return {
    ...fallback,
    plannedProductionTimeMin: Math.max(1, Math.round(summary.timeSec.planned / 60)),
    runTimeMin: Math.max(0, Math.round(summary.timeSec.run / 60)),
    downtimeMin: Math.max(0, Math.round(summary.timeSec.downtime / 60)),
    availabilityPct,
    performancePct,
    qualityPct,
    oeePct,
    oeeGap: Number((oeePct - targets.targetOee).toFixed(1)),
    availabilityGap: Number((availabilityPct - targets.targetAvailability).toFixed(1)),
    performanceGap: Number((performancePct - targets.targetPerformance).toFixed(1)),
    qualityGap: Number((qualityPct - targets.targetQuality).toFixed(1)),
  };
}

export function useShiftServerData(deps: ShiftServerDataDeps): ShiftServerDataApi {
  const {
    useBackend,
    currentMachineId,
    currentDeviceId,
    shiftWindow,
    getShiftSummaryUseCase,
    getShiftTimelineUseCase,
  } = deps;

  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);
  const [serverSegments, setServerSegments] = useState<ShiftTimelineSegment[] | null>(null);

  const windowFrom = shiftWindow?.from ?? null;
  const windowTo = shiftWindow?.to ?? null;

  useEffect(() => {
    if (!useBackend || !currentDeviceId) {
      setShiftSummary(null);
      setServerSegments(null);
      return;
    }
    let isMounted = true;

    async function load() {
      try {
        const [summary, segments] = await Promise.all([
          getShiftSummaryUseCase.execute({
            machineId: currentMachineId || undefined,
            deviceId: currentDeviceId,
            ...(windowFrom && windowTo ? { from: windowFrom, to: windowTo } : {}),
          }),
          windowFrom && windowTo
            ? getShiftTimelineUseCase.execute({
                machineId: currentMachineId || undefined,
                deviceId: currentDeviceId,
                from: windowFrom,
                to: windowTo,
                bucket: '5m',
              })
            : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        setShiftSummary(summary);
        setServerSegments(segments);
      } catch {
        // Non-404 failures: keep null so callers use client composition.
        // (Boot-level outages already surface via loadError.)
        if (isMounted) {
          setShiftSummary(null);
          setServerSegments(null);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [useBackend, currentMachineId, currentDeviceId, windowFrom, windowTo, getShiftSummaryUseCase, getShiftTimelineUseCase]);

  const shiftSegments = useMemo<TimelineSegment[] | null>(() => {
    if (!serverSegments || !windowFrom) return null;
    const mapped = toTimelineSegments(serverSegments, windowFrom);
    return mapped.length > 0 ? mapped : null;
  }, [serverSegments, windowFrom]);

  return { shiftSummary, shiftSegments };
}
