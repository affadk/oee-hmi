// Unit 001 Fase 2 (T009/T010/T015): WS close-code policy (FR-013),
// reconnect resync signal (FR-012), mapper lifecycle lengkap (FR-011).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TelemetryWsClient } from '../src/infrastructure/realtime/telemetryWsClient';
import { mapWsLifecycleEventDto } from '../src/infrastructure/backend/dto/telemetry.dto';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  readyState = 1;
  closeCode = 1000;
  onopen: (() => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) { FakeWebSocket.instances.push(this); }
  send(): void {}
  close(): void { this.readyState = 3; this.onclose?.({ code: this.closeCode }); }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  FakeWebSocket.instances = [];
});

function connectClient(listener: Parameters<TelemetryWsClient['connect']>[0]) {
  vi.stubGlobal('WebSocket', FakeWebSocket);
  const client = new TelemetryWsClient('ws://test/ws/telemetry');
  client.connect(listener);
  const sock = FakeWebSocket.instances[0];
  if (!sock) throw new Error('no socket');
  return { client, sock };
}

describe('TelemetryWsClient — close code policy (FR-013)', () => {
  it('4403 Forbidden Origin: berhenti reconnect + onFatal', () => {
    vi.useFakeTimers();
    const onFatal = vi.fn();
    const { client, sock } = connectClient({ onFatal });
    sock.onopen?.();
    sock.onclose?.({ code: 4403 });
    vi.advanceTimersByTime(180_000);
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(onFatal).toHaveBeenCalledWith('FORBIDDEN_ORIGIN');
    client.disconnect();
  });

  it('4429 rate limit: reconnect berikutnya ≥ 60s', () => {
    vi.useFakeTimers();
    const { client, sock } = connectClient({});
    sock.onopen?.();
    sock.onclose?.({ code: 4429 });
    vi.advanceTimersByTime(59_000);
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(10_000);
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(2);
    client.disconnect();
  });

  it('close normal: backoff cepat (~1s) lalu reconnect', () => {
    vi.useFakeTimers();
    const { client, sock } = connectClient({});
    sock.onopen?.();
    sock.onclose?.({ code: 1006 });
    vi.advanceTimersByTime(1_100);
    expect(FakeWebSocket.instances).toHaveLength(2);
    client.disconnect();
  });

  it('onReconnect hanya untuk reconnect (bukan boot pertama)', () => {
    vi.useFakeTimers();
    const onReconnect = vi.fn();
    const { client, sock } = connectClient({ onReconnect });
    sock.onopen?.();
    expect(onReconnect).not.toHaveBeenCalled();
    sock.onclose?.({ code: 1006 });
    vi.advanceTimersByTime(1_100);
    FakeWebSocket.instances[1]?.onopen?.();
    expect(onReconnect).toHaveBeenCalledTimes(1);
    client.disconnect();
  });
});

describe('mapWsLifecycleEventDto — 26 tipe defensif (FR-011)', () => {
  it('DEVICE_STATUS_UPDATE snake_case is_online', () => {
    expect(mapWsLifecycleEventDto({ type: 'DEVICE_STATUS_UPDATE', device_id: 'STM32-OEE-01', is_online: true }))
      .toEqual({ type: 'DEVICE_STATUS_UPDATE', deviceId: 'STM32-OEE-01', isOnline: true });
  });

  it('DOWNTIME_EVENT_OPENED camelCase eventId + machineId null fallback', () => {
    expect(mapWsLifecycleEventDto({ type: 'DOWNTIME_EVENT_OPENED', eventId: 42, deviceId: 'D1' }))
      .toEqual({ type: 'DOWNTIME_EVENT_OPENED', eventId: 42, deviceId: 'D1', machineId: null });
  });

  it('WORK_ORDER_COMPLETED snake_case data.wo_id', () => {
    expect(mapWsLifecycleEventDto({
      type: 'WORK_ORDER_COMPLETED', device_id: 'D1', machine_id: 'M1',
      data: { wo_id: 'WO-9', status: 'COMPLETED' },
    })).toEqual({ type: 'WORK_ORDER_COMPLETED', deviceId: 'D1', machineId: 'M1', woId: 'WO-9', status: 'COMPLETED' });
  });

  it('SHIFT_SCHEDULE_CREATED day_of_week + MACHINE_CREATED deviceId null', () => {
    expect(mapWsLifecycleEventDto({ type: 'SHIFT_SCHEDULE_CREATED', line_id: 'LINE-01', shift_id: 'PAGI', day_of_week: 1 }))
      .toEqual({ type: 'SHIFT_SCHEDULE_CREATED', lineId: 'LINE-01', shiftId: 'PAGI', dayOfWeek: 1 });
    expect(mapWsLifecycleEventDto({ type: 'MACHINE_CREATED', machine_id: 'M1' }))
      .toEqual({ type: 'MACHINE_CREATED', machineId: 'M1', deviceId: null });
  });

  it('type tak dikenal → null (ignore-unknown by design)', () => {
    expect(mapWsLifecycleEventDto({ type: 'FUTURE_ADVISORY' })).toBeNull();
    expect(mapWsLifecycleEventDto({})).toBeNull();
  });
});
