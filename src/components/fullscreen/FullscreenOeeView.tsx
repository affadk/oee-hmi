// /src/presentation/components/fullscreen/FullscreenOeeView.tsx

import React, { useState } from 'react';
import { MachineConfig, CalculatedOeeMetrics } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  Maximize2,
  Minimize2,
  QrCode,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  HelpCircle,
  Activity,
  CheckCircle2,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { BatchQrScannerModal } from './BatchQrScannerModal';
import { FloorPushButtonsPanel } from './FloorPushButtonsPanel';
import { PasXDonutGauge, PasXTachometerGauge } from './PasXGauges';
import { PasXProgressStrip } from './PasXProgressStrip';
import { TimeSummaryPanel } from './TimeSummaryPanel';
import { EChartsOeeTrend } from '../echarts/EChartsOeeTrend';

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
    cycleTimeSec?: number
  ) => Promise<void>;
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
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Live computed OEE metrics
  const oeeValue = metrics.oeePct ?? 65.0;
  const availValue = metrics.availabilityPct ?? 65.0;
  const perfValue = metrics.performancePct ?? 72.0;
  const qualValue = metrics.qualityPct ?? 98.0;

  // Metadata from machine and job config - mapping user's custom OEE production fields
  const machineName = machine.name || 'Mesin Blister (CP400)';
  const machineLine = machine.line || 'Line Mediseal 01';
  const productName = machine.currentProduct || machine.jobConfig?.productName || 'Sodium Tablets 500mg';
  const targetCycleTimeSec = machine.idealCycleTimeSec || machine.jobConfig?.standardCycleTimeSec || 9.0;
  const operatorName = machine.jobConfig?.operatorName || 'Budi Santoso';
  const operatorId = machine.jobConfig?.operatorId || 'OP-104';
  const shiftStart = machine.jobConfig?.shiftStart || '22:00';
  const shiftEnd = machine.jobConfig?.shiftEnd || '08:00';
  const breakTimeWindow = machine.jobConfig?.breakTimeWindow || '02:00 - 03:00';
  const plannedBreakMin = machine.jobConfig?.plannedBreakMin ?? 60;
  const shiftNumber = shiftStart === '22:00' || shiftStart === '23:00' ? 'Shift 3' : shiftStart === '15:00' ? 'Shift 2' : 'Shift 1';

  // Synchronize Production Rate strictly with metadata cycle time: Target Rate = 3600 / targetCycleTimeSec
  const theoreticalHourlyOutput = targetCycleTimeSec > 0 ? Math.round(3600 / targetCycleTimeSec) : 400;
  const targetRate = theoreticalHourlyOutput;
  const currentRate = machine.actualHourlyRate || 203;
  const actualCycleTimeSec = currentRate > 0 ? (3600 / currentRate).toFixed(1) : (targetCycleTimeSec * 1.97).toFixed(1);

  // Edge Health Telemetry (Poin 4 MQTT Edge Controller: FreeRTOS Health)
  const health = machine.health || {
    tasks_healthy: 6,
    tasks_total: 6,
    heap_free: 184320,
    stale_count: 0,
    timestamp: Math.floor(Date.now() / 1000),
    event_flags: 1,
    stale_tasks: [],
  };
  const isHealthy = (health.stale_count ?? 0) === 0 && (health.tasks_healthy ?? 6) === (health.tasks_total ?? 6);
  const heapFreeKb = Math.round((health.heap_free || 184320) / 1024);

  // Output Counters
  const targetPcs = machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 12500;
  const actualPcs = machine.telemetry?.tot ?? machine.totalCount ?? 8721;
  const rejectPcs = machine.telemetry?.rej ?? machine.rejectCount ?? 201;
  const goodPcs = Math.max(0, actualPcs - rejectPcs);
  const deltaPcs = actualPcs - targetPcs;

  // Calculation parameters for AVA, QUA, and PER
  const runTimeMin = machine.telemetry?.run ? Math.round(machine.telemetry.run / 60) : (metrics.runTimeMin || 219);
  const plannedTimeMin = metrics.plannedProductionTimeMin || Math.max(1, machine.shiftDurationMinutes - (machine.plannedDowntimeMinutes || 60));
  const downtimeMin = machine.telemetry?.dt ? Math.round(machine.telemetry.dt / 60) : (metrics.downtimeMin || 42);
  const runTimeSec = machine.telemetry?.run ?? (runTimeMin * 60);

  const isRunning = machine.status === 'RUNNING';

  return (
    <div
      id="oee-edge-dashboard"
      className={`min-h-screen w-full flex flex-col font-sans select-none transition-colors ${
        isDark ? 'bg-[#080e1a] text-slate-100' : 'bg-[#e9edf4] text-slate-900'
      }`}
    >
      {/* QR BATCH SCANNER MODAL */}
      <BatchQrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        machine={machine}
        allMachines={allMachines}
        onSwitchMachine={onSwitchMachine}
        onApplyJobConfig={onApplyJobConfig}
      />

      {/* 1. AUTHENTIC TOP HEADER STRIP (FULL WIDTH) */}
      <header className="bg-[#1a3464] text-white px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-md shrink-0 w-full">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wide text-sm sm:text-base">OEE Machine Dashboard</span>
          <span className="hidden md:inline-block text-[10px] font-mono px-2.5 py-0.5 rounded bg-white/15 text-blue-100">
            {shiftNumber} · {shiftStart} - {shiftEnd} WIB · 21 Sep 2026 01:25:37
          </span>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Machine selector dropdown */}
          <div className="relative inline-block text-slate-900 text-xs">
            <select
              value={machine.id}
              onChange={(e) => onSwitchMachine(e.target.value)}
              className="bg-white/95 hover:bg-white text-slate-900 font-bold py-1.5 pl-3 pr-7 rounded text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            >
              {allMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.line || m.id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600" />
          </div>

          {/* QR Scanner Trigger */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-2.5 py-1.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Scan QR Code Batch"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden lg:inline font-mono">Scan QR</span>
          </button>

          {/* Edge Telemetry Modal */}
          <button
            type="button"
            onClick={onOpenMqttModal}
            className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Edge Telemetry Hardware Inspector"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline font-mono">Edge I/O</span>
          </button>

          {/* Live simulation toggle */}
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

          {/* Switch to Detailed Audit View */}
          {onViewAllEvents && (
            <button
              type="button"
              onClick={onViewAllEvents}
              className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
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

          {/* MQTT Edge Controller - Poin 4: Edge Health */}
          <button
            type="button"
            onClick={onOpenMqttModal}
            className={`flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs transition-all cursor-pointer select-none ml-1 border ${
              isHealthy
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
            }`}
            title={`Edge Health: ${health.tasks_healthy}/${health.tasks_total} Tasks • Heap ${heapFreeKb} KB`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
            </span>
            <span className="font-bold text-xs tracking-tight">
              Edge: {isHealthy ? 'OK' : 'WARN'}
            </span>
            <span className="text-[10px] opacity-75 hidden sm:inline">
              ({health.tasks_healthy}/{health.tasks_total})
            </span>
          </button>
        </div>
      </header>

      {/* 2. SUB-HEADER: GRID INFORMASI OEE RINGKAS & MELEBAR */}
      <section
        className={`w-full px-4 sm:px-6 lg:px-8 py-2.5 border-b transition-colors shrink-0 ${
          isDark ? 'bg-[#0d1728] border-slate-800' : 'bg-[#e8edf4] border-[#c4cbd5]'
        }`}
      >
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Sisi Kiri: Nama Mesin & Line */}
          <div className="flex flex-col shrink-0 min-w-[180px]">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {machineName}
            </h1>
            <span className={`text-xs font-semibold mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {machineLine}
            </span>
          </div>

          {/* Bagian Tengah: Grid 2-Baris Melebar & Ringkas */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-2 text-xs">
            {/* Baris 1: Product */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Product
              </span>
              <strong className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={productName}>
                {productName}
              </strong>
            </div>

            {/* Baris 1: Target CT */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cycle Time
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {targetCycleTimeSec}s
              </strong>
            </div>

            {/* Baris 1: Operator */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Operator
              </span>
              <strong className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {operatorName}
              </strong>
            </div>

            {/* Baris 1: Shift */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Shift
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {operatorId} · Shift 1
              </strong>
            </div>

            {/* Baris 2: Start */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mulai
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {shiftStart}
              </strong>
            </div>

            {/* Baris 2: End */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Selesai
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {shiftEnd}
              </strong>
            </div>

            {/* Baris 2: Istirahat */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Istirahat
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400`} title={`Jam Istirahat: ${breakTimeWindow} (${plannedBreakMin} menit)`}>
                {breakTimeWindow ? `${breakTimeWindow} (${plannedBreakMin}m)` : `${plannedBreakMin}m`}
              </strong>
            </div>

            {/* Baris 2: Target Rate */}
            <div className="flex flex-col">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Target Rate
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {theoreticalHourlyOutput} pcs/h
              </strong>
            </div>
          </div>

          {/* Sisi Kanan: Status Mesin Kotak (Persis layout asli referensi) */}
          <div
            onClick={() => onUpdateMachineStatus(isRunning ? 'DOWN' : 'RUNNING')}
            className={`px-5 py-2 rounded-md shadow-sm flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-102 shrink-0 select-none ${
              isRunning
                ? 'bg-[#48a43f] text-white'
                : 'bg-rose-600 text-white'
            }`}
            title={`Status: ${isRunning ? 'Active / Running' : 'Down / Stopped'}. Klik untuk mengubah status.`}
          >
            <span className="text-base sm:text-lg font-black leading-tight tracking-wide">
              {isRunning ? 'Active' : 'Down'}
            </span>
            <span className="text-[11px] font-medium leading-none opacity-90">
              {isRunning ? 'Active' : 'Stopped'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT: FULL VIEWPORT WIDTH LAYOUT (w-full px-4 sm:px-6 lg:px-8) */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-14">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* ======================================================== */}
          {/* LEFT COLUMN: OEE KPI & TREND (8 of 12 cols — dilebarkan) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-4">
            {/* CARD 1: KEY PERFORMANCE INDICATORS & PRODUCT QUANTITY (FILL HEIGHT) */}
            <div
              id="kpi-card-fullheight"
              className={`p-4 sm:p-5 rounded-xl border shadow-sm transition-colors flex-1 flex flex-col justify-between ${
                isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
              }`}
            >
              {/* Header: Key performance indicators — keterangan warna simplify di header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className={`text-base font-bold tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Key performance indicators
                  </h2>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] leading-none ${
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
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Formula Help
                </button>
              </div>

              {/* Gauges Row: 4 Donuts OEE + AVA + PER + QUA — siklus A→P→Q + dimensi konsisten (semua medium 92) */}
              <div className="flex-1 flex flex-wrap items-center justify-around gap-4 sm:gap-6 py-2 sm:py-3 my-auto">
                {/* OEE — konsisten dimensi medium sama dengan A/P/Q */}
                <PasXDonutGauge
                  label="OEE"
                  value={oeeValue}
                  size="medium"
                  color="#48a43f"
                  rawLines={[
                    `a: ${availValue.toFixed(1)}%`,
                    `p: ${perfValue.toFixed(1)}%`,
                    `q: ${qualValue.toFixed(1)}%`,
                  ]}
                  onClick={() => onOpenFormula('OEE')}
                />

                {/* 3 Donut Rings — urutan siklus benar A → P → Q */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
                  <PasXDonutGauge
                    label="AVA"
                    value={availValue}
                    size="medium"
                    color="#48a43f"
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
                    color="#eab308"
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
                    color="#48a43f"
                    rawLines={[
                      `good: ${goodPcs.toLocaleString()} pcs`,
                      `tot: ${actualPcs.toLocaleString()} pcs`,
                      `rej: ${rejectPcs.toLocaleString()} pcs`,
                    ]}
                    onClick={() => onOpenFormula('Quality')}
                  />
                </div>
              </div>

              {/* Sub-Section: Progress Bar di Atas, Angka (Actual, Good, Reject, Target) di Bawah (Anchored at Bottom) */}
              <div className="mt-auto pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                {/* 1. Progress Bar di Atas */}
                <div className="w-full h-4 sm:h-5 rounded-md overflow-hidden flex bg-[#dce3ec] dark:bg-slate-800 shadow-inner relative">
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
                  {/* Persentase Total */}
                  <div className="absolute inset-0 flex items-center justify-end pr-2.5 pointer-events-none">
                    <span className="text-[11px] font-mono font-bold text-white drop-shadow-sm">
                      {targetPcs > 0 ? Math.round((actualPcs / targetPcs) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* 2. Angka di Bawah dalam Satu Baris Teratur */}
                <div className="flex flex-wrap items-baseline justify-between gap-3 sm:gap-6">
                  {/* Actual Quantity */}
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black font-sans leading-none ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {actualPcs.toLocaleString()}
                    </span>
                    <span className={`text-xs font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Actual Quantity
                    </span>
                  </div>

                  {/* Good & Reject Pieces */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[11px] font-sans font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Good:
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base font-black">
                        {goodPcs.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[11px] font-sans font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Reject:
                      </span>
                      <strong className="text-rose-600 dark:text-rose-400 text-sm sm:text-base font-black">
                        {rejectPcs.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Target Quantity */}
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black font-sans leading-none ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {targetPcs.toLocaleString()}
                    </span>
                    <span className={`text-xs font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Target Quantity
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: GRAFIK OEE SHIFT TREND */}
            <div
              className={`p-4 sm:p-5 rounded-xl border shadow-sm transition-colors flex-none ${
                isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Grafik OEE Shift Trend
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Target Benchmark 85%
                </span>
              </div>

              <div className="w-full h-52 sm:h-56">
                <EChartsOeeTrend
                  hourlyTrends={machine.hourlyTrends}
                  isBuffered={machine.telemetry?.is_buffered}
                  title="Grafik OEE Trend (Shift)"
                  height={200}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: DISUSUTKAN (4 of 12 cols) — Time Summary, Production Rate, Floor Push */}
          {/* ======================================================== */}
          <div id="oee-right-grid-group" className="lg:col-span-4 flex flex-col justify-between gap-4">
            {/* SUB-CARD 1: TIME SUMMARY */}
            <TimeSummaryPanel metrics={metrics} />

            {/* SUB-CARD 2: PRODUCTION RATE (SYNCHRONIZED WITH METADATA CYCLE TIME) */}
            <div
              id="production-rate-card"
              className={`p-4 rounded-xl border shadow-sm transition-colors ${
                isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-bold tracking-tight ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Production Rate
                </h3>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  CT: {targetCycleTimeSec}s · Target: {targetRate} pcs/h
                </span>
              </div>

              {/* Numbers: Current Rate on left, Target Rate on right with synchronized Cycle Times */}
              <div className="flex items-baseline justify-between mb-2 px-2">
                <div className="flex flex-col">
                  <span className={`text-2xl sm:text-3xl font-black font-sans leading-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {currentRate}
                  </span>
                  <span className={`text-[11px] font-semibold mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Current Rate (pcs/h)
                  </span>
                  <span className={`text-[10px] font-mono mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Actual: {actualCycleTimeSec}s/pcs
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`text-2xl sm:text-3xl font-black font-sans leading-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {targetRate}
                  </span>
                  <span className={`text-[11px] font-semibold mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Target Rate (pcs/h)
                  </span>
                  <span className={`text-[10px] font-mono mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Ideal: {targetCycleTimeSec}s/pcs
                  </span>
                </div>
              </div>

              {/* Semi-circular Tachometer Gauge — diperbesar */}
              <div className="py-2 flex justify-center scale-[1.02]">
                <PasXTachometerGauge
                  currentRate={currentRate}
                  targetRate={targetRate}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  3600 / {targetCycleTimeSec}s = {targetRate} pcs/h
                </span>
                <span className={`font-semibold ${
                  (currentRate / targetRate) >= 0.85
                    ? 'text-emerald-500'
                    : (currentRate / targetRate) >= 0.6
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}>
                  Speed Eff: {Math.round((currentRate / targetRate) * 100)}%
                </span>
              </div>
            </div>

            {/* SUB-CARD 3: FLOOR PUSH BUTTONS PANEL */}
            <FloorPushButtonsPanel
              machine={machine}
              onUpdateMachineStatus={onUpdateMachineStatus}
              onLogReject={onLogReject}
              onDispatchMqttCommand={onDispatchMqttCommand}
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* LOWER SECTION: PROGRESS (FULL WIDTH LAYAR)               */}
        {/* ======================================================== */}
        <div id="shift-progress-fullwidth" className="w-full">
          <PasXProgressStrip machine={machine} metrics={metrics} />
        </div>
      </main>

      {/* 4. FOOTER: SYSTEM & HARDWARE STATUS (FULL WIDTH) */}
      <footer
        className={`w-full px-4 sm:px-6 lg:px-8 py-2.5 border-t text-xs font-mono transition-colors shrink-0 ${
          isDark ? 'bg-[#0d1728] border-slate-800 text-slate-400' : 'bg-[#e2e8f0] border-[#c4cbd5] text-slate-600'
        }`}
      >
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>Machine: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.name}</strong></span>
            <span>Line: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.line}</strong></span>
            <span>Status: <strong className="text-emerald-500">ONLINE</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span>Planned Time: <strong>{metrics.plannedProductionTimeMin || 420}m</strong></span>
            <span>Staffed: <strong>06:35</strong></span>
            <button
              onClick={onOpenMqttModal}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Radio className="w-3 h-3" />
              STM32H723 Edge I/O
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
