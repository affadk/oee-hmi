// /src/application/hooks/useSimulationTicker.ts
// Focused hook: simulation-lane pulse ticker (3.5s interval while RUNNING).
// Owns no state — writes via setMachines. Inactive in backend mode.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useEffect } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { SimulateMachinePulseUseCase } from '../simulation/use-cases/SimulateMachinePulseUseCase';

export interface SimulationTickerDeps {
  isSimulating: boolean;
  currentMachine: MachineConfig | null;
  useBackend: boolean;
  simulateMachinePulseUseCase: SimulateMachinePulseUseCase;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export function useSimulationTicker(deps: SimulationTickerDeps): void {
  const { isSimulating, currentMachine, useBackend, simulateMachinePulseUseCase, setMachines } = deps;

  // Simulation ticker — only active in simulation mode
  useEffect(() => {
    if (!isSimulating || !currentMachine || useBackend) return;
    const interval = setInterval(async () => {
      if (currentMachine.status !== 'RUNNING') return;
      const updated = await simulateMachinePulseUseCase.execute(currentMachine);
      if (updated) {
        setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isSimulating, currentMachine, simulateMachinePulseUseCase, useBackend, setMachines]);
}
