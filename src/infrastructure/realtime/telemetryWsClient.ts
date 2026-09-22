// /src/infrastructure/realtime/telemetryWsClient.ts
// WebSocket adapter for ws://…/ws/telemetry (§4 API_DOCUMENTATION.md).
// Owns socket lifecycle, ping/pong heartbeat, and frame mapping.
// Buffered backlog frames (is_buffered=true) are still delivered — the
// consumer decides to skip them for 60fps rendering (see isLiveTelemetryFrame).

import type { IRealtimeGateway, RealtimeListener } from '../../domain/ports/IOeeBackend';
import { mapTelemetryFrameDto, mapWsLifecycleEventDto } from '../../application/dto/telemetry.dto';
import { env } from '../config/env';

const HEARTBEAT_MS = 25_000;

export class TelemetryWsClient implements IRealtimeGateway {
  private socket: WebSocket | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private listener: RealtimeListener = {};
  private url: string;

  constructor(url: string = env.wsTelemetryUrl) {
    this.url = url;
  }

  connect(listener: RealtimeListener): void {
    this.listener = listener;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    this.socket = new WebSocket(this.url);
    this.socket.onmessage = (event: MessageEvent) => {
      if (event.data === 'pong') return;
      try {
        const raw = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (raw && typeof raw === 'object' && ('device_id' in raw || 'deviceId' in raw || 'fsm_state' in raw)) {
          this.listener.onTelemetry?.(mapTelemetryFrameDto(raw));
        } else if (raw && typeof raw.type === 'string') {
          const lifecycleEvent = mapWsLifecycleEventDto(raw);
          if (lifecycleEvent) this.listener.onLifecycle?.(lifecycleEvent);
        }
      } catch {
        // Malformed frame — never crash the dashboard loop.
      }
    };
    this.heartbeat = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) this.socket.send('ping');
    }, HEARTBEAT_MS);
  }

  disconnect(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    try {
      this.socket?.close();
    } catch {
      // ignore close errors
    }
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
