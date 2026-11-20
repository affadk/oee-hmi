// /src/application/lifecycleRefetch.ts
// Debounced refetch scheduler untuk envelope WS lifecycle (ADR-0001/FR-011):
// payload tipis → baca ulang REST sumber kebenaran, bukan fabrikasi state.
// Dedupe per jenis state; ≤ 2s debounce; timer injectable untuk test.
// LAYER RULES: pure factory — no IO, no DOM, no infrastructure imports.

export type RefetchKind = 'fleet' | 'registry' | 'supplemental';

export interface RefetchTimers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

const DEFAULT_DEBOUNCE_MS = 1_500;

export function createRefetchScheduler(
  run: (kind: RefetchKind) => void,
  timers: RefetchTimers = { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): { schedule: (kinds: RefetchKind[]) => void; dispose: () => void } {
  const pending = new Map<RefetchKind, unknown>();
  return {
    schedule(kinds) {
      for (const kind of kinds) {
        if (pending.has(kind)) continue; // dedupe: satu refetch per jendela
        pending.set(kind, timers.setTimeout(() => {
          pending.delete(kind);
          run(kind);
        }, debounceMs));
      }
    },
    dispose() {
      for (const handle of pending.values()) timers.clearTimeout(handle);
      pending.clear();
    },
  };
}

/** Klasifikasi event lifecycle → jenis state yang perlu dibaca ulang. */
export function refetchKindsForEvent(type: string): RefetchKind[] {
  switch (type) {
    case 'DOWNTIME_EVENT_OPENED':
    case 'DOWNTIME_EVENT_CLOSED':
    case 'DOWNTIME_REASON_LABELED':
      return ['supplemental'];
    case 'WORK_ORDER_COMPLETED':
    case 'WORK_ORDER_CANCELLED':
      return ['fleet', 'supplemental'];
    case 'MACHINE_CREATED':
    case 'MACHINE_UPDATED':
    case 'MACHINE_DELETED':
    case 'MACHINE_BOUND':
    case 'MACHINE_UNBOUND':
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
    case 'PRODUCT_DELETED':
    case 'PRODUCTION_LINE_CREATED':
    case 'PRODUCTION_LINE_UPDATED':
    case 'PRODUCTION_LINE_DELETED':
    case 'SHIFT_CREATED':
    case 'SHIFT_UPDATED':
    case 'SHIFT_DELETED':
    case 'SHIFT_SCHEDULE_CREATED':
    case 'SHIFT_SCHEDULE_UPDATED':
    case 'SHIFT_SCHEDULE_DELETED':
      return ['fleet', 'registry'];
    default:
      return []; // DEVICE_STATUS_UPDATE/DEVICE_EVENT ditangani langsung di hook
  }
}
