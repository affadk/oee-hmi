// /src/application/use-cases/SubscribeTelemetryUseCase.ts
// Thin orchestration over the IRealtimeGateway port (WS relay, §4).
// Buffered backlog frames are dropped at the gateway (see isLiveTelemetryFrame);
// consumers must still guard defensively before driving 60fps UI.

import type { IRealtimeGateway, RealtimeListener } from '../../domain/ports/IOeeBackend';

export class SubscribeTelemetryUseCase {
  constructor(private readonly realtime: IRealtimeGateway) {}

  subscribe(listener: RealtimeListener): () => void {
    this.realtime.connect(listener);
    return () => this.realtime.disconnect();
  }
}
