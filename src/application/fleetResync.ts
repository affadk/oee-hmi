// /src/application/fleetResync.ts
// Pure merge snapshot live-state → MachineConfig[] (ADR-0001/FR-012).
// Resync setelah WS (re)connect + poll jaring-pengaman; bukan pengganti WS.
// LAYER RULES: pure — no IO, no DOM, no infrastructure imports.

import type { MachineConfig } from '../domain/entities/Machine';
import type { LiveStateSnapshot } from '../domain/entities/backend/LiveState';
import { fsmToMachineStatus } from '../domain/entities/backend/LiveState';

export const RESYNC_POLL_MS = 60_000; // FR-012: konstanta tunggal jaring-pengaman

export function mergeSnapshotsIntoMachines(
  machines: MachineConfig[],
  snapshots: LiveStateSnapshot[],
): MachineConfig[] {
  if (snapshots.length === 0) return machines;
  const byDevice = new Map(snapshots.map((s) => [s.deviceId, s]));
  return machines.map((m) => {
    const s = byDevice.get(m.deviceId);
    if (!s) return m;
    const status = fsmToMachineStatus(s.currentState);
    const ts = Math.floor(new Date(s.lastTelemetryAt).getTime() / 1000);
    return {
      ...m,
      totalCount: s.totalCount,
      goodCount: s.goodCount,
      rejectCount: s.rejectCount,
      actualCycleTimeSec: s.lastCycleTimeSec ?? m.actualCycleTimeSec,
      status,
      statusSince: status !== m.status ? s.updatedAt : m.statusSince,
      lastTelemetryTs: Number.isFinite(ts) ? ts : m.lastTelemetryTs,
      telemetry: {
        ...m.telemetry,
        ts: Number.isFinite(ts) ? ts : m.telemetry.ts,
        tot: s.totalCount,
        rej: s.rejectCount,
        run: s.runTimeSec,
        dt: s.downtimeSec,
        oee: Math.round(s.oee * 100),
        a: Math.round(s.availability * 100),
        p: Math.round(s.performance * 100),
        q: Math.round(s.quality * 100),
      },
    };
  });
}
