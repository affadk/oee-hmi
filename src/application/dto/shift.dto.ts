// /src/application/dto/shift.dto.ts
// Boundary DTO: Fase 2 shift-summary/shift-timeline JSON → domain.
// Tolerant to snake_case/camelCase like the other mappers.

import type { ShiftSummary, ShiftTimelineSegment } from '../../domain/ports/IShiftSummary';
import type { TimelineSegment, TimelineKind } from '../../domain/services/ShiftTimeline';
import { isPlannedDowntimeCategory } from '../../domain/entities/backend/Telemetry';
import { toFiniteNumber } from '../../domain/entities/backend/LiveState';

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function num(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '') return toFiniteNumber(c);
  }
  return 0;
}

function str(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c !== '') return c;
  }
  return '';
}

export function mapShiftSummaryDto(raw: RawRecord): ShiftSummary {
  const oee = asRecord(raw.oee);
  const timeSec = asRecord(raw.time_sec ?? raw.timeSec);
  const window = asRecord(raw.window);
  return {
    machineId: str(raw.machine_id, raw.machineId),
    deviceId: str(raw.device_id, raw.deviceId),
    woId: (str(raw.wo_id, raw.woId) || null) as string | null,
    plannedBreakMin: num(window.planned_break_min, window.plannedBreakMin),
    plannedOperatingSec: num(window.planned_operating_sec, window.plannedOperatingSec),
    oee: {
      availability: num(oee.availability),
      performance: num(oee.performance),
      quality: num(oee.quality),
      oee: num(oee.oee, oee.total_oee, oee.totalOee),
    },
    timeSec: {
      planned: num(timeSec.planned),
      run: num(timeSec.run, timeSec.run_time, timeSec.runTime),
      downtime: num(timeSec.downtime),
      plannedDt: num(timeSec.planned_dt, timeSec.plannedDt),
      unplannedDt: num(timeSec.unplanned_dt, timeSec.unplannedDt),
    },
  };
}

export function mapShiftTimelineDto(raw: RawRecord): ShiftTimelineSegment {
  return {
    from: str(raw.from, raw.start, raw.start_time, raw.startTime),
    to: str(raw.to, raw.end, raw.end_time, raw.endTime),
    state: str(raw.state, raw.fsm_state, raw.fsmState, 'UNKNOWN').toUpperCase(),
    oee: raw.oee === undefined || raw.oee === null ? null : toFiniteNumber(raw.oee),
    downtimeId: raw.downtime_id === undefined || raw.downtime_id === null
      ? (raw.downtimeId === undefined || raw.downtimeId === null ? null : toFiniteNumber(raw.downtimeId))
      : toFiniteNumber(raw.downtime_id),
    category: str(raw.category) || null,
    reason: str(raw.reason, raw.operator_reason, raw.operatorReason) || null,
    planned: raw.planned === true || raw.planned === 'true',
  };
}

export function mapShiftTimelineListDto(raw: unknown): ShiftTimelineSegment[] {
  if (Array.isArray(raw)) return (raw as RawRecord[]).map(mapShiftTimelineDto);
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return ((raw as { data?: unknown }).data as RawRecord[]).map(mapShiftTimelineDto);
  }
  return [];
}

function serverSegmentToKind(state: string, category: string | null, planned: boolean): TimelineKind {
  if (category === 'SETUP_AND_ADJUSTMENT') return 'Changeover';
  if (planned || isPlannedDowntimeCategory(category)) return 'Planned';
  switch (state) {
    case 'RUNNING':
    case 'READY':
      return 'Active';
    case 'SETUP':
      return 'Changeover';
    case 'DOWN':
    case 'UNPLANNED_DT':
    case 'UNCONFIGURED':
    case 'BATCH_FINISHED':
    default:
      return state === 'PLANNED_DT' || state === 'PLANNED_STOP' ? 'Planned' : 'Breakdown';
  }
}

/**
 * Server segments → domain TimelineSegment for PasXProgressStrip.
 * Offsets are measured from `windowFromIso`; unparseable bounds are skipped.
 */
export function toTimelineSegments(segments: ShiftTimelineSegment[], windowFromIso: string): TimelineSegment[] {
  const windowStart = new Date(windowFromIso).getTime();
  if (!Number.isFinite(windowStart)) return [];
  const out: TimelineSegment[] = [];
  segments.forEach((seg, idx) => {
    const from = new Date(seg.from).getTime();
    const to = new Date(seg.to).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return;
    const durationMinutes = Math.max(1, Math.round((to - from) / 60000));
    out.push({
      key: seg.downtimeId !== null ? `srv-dt-${seg.downtimeId}` : `srv-${idx}`,
      kind: serverSegmentToKind(seg.state, seg.category, seg.planned),
      label: seg.reason ?? seg.category ?? seg.state,
      durationMinutes,
      startOffsetMin: Math.max(0, Math.round((from - windowStart) / 60000)),
      planned: seg.planned || isPlannedDowntimeCategory(seg.category),
    });
  });
  return out;
}
