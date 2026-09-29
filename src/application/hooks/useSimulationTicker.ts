// /src/application/hooks/useSimulationTicker.ts
// Focused hook: simulation-lane pulse ticker (3.5s interval while RUNNING).
// Owns no state — writes via setMachines. Inactive in backend mode.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useEffect, useRef } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { SimulateMachinePulseUseCase } from '../simulation/use-cases/SimulateMachinePulseUseCase';

export interface SimulationTickerDeps {
  isSimulating: boolean;
  currentMachine: MachineConfig | null;
  useBackend: boolean;
  machineRepository: import('../../domain/ports/IMachineRepository').IMachineRepository;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export function useSimulationTicker(deps: SimulationTickerDeps): void {
  const { isSimulating, currentMachine, useBackend, machineRepository, setMachines } = deps;
  const useCaseRef = useRef<SimulateMachinePulseUseCase | null>(null);

  // Simulation ticker — only active in simulation mode
  useEffect(() => {
    if (!isSimulating || !currentMachine || useBackend) return;

    // Lazy-load simulation use case on first run (code-split)
    const initUseCase = async (): Promise<SimulateMachinePulseUseCase> => {
      if (useCaseRef.current) return useCaseRef.current;
      const { SimulateMachinePulseUseCase } = await import('../simulation/use-cases/SimulateMachinePulseUseCase');
      useCaseRef.current = new SimulateMachinePulseUseCase(machineRepository);
      return useCaseRef.current;
    };

    const interval = setInterval(async () => {
      if (currentMachine.status !== 'RUNNING') return;
      const useCase = await initUseCase();
      const updated = await useCase.execute(currentMachine);
      if (updated) {
        setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isSimulating, currentMachine, useBackend, machineRepository, setMachines]);
}
