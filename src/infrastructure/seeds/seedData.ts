// /src/infrastructure/seeds/seedData.ts
// Canonical seed fixtures (moved from src/data/mockData.ts).
// Owned by infrastructure: only repositories/adapters may import this.
// Application/presentation must go through IMachineRepository/IAlarmRepository.

import type { MachineConfig } from '../../domain/entities/Machine';
import type { MachineAlarmEvent } from '../../domain/entities/Alarm';

export const INITIAL_MACHINES: MachineConfig[] = [
  {
    id: 'MC-SODIUM',
    deviceId: 'SODIUM-CP400',
    name: 'Mesin Blister (CP400)',
    connectionStatus: 'ONLINE',
    lastTelemetryTs: 1790065537, // 21 Sep 2026 01:25:37
    status: 'RUNNING',
    currentProduct: 'Sodium Tablets 500mg',
    idealCycleTimeSec: 9.0,
    actualCycleTimeSec: 9.2,
    shiftDurationMinutes: 600, // 10h shift (22:00 - 08:00)
    plannedDowntimeMinutes: 60,
    unplannedDowntimeMinutes: 42,
    targetCount: 12500,
    totalCount: 8721,
    goodCount: 8520,
    rejectCount: 201,

    // Targets & Meta
    targetOee: 85.0,
    targetAvailability: 90.0,
    targetPerformance: 95.0,
    targetQuality: 98.0,
    plant: 'Mediseal Pharma Plant',
    line: 'Line Mediseal 01',
    area: 'Packaging Suite 04',
    statusSince: '22:00 (3h 25m)',
    productDescription: 'Sodium Tablets 500mg Blister Packaging',
    actualHourlyRate: 203,

    // Breakdown & Losses
    downtimeReasons: [
      { id: 'dt-s1', category: 'Breakdown', label: 'Feeder Breakdown (Event Key 0295837182)', durationMinutes: 28, equivalentLossPcs: 187, type: 'UNPLANNED' },
      { id: 'dt-s2', category: 'Waiting', label: 'Waiting for Material Supply', durationMinutes: 14, equivalentLossPcs: 93, type: 'UNPLANNED' },
      { id: 'dt-s3', category: 'Changeover', label: 'Batch Foil Changeover', durationMinutes: 108, equivalentLossPcs: 720, type: 'UNPLANNED' },
      { id: 'dt-sp1', category: 'Planned', label: 'Staff Meal Break', durationMinutes: 60, equivalentLossPcs: 400, type: 'PLANNED' },
    ],
    rejectReasons: [
      { id: 'rej-s1', label: 'Blister Seal Leakage', count: 125, percentage: 62.2 },
      { id: 'rej-s2', label: 'Missing Tablet Sensor', count: 76, percentage: 37.8 },
    ],

    // Active Job Configuration matching user's custom production fields
    jobConfig: {
      workOrder: 'WO-2026-0920-01',
      productName: 'Sodium Tablets 500mg',
      productId: 'PRD-SODIUM-500',
      operatorName: 'Budi Santoso',
      operatorId: 'OP-104',
      standardCycleTimeSec: 9.0,
      targetQuantity: 12500,
      shiftStart: '22:00',
      shiftEnd: '08:00',
      breakTimeWindow: '02:00 - 03:00',
      plannedBreakMin: 60,
      plannedOperatingSec: 32400,
    },

    // Telemetry payload representing exact values in image.png
    telemetry: {
      ts: 1790065537,
      st: 2, // RUNNING / Active
      tot: 8721, // Actual Quantity
      rej: 201,
      cyc: 920, // 9.20s
      run: 12300, // Active: 03:25 (3h 25m running)
      dt: 2520,  // Breakdown 00:28 + Waiting 00:14 = 42 min
      oee: 6500, // 65.0% OEE
      a: 6500,   // 65.0% AVA
      p: 7200,   // 72.0% PER
      q: 9800,   // 98.0% QUA
      alm: 0,
      rpm: 1200,
      tmp: 382,
      di: 0x07,
      is_buffered: false,
    },

    health: {
      timestamp: 1790065537,
      heap_free: 198400,
      tasks_healthy: 6,
      tasks_total: 6,
      stale_tasks: [],
      stale_count: 0,
      event_flags: 0x0001,
    },

    // Hourly trends matching the 22:00 to 08:00 shift (current live hour: 01:00 / 01:25)
    hourlyTrends: [
      { hour: '22:00', target: 1250, actual: 980, good: 960, reject: 20, oee: 62.5, availability: 68.0, performance: 70.5, quality: 97.9, status: 'RUNNING', isBuffered: false },
      { hour: '23:00', target: 1250, actual: 1020, good: 998, reject: 22, oee: 64.0, availability: 67.0, performance: 71.0, quality: 97.8, status: 'RUNNING', isBuffered: false },
      { hour: '00:00', target: 1250, actual: 780, good: 760, reject: 20, oee: 58.2, availability: 61.0, performance: 68.0, quality: 97.4, status: 'RUNNING', isBuffered: false },
      { hour: '01:00', target: 1250, actual: 640, good: 625, reject: 15, oee: 52.0, availability: 54.0, performance: 65.0, quality: 97.6, status: 'RUNNING', isBuffered: false },
      { hour: '02:00', target: 1250, actual: 950, good: 932, reject: 18, oee: 63.8, availability: 64.0, performance: 72.0, quality: 98.1, status: 'RUNNING', isBuffered: false },
      { hour: '03:00', target: 1250, actual: 1120, good: 1098, reject: 22, oee: 67.4, availability: 68.0, performance: 73.5, quality: 98.0, status: 'RUNNING', isBuffered: false },
      { hour: '04:00', target: 1250, actual: 910, good: 890, reject: 20, oee: 60.5, availability: 62.0, performance: 70.0, quality: 97.8, status: 'RUNNING', isBuffered: false },
      { hour: '05:00', target: 1250, actual: 1180, good: 1158, reject: 22, oee: 69.2, availability: 70.0, performance: 74.0, quality: 98.1, status: 'RUNNING', isBuffered: false },
      { hour: '06:00', target: 1250, actual: 1141, good: 1119, reject: 22, oee: 68.0, availability: 69.0, performance: 73.0, quality: 98.0, status: 'RUNNING', isBuffered: false },
      { hour: '07:00', target: 1250, actual: 0, good: 0, reject: 0, oee: 0, availability: 0, performance: 0, quality: 100, status: 'RUNNING', isBuffered: false },
    ],
  },
  {
    id: 'STM32-OEE-01',
    deviceId: 'STM32-OEE-01',
    name: 'CNC Milling Mazak VCN-530C',
    connectionStatus: 'ONLINE',
    lastTelemetryTs: 1790065537, // 21 Sep 2026 01:25:37
    status: 'RUNNING',
    currentProduct: 'Flange Housing B-20',
    idealCycleTimeSec: 45.0,
    actualCycleTimeSec: 46.2,
    shiftDurationMinutes: 480,
    plannedDowntimeMinutes: 60,
    unplannedDowntimeMinutes: 42,
    targetCount: 560,
    totalCount: 532,
    goodCount: 521,
    rejectCount: 11,

    // Targets & Meta
    targetOee: 85.0,
    targetAvailability: 92.0,
    targetPerformance: 95.0,
    targetQuality: 98.0,
    plant: 'Cikarang Plant 1',
    line: 'Machining Line 2',
    area: 'Machining & Turning',
    statusSince: '22:00 (3h 25m)',
    productDescription: 'Flange Housing B-20 CNC Machined',
    actualHourlyRate: 76,

    // Breakdown
    downtimeReasons: [
      { id: 'dt-1', category: 'Sensor', label: 'Sensor Fault', durationMinutes: 18, equivalentLossPcs: 24, type: 'UNPLANNED' },
      { id: 'dt-2', category: 'Mechanical', label: 'Feeder Jam', durationMinutes: 12, equivalentLossPcs: 16, type: 'UNPLANNED' },
      { id: 'dt-3', category: 'Material', label: 'Material Shortage', durationMinutes: 8, equivalentLossPcs: 10, type: 'UNPLANNED' },
      { id: 'dt-4', category: 'Setup', label: 'Die Calibration', durationMinutes: 4, equivalentLossPcs: 5, type: 'UNPLANNED' },
      { id: 'dt-p1', category: 'Planned', label: 'Meal & Rest Break', durationMinutes: 60, equivalentLossPcs: 80, type: 'PLANNED' },
    ],
    rejectReasons: [
      { id: 'rej-1', label: 'Push Button Reject', count: 11, percentage: 100 },
    ],

    // Active MQTT Job Configuration (SET_JOB_CONFIG)
    jobConfig: {
      workOrder: 'WO-2026-0920-01',
      productName: 'Flange Housing B-20',
      productId: 'PRD-FLANGE-B20',
      operatorName: 'Budi Santoso',
      operatorId: 'OP-4021',
      standardCycleTimeSec: 45.0,
      targetQuantity: 560,
      shiftStart: '22:00',
      shiftEnd: '08:00',
      breakTimeWindow: '02:00 - 03:00',
      plannedBreakMin: 60,
      plannedOperatingSec: 25200, // 420 min * 60
    },

    // Live MQTT Telemetry Payload (Direct wire fields)
    telemetry: {
      ts: 1790065537,
      st: 2, // RUNNING
      tot: 532,
      rej: 11,
      cyc: 4620, // 46.20s
      run: 22680, // 378 min in seconds
      dt: 2520,  // 42 min in seconds
      oee: 8240, // 82.40%
      a: 9120,   // 91.20%
      p: 9450,   // 94.50%
      q: 9560,   // 95.60%
      alm: 0,
      rpm: 1450,
      tmp: 423,  // 42.3 C
      di: 0x03,
      is_buffered: false,
    },

    // Edge Health Payload (oee/device/{id}/health)
    health: {
      timestamp: 1790065537,
      heap_free: 184320,
      tasks_healthy: 6,
      tasks_total: 6,
      stale_tasks: [],
      stale_count: 0,
      event_flags: 0x0001,
    },

    // Contract-driven hourly time-series (22:00 to 05:00 - shift in progress, current: 01:25)
    // Target per hour: 560 pcs / 8 hours = 70 pcs/hr
    // Actual sum: 65+68+72+70+58+66+71+62 = 532 pcs
    hourlyTrends: [
      { hour: '22:00', target: 70, actual: 65, good: 64, reject: 1, oee: 79.5, availability: 89.0, performance: 92.5, quality: 98.5, status: 'RUNNING', isBuffered: false },
      { hour: '23:00', target: 70, actual: 68, good: 67, reject: 1, oee: 81.2, availability: 90.0, performance: 93.0, quality: 98.5, status: 'RUNNING', isBuffered: false },
      { hour: '00:00', target: 70, actual: 72, good: 70, reject: 2, oee: 83.0, availability: 91.0, performance: 94.0, quality: 97.2, status: 'RUNNING', isBuffered: false },
      { hour: '01:00', target: 70, actual: 70, good: 69, reject: 1, oee: 86.5, availability: 93.5, performance: 95.5, quality: 98.6, status: 'RUNNING', isBuffered: false },
      { hour: '02:00', target: 70, actual: 58, good: 56, reject: 2, oee: 75.8, availability: 84.0, performance: 93.0, quality: 96.6, status: 'RUNNING', isBuffered: false },
      { hour: '03:00', target: 70, actual: 66, good: 65, reject: 1, oee: 82.0, availability: 91.0, performance: 93.5, quality: 98.5, status: 'RUNNING', isBuffered: false },
      { hour: '04:00', target: 70, actual: 71, good: 70, reject: 1, oee: 85.5, availability: 93.0, performance: 95.0, quality: 98.6, status: 'RUNNING', isBuffered: false },
      { hour: '05:00', target: 70, actual: 62, good: 60, reject: 2, oee: 82.4, availability: 91.2, performance: 94.5, quality: 96.8, status: 'RUNNING', isBuffered: false },
    ],
  },
  {
    id: 'STM32-OEE-02',
    deviceId: 'STM32-OEE-02',
    name: 'STM32 Edge Controller (Hydraulic Press)',
    connectionStatus: 'ONLINE',
    lastTelemetryTs: 1790065537,
    status: 'DOWN',
    currentProduct: 'Product B (Bracket)',
    idealCycleTimeSec: 30.0,
    actualCycleTimeSec: 36.0,
    shiftDurationMinutes: 480,
    plannedDowntimeMinutes: 60,
    unplannedDowntimeMinutes: 145,
    targetCount: 840,
    totalCount: 476,
    goodCount: 448,
    rejectCount: 28,

    // Targets & Meta
    targetOee: 80.0,
    targetAvailability: 90.0,
    targetPerformance: 92.0,
    targetQuality: 96.0,
    plant: 'Cikarang Plant 1',
    line: 'Press Line 01',
    area: 'Hydraulic Press Stamping',
    statusSince: '00:15 (1h 10m)',
    productDescription: 'Heavy Duty Structural Bracket',
    actualHourlyRate: 85,

    // Breakdown
    downtimeReasons: [
      { id: 'dt-201', category: 'Breakdown', label: 'Main Hydraulic Pump Low Pressure', durationMinutes: 105, equivalentLossPcs: 210, type: 'UNPLANNED' },
      { id: 'dt-202', category: 'Material', label: 'Raw Steel Coil Reel Delay', durationMinutes: 40, equivalentLossPcs: 80, type: 'UNPLANNED' },
      { id: 'dt-203', category: 'Planned', label: 'Scheduled Maintenance & Filter Wash', durationMinutes: 60, equivalentLossPcs: 120, type: 'PLANNED' },
    ],
    rejectReasons: [
      { id: 'rej-201', label: 'Forming Crack', count: 18, percentage: 64.3 },
      { id: 'rej-202', label: 'Dimensional Offset', count: 10, percentage: 35.7 },
    ],

    jobConfig: {
      workOrder: 'WO-2026-0920-02',
      productName: 'Product B (Bracket)',
      productId: 'PRD-AUTO-02',
      operatorName: 'Rian K.',
      operatorId: 'OP-EDGE-02',
      standardCycleTimeSec: 30.0,
      targetQuantity: 840,
      shiftStart: '22:00',
      shiftEnd: '08:00',
      breakTimeWindow: '02:00 - 03:00',
      plannedBreakMin: 60,
      plannedOperatingSec: 25200,
    },

    telemetry: {
      ts: 1790065537,
      st: 4, // UNPLANNED_DT
      tot: 476,
      rej: 28,
      cyc: 3600,
      run: 14100,
      dt: 8700,
      oee: 4600,
      a: 5000,
      p: 9400,
      q: 9800,
      alm: 104, // Hydraulic low pressure
      rpm: 0,
      tmp: 584,
      di: 0x01,
      is_buffered: false,
    },

    health: {
      timestamp: 1790065537,
      heap_free: 176128,
      tasks_healthy: 5,
      tasks_total: 6,
      stale_tasks: [{ name: 'MODBUS_POLL', age_ms: 6200, alive: 0 }],
      stale_count: 1,
      event_flags: 0x0002,
    },

    // Hourly time-series (22:00 to 05:00)
    // Target per hour: 840 pcs / 8 hours = 105 pcs/hr
    // Sum of targets: 8 x 105 = 840 pcs (Target Plan)
    // Sum of actuals: 50+98+92+86+45+0+55+50 = 476 pcs (Actual Total)
    // Sum of goods: 49+94+88+80+40+0+50+47 = 448 pcs (Good Output)
    // Sum of rejects: 1+4+4+6+5+0+5+3 = 28 pcs (Reject Output)
    hourlyTrends: [
      { hour: '22:00', target: 105, actual: 50, good: 49, reject: 1, oee: 45.0, availability: 52.0, performance: 90.0, quality: 98.0, status: 'RUNNING' },
      { hour: '23:00', target: 105, actual: 98, good: 94, reject: 4, oee: 78.2, availability: 89.0, performance: 92.0, quality: 95.9, status: 'RUNNING' },
      { hour: '00:00', target: 105, actual: 92, good: 88, reject: 4, oee: 72.0, availability: 84.0, performance: 90.0, quality: 95.7, status: 'RUNNING' },
      { hour: '01:00', target: 105, actual: 86, good: 80, reject: 6, oee: 65.4, availability: 76.0, performance: 93.0, quality: 93.0, status: 'IDLE' },
      { hour: '02:00', target: 105, actual: 45, good: 40, reject: 5, oee: 34.0, availability: 40.0, performance: 91.0, quality: 88.9, status: 'DOWN' },
      { hour: '03:00', target: 105, actual: 0, good: 0, reject: 0, oee: 0.0, availability: 0.0, performance: 0.0, quality: 100.0, status: 'DOWN' },
      { hour: '04:00', target: 105, actual: 55, good: 50, reject: 5, oee: 41.5, availability: 48.0, performance: 92.0, quality: 90.9, status: 'DOWN' },
      { hour: '05:00', target: 105, actual: 50, good: 47, reject: 3, oee: 43.1, availability: 49.0, performance: 93.5, quality: 94.0, status: 'DOWN' },
    ],
  },
];

export const INITIAL_ALARMS: MachineAlarmEvent[] = [
  {
    id: 'alm-1',
    timestamp: '01:12:45',
    type: 'Breakdown',
    machineId: 'STM32-OEE-01',
    durationMinutes: 8,
    status: 'Waiting Maintenance',
    description: 'PLC Alarm Code 0x0000 (Clear) - Edge controller reporting normal IO status',
    operator: 'Bambang S.',
  },
  {
    id: 'alm-2',
    timestamp: '00:45:10',
    type: 'Breakdown',
    machineId: 'STM32-OEE-02',
    durationMinutes: 105,
    status: 'In Progress',
    description: 'PLC Alarm Code 104: Main Hydraulic Pump Low Pressure Sensor',
    operator: 'Rian K.',
  },
];

