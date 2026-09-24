// /src/domain/services/ShiftTimeline.ts
// Domain Service: pure shift-timeline derivation (no IO, no React, no DOM).
// Timeline = shift window (canvas) + WO-agnostic downtime reasons (overlay).
// Changeover is a LABEL (SETUP_AND_ADJUSTMENT family), never a new FSM state:
// firmware only sends st 0..5 (UNCONFIGURED..BATCH_FINISHED).

import type { MachineConfig } from '../entities/Machine';
import { isPlannedDowntimeCategory } from '../entities/backend/Telemetry';

export type TimelineKind = 'Active' | 'Breakdown' | 'Changeover' | 'Waiting' | 'Planned' | 'Undefined';

export interface TimelineSegment {
  key: string;
  kind: TimelineKind;
  label: string;
  durationMinutes: number;
  startOffsetMin: number; // minutes from shift start
  planned: boolean;
}

/** "22:00" -> minutes since midnight. Falls back when unparseable. */
export function parseShiftHM(hm: string | undefined, fallbackMin: number): number {
  if (!hm) return fallbackMin;
  const m = hm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallbackMin;
  return (parseInt(m[1] ?? '0', 10) % 24) * 60 + (parseInt(m[2] ?? '0', 10) % 60);
}

/** Shift window in minutes, handling overnight (end <= start means +24h). */
export function shiftWindowMinutes(shiftStart: string | undefined, shiftEnd: string | undefined): number {
  const startMin = parseShiftHM(shiftStart, 22 * 60);
  const endRaw = parseShiftHM(shiftEnd, 8 * 60);
  const endMin = endRaw <= startMin ? endRaw + 24 * 60 : endRaw;
  return Math.max(60, endMin - startMin);
}

/**
 * Map a downtime reason to a timeline kind.
 * Order matters: check Waiting/Changeover keywords before Breakdown,
 * because e.g. "Waiting for Material Supply" is UNPLANNED but not a breakdown.
 * Planned stops (break/maintenance) fall back to Changeover (amber lane)
 * for renderers that only carry Active/Changeover/Breakdown.
 */
export function mapDowntimeToKind(category: string, label: string, type?: 'PLANNED' | 'UNPLANNED'): TimelineKind {
  const hay = `${category} ${label}`.toLowerCase();
  if (/waiting|material|supply|starv|verif|batch verif/.test(hay)) return 'Waiting';
  if (/changeover|setup|adjust|splice|foil|calibrat|die|tool/.test(hay)) return 'Changeover';
  if (/breakdown|break down|break-down|sensor|mechanic|fault|jam|pump|alarm|chute|feeder/.test(hay)) return 'Breakdown';
  if (/planned|break|meal|rest|maintenance|planned_stop|cleaning|5s/.test(hay)) return 'Changeover';
  return type === 'PLANNED' ? 'Changeover' : 'Breakdown';
}

/** 108 -> "1h 48m", 28 -> "28m". */
export function formatDuration(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m >= 60) return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  return `${m}m`;
}

/** Shift-start minutes + offset -> "HH:MM" clock label (wraps midnight). */
export function clockLabel(shiftStartMin: number, offsetMin: number): string {
  const total = shiftStartMin + Math.round(offsetMin);
  const norm = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
}

/**
 * Build sequential timeline segments from real machine data.
 * - windowMin: shift canvas (defaults to jobConfig shiftStart/shiftEnd).
 * - downtime reasons keep input order; Active remainder is spread evenly
 *   into the gaps between/around them so the bar always sums to ~windowMin.
 * - when recorded downtime exceeds the window (bad data), segments are
 *   scaled down proportionally instead of overflowing.
 */
export function buildShiftTimeline(machine: MachineConfig, windowMinOverride?: number): TimelineSegment[] {
  const shiftStartStr = machine?.jobConfig?.shiftStart ?? '22:00';
  const shiftEndStr = machine?.jobConfig?.shiftEnd ?? '08:00';
  const windowMin = windowMinOverride ?? shiftWindowMinutes(shiftStartStr, shiftEndStr);
  const reasons = machine?.downtimeReasons ?? [];

  if (reasons.length === 0) {
    return injectPlannedBreak(
      [
        { key: 'active-full', kind: 'Active', label: 'Normal Production Run', durationMinutes: windowMin, startOffsetMin: 0, planned: false },
      ],
      machine,
      windowMin,
      shiftStartStr,
    );
  }

  const totalDT = reasons.reduce((acc, r) => acc + Math.max(0, r.durationMinutes), 0);
  const scale = totalDT > windowMin && totalDT > 0 ? windowMin / totalDT : 1;
  const scaled = reasons.map((r) => ({ ...r, durationMinutes: Math.max(0, r.durationMinutes * scale) }));
  const scaledTotal = scaled.reduce((acc, r) => acc + r.durationMinutes, 0);
  const activeTotal = Math.max(0, windowMin - scaledTotal);
  const gaps = scaled.length + 1;
  const activePerGap = activeTotal / gaps;

  const segments: TimelineSegment[] = [];
  let cursor = 0;
  const pushActive = (mins: number) => {
    if (mins <= 0.005) return;
    segments.push({
      key: `active-${segments.length}`,
      kind: 'Active',
      label: 'Normal Production Run',
      durationMinutes: mins,
      startOffsetMin: cursor,
      planned: false,
    });
    cursor += mins;
  };

  scaled.forEach((r, idx) => {
    pushActive(activePerGap);
    const planned = r.type === 'PLANNED' || isPlannedDowntimeCategory(r.category);
    segments.push({
      key: r.id || `dt-${idx}`,
      kind: mapDowntimeToKind(r.category, r.label, r.type),
      label: r.label,
      durationMinutes: r.durationMinutes,
      startOffsetMin: cursor,
      planned,
    });
    cursor += r.durationMinutes;
  });
  pushActive(activePerGap + Math.max(0, windowMin - cursor - activePerGap));

  return injectPlannedBreak(segments, machine, windowMin, shiftStartStr);
}

/** "02:00 - 03:00" -> { startMin, endMin } (menit sejak tengah malam). Null bila tak terparse. */
export function parseBreakWindow(breakTimeWindow: string | undefined): { startMin: number; endMin: number } | null {
  if (!breakTimeWindow) return null;
  const m = breakTimeWindow.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const s = (parseInt(m[1] ?? '0', 10) % 24) * 60 + (parseInt(m[2] ?? '0', 10) % 60);
  let e = (parseInt(m[3] ?? '0', 10) % 24) * 60 + (parseInt(m[4] ?? '0', 10) % 60);
  if (e <= s) e += 24 * 60;
  return { startMin: s, endMin: e };
}

/**
 * Sisipkan segmen istirahat terjadwal (planned downtime) pada posisi jam
 * yang sebenarnya di dalam window shift — bukan disebar rata seperti Active.
 * Segmen yang tertabrak dibelah; total durasi window tetap terjaga.
 * Tanpa ini, istirahat (breakTimeWindow/plannedBreakMin) tak pernah tampil
 * di grafik shift timeline karena timeline hanya dibangun dari downtimeReasons.
 */
export function injectPlannedBreak(
  segments: TimelineSegment[],
  machine: MachineConfig,
  windowMin: number,
  shiftStartStr: string,
): TimelineSegment[] {
  const breakWindow = parseBreakWindow(machine?.jobConfig?.breakTimeWindow);
  if (!breakWindow) return segments;
  const fromJob = machine?.jobConfig?.plannedBreakMin ?? 0;
  const breakDur =
    fromJob > 0 ? fromJob : Math.max(0, breakWindow.endMin - breakWindow.startMin);
  if (breakDur <= 0) return segments;

  const shiftStartMin = parseShiftHM(shiftStartStr, 22 * 60);
  let bStart = breakWindow.startMin - shiftStartMin;
  while (bStart < 0) bStart += 24 * 60;
  while (bStart >= 24 * 60) bStart -= 24 * 60;
  if (bStart >= windowMin) return segments;
  const bEnd = Math.min(bStart + breakDur, windowMin);
  if (bEnd <= bStart) return segments;

  const out: TimelineSegment[] = [];
  for (const seg of segments) {
    const s0 = seg.startOffsetMin;
    const s1 = seg.startOffsetMin + seg.durationMinutes;
    if (s1 <= bStart || s0 >= bEnd) {
      out.push(seg);
      continue;
    }
    if (s0 < bStart) {
      out.push({ ...seg, durationMinutes: bStart - s0 });
    }
    if (s1 > bEnd) {
      out.push({ ...seg, key: `${seg.key}-post`, startOffsetMin: bEnd, durationMinutes: s1 - bEnd });
    }
  }
  out.push({
    key: 'planned-break',
    kind: 'Planned',
    label: `Istirahat (${machine?.jobConfig?.breakTimeWindow})`,
    durationMinutes: bEnd - bStart,
    startOffsetMin: bStart,
    planned: true,
  });
  out.sort((a, b) => a.startOffsetMin - b.startOffsetMin);
  return out;
}

/** Sum durations per kind bucket for summary panels (minutes). */
export function summarizeTimeline(segments: TimelineSegment[]): Record<TimelineKind, number> {
  const out: Record<TimelineKind, number> = { Active: 0, Breakdown: 0, Changeover: 0, Waiting: 0, Planned: 0, Undefined: 0 };
  for (const s of segments) out[s.kind] += s.durationMinutes;
  return out;
}
