// /src/domain/ports/IMqttGateway.ts

import { MqttTelemetryPayload, MqttJobConfigPayload, MqttHealthPayload } from '../entities/MqttContracts';

export type MqttEdgeCommand = 'RESET_COUNTER' | 'PAUSE' | 'RESUME';

export interface IMqttGateway {
  /**
   * Dispatches a PLC command to the Edge controller (e.g. STM32H723).
   */
  sendCommand(machineId: string, command: MqttEdgeCommand): Promise<{ success: boolean; message: string }>;

  /**
   * Transmits a work order job configuration payload to the machine edge client.
   */
  sendJobConfig(payload: MqttJobConfigPayload): Promise<{ success: boolean; transactionId: string }>;

  /**
   * Fetches latest edge health heartbeat.
   */
  getEdgeHealth(machineId: string): Promise<MqttHealthPayload>;

  /**
   * Gets current telemetry wire frame.
   */
  getLatestTelemetry(machineId: string): Promise<MqttTelemetryPayload | null>;
}
