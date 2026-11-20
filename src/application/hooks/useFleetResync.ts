// /src/application/hooks/useFleetResync.ts
// FR-012 / ADR-0001: rekonsiliasi fleet via GET /live-state setelah WS
// (re)connect + poll jaring-pengaman frekuensi rendah (konstanta tunggal).
// Bukan pengganti WS hot-path; satu panggilan per pemicu.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useCallback, useEffect, useRef } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { ILiveStateRepository } from '../../domain/ports/IOeeBackend';
import { mergeSnapshotsIntoMachines, RESYNC_POLL_MS } from '../fleetResync';

export interface FleetResyncDeps {
  useBackend: boolean;
  liveStateRepository: ILiveStateRepository;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export interface FleetResyncApi {
  triggerResync: () => void;
}

export function useFleetResync(deps: FleetResyncDeps): FleetResyncApi {
  const { useBackend, liveStateRepository, setMachines } = deps;
  const aliveRef = useRef(true);

  const run = useCallback(async () => {
    try {
      const snapshots = await liveStateRepository.getAllSnapshots();
      if (aliveRef.current) setMachines((prev) => mergeSnapshotsIntoMachines(prev, snapshots));
    } catch {
      // Jaring pengaman: gagal resync tidak boleh merusak state live yang ada.
    }
  }, [liveStateRepository, setMachines]);

  const triggerResync = useCallback(() => {
    void run();
  }, [run]);

  useEffect(() => {
    aliveRef.current = true;
    if (!useBackend) return;
    const timer = setInterval(() => void run(), RESYNC_POLL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
    };
  }, [useBackend, run]);

  return { triggerResync };
}
