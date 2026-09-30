// /src/presentation/layouts/sub-components/FullscreenSubHeader.tsx
// Sub-header bar — machine metadata (product, cycle time, operator, shift, break, target) + live clock + status toggle.

import React from "react";

export interface FullscreenSubHeaderProps {
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
  theoreticalHourlyOutput: number;
  isRunning: boolean;
  headerTime: string;
  headerDate: string;
  isDark: boolean;
  onUpdateMachineStatus?: (
    status: "RUNNING" | "DOWN" | "IDLE",
  ) => Promise<void>;
}

export const FullscreenSubHeader: React.FC<FullscreenSubHeaderProps> = ({
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
  isRunning,
  headerTime,
  headerDate,
  isDark,
  onUpdateMachineStatus,
}) => {
  return (
    <section
      className={`w-full px-[1.2vw] py-[1vh] border-b transition-colors shrink-0 ${
        isDark
          ? "bg-[#0d1728] border-slate-800"
          : "bg-[#e8edf4] border-[#c4cbd5]"
      }`}
    >
      <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-6">
        {/* Machine name + line */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-[180px]">
          <div className="flex flex-col">
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {machineName}
            </h1>
            {machineLine && machineLine !== "—" ? (
              <span
                className={`text-sm sm:text-base font-bold mt-0.5 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {machineLine}
              </span>
            ) : null}
            {deviceId && deviceId !== "—" ? (
              <span
                className={`font-mono text-sm sm:text-base font-bold mt-0.5 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
                title="Device ID edge controller"
              >
                {deviceId}
              </span>
            ) : null}
          </div>
        </div>

        {/* Metadata grid */}
        <div className="w-full xl:w-fit grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2 text-sm">
          {/* Product */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Product
            </span>
            <strong
              className={`text-lg font-extrabold truncate mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              title={productName}
            >
              {productName}
            </strong>
          </div>

          {/* Cycle Time */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Cycle Time
            </span>
            <strong
              className={`font-mono text-lg font-extrabold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {targetCycleTimeSec}s
            </strong>
          </div>

          {/* Operator */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Operator
            </span>
            <strong
              className={`text-lg font-extrabold truncate mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {operatorName}
            </strong>
          </div>

          {/* Shift */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Shift
            </span>
            <strong
              className={`font-mono text-lg font-extrabold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {operatorId} · {shiftNumber}
            </strong>
          </div>

          {/* Start */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Mulai
            </span>
            <strong
              className={`font-mono text-lg font-extrabold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {shiftStart}
            </strong>
          </div>

          {/* End */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Selesai
            </span>
            <strong
              className={`font-mono text-lg font-extrabold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {shiftEnd}
            </strong>
          </div>

          {/* Break */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Istirahat
            </span>
            <strong
              className="font-mono text-lg font-extrabold mt-1 text-amber-600 dark:text-amber-400"
              title={`Jam Istirahat: ${breakTimeWindow} (${plannedBreakMin} menit)`}
            >
              {breakTimeWindow
                ? `${breakTimeWindow} (${plannedBreakMin}m)`
                : `${plannedBreakMin}m`}
            </strong>
          </div>

          {/* Target Rate */}
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm leading-none font-semibold tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Target Rate
            </span>
            <strong
              className={`font-mono text-lg font-extrabold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {theoreticalHourlyOutput} pcs/h
            </strong>
          </div>
        </div>

        {/* Timestamp + Status toggle */}
        <div className="flex items-stretch gap-2.5 shrink-0">
          {/* Timestamp */}
          <div
            className={`flex flex-col items-center justify-center leading-none shrink-0 px-4 py-2 rounded-md border shadow-sm select-none ${
              isDark
                ? "bg-[#0f1b2e] border-slate-700"
                : "bg-white border-slate-300"
            }`}
            title={`${headerDate} ${headerTime}`}
          >
            <span
              className={`font-mono font-black tabular-nums tracking-tight text-2xl sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {headerTime}
            </span>
            <span
              className={`font-mono text-xs font-semibold mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {headerDate}
            </span>
          </div>

          {/* Machine status toggle */}
          {onUpdateMachineStatus && (
            <div
              onClick={() =>
                onUpdateMachineStatus(isRunning ? "DOWN" : "RUNNING")
              }
              className={`w-[112px] px-4 py-2 rounded-md shadow-sm flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-102 shrink-0 select-none ${
                isRunning ? "bg-[#48a43f] text-white" : "bg-rose-600 text-white"
              }`}
              title={`Status: ${isRunning ? "Active / Running" : "Down / Stopped"}. Klik untuk mengubah status.`}
            >
              <span className="text-xl sm:text-2xl font-black leading-tight tracking-wide">
                {isRunning ? "Active" : "Down"}
              </span>
              <span className="text-sm font-semibold leading-none opacity-90">
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
