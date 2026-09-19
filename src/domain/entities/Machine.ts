// /src/domain/entities/Machine.ts

export type MachineStatus = 'RUNNING' | 'IDLE' | 'DOWN' | 'SETUP' | 'PLANNED_STOP';

export interface DowntimeReasonItem {
  id: string;
  category: 'Breakdown' | 'Material' | 'Changeover' | 'Adjustment' | 'Other';
  label: string;
  durationMinutes: number;
  equivalentLossPcs: number;
  occurrences: number;
}

export interface RejectReasonItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
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
}

export interface MachineConfig {
  id: string;
  name: string;
  line: string;
  plant: string;
  area: string;
  status: MachineStatus;
  statusSince: string;
  currentProduct: string;
  productDescription: string;
  idealCycleTimeSec: number; // e.g. 10.0 sec/pcs
  actualCycleTimeSec: number; // e.g. 10.8 sec/pcs
  targetHourlyRate: number; // e.g. 360 pcs/h
  actualHourlyRate: number; // e.g. 333 pcs/h

  // Time inputs (in minutes)
  shiftDurationMinutes: number; // e.g. 480 min (8h)
  plannedDowntimeMinutes: number; // e.g. 60 min (breaks/cleaning)
  unplannedDowntimeMinutes: number; // e.g. 42 min

  // Output Counts (in pieces)
  targetCount: number; // e.g. 1000
  totalCount: number; // e.g. 945
  goodCount: number; // e.g. 904
  rejectCount: number; // e.g. 41

  // Targets for KPIs (%)
  targetOee: number; // e.g. 85.0%
  targetAvailability: number; // e.g. 90.0%
  targetPerformance: number; // e.g. 95.0%
  targetQuality: number; // e.g. 99.0%

  // Breakdown details
  downtimeReasons: DowntimeReasonItem[];
  rejectReasons: RejectReasonItem[];
  hourlyTrends: HourlyDataPoint[];
}
