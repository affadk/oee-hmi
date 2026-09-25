// /src/presentation/layouts/FullscreenOeeView.tsx
// Main fullscreen OEE dashboard layout coordinator.
// Delegates rendering to focused sub-components under sub-components/.

import React, { useState, useEffect } from "react";
import { useTheme } from "../providers/ThemeProvider";
import { BatchQrScannerModal } from "../components/modals/BatchQrScannerModal/BatchQrScannerModal";
import { FloorPushButtonsPanel } from "./FloorPushButtonsPanel";
import { TimeSummaryPanel } from "./panels/TimeSummaryPanel";
import { PasXProgressStrip } from "./panels/PasXProgressStrip";
import { FullscreenHeader } from "./sub-components/FullscreenHeader";
import { FullscreenSubHeader } from "./sub-components/FullscreenSubHeader";
import { KpiCard } from "./sub-components/KpiCard";
import { ProductionRateCard } from "./sub-components/ProductionRateCard";
import { FullscreenFooter } from "./sub-components/FullscreenFooter";
import { buildFullscreenViewModel } from "./sub-components/FullscreenViewModel";
import type { FullscreenOeeViewProps } from "./sub-components/FullscreenViewModel";

export type { FullscreenOeeViewProps };

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
  shiftSegments = null,
  livePoints = null,
  workOrderPreview = null,
  onPreviewWorkOrder,
  onProceedToSetup,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Live wall-clock untuk timestamp header — refresh tiap detik
  const [headerNow, setHeaderNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setHeaderNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const headerDate = headerNow.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const headerTime = [
    headerNow.getHours(),
    headerNow.getMinutes(),
    headerNow.getSeconds(),
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

  const vm = buildFullscreenViewModel(machine, metrics, theme === "dark");

  // Layout classes
  const outerShellClass = isFullscreen
    ? `h-[100dvh] w-screen overflow-hidden flex flex-col font-sans select-none ${vm.isDark ? "bg-black" : "bg-[#e9edf4]"}`
    : "h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col font-sans select-none transition-colors";

  const innerShellClass = isFullscreen
    ? `w-screen h-[100dvh] flex flex-col overflow-hidden ${
        vm.isDark
          ? "bg-[#080e1a] text-slate-100"
          : "bg-[#e9edf4] text-slate-900"
      }`
    : `w-full flex-1 min-h-0 flex flex-col overflow-hidden ${vm.isDark ? "bg-[#080e1a] text-slate-100" : "bg-[#e9edf4] text-slate-900"}`;

  return (
    <div id="oee-edge-dashboard" className={outerShellClass}>
      <div id="oee-viewport-shell" className={innerShellClass}>
        {/* QR BATCH SCANNER */}
        <BatchQrScannerModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          machine={machine}
          allMachines={allMachines}
          onSwitchMachine={onSwitchMachine}
          onApplyJobConfig={onApplyJobConfig}
          backendMode={useBackend}
          workOrderPreview={workOrderPreview}
          onPreviewWorkOrder={onPreviewWorkOrder}
          onProceedToSetup={
            onProceedToSetup
              ? () => {
                  setIsQrModalOpen(false);
                  onProceedToSetup();
                }
              : undefined
          }
        />

        {/* 1. TOP HEADER */}
        <FullscreenHeader
          machine={machine}
          allMachines={allMachines}
          isSimulating={isSimulating}
          onToggleSimulate={onToggleSimulate}
          onSwitchMachine={onSwitchMachine}
          onOpenMqttModal={onOpenMqttModal}
          onOpenFormula={onOpenFormula}
          onViewAllEvents={onViewAllEvents}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          onThemeToggle={toggleTheme}
          isDark={vm.isDark}
          useBackend={useBackend}
          health={vm.health}
          isHealthy={vm.isHealthy}
          heapFreeKb={vm.heapFreeKb}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />

        {/* 2. SUB-HEADER */}
        <FullscreenSubHeader
          machineName={vm.machineName}
          machineLine={vm.machineLine}
          productName={vm.productName}
          targetCycleTimeSec={vm.targetCycleTimeSec}
          operatorName={vm.operatorName}
          operatorId={vm.operatorId}
          shiftStart={vm.shiftStart}
          shiftEnd={vm.shiftEnd}
          breakTimeWindow={vm.breakTimeWindow}
          plannedBreakMin={vm.plannedBreakMin}
          shiftNumber={vm.shiftNumber}
          theoreticalHourlyOutput={vm.theoreticalHourlyOutput}
          isRunning={vm.isRunning}
          headerTime={headerTime}
          headerDate={headerDate}
          isDark={vm.isDark}
          onUpdateMachineStatus={onUpdateMachineStatus}
        />

        {/* 3. MAIN CONTENT */}
        <main className="flex-1 min-h-0 w-full flex flex-col gap-[1vh] px-[1vw] py-[1vh] overflow-hidden">
          {/* Upper grid: 12 cols */}
          <div className="flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 gap-[1vh] lg:gap-[0.9vw] overflow-hidden">
            {/* LEFT COLUMN: OEE KPI & TREND (8 of 12 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-[1vh] min-h-0 h-full overflow-hidden">
              <KpiCard
                oeeValue={vm.oeeValue}
                availValue={vm.availValue}
                perfValue={vm.perfValue}
                qualValue={vm.qualValue}
                oeeGaugeColor={vm.oeeGaugeColor}
                availGaugeColor={vm.availGaugeColor}
                perfGaugeColor={vm.perfGaugeColor}
                qualGaugeColor={vm.qualGaugeColor}
                runTimeMin={vm.runTimeMin}
                plannedTimeMin={vm.plannedTimeMin}
                downtimeMin={vm.downtimeMin}
                theoreticalHourlyOutput={vm.theoreticalHourlyOutput}
                currentRate={vm.currentRate}
                actualCycleTimeSec={vm.actualCycleTimeSec}
                goodPcs={vm.goodPcs}
                actualPcs={vm.actualPcs}
                rejectPcs={vm.rejectPcs}
                targetPcs={vm.targetPcs}
                machine={machine}
                shiftStart={vm.shiftStart}
                shiftEnd={vm.shiftEnd}
                breakTimeWindow={vm.breakTimeWindow}
                onOpenFormula={onOpenFormula}
                livePoints={livePoints}
                isDark={vm.isDark}
              />
            </div>

            {/* RIGHT COLUMN */}
            <div
              id="oee-right-grid-group"
              className="lg:col-span-4 flex flex-col gap-[1vh] min-h-0 h-full overflow-hidden"
            >
              {/* Time Summary */}
              <div className="flex-[1.1] min-h-0 overflow-hidden">
                <TimeSummaryPanel
                  metrics={metrics}
                  shiftDurationMin={machine.shiftDurationMinutes}
                  plannedStopMin={machine.plannedDowntimeMinutes}
                  useBackend={useBackend}
                />
              </div>

              {/* Production Rate */}
              <ProductionRateCard
                currentRate={vm.currentRate}
                targetRate={vm.targetRate}
                targetCycleTimeSec={vm.targetCycleTimeSec}
                actualCycleTimeSec={vm.actualCycleTimeSec}
                speedEffRatio={vm.speedEffRatio}
                speedEffPct={vm.speedEffPct}
                speedEffColor={vm.speedEffColor}
                isDark={vm.isDark}
              />

              {/* Floor Push Buttons */}
              {!useBackend && (
                <FloorPushButtonsPanel
                  machine={machine}
                  onUpdateMachineStatus={onUpdateMachineStatus}
                  onLogReject={onLogReject}
                  onDispatchMqttCommand={onDispatchMqttCommand}
                  onRequestWorkOrder={() => setIsQrModalOpen(true)}
                />
              )}
            </div>
          </div>

          {/* LOWER: Progress & Shift Timeline */}
          <div
            id="shift-progress-fullwidth"
            className="shrink-0 h-[clamp(110px,16vh,190px)] min-h-0 w-full overflow-hidden"
          >
            <PasXProgressStrip
              machine={machine}
              metrics={metrics}
              useBackend={useBackend}
              serverSegments={shiftSegments}
            />
          </div>
        </main>

        {/* 4. FOOTER */}
        <FullscreenFooter
          machineName={vm.machineName}
          machineLine={vm.machineLine}
          connectionStatus={machine.connectionStatus}
          plannedProductionTimeMin={metrics.plannedProductionTimeMin}
          plannedDowntimeMinutes={machine.plannedDowntimeMinutes}
          isStale={vm.staleAgeSec !== null && vm.staleAgeSec > 60}
          staleAgeSec={vm.staleAgeSec}
          useBackend={useBackend}
          onOpenMqttModal={onOpenMqttModal}
          isDark={vm.isDark}
          formatStaffed={vm.formatStaffed}
        />
      </div>
    </div>
  );
};
