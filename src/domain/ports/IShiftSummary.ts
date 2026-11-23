// /src/domain/ports/IShiftSummary.ts
// Ports for Fase 2 aggregate endpoints (spec §3.1/§3.2, ADITIF).
// Backend may not implement them yet: repositories return null on HTTP 404
// (endpoint absence) and throw otherwise — callers fall back to §2 composition.

export interface ShiftSummaryQuery {
  machineId?: string;
  deviceId?: string;
  from?: string;
  to?: string;
  date?: string;
  shift?: string;
}

export interface ShiftSummaryOee {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface ShiftSummaryTimeSec {
  planned: number;
  run: number;
  downtime: number;
  plannedDt: number;
  unplannedDt: number;
}

export interface ShiftSummary {
  machineId: string;
  deviceId: string;
  woId: string | null;
  plannedBreakMin: number;
  plannedOperatingSec: number;
  oee: ShiftSummaryOee;
  timeSec: ShiftSummaryTimeSec;
}

export interface ShiftTimelineQuery {
  machineId?: string;
  deviceId?: string;
  from: string;
  to: string;
  bucket?: '1m' | '5m' | '15m' | '1h';
}

export interface ShiftTimelineSegment {
  from: string;
  to: string;
  state: string;
  oee: number | null;
  downtimeId: number | null;
  category: string | null;
  reason: string | null;
  planned: boolean;
}

export interface IShiftSummaryRepository {
  /** Null when the endpoint does not exist (404); throws on other failures. */
  getShiftSummary(query: ShiftSummaryQuery, signal?: AbortSignal): Promise<ShiftSummary | null>;
}

export interface IShiftTimelineRepository {
  /** Null when the endpoint does not exist (404); throws on other failures. */
  getShiftTimeline(query: ShiftTimelineQuery, signal?: AbortSignal): Promise<ShiftTimelineSegment[] | null>;
}
