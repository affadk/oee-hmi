// /src/infrastructure/adapters/NoOpMqttGateway.ts
// No-op MQTT gateway used when VITE_USE_BACKEND=true.
// In backend mode the real edge controller is managed by the backend
// via HTTP/WebSocket, so the frontend does not simulate MQTT.

import { IMqttGateway } from '../../../domain/ports/IMqttGateway';
import { MqttTelemetryPayload, MqttJobConfigPayload, MqttHealthPayload } from '../../../domain/entities/MqttContracts';

export class NoOpMqttGateway implements IMqttGateway {
  async sendCommand(_machineId: string, _command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME'): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'MQTT simulation disabled — backend mode does not support direct MQTT commands from the frontend.' };
  }

  async sendJobConfig(_payload: MqttJobConfigPayload): Promise<{ success: boolean; transactionId: string }> {
    return { success: false, transactionId: '' };
  }

  async getEdgeHealth(_machineId: string): Promise<MqttHealthPayload> {
    return {
      tasks_healthy: 0,
      tasks_total: 0,
      heap_free: 0,
      stale_count: 0,
      timestamp: 0,
      event_flags: 0,
      stale_tasks: [],
    };
  }

  async getLatestTelemetry(_machineId: string): Promise<MqttTelemetryPayload | null> {
    return null;
  }
}
