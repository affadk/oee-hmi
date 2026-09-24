// /src/presentation/components/fullscreen/FullscreenOeeView.tsx

import React, { useState, useEffect } from 'react';
import { MachineConfig, CalculatedOeeMetrics, telemetryAgeSec } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';
import {
  Maximize2,
  Minimize2,
  QrCode,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { BatchQrScannerModal } from './BatchQrScannerModal';
import { FloorPushButtonsPanel } from './FloorPushButtonsPanel';
import { PasXDonutGauge, PasXTachometerGauge } from './PasXGauges';
import { PasXProgressStrip } from './PasXProgressStrip';
import { TimeSummaryPanel } from './TimeSummaryPanel';
import { EChartsOeeTrend } from '../echarts/EChartsOeeTrend';
import { fluid } from '../../utils/fluidType';

interface FullscreenOeeViewProps {
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
  onDispatchMqttCommand?: (command: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => Promise<void>;
  onApplyJobConfig?: (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number,
    shiftOverride?: { shiftStart: string; shiftEnd: string; breakWindow: string; breakMin: number }
  ) => Promise<void>;
  useBackend?: boolean;
}

export const FullscreenOeeView: React.FC<FullscreenOeeViewProps> = ({
  machine,
  allMachines,
  metrics,
  isFullscreen,
  onToggleFullscreen,
  onOpenMqttModal,
  isSimulating,
  onToggleSimulate,
  onSwitchMachine,
  onOpenFormula,
  onViewAllEvents,
  onUpdateMachineStatus = async () => {},
  onLogReject = async () => {},
  onDispatchMqttCommand = async () => {},
  onApplyJobConfig = async () => {},
  useBackend,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Live wall-clock untuk timestamp header — refresh tiap detik
  const [headerNow, setHeaderNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setHeaderNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const headerDate = headerNow.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const headerTime = [headerNow.getHours(), headerNow.getMinutes(), headerNow.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');

/** 395 -> "06:35" (durasi staffed shift). */
const formatStaffed = (totalMin: number): string => {
  const m = Math.max(0, Math.round(totalMin));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

  // Live computed OEE metrics
  const oeeValue = metrics.oeePct ?? 65.0;
  const availValue = metrics.availabilityPct ?? 65.0;
  const perfValue = metrics.performancePct ?? 72.0;
  const qualValue = metrics.qualityPct ?? 98.0;

  // Warna gauge sinkron dengan legend: Target (emerald-500) / −5% (amber-500) / Kritis (rose-500)
  const getGaugeColor = (val: number, target: number) => {
    if (val >= target) return '#10b981';
    if (val >= target - 5) return '#f59e0b';
    return '#f43f5e';
  };
  const oeeGaugeColor = getGaugeColor(oeeValue, machine.targetOee ?? 85);
  const availGaugeColor = getGaugeColor(availValue, machine.targetAvailability ?? 90);
  const perfGaugeColor = getGaugeColor(perfValue, machine.targetPerformance ?? 95);
  const qualGaugeColor = getGaugeColor(qualValue, machine.targetQuality ?? 98);

  // Metadata from machine and job config - mapping user's custom OEE production fields
  const machineName = machine.name || '—';
  const machineLine = machine.line || '—';
  const productName = machine.currentProduct || machine.jobConfig?.productName || '—';
  const targetCycleTimeSec = machine.idealCycleTimeSec || machine.jobConfig?.standardCycleTimeSec || 0;
  const operatorName = machine.jobConfig?.operatorName || '—';
  const operatorId = machine.jobConfig?.operatorId || '—';
  const shiftStart = machine.jobConfig?.shiftStart || '—';
  const shiftEnd = machine.jobConfig?.shiftEnd || '—';
  const breakTimeWindow = machine.jobConfig?.breakTimeWindow || '—';
  const plannedBreakMin = machine.jobConfig?.plannedBreakMin ?? 0;
  const shiftNumber = shiftStart === '22:00' || shiftStart === '23:00' ? 'Shift 3' : shiftStart === '15:00' ? 'Shift 2' : 'Shift 1';

  // Synchronize Production Rate strictly with metadata cycle time: Target Rate = 3600 / targetCycleTimeSec
  const theoreticalHourlyOutput = targetCycleTimeSec > 0 ? Math.round(3600 / targetCycleTimeSec) : 0;
  const targetRate = theoreticalHourlyOutput;
  const currentRate = machine.actualHourlyRate || 0;
  const actualCycleTimeSec = currentRate > 0 ? (3600 / currentRate).toFixed(1) : (targetCycleTimeSec > 0 ? targetCycleTimeSec.toFixed(1) : '0.0');
  const speedEffRatio = targetRate > 0 ? currentRate / targetRate : 0;
  const speedEffPct = targetRate > 0 ? Math.round(speedEffRatio * 100) : 0;
  const speedEffColor = speedEffRatio >= 0.85 ? 'text-emerald-500' : speedEffRatio >= 0.6 ? 'text-amber-500' : 'text-rose-500';

  // Edge Health Telemetry (Poin 4 MQTT Edge Controller: FreeRTOS Health)
  const health = machine.health || {
    tasks_healthy: 0,
    tasks_total: 0,
    heap_free: 0,
    stale_count: 0,
    timestamp: Math.floor(Date.now() / 1000),
    event_flags: 0,
    stale_tasks: [],
  };
  const isHealthy = (health.stale_count ?? 0) === 0 && (health.tasks_healthy ?? 0) === (health.tasks_total ?? 0);
  const heapFreeKb = health.heap_free != null ? Math.round(health.heap_free / 1024) : 0;

  // Output Counters
  const targetPcs = machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 0;
  const actualPcs = machine.telemetry?.tot ?? machine.totalCount ?? 0;
  const rejectPcs = machine.telemetry?.rej ?? machine.rejectCount ?? 0;
  const goodPcs = Math.max(0, actualPcs - rejectPcs);

  // Calculation parameters for AVA, QUA, and PER
  const runTimeMin = machine.telemetry?.run ? Math.round(machine.telemetry.run / 60) : (metrics.runTimeMin || 0);
  const plannedTimeMin = metrics.plannedProductionTimeMin || Math.max(1, machine.shiftDurationMinutes - (machine.plannedDowntimeMinutes || 0));
  const downtimeMin = machine.telemetry?.dt ? Math.round(machine.telemetry.dt / 60) : (metrics.downtimeMin || 0);

  const isRunning = machine.status === 'RUNNING';
  // Spec §4: telemetri basi ditandai di footer, angka terakhir tetap tampil.
  // Dihitung saat render (render dipicu tiap pulse telemetri — tanpa interval baru).
  const staleAgeSec = telemetryAgeSec(machine.lastTelemetryTs);

  // Layout: FIT LAYAR — isFullscreen fill 100dvh tanpa celah, normal 100dvh flex
  // Outer shell mengikuti tema agar light mode tidak terjebak hitam
  const outerShellClass = isFullscreen
    ? `h-[100dvh] w-screen overflow-hidden flex flex-col font-sans select-none ${isDark ? 'bg-black' : 'bg-[#e9edf4]'}`
    : 'h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col font-sans select-none transition-colors';

  const innerShellClass = isFullscreen
    ? `w-screen h-[100dvh] flex flex-col overflow-hidden ${
        isDark ? 'bg-[#080e1a] text-slate-100' : 'bg-[#e9edf4] text-slate-900'
      }`
    : `w-full flex-1 min-h-0 flex flex-col overflow-hidden ${isDark ? 'bg-[#080e1a] text-slate-100' : 'bg-[#e9edf4] text-slate-900'}`;

  return (
    <div id="oee-edge-dashboard" className={outerShellClass}>
      <div id="oee-viewport-shell" className={innerShellClass}>
      {/* QR BATCH SCANNER MODAL — lane simulasi saja. Lane backend memakai
          ProductionSetupModal (data WO/produk/operator nyata). */}
      {!useBackend && (
      <BatchQrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        machine={machine}
        allMachines={allMachines}
        onSwitchMachine={onSwitchMachine}
        onApplyJobConfig={onApplyJobConfig}
      />
      )}

      {/* 1. TOP HEADER — shrink-0, padding relatif vh/vw — readability: min 12px */}
      <header className="bg-[#1a3464] text-white px-[1.2vw] py-[0.8vh] flex items-center justify-between text-[clamp(12px,0.85vw,14px)] font-semibold shadow-md shrink-0 w-full">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wide text-sm sm:text-base">OEE Machine Dashboard</span>
          {useBackend ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">Backend Live</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">Simulation</span>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Machine selector dropdown — readability: text-sm min 13px */}
          <div className="relative inline-block text-slate-900">
            <select
              value={machine.id}
              onChange={(e) => onSwitchMachine(e.target.value)}
              className="bg-white/95 hover:bg-white text-slate-900 font-bold py-1.5 pl-3 pr-7 rounded text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            >
              {allMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.line || m.id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600" />
          </div>

          {/* QR Scanner Trigger — lane simulasi saja */}
          {!useBackend && (
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-2.5 py-1.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Scan QR Code Batch"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden lg:inline font-mono">Scan QR</span>
          </button>
          )}

          {/* Edge Telemetry Modal — lane simulasi saja (draft MQTT/broker lokal).
              Lane backend memakai Perangkat + Setup Produksi (REST nyata). */}
          {!useBackend && (
          <button
            type="button"
            onClick={onOpenMqttModal}
            className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Edge Telemetry Hardware Inspector"
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline font-mono">Edge I/O</span>
          </button>
          )}

          {/* Live simulation toggle */}
          {!useBackend && (
            <button
              type="button"
              onClick={onToggleSimulate}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isSimulating ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              title={isSimulating ? 'Pause simulation' : 'Resume simulation'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Switch to Detailed Audit View — text-sm for readability */}
          {onViewAllEvents && (
            <button
              type="button"
              onClick={onViewAllEvents}
              className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all cursor-pointer"
              title="Open Detailed Audit View"
            >
              Audit View
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* MQTT Edge Controller health — lane simulasi saja (backend tidak
              punya endpoint health; lihat specs/backend-gaps.md G3). */}
          {!useBackend && (
          <button
            type="button"
            onClick={onOpenMqttModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-sm transition-all cursor-pointer select-none ml-1 border ${
              isHealthy
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
            }`}
            title={`Edge Health: ${health.tasks_healthy}/${health.tasks_total} Tasks • Heap ${heapFreeKb} KB`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
            </span>
            <span className="font-bold text-sm tracking-tight">
              Edge: {isHealthy ? 'OK' : 'WARN'}
            </span>
            <span className="text-xs opacity-75 hidden sm:inline">
              ({health.tasks_healthy}/{health.tasks_total})
            </span>
          </button>
          )}
        </div>
      </header>

      {/* 2. SUB-HEADER — shrink-0, padding & font relatif */}
      <section
        className={`w-full px-[1.2vw] py-[1vh] border-b transition-colors shrink-0 ${
          isDark ? 'bg-[#0d1728] border-slate-800' : 'bg-[#e8edf4] border-[#c4cbd5]'
        }`}
      >
        <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-6">
          {/* Kelompok 1: Header Nama Mesin & Line */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-[180px]">
            <div className="flex flex-col">
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {machineName}
              </h1>
              <span className={`text-sm sm:text-base font-bold mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {machineLine}
              </span>
            </div>
          </div>

          {/* Kelompok 2: Metadata — grid ringkas — readability min 12px label / 14px value */}
          <div className="w-full xl:w-fit grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2 text-sm">
            {/* Product */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Product
              </span>
              <strong className={`text-lg font-extrabold truncate mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={productName}>
                {productName}
              </strong>
            </div>

            {/* Cycle Time */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cycle Time
              </span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {targetCycleTimeSec}s
              </strong>
            </div>

            {/* Operator */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Operator
              </span>
              <strong className={`text-lg font-extrabold truncate mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {operatorName}
              </strong>
            </div>

            {/* Shift */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Shift
              </span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {operatorId} · {shiftNumber}
              </strong>
            </div>

            {/* Mulai */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mulai
              </span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {shiftStart}
              </strong>
            </div>

            {/* Selesai */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Selesai
              </span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {shiftEnd}
              </strong>
            </div>

            {/* Istirahat */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Istirahat
              </span>
              <strong className={`font-mono text-lg font-extrabold mt-1 text-amber-600 dark:text-amber-400`} title={`Jam Istirahat: ${breakTimeWindow} (${plannedBreakMin} menit)`}>
                {breakTimeWindow ? `${breakTimeWindow} (${plannedBreakMin}m)` : `${plannedBreakMin}m`}
              </strong>
            </div>

            {/* Target Rate */}
            <div className="flex flex-col min-w-0">
              <span className={`text-sm leading-none font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Target Rate
              </span>
              <strong className={`font-mono text-lg font-extrabold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {theoreticalHourlyOutput} pcs/h
              </strong>
            </div>
          </div>

          {/* Kelompok 3: Timestamp + Status Mesin — tinggi disamakan via items-stretch */}
          <div className="flex items-stretch gap-2.5 shrink-0">
            {/* Timestamp & tanggal — panel mandiri di sebelah penanda state */}
            <div className={`flex flex-col items-center justify-center leading-none shrink-0 px-4 py-2 rounded-md border shadow-sm select-none ${
              isDark ? 'bg-[#0f1b2e] border-slate-700' : 'bg-white border-slate-300'
            }`} title={`${headerDate} ${headerTime}`}>
              <span className={`font-mono font-black tabular-nums tracking-tight text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{headerTime}</span>
              <span className={`font-mono text-xs font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{headerDate}</span>
            </div>
            <div
              onClick={() => onUpdateMachineStatus(isRunning ? 'DOWN' : 'RUNNING')}
              className={`w-[112px] px-4 py-2 rounded-md shadow-sm flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-102 shrink-0 select-none ${
                isRunning
                  ? 'bg-[#48a43f] text-white'
                  : 'bg-rose-600 text-white'
              }`}
              title={`Status: ${isRunning ? 'Active / Running' : 'Down / Stopped'}. Klik untuk mengubah status.`}
            >
              <span className="text-xl sm:text-2xl font-black leading-tight tracking-wide">
                {isRunning ? 'Active' : 'Down'}
              </span>
              <span className="text-sm font-semibold leading-none opacity-90">
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT — proporsional relatif vh/vw, semua panel min-h-0 agar tidak terpotong */}
      <main className="flex-1 min-h-0 w-full flex flex-col gap-[1vh] px-[1vw] py-[1vh] overflow-hidden">
        {/* Upper grid: 12 cols, gap relatif vh */}
        <div className="flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 gap-[1vh] lg:gap-[0.9vw] overflow-hidden">
          {/* ======================================================== */}
          {/* LEFT COLUMN: OEE KPI & TREND (8 of 12 cols — dilebarkan) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-[1vh] min-h-0 h-full overflow-hidden">
            {/* CARD 1: KPI & Quantity — flex proporsional, padding relatif — transparan mengikuti Progress & Shift Timeline (tanpa background container) */}
            <div
              id="kpi-card-fullheight"
              className="p-[clamp(8px,1vh,14px)] rounded-xl border border-transparent bg-transparent shadow-none transition-colors flex-[1.35] min-h-0 flex flex-col justify-between overflow-hidden"
            >
              {/* Header KPI — gap & padding relatif — legend min 12px */}
              <div className="flex flex-wrap items-center justify-between gap-[0.8vw] pb-[1vh] border-b border-slate-200 dark:border-slate-800 mb-[0.6vh] shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className={`text-base sm:text-[15px] font-bold tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Key performance indicators
                  </h2>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs leading-none font-medium ${
                    isDark ? 'bg-slate-800/70 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Target</span>
                    <span className={`w-px h-3 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>−5%</span>
                    <span className={`w-px h-3 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Kritis</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenFormula('OEE')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <HelpCircle className="w-4 h-4" />
                  Formula Help
                </button>
              </div>

              {/* Gauges Row — gap & padding relatif vh, semua gauge skala relatif */}
              <div className="flex-1 min-h-0 flex flex-wrap items-center justify-around gap-[0.8vw] py-[0.3vh] my-auto overflow-hidden">
                {/* OEE — tanpa rincian a/p/q, circle diperbesar relatif terhadap tinggi section */}
                <PasXDonutGauge
                  label="OEE"
                  value={oeeValue}
                  size="large"
                  color={oeeGaugeColor}
                  onClick={() => onOpenFormula('OEE')}
                />

                {/* 3 Donut Rings — urutan siklus benar A → P → Q */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap h-full max-h-full min-h-0 min-w-0">
                  <PasXDonutGauge
                    label="AVA"
                    value={availValue}
                    size="medium"
                    color={availGaugeColor}
                    rawLines={[
                      `run: ${runTimeMin}m`,
                      `plan: ${plannedTimeMin}m`,
                      `dt: ${downtimeMin}m`,
                    ]}
                    onClick={() => onOpenFormula('Availability')}
                  />
                  <PasXDonutGauge
                    label="PER"
                    value={perfValue}
                    size="medium"
                    color={perfGaugeColor}
                    rawLines={[
                      `act: ${currentRate} pcs/h`,
                      `tgt: ${theoreticalHourlyOutput} pcs/h`,
                      `cyc: ${actualCycleTimeSec}s`,
                    ]}
                    onClick={() => onOpenFormula('Performance')}
                  />
                  <PasXDonutGauge
                    label="QUA"
                    value={qualValue}
                    size="medium"
                    color={qualGaugeColor}
                    rawLines={[
                      `good: ${goodPcs.toLocaleString()} pcs`,
                      `tot: ${actualPcs.toLocaleString()} pcs`,
                      `rej: ${rejectPcs.toLocaleString()} pcs`,
                    ]}
                    onClick={() => onOpenFormula('Quality')}
                  />
                </div>
              </div>

              {/* Progress Bar + Angka — spacing relatif vh, shrink-0 agar tidak hilang */}
              <div className="mt-auto pt-[1vh] border-t border-slate-200 dark:border-slate-800 space-y-[0.8vh] shrink-0">
                {/* Progress Bar — tinggi relatif vh */}
                <div className="w-full flex items-center gap-2.5 shrink-0">
                  <div className="flex-1 h-[1.7vh] min-h-[10px] max-h-[18px] rounded-md overflow-hidden flex bg-slate-300 dark:bg-slate-800 border border-slate-400/40 dark:border-transparent shadow-inner relative">
                    {/* Segment Good (Hijau) */}
                    <div
                      style={{ width: `${targetPcs > 0 ? Math.min(100, (goodPcs / targetPcs) * 100) : 0}%` }}
                      className="h-full bg-[#48a43f] transition-all duration-700 ease-out"
                      title={`Good: ${goodPcs.toLocaleString()} pcs`}
                    />
                    {/* Segment Reject (Merah) */}
                    <div
                      style={{ width: `${targetPcs > 0 ? Math.min(100, (rejectPcs / targetPcs) * 100) : 0}%` }}
                      className="h-full bg-rose-600 transition-all duration-700 ease-out"
                      title={`Reject: ${rejectPcs.toLocaleString()} pcs`}
                    />
                  </div>
                  <span className={`text-base sm:text-lg font-mono font-black tabular-nums leading-none shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {targetPcs > 0 ? Math.round((actualPcs / targetPcs) * 100) : 0}%
                  </span>
                </div>

                {/* Angka — font relatif clamp terhadap vw/vh — min 12px untuk label */}
                <div className="flex flex-wrap items-baseline justify-between gap-[0.8vw]">
                  {/* Actual */}
                  <div className="flex items-baseline gap-[0.5vw]">
                    <span className={`text-[clamp(16px,1.6vw,26px)] font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {actualPcs.toLocaleString()}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Actual</span>
                  </div>
                  {/* Good & Reject — label min 12px */}
                  <div className="flex items-center gap-[1vw] text-sm font-mono">
                    <div className="flex items-baseline gap-[0.4vw]">
                      <span className={`text-xs font-sans font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Good:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-[clamp(16px,1.5vw,28px)] font-black">{goodPcs.toLocaleString()}</strong>
                    </div>
                    <div className="flex items-baseline gap-[0.4vw]">
                      <span className={`text-xs font-sans font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reject:</span>
                      <strong className="text-rose-600 dark:text-rose-400 text-[clamp(16px,1.5vw,28px)] font-black">{rejectPcs.toLocaleString()}</strong>
                    </div>
                  </div>
                  {/* Target */}
                  <div className="flex items-baseline gap-[0.5vw]">
                    <span className={`text-[clamp(16px,1.6vw,26px)] font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {targetPcs.toLocaleString()}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Target</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: GRAFIK OEE SHIFT TREND — header tunggal milik EChartsOeeTrend */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <EChartsOeeTrend
                  hourlyTrends={machine.hourlyTrends}
                  isBuffered={machine.telemetry?.is_buffered}
                  title="Grafik OEE Shift Trend"
                  shiftStart={shiftStart}
                  shiftEnd={shiftEnd}
                  showBenchmark
                  breakTimeWindow={breakTimeWindow}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — semua panel flex-1 proporsional relatif */}
          <div id="oee-right-grid-group" className="lg:col-span-4 flex flex-col gap-[1vh] min-h-0 h-full overflow-hidden">
            {/* Time Summary — flex awal, Production Rate tidak diubah */}
            <div className="flex-[1.1] min-h-0 overflow-hidden">
              <TimeSummaryPanel metrics={metrics} />
            </div>

            {/* Production Rate — flex-1 relatif */}
            <div
              id="production-rate-card"
              className={`p-[clamp(8px,1vh,12px)] rounded-xl border shadow-sm transition-colors flex-1 min-h-0 overflow-hidden flex flex-col ${
                isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
              }`}
            >
              <div className="flex items-center justify-between mb-[0.6vh] shrink-0">
                <h3 className={`font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontSize: fluid(14, 2.1, 19) }}>Production Rate</h3>
                <span className={`font-mono font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>CT: {targetCycleTimeSec}s · Target: {targetRate} pcs/h</span>
              </div>

              {/* Layered body: chart di belakang, angka di depan — teks fluid vmin */}
              <div className="relative flex-1 min-h-0 overflow-hidden">
                {/* Chart layer (belakang) — diperbesar, jangkar bawah tengah */}
                <div className="absolute inset-x-0 bottom-[0.5vh] top-[26%] flex items-end justify-center pb-[0.2vh] pointer-events-none" aria-hidden="true">
                  <div className="max-h-full" style={{ width: 'min(90%, 320px)', aspectRatio: '196 / 108' }}>
                    <PasXTachometerGauge currentRate={currentRate} targetRate={targetRate} />
                  </div>
                </div>

                {/* Numbers layer (depan) — angka besar fluid */}
                <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-[0.5vw] pt-[0.4vh] pointer-events-none">
                  <div className="flex flex-col drop-shadow-sm">
                    <span className={`font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: fluid(26, 4.2, 44) }}>{currentRate}</span>
                    <span className={`font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontSize: fluid(11, 1.7, 15) }}>Current Rate (pcs/h)</span>
                    <span className={`font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>Actual: {actualCycleTimeSec}s/pcs</span>
                  </div>
                  <div className="flex flex-col items-end drop-shadow-sm text-right">
                    <span className={`font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: fluid(26, 4.2, 44) }}>{targetRate}</span>
                    <span className={`font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontSize: fluid(11, 1.7, 15) }}>Target Rate (pcs/h)</span>
                    <span className={`font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>Ideal: {targetCycleTimeSec}s/pcs</span>
                  </div>
                </div>

                {/* Speed Eff — pojok kanan bawah, nilai dominan */}
                <div className="absolute bottom-[0.4vh] right-[0.5vw] z-10 flex flex-col items-end drop-shadow-sm text-right pointer-events-none">
                  <span className={`font-mono font-black leading-none ${speedEffColor}`} style={{ fontSize: fluid(28, 4.6, 48) }}>{speedEffPct}%</span>
                  <span className={`font-semibold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontSize: fluid(11, 1.7, 15) }}>Speed Eff</span>
                </div>
              </div>

              <div className="flex items-center justify-center font-mono font-semibold mt-[0.4vh] pt-[0.6vh] border-t border-slate-100 dark:border-slate-800 shrink-0" style={{ fontSize: fluid(11, 1.6, 14) }}>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  3600 / {targetCycleTimeSec}s = {targetRate} pcs/h
                </span>
              </div>
            </div>

            {/* SUB-CARD 3: FLOOR PUSH BUTTONS PANEL */}
            {!useBackend && (
              <FloorPushButtonsPanel
                machine={machine}
                onUpdateMachineStatus={onUpdateMachineStatus}
                onLogReject={onLogReject}
                onDispatchMqttCommand={onDispatchMqttCommand}
              />
            )}
          </div>
        </div>

        {/* LOWER: Progress & Shift Timeline — horizontal grid, tinggi relatif vh, tetap proporsional */}
        <div id="shift-progress-fullwidth" className="shrink-0 h-[clamp(110px,16vh,190px)] min-h-0 w-full overflow-hidden">
          <PasXProgressStrip machine={machine} metrics={metrics} useBackend={useBackend} />
        </div>
      </main>

      {/* 4. FOOTER — shrink-0, padding relatif — min 12px */}
      <footer
        className={`w-full px-[1.2vw] py-[0.8vh] border-t text-xs font-mono transition-colors shrink-0 overflow-hidden ${
          isDark ? 'bg-[#0d1728] border-slate-800 text-slate-400' : 'bg-[#e2e8f0] border-[#c4cbd5] text-slate-600'
        }`}
      >
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>Machine: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.name}</strong></span>
            <span>Line: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.line}</strong></span>
            <span>Status: <strong className={machine.connectionStatus === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}>{machine.connectionStatus || '—'}</strong></span>
            {staleAgeSec !== null && staleAgeSec > 60 ? (
              <span
                role="status"
                title={`Telemetri terakhir ${staleAgeSec} dtk lalu — angka yang tampil mungkin basi`}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/40"
              >
                STALE {staleAgeSec}s
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span>Planned Time: <strong>{metrics.plannedProductionTimeMin}m</strong></span>
            <span>Staffed: <strong>{formatStaffed(metrics.plannedProductionTimeMin + (machine.plannedDowntimeMinutes || 0))}</strong></span>
            {!useBackend && (
            <button type="button"
              onClick={onOpenMqttModal}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Radio className="w-3 h-3" />
              STM32H723 Edge I/O
            </button>
            )}
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};
