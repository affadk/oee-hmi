// /src/application/hooks/useWorkOrderAckWait.ts
// Unit 003 (FR-005/006, NFR-002, ADR-0005): tunggu ACK edge pasca initiate/dispatch.
// Poll bounded detail WO: interval 2s, cap 20s (> watchdog backend 15s),
// berhenti saat ACTIVE / ABORTED / timeout. BUKAN fetch-loop permanen —
// maksimal ±10 read per initiate, cleanup saat unmount/run baru.
// LAYER RULES: domain types + use-case + React only — no infrastructure, no DOM.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AckWaitState, AckWaitStatus } from '../../domain/entities/backend/WorkOrder';
import type { ListWorkOrdersUseCase } from '../use-cases/ListWorkOrdersUseCase';

export const ACK_POLL_INTERVAL_MS = 2_000;
export const ACK_WAIT_CAP_MS = 20_000;

export interface AckPollDeps {
  /** Status WO terbaru dari backend (poll). */
  readStatus: () => Promise<string>;
  /** True bila run sudah digantikan/di-unmount — hentikan poll tanpa set state. */
  isCancelled: () => boolean;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

/**
 * Poll bounded ACK — pure async, tanpa React. Return null = dibatalkan
 * (jangan set state). Test memakai sleep/now yang disuntik.
 */
export async function pollWorkOrderAck(deps: AckPollDeps): Promise<AckWaitStatus | null> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = deps.now ?? (() => Date.now());
  const deadline = now() + ACK_WAIT_CAP_MS;
  while (now() < deadline) {
    await sleep(ACK_POLL_INTERVAL_MS);
    if (deps.isCancelled()) return null;
    try {
      const status = await deps.readStatus();
      if (deps.isCancelled()) return null;
      if (status === 'ACTIVE') return 'ACTIVE';
      if (status === 'ABORTED') return 'ABORTED';
    } catch {
      // Read transient gagal — lanjut poll sampai cap (timeout jujur).
    }
  }
  return deps.isCancelled() ? null : 'TIMEOUT';
}

export interface AckWaitApi {
  ackWait: AckWaitState | null;
  /** Mulai tunggu ACK untuk woId (menggantikan wait sebelumnya). Fire-and-forget. */
  waitForAck: (woId: string) => Promise<void>;
  clearAckWait: () => void;
}

export function useWorkOrderAckWait(listWorkOrdersUseCase: ListWorkOrdersUseCase): AckWaitApi {
  const [ackWait, setAckWait] = useState<AckWaitState | null>(null);
  const runRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runRef.current += 1; // batalkan wait yang sedang berjalan
    };
  }, []);

  const waitForAck = useCallback(
    async (woId: string) => {
      const run = ++runRef.current;
      const isCancelled = () => !mountedRef.current || runRef.current !== run;
      setAckWait({ woId, status: 'WAITING' });
      const status = await pollWorkOrderAck({
        readStatus: async () => (await listWorkOrdersUseCase.detail(woId)).status,
        isCancelled,
      });
      if (status) setAckWait({ woId, status });
    },
    [listWorkOrdersUseCase],
  );

  const clearAckWait = useCallback(() => {
    runRef.current += 1;
    setAckWait(null);
  }, []);

  return { ackWait, waitForAck, clearAckWait };
}
