import type { BackendHealth, IHealthRepository } from '../../domain/ports/IOeeBackend';

export class GetHealthUseCase {
  constructor(private readonly health: IHealthRepository) {}

  execute(signal?: AbortSignal): Promise<BackendHealth | null> {
    return this.health.getHealth(signal);
  }
}
