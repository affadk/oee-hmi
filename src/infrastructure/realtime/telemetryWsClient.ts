// /src/infrastructure/realtime/telemetryWsClient.ts
// WebSocket adapter for ws://…/ws/telemetry (§4 API_DOCUMENTATION.md).
// Owns socket lifecycle, ping/pong heartbeat, and frame mapping.
// Buffered backlog frames (is_buffered=true) are still delivered — the
// consumer decides to skip them for 60fps rendering (see isLiveTelemetryFrame).

import type { IRealtimeGateway, RealtimeListener } from '../../domain/ports/IOeeBackend';
import { isLiveTelemetryFrame } from '../../domain/entities/backend/Telemetry';
import { mapTelemetryFrameDto, mapWsHealthDto, mapWsLifecycleEventDto } from '../backend/dto/telemetry.dto';
import { env } from '../config/env';

const HEARTBEAT_MS = 25_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export class TelemetryWsClient implements IRealtimeGateway {
  private socket: WebSocket | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private manualClose = false;
  private listener: RealtimeListener = {};
  private url: string;

  constructor(url: string = env.wsTelemetryUrl) {
    this.url = url;
  }

  connect(listener: RealtimeListener): void {
    this.listener = listener;
    this.manualClose = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    this.openSocket();
  }

  private openSocket(): void {
    try {
      this.socket = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket.onmessage = (event: MessageEvent) => {
      if (event.data === 'pong') return;
      try {
        const raw = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (!raw || typeof raw !== 'object') return;
        // Relay WS memakai discriminator `type` (lihat payload TELEMETRY_UPDATE /
        // HEALTH_UPDATE nyata): route dulu berdasar type agar HEALTH_UPDATE tidak
        // salah masuk jalur telemetri sebagai counter 0.
        if (raw.type === 'TELEMETRY_UPDATE') {
          const frame = mapTelemetryFrameDto(raw);
          // Buffered backlog frames must not drive 60fps gauges.
          if (!isLiveTelemetryFrame(frame)) return;
          this.listener.onTelemetry?.(frame);
          return;
        }
        if (raw.type === 'HEALTH_UPDATE') {
          const update = mapWsHealthDto(raw);
          if (update) this.listener.onHealth?.(update.deviceId, update.health);
          return;
        }
        if (raw.type === 'ping') return;
        if ('device_id' in raw || 'deviceId' in raw || 'fsm_state' in raw) {
          // Kompatibel kontrak lama: frame telemetri flat tanpa envelope type.
          const frame = mapTelemetryFrameDto(raw);
          if (!isLiveTelemetryFrame(frame)) return;
          this.listener.onTelemetry?.(frame);
        } else if (typeof raw.type === 'string') {
          const lifecycleEvent = mapWsLifecycleEventDto(raw);
          if (lifecycleEvent) this.listener.onLifecycle?.(lifecycleEvent);
        }
      } catch {
        // Malformed frame — never crash the dashboard loop.
      }
    };
    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
    };
    this.socket.onclose = () => {
      this.clearHeartbeat();
      this.socket = null;
      if (!this.manualClose) this.scheduleReconnect();
    };
    this.socket.onerror = () => {
      try {
        this.socket?.close();
      } catch {
        // onclose handler drives reconnect
      }
    };
    this.clearHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) this.socket.send('ping');
    }, HEARTBEAT_MS);
  }

  private scheduleReconnect(): void {
    if (this.manualClose || this.reconnectTimer) return;
    const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** Math.min(this.reconnectAttempts, 5));
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manualClose) this.openSocket();
    }, delay);
  }

  private clearHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.clearHeartbeat();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onopen = null;
      try {
        socket.close();
      } catch {
        // ignore close errors
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
