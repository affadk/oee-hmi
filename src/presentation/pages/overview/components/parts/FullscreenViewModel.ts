// /src/presentation/layouts/sub-components/FullscreenViewModel.ts
import type { DeviceCommandKind } from '../../../../../domain/entities/backend/Device';
// Shared view-model: computed metrics consumed by FullscreenOeeView sub-components.
// Kept as a plain object type so each sub-component receives only the data it needs.

import type { MachineConfig, CalculatedOeeMetrics } from '../../../../../domain/index';
import type { BackendHealth } from '../../../../../domain/ports/IOeeBackend';
import type { OperatorRecord, ProductRecord } from '../../../../../domain/entities/backend/Device';
import { telemetryAgeSec } from '../../../../../domain/index';
import { isEdgeHealthOk } from '../../../../../domain/entities/EdgeContracts';
import type { TimelineSegment } from '../../../../../domain/services/ShiftTimeline';
import type { WorkOrderResolveResult } from '../../../../../domain/entities/backend/WorkOrder';
import { fluid } from '../../../../utils/fluidType';

export interface FullscreenOeeViewProps {
  machine: MachineConfig;
  allMachines: MachineConfig[];
  metrics: CalculatedOeeMetrics;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenMqttModal: () => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onSwitchMachine: (id: string) => void;
  onOpenFormula: (metric: string) => void;
  onViewAllEvents?: () => void;
  onUpdateMachineStatus?: (status: 'RUNNING' | 'DOWN' | 'IDLE') => Promise<void>;
  onLogReject?: (reasonLabel: string, count: number) => Promise<void>;
  onDispatchMachineCommand?: (command: DeviceCommandKind) => Promise<void>;
  commandsDisabled?: boolean;
  disabledReason?: string;
  onApplyJobConfig?: (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number,
    shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number }
  ) => Promise<void>;
  useBackend?: boolean;
  backendHealth?: BackendHealth | null;
  catalog?: { products: ProductRecord[]; operators: OperatorRecord[] } | null;
  onRefreshCatalog?: () => Promise<void>;
  shiftSegments?: TimelineSegment[] | null;
  livePoints?: Array<{ timestamp: string; oee: number | null }> | null;
  workOrderPreview?: { woId: string; result: WorkOrderResolveResult } | null;
  onPreviewWorkOrder?: (woId: string) => Promise<void>;
  onProceedToSetup?: () => void;
}

/** Computed values derived from machine + metrics (single-source of truth for the view). */
export interface FullscreenViewModel {
  // OEE values
  oeeValue: number;
  availValue: number;
  perfValue: number;
  qualValue: number;
  oeeGaugeColor: string;
  availGaugeColor: string;
  perfGaugeColor: string;
  qualGaugeColor: string;

  // Machine metadata
  machineName: string;
  machineLine: string;
  deviceId: string;
  productName: string;
  targetCycleTimeSec: number;
  operatorName: string;
  operatorId: string;
  shiftStart: string;
  shiftEnd: string;
  breakTimeWindow: string;
  plannedBreakMin: number;
  shiftNumber: string;

  // Production rate
  theoreticalHourlyOutput: number;
  targetRate: number;
  currentRate: number;
  actualCycleTimeSec: string;
  speedEffRatio: number;
  speedEffPct: number;
  speedEffColor: string;

  // Edge health
  health: NonNullable<MachineConfig['health']>;
  isHealthy: boolean;
  heapFreeKb: number;

  // Output counters
  targetPcs: number;
  actualPcs: number;
  rejectPcs: number;
  goodPcs: number;

  // Time calculations
  runTimeMin: number;
  plannedTimeMin: number;
  downtimeMin: number;
  isRunning: boolean;
  staleAgeSec: ReturnType<typeof telemetryAgeSec>;
  teepEnabled: boolean;

  // UI helpers
  formatStaffed: (totalMin: number) => string;
  fluid: typeof fluid;
  isDark: boolean;
}

/** Builds the view-model from raw props. Call once in the parent container. */
export function buildFullscreenViewModel(
  machine: MachineConfig,
  metrics: CalculatedOeeMetrics,
  isDark: boolean
): FullscreenViewModel {
  const getGaugeColor = (val: number, target: number) => {
    if (val >= target) return '#10b981';
    if (val >= target - 5) return '#f59e0b';
    return '#f43f5e';
  };

  const oeeValue = metrics.oeePct ?? 65.0;
  const availValue = metrics.availabilityPct ?? 65.0;
  const perfValue = metrics.performancePct ?? 72.0;
  const qualValue = metrics.qualityPct ?? 98.0;

  const machineName = machine.name || '—';
  const machineLine = machine.line || '—';
  const deviceId = machine.deviceId || '—';
  const productName = machine.currentProduct || machine.jobConfig?.productName || '—';
  const targetCycleTimeSec = machine.idealCycleTimeSec || machine.jobConfig?.standardCycleTimeSec || 0;
  const operatorName = machine.jobConfig?.operatorName || '—';
  const operatorId = machine.jobConfig?.operatorId || '—';
  const shiftStart = machine.jobConfig?.shiftStart || '—';
  const shiftEnd = machine.jobConfig?.shiftEnd || '—';
  const breakTimeWindow = machine.jobConfig?.breakTimeWindow || '—';
  const plannedBreakMin = machine.jobConfig?.plannedBreakMin ?? 0;
  const shiftNumber =
    shiftStart === '22:00' || shiftStart === '23:00'
      ? 'Shift 3'
      : shiftStart === '15:00'
      ? 'Shift 2'
      : 'Shift 1';

  const theoreticalHourlyOutput = targetCycleTimeSec > 0 ? Math.round(3600 / targetCycleTimeSec) : 0;
  const targetRate = theoreticalHourlyOutput;
  const currentRate = machine.actualHourlyRate || 0;
  const actualCycleTimeSec =
    currentRate > 0
      ? (3600 / currentRate).toFixed(1)
      : targetCycleTimeSec > 0
      ? targetCycleTimeSec.toFixed(1)
      : '0.0';
  const speedEffRatio = targetRate > 0 ? currentRate / targetRate : 0;
  const speedEffPct = targetRate > 0 ? Math.round(speedEffRatio * 100) : 0;
  const speedEffColor =
    speedEffRatio >= 0.85
      ? 'text-emerald-500'
      : speedEffRatio >= 0.6
      ? 'text-amber-500'
      : 'text-rose-500';

  const health = machine.health || {
    tasks_healthy: 0,
    tasks_total: 0,
    heap_free: 0,
    stale_count: 0,
    timestamp: Math.floor(Date.now() / 1000),
    event_flags: 0,
    stale_tasks: [],
  };
  const isHealthy = isEdgeHealthOk(health);
  const heapFreeKb = health.heap_free != null ? Math.round(health.heap_free / 1024) : 0;

  const targetPcs = machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 0;
  const actualPcs = machine.telemetry?.tot ?? machine.totalCount ?? 0;
  const rejectPcs = machine.telemetry?.rej ?? machine.rejectCount ?? 0;
  const goodPcs = Math.max(0, actualPcs - rejectPcs);

  const runTimeMin = machine.telemetry?.run ? Math.round(machine.telemetry.run / 60) : (metrics.runTimeMin || 0);
  // Shift plan kosong => 0, bukan 1 menit palsu.
  const plannedTimeMin = metrics.plannedProductionTimeMin || Math.max(0, machine.shiftDurationMinutes - (machine.plannedDowntimeMinutes || 0));
  const downtimeMin = machine.telemetry?.dt ? Math.round(machine.telemetry.dt / 60) : (metrics.downtimeMin || 0);

  const isRunning = machine.status === 'RUNNING';
  const staleAgeSec = telemetryAgeSec(machine.lastTelemetryTs);

  const formatStaffed = (totalMin: number): string => {
    const m = Math.max(0, Math.round(totalMin));
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  return {
    oeeValue,
    availValue,
    perfValue,
    qualValue,
    oeeGaugeColor: getGaugeColor(oeeValue, machine.targetOee ?? 85),
    availGaugeColor: getGaugeColor(availValue, machine.targetAvailability ?? 90),
    perfGaugeColor: getGaugeColor(perfValue, machine.targetPerformance ?? 95),
    qualGaugeColor: getGaugeColor(qualValue, machine.targetQuality ?? 98),
    machineName,
    machineLine,
    deviceId,
    productName,
    targetCycleTimeSec,
    operatorName,
    operatorId,
    shiftStart,
    shiftEnd,
    breakTimeWindow,
    plannedBreakMin,
    shiftNumber,
    theoreticalHourlyOutput,
    targetRate,
    currentRate,
    actualCycleTimeSec,
    speedEffRatio,
    speedEffPct,
    speedEffColor,
    health,
    isHealthy,
    heapFreeKb,
    targetPcs,
    actualPcs,
    rejectPcs,
    goodPcs,
    runTimeMin,
    plannedTimeMin,
    downtimeMin,
    isRunning,
    staleAgeSec,
    teepEnabled: !!machine.jobConfig,
    formatStaffed,
    fluid,
    isDark,
  };
}
