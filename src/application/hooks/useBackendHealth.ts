import { useEffect, useState } from 'react';
import type { BackendHealth } from '../../domain/ports/IOeeBackend';
import type { GetHealthUseCase } from '../use-cases/GetHealthUseCase';

export interface BackendHealthDeps {
  useBackend: boolean;
  getHealthUseCase: GetHealthUseCase;
}

export interface BackendHealthApi {
  health: BackendHealth | null;
}

export function useBackendHealth(deps: BackendHealthDeps): BackendHealthApi {
  const { useBackend, getHealthUseCase } = deps;
  const [health, setHealth] = useState<BackendHealth | null>(null);

  useEffect(() => {
    if (!useBackend) return;
    let isMounted = true;
    const controller = new AbortController();
    async function load() {
      try {
        const result = await getHealthUseCase.execute(controller.signal);
        if (isMounted) setHealth(result);
      } catch {
        if (isMounted) setHealth(null);
      }
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [useBackend, getHealthUseCase]);

  return { health };
}
