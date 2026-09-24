// /src/presentation/layouts/sub-components/KpiCard.tsx
// KPIs & OEE trend gauge card (left upper panel in fullscreen layout).

import React from "react";
import { HelpCircle } from "lucide-react";
import type { MachineConfig } from "../../../domain/index";
import { PasXDonutGauge } from "../../components/charts/PasXDonutGauge";
import { EChartsOeeTrend } from "../../components/charts/EChartsOeeTrend";

export interface KpiCardProps {
  // Gauge data
  oeeValue: number;
  availValue: number;
  perfValue: number;
  qualValue: number;
  oeeGaugeColor: string;
  availGaugeColor: string;
  perfGaugeColor: string;
  qualGaugeColor: string;

  // Computed values
  runTimeMin: number;
  plannedTimeMin: number;
  downtimeMin: number;
  theoreticalHourlyOutput: number;
  currentRate: number;
  actualCycleTimeSec: string;
  goodPcs: number;
  actualPcs: number;
  rejectPcs: number;
  targetPcs: number;

  // Machine data
  machine: MachineConfig;
  shiftStart: string;
  shiftEnd: string;
  breakTimeWindow: string;

  // Callbacks
  onOpenFormula: (metric: string) => void;

  // Live points
  livePoints?: Array<{ timestamp: string; oee: number }> | null;

  // UI
  isDark: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  oeeValue,
  availValue,
  perfValue,
  qualValue,
  oeeGaugeColor,
  availGaugeColor,
  perfGaugeColor,
  qualGaugeColor,
  runTimeMin,
  plannedTimeMin,
  downtimeMin,
  theoreticalHourlyOutput,
  currentRate,
  actualCycleTimeSec,
  goodPcs,
  actualPcs,
  rejectPcs,
  targetPcs,
  machine,
  shiftStart,
  shiftEnd,
  breakTimeWindow,
  onOpenFormula,
  livePoints,
  isDark,
}) => {
  return (
    <div
      id="kpi-card-fullheight"
      className="p-[clamp(8px,1vh,14px)] rounded-xl border border-transparent bg-transparent shadow-none transition-colors flex-[1.35] min-h-0 flex flex-col justify-between overflow-hidden"
    >
      {/* Header KPI */}
      <div className="flex flex-wrap items-center justify-between gap-[0.8vw] pb-[1vh] border-b border-slate-200 dark:border-slate-800 mb-[0.6vh] shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            className={`text-base sm:text-[15px] font-bold tracking-tight ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Key performance indicators
          </h2>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs leading-none font-medium ${
              isDark
                ? "bg-slate-800/70 border-slate-700/60"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              Target
            </span>
            <span
              className={`w-px h-3 ${isDark ? "bg-slate-600" : "bg-slate-300"}`}
            />
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              −5%
            </span>
            <span
              className={`w-px h-3 ${isDark ? "bg-slate-600" : "bg-slate-300"}`}
            />
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              Kritis
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenFormula("OEE")}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
        >
          <HelpCircle className="w-4 h-4" />
          Formula Help
        </button>
      </div>

      {/* Gauges Row */}
      <div className="flex-1 min-h-0 grid grid-cols-5 gap-2 lg:gap-6 items-center justify-center py-[0.3vh] my-auto overflow-hidden px-4">
        {/* OEE large gauge menempati 2 kolom */}
        <div className="col-span-2 flex items-center justify-center h-full w-full">
          <PasXDonutGauge
            label="OEE"
            value={oeeValue}
            size="large"
            color={oeeGaugeColor}
            onClick={() => onOpenFormula("OEE")}
          />
        </div>

        {/* 3 small donut rings: A → P → Q cycle order - masing-masing 1 kolom (total 3 kolom) */}
        <div className="col-span-1 flex items-center justify-center h-full w-full">
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
            onClick={() => onOpenFormula("Availability")}
          />
        </div>
        <div className="col-span-1 flex items-center justify-center h-full w-full">
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
            onClick={() => onOpenFormula("Performance")}
          />
        </div>
        <div className="col-span-1 flex items-center justify-center h-full w-full">
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
            onClick={() => onOpenFormula("Quality")}
          />
        </div>
      </div>

      {/* Progress Bar + Numbers */}
      <div className="mt-auto pt-[1vh] border-t border-slate-200 dark:border-slate-800 space-y-[0.8vh] shrink-0">
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2.5 shrink-0">
          <div className="flex-1 h-[1.7vh] min-h-[10px] max-h-[18px] rounded-md overflow-hidden flex bg-slate-300 dark:bg-slate-800 border border-slate-400/40 dark:border-transparent shadow-inner relative">
            {/* Good segment */}
            <div
              style={{
                width: `${targetPcs > 0 ? Math.min(100, (goodPcs / targetPcs) * 100) : 0}%`,
              }}
              className="h-full bg-[#48a43f] transition-all duration-700 ease-out"
              title={`Good: ${goodPcs.toLocaleString()} pcs`}
            />
            {/* Reject segment */}
            <div
              style={{
                width: `${targetPcs > 0 ? Math.min(100, (rejectPcs / targetPcs) * 100) : 0}%`,
              }}
              className="h-full bg-rose-600 transition-all duration-700 ease-out"
              title={`Reject: ${rejectPcs.toLocaleString()} pcs`}
            />
          </div>
          <span
            className={`text-base sm:text-lg font-mono font-black tabular-nums leading-none shrink-0 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {targetPcs > 0 ? Math.round((actualPcs / targetPcs) * 100) : 0}%
          </span>
        </div>

        {/* Numbers row */}
        <div className="flex flex-wrap items-baseline justify-between gap-[0.8vw]">
          {/* Actual */}
          <div className="flex items-baseline gap-[0.5vw]">
            <span
              className={`text-[clamp(16px,1.6vw,26px)] font-black font-sans leading-none ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {actualPcs.toLocaleString()}
            </span>
            <span
              className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Actual
            </span>
          </div>
          {/* Good & Reject */}
          <div className="flex items-center gap-[1vw] text-sm font-mono">
            <div className="flex items-baseline gap-[0.4vw]">
              <span
                className={`text-xs font-sans font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Good:
              </span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-[clamp(16px,1.5vw,28px)] font-black">
                {goodPcs.toLocaleString()}
              </strong>
            </div>
            <div className="flex items-baseline gap-[0.4vw]">
              <span
                className={`text-xs font-sans font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Reject:
              </span>
              <strong className="text-rose-600 dark:text-rose-400 text-[clamp(16px,1.5vw,28px)] font-black">
                {rejectPcs.toLocaleString()}
              </strong>
            </div>
          </div>
          {/* Target */}
          <div className="flex items-baseline gap-[0.5vw]">
            <span
              className={`text-[clamp(16px,1.6vw,26px)] font-black font-sans leading-none ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {targetPcs.toLocaleString()}
            </span>
            <span
              className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Target
            </span>
          </div>
        </div>
      </div>

      {/* OEE Trend Chart */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden mt-[0.6vh]">
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <EChartsOeeTrend
            hourlyTrends={machine.hourlyTrends}
            isBuffered={machine.telemetry?.is_buffered}
            title="Grafik OEE Shift Trend"
            shiftStart={shiftStart}
            shiftEnd={shiftEnd}
            showBenchmark
            breakTimeWindow={breakTimeWindow}
            livePoints={livePoints}
          />
        </div>
      </div>
    </div>
  );
};
