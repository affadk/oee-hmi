// /src/application/hooks/useTelemetrySubscription.ts
// Focused hook: WebSocket real-time updates (backend mode only).
// Merges live telemetry frames (counters + OEE + FSM status, FR-009) into the
// matching machine, DEVICE_STATUS_UPDATE → connectionStatus (FR-010), and
// lifecycle envelopes → debounced REST refetch (FR-011, ADR-0001).
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useEffect } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';
import { isLiveTelemetryFrame } from '../../domain/entities/backend/Telemetry';
import { fsmToMachineStatus } from '../../domain/entities/backend/LiveState';
import { refetchKindsForEvent, type RefetchKind } from '../lifecycleRefetch';
import type { SubscribeTelemetryUseCase } from '../use-cases/SubscribeTelemetryUseCase';

export interface TelemetrySubscriptionDeps {
  useBackend: boolean;
  subscribeTelemetryUseCase: SubscribeTelemetryUseCase;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
  setAlarms: React.Dispatch<React.SetStateAction<MachineAlarmEvent[]>>;
  /** FR-011: scheduler debounced refetch (fleet/registry/supplemental). */
  onRefetch?: (kinds: RefetchKind[]) => void;
  /** FR-012: resync snapshot setelah WS reconnect. */
  onReconnect?: () => void;
  /** FR-013: close 4403 — berhenti + error konfigurasi eksplisit. */
  onFatal?: (reason: 'FORBIDDEN_ORIGIN') => void;
}

const ALARM_EVENT_TYPES = new Set([
  'DOWNTIME_EVENT_OPENED',
  'DOWNTIME_EVENT_CLOSED',
  'WORK_ORDER_COMPLETED',
  'WORK_ORDER_CANCELLED',
  'DEVICE_EVENT',
]);

export function useTelemetrySubscription(deps: TelemetrySubscriptionDeps): void {
  const { useBackend, subscribeTelemetryUseCase, setMachines, setAlarms, onRefetch, onReconnect, onFatal } = deps;

  // WebSocket real-time updates — backend mode only
  useEffect(() => {
    if (!useBackend) return;
    let isMounted = true;

    const unsubscribe = subscribeTelemetryUseCase.subscribe({
      onTelemetry: (frame) => {
        if (!isMounted) return;
        // Buffered backlog must not drive 60fps gauges (defense-in-depth: gateway already drops these).
        if (!isLiveTelemetryFrame(frame)) return;
        // Update the matching machine in state with live telemetry + FSM status (FR-009).
        setMachines((prev) =>
          prev.map((m) => {
            if (m.deviceId !== frame.deviceId && m.id !== frame.machineId) return m;
            const status = fsmToMachineStatus(frame.fsmState);
            return {
              ...m,
              totalCount: frame.counters.total,
              goodCount: frame.counters.good,
              rejectCount: frame.counters.reject,
              actualCycleTimeSec: frame.counters.lastCycleSec,
              status,
              statusSince: status !== m.status ? new Date(frame.timestamp * 1000).toISOString() : m.statusSince,
              telemetry: {
                ...m.telemetry,
                ts: frame.timestamp,
                tot: frame.counters.total,
                rej: frame.counters.reject,
                cyc: Math.round(frame.counters.lastCycleSec * 100),
                run: frame.timeMetricsSec.runTime,
                dt: frame.timeMetricsSec.downtime,
                oee: Math.round(frame.oee.totalOee * 100),
                a: Math.round(frame.oee.availability * 100),
                p: Math.round(frame.oee.performance * 100),
                q: Math.round(frame.oee.quality * 100),
                alm: frame.plcModbus.alarmCode,
                rpm: frame.plcModbus.spindleRpm,
                tmp: Math.round(frame.plcModbus.tempC * 10),
                is_buffered: frame.isBuffered,
              },
              health: {
                ...m.health,
                timestamp: frame.timestamp,
                uptimeSec: frame.hwDiag.uptimeSec,
                heap_free: frame.hwDiag.freeHeap,
              },
              lastTelemetryTs: frame.timestamp,
            };
          })
        );
      },
      onHealth: (deviceId, health) => {
        if (!isMounted) return;
        // Relay HEALTH_UPDATE langsung dari edge (tanpa cache REST G3):
        // badge Edge hidup walau cache backend miss.
        setMachines((prev) =>
          prev.map((m) => (m.deviceId === deviceId ? { ...m, health } : m))
        );
      },
      onLifecycle: (event) => {
        if (!isMounted) return;
        // FR-010: presence live tanpa reload.
        if (event.type === 'DEVICE_STATUS_UPDATE') {
          setMachines((prev) =>
            prev.map((m) =>
              m.deviceId === event.deviceId
                ? { ...m, connectionStatus: event.isOnline ? 'ONLINE' : 'OFFLINE' }
                : m
            )
          );
          return;
        }
        // FR-011: payload tipis → refetch REST sumber kebenaran (debounced).
        const kinds = refetchKindsForEvent(event.type);
        if (kinds.length > 0) onRefetch?.(kinds);
        // Alarm feed hanya event operasional bermakna (bukan mutasi master).
        if (!ALARM_EVENT_TYPES.has(event.type)) return;
        const machineId = 'machineId' in event ? (event.machineId ?? 'unknown') : 'unknown';
        const alarmEntry: MachineAlarmEvent = {
          id: `alm-${Date.now()}-${event.type}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'Warning',
          machineId,
          durationMinutes: 1,
          status: 'In Progress',
          description: `${event.type}`,
          operator: 'System',
        };
        setAlarms((prev) => [alarmEntry, ...prev]);
      },
      onReconnect: () => {
        if (isMounted) onReconnect?.();
      },
      onFatal: (reason) => {
        if (isMounted) onFatal?.(reason);
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [useBackend, subscribeTelemetryUseCase, setMachines, setAlarms, onRefetch, onReconnect, onFatal]);
}
