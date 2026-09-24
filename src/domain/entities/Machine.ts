// /src/domain/entities/Machine.ts

import { MqttTelemetryPayload, MqttHealthPayload } from './MqttContracts';

export type MachineStatus = 'RUNNING' | 'IDLE' | 'DOWN' | 'SETUP' | 'PLANNED_STOP';

export interface DowntimeReasonItem {
  id: string;
  label: string;
  category: string;
  durationMinutes: number;
  equivalentLossPcs?: number;
  type?: 'PLANNED' | 'UNPLANNED';
}

export interface RejectReasonItem {
  id: string;
  label: string;
  count: number;
  percentage?: number;
}

export interface HourlyDataPoint {
  hour: string;
  target: number;
  actual: number;
  good: number;
  reject: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  status: MachineStatus;
  isBuffered?: boolean;
}

export interface MachineConfig {
  id: string; // e.g. 'STM32-OEE-01' or 'MC-01'
  name: string; // Machine device description
  deviceId: string; // STM32 MQTT wire topic device ID e.g. 'STM32-OEE-01'
  connectionStatus: 'ONLINE' | 'OFFLINE';
  lastTelemetryTs: number; // Unix epoch seconds

  // Active Job Configuration (SET_JOB_CONFIG)
  jobConfig: {
    workOrder: string;
    productName: string;
    productId: string;
    operatorName: string;
    operatorId: string;
    standardCycleTimeSec: number;
    targetQuantity: number;
    shiftStart: string; // e.g. "06:00"
    shiftEnd: string;   // e.g. "14:00"
    breakTimeWindow?: string; // e.g. "12:00 - 13:00"
    plannedBreakMin: number; // e.g. 60
    plannedOperatingSec: number; // e.g. 25200 (420 min)
  };

  // Live MQTT Telemetry State (Direct payload fields)
  telemetry: MqttTelemetryPayload;

  // Edge Health Telemetry (From oee/device/{id}/health)
  health: MqttHealthPayload;

  // Time-series trend buffer
  hourlyTrends: HourlyDataPoint[];

  // Targets & Metadata
  targetOee: number;
  targetAvailability: number;
  targetPerformance: number;
  targetQuality: number;
  plant?: string;
  line?: string;
  area?: string;
  statusSince?: string;
  productDescription?: string;
  actualHourlyRate?: number;

  // Reasons breakdown
  downtimeReasons?: DowntimeReasonItem[];
  rejectReasons?: RejectReasonItem[];

  // Compatibility getters / properties
  status: MachineStatus;
  currentProduct: string;
  idealCycleTimeSec: number;
  actualCycleTimeSec: number;
  shiftDurationMinutes: number;
  plannedDowntimeMinutes: number;
  unplannedDowntimeMinutes: number;
  targetCount: number;
  totalCount: number;
  goodCount: number;
  rejectCount: number;
}


