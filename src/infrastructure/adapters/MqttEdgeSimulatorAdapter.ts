// /src/infrastructure/adapters/MqttEdgeSimulatorAdapter.ts

import { IMqttGateway, MqttEdgeCommand } from '../../domain/ports/IMqttGateway';
import { MqttTelemetryPayload, MqttJobConfigPayload, MqttHealthPayload } from '../../domain/entities/MqttContracts';

export class MqttEdgeSimulatorAdapter implements IMqttGateway {
  public async sendCommand(machineId: string, command: MqttEdgeCommand): Promise<{ success: boolean; message: string }> {
    // Simulates STM32H723 command processing over MQTT topic `machines/${machineId}/cmd`
    return {
      success: true,
      message: `Command [${command}] dispatched to MQTT topic factory/lines/stamping/${machineId}/cmd`,
    };
  }

  public async sendJobConfig(payload: MqttJobConfigPayload): Promise<{ success: boolean; transactionId: string }> {
    return {
      success: true,
      transactionId: payload.transaction_id,
    };
  }

  public async getEdgeHealth(machineId: string): Promise<MqttHealthPayload> {
    return {
      timestamp: Date.now(),
      heap_free: 184320,
      tasks_healthy: 6,
      tasks_total: 6,
      stale_tasks: [],
      stale_count: 0,
      event_flags: 0x0001,
    };
  }

  public async getLatestTelemetry(machineId: string): Promise<MqttTelemetryPayload | null> {
    return {
      ts: Math.floor(Date.now() / 1000),
      st: 2, // RUNNING
      tot: 945,
      rej: 41,
      cyc: 1080,
      run: 22680,
      dt: 2520,
      oee: 8240,
      a: 9120,
      p: 9450,
      q: 9560,
      alm: 0,
      rpm: 1450,
      tmp: 423,
      di: 0x03,
      is_buffered: false,
    };
  }
}
