import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { telemetryAgeSec } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';
import { HeaderZone } from './components/HeaderZone';
import { HeroKpiZone } from './components/zones/HeroKpiZone';
import { ProductionZone } from './components/zones/ProductionZone';
import { MachineStatusZone } from './components/zones/MachineStatusZone';
import { LossAnalysisZone } from './components/zones/LossAnalysisZone';
import { TrendZone } from './components/zones/TrendZone';
import { AlarmsZone } from './components/zones/AlarmsZone';
import type { DashboardOutletContext } from '../DashboardPage';
import { HealthFooter } from '../../components/footer/HealthFooter';
import { connectionWord } from '../../utils/statusWords';

export const AuditPage: React.FC = () => {
  const { dashboard } = useOutletContext<DashboardOutletContext>();
  const { isDark } = useTheme();
  const machine = dashboard.currentMachine;
  const metrics = dashboard.currentMetrics;
  if (!machine || !metrics) return null;

  // Spec §4: seperti footer fullscreen — tandai basi, jangan sembunyikan angka.
  const staleAgeSec = telemetryAgeSec(machine.lastTelemetryTs);

  return (
    <div
      id="detailed-audit-view-container"
      className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#080e1a] text-slate-100' : 'bg-[#e9edf4] text-slate-900'
      }`}
    >
      <HeaderZone
        currentMachine={machine}
        allMachines={dashboard.machines}
        metrics={metrics}
        selectedPlant={dashboard.selectedPlant}
        selectedLine={dashboard.selectedLine}
        selectedShift={dashboard.selectedShift}
        selectedDate={dashboard.selectedDate}
        isSimulating={dashboard.isSimulating}
        useBackend={dashboard.useBackend}
        onSelectMachine={dashboard.selectMachine}
        onSelectLine={dashboard.selectLine}
        onSelectShift={dashboard.selectShift}
        onToggleSimulate={dashboard.toggleSimulate}
        onOpenLogModal={dashboard.openLogModal}
        onOpenHelpModal={() => dashboard.openFormulaModal('OEE')}
        onOpenMqttModal={dashboard.openMqttModal}
        onOpenProductionSetup={() => {
          dashboard.openProductionSetupModal();
          void dashboard.loadPendingWorkOrders().catch(() => undefined);
        }}
        onOpenDeviceConfig={dashboard.openDeviceConfigModal}
        teepEnabled={dashboard.teepEnabled}
        onToggleTeep={dashboard.toggleTeep}
      />
      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-clip px-[1vw] py-[1vh] space-y-[1vh] pb-20">
        <HeroKpiZone
          metrics={metrics}
          machine={machine}
          teepEnabled={dashboard.teepEnabled}
          onOpenFormula={dashboard.openFormulaModal}
        />

        <ProductionZone
          metrics={metrics}
          machine={machine}
        />

        <MachineStatusZone
          machine={machine}
          allMachines={dashboard.machines}
          metrics={metrics}
          onSelectMachine={dashboard.selectMachine}
          onExportTelemetry={dashboard.exportTelemetry}
        />

        <LossAnalysisZone
          machine={machine}
          metrics={metrics}
        />

        <TrendZone
          hourlyTrends={machine.hourlyTrends}
          targetOee={machine.targetOee}
          totalTargetQty={machine.jobConfig?.targetQuantity ?? machine.targetCount}
          totalCount={machine.telemetry?.tot ?? machine.totalCount}
          dataWarning={dashboard.supplementalError || undefined}
        />

        <AlarmsZone
          ackDisabled={!dashboard.canAckAlarm}
          alarms={dashboard.alarms}
          onAcknowledgeAlarm={dashboard.acknowledgeAlarm}
          onResolveAlarm={dashboard.resolveAlarm}
          activeDowntimeCount={dashboard.activeDowntimeCount}
        />
      </main>

      <footer
        id="audit-view-footer"
        className={`w-full px-[1.2vw] py-[0.8vh] border-t text-xs font-mono transition-colors ${
          isDark ? 'bg-[#0d1728] border-slate-800 text-slate-400' : 'bg-[#e2e8f0] border-[#c4cbd5] text-slate-600'
        }`}
      >
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>Machine: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.name}</strong></span>
            <span>Line: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.line}</strong></span>
            <span>Status: <strong className={machine.connectionStatus === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}>{connectionWord(machine.connectionStatus)}</strong></span>
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
            <HealthFooter health={dashboard.backendHealth} useBackend={dashboard.useBackend} isDark={isDark} />
            <span>Planned Time: <strong>{metrics.plannedProductionTimeMin || 420}m</strong></span>
            <span>OEE: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{metrics.oeePct?.toFixed(1)}%</strong></span>
            <span className="hidden sm:inline">A × P × Q = {metrics.availabilityPct?.toFixed(1)}% × {metrics.performancePct?.toFixed(1)}% × {metrics.qualityPct?.toFixed(1)}%</span>
          </div>
        </div>
      </footer>
    </div>
  );
};