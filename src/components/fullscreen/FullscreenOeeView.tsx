import React from 'react';
import { FullscreenHeader } from './FullscreenHeader';
import { EChartsKpiGauge } from '../echarts/EChartsKpiGauge';
import { EChartsOeeTrend } from '../echarts/EChartsOeeTrend';
import { EChartsProdVsTarget } from '../echarts/EChartsProdVsTarget';
import { EChartsComponentBreakdown } from '../echarts/EChartsComponentBreakdown';
import { MachineStatusPanel } from './MachineStatusPanel';
import { ProductionSummaryPanel } from './ProductionSummaryPanel';
import { TimeSummaryPanel } from './TimeSummaryPanel';
import { DowntimeLossPanel } from './DowntimeLossPanel';
import { TopDowntimeReasonsPanel } from './TopDowntimeReasonsPanel';
import { EChartsRejectReason } from '../echarts/EChartsRejectReason';
import { RecentEventsPanel } from './RecentEventsPanel';
import { MachineConfig, CalculatedOeeMetrics } from '../../types';
import { Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      id="oee-fullscreen-video-canvas"
      className={`h-screen w-screen overflow-hidden flex flex-col justify-between font-sans select-none transition-colors ${
        isDark ? 'bg-[#070d1a] text-slate-100' : 'bg-[#f1f5f9] text-slate-900'
      }`}
    >
      {/* 1. Header Bar matching image.png */}
      <FullscreenHeader
        machine={machine}
        allMachines={allMachines}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onOpenMqttModal={onOpenMqttModal}
        isSimulating={isSimulating}
        onToggleSimulate={onToggleSimulate}
        onSwitchMachine={onSwitchMachine}
      />

      {/* 2. Main Grid: 4 Rows perfectly fitted in viewport without scroll */}
      <main className="flex-1 min-h-0 px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col justify-between gap-2 sm:gap-2.5 overflow-hidden">
        {/* ROW 1: 4 Hero KPI Cards with Donut Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
          {/* OEE */}
          <EChartsKpiGauge
            title="OEE"
            value={82.4}
            target={85.0}
            gap={-2.6}
            color="#10b981"
            onClick={() => onOpenFormula('OEE')}
          />

          {/* Availability */}
          <EChartsKpiGauge
            title="Availability"
            value={91.2}
            target={92.0}
            gap={-0.8}
            color="#0ea5e9"
            onClick={() => onOpenFormula('Availability')}
          />

          {/* Performance */}
          <EChartsKpiGauge
            title="Performance"
            value={94.5}
            target={95.0}
            gap={-0.5}
            color="#f59e0b"
            onClick={() => onOpenFormula('Performance')}
          />

          {/* Quality */}
          <EChartsKpiGauge
            title="Quality"
            value={95.6}
            target={98.0}
            gap={-2.4}
            color="#a855f7"
            onClick={() => onOpenFormula('Quality')}
          />
        </div>

        {/* ROW 2: 3 ECharts Panels (Trend 5/12, Production 4/12, Breakdown 3/12) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 flex-1 min-h-[140px] max-h-[30vh]">
          {/* OEE Trend (Last 8 Hours) */}
          <div className="md:col-span-5 h-full min-h-0">
            <EChartsOeeTrend hourlyTrends={machine.hourlyTrends} />
          </div>

          {/* Production vs Target */}
          <div className="md:col-span-4 h-full min-h-0">
            <EChartsProdVsTarget hourlyTrends={machine.hourlyTrends} />
          </div>

          {/* OEE Component Breakdown */}
          <div className="md:col-span-3 h-full min-h-0">
            <EChartsComponentBreakdown
              oee={82.4}
              availability={91.2}
              performance={94.5}
              quality={95.6}
            />
          </div>
        </div>

        {/* ROW 3: 4 Panels (Machine Status, Production Summary, Time Summary, Downtime Loss) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 flex-1 min-h-[110px] max-h-[22vh]">
          {/* Machine Status */}
          <div className="h-full min-h-0">
            <MachineStatusPanel machine={machine} />
          </div>

          {/* Production Summary */}
          <div className="h-full min-h-0">
            <ProductionSummaryPanel
              target={1000}
              actual={945}
              good={904}
              reject={41}
            />
          </div>

          {/* Time Summary */}
          <div className="h-full min-h-0">
            <TimeSummaryPanel
              shiftDurationMin={480}
              plannedStopMin={60}
              plannedProdTimeMin={420}
              runTimeMin={378}
              unplannedDowntimeMin={42}
            />
          </div>

          {/* Downtime Loss */}
          <div className="h-full min-h-0">
            <DowntimeLossPanel
              totalDowntimeMin={42}
              plannedProdTimeMin={420}
            />
          </div>
        </div>

        {/* ROW 4: 3 Panels (Top 5 Downtime Reasons, Reject Reason Donut, Recent Events Table) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 flex-1 min-h-[120px] max-h-[25vh]">
          {/* Top 5 Downtime Reasons */}
          <div className="lg:col-span-4 h-full min-h-0">
            <TopDowntimeReasonsPanel />
          </div>

          {/* Reject Reason ECharts Donut */}
          <div className="lg:col-span-4 h-full min-h-0">
            <EChartsRejectReason
              rejectReasons={machine.rejectReasons}
              totalRejects={41}
            />
          </div>

          {/* Recent Events Table */}
          <div className="lg:col-span-4 h-full min-h-0">
            <RecentEventsPanel onViewAll={onViewAllEvents} />
          </div>
        </div>
      </main>

      {/* 3. Footer matching image.png */}
      <footer className={`px-4 py-1.5 flex items-center justify-between text-xs shrink-0 select-none border-t transition-colors ${
        isDark ? 'bg-[#0b1528] border-[#162744] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Smart Factory</span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Better Performance, Higher Productivity</span>
        </div>

        <div className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <span>18 Sep 2026 14:32</span>
        </div>
      </footer>
    </div>
  );
};
