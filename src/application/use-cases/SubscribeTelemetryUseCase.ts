// /src/application/use-cases/SubscribeTelemetryUseCase.ts
// Thin orchestration over the IRealtimeGateway port (WS relay, §4).
// buffered frames are forwarded — presentation filters via isLiveTelemetryFrame.

import type { IRealtimeGateway, RealtimeListener } from '../../domain/ports/IOeeBackend';

export class SubscribeTelemetryUseCase {
  constructor(private readonly realtime: IRealtimeGateway) {}

  subscribe(listener: RealtimeListener): () => void {
    this.realtime.connect(listener);
    return () => this.realtime.disconnect();
  }
}
