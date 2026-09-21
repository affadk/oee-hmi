// /src/presentation/pages/DashboardPage.tsx

import React from 'react';
import { useOeeDashboard } from '../../application/hooks/useOeeDashboard';
import { useTheme } from '../../application/hooks/useTheme';
import { FullscreenOeeView } from '../../components/fullscreen/FullscreenOeeView';
import { HeaderZone } from '../../components/HeaderZone';
import { HeroKpiZone } from '../../components/HeroKpiZone';
import { ProductionZone } from '../../components/ProductionZone';
import { MachineStatusZone } from '../../components/MachineStatusZone';
import { LossAnalysisZone } from '../../components/LossAnalysisZone';
import { TrendZone } from '../../components/TrendZone';
import { AlarmsZone } from '../../components/AlarmsZone';
import { LogEventModal } from '../../components/LogEventModal';
import { FormulaHelpModal } from '../../components/FormulaHelpModal';
import { MqttEdgeInspectorModal } from '../../components/MqttEdgeInspectorModal';
import { LayoutDashboard, Tv, Sun, Moon } from 'lucide-react';

/**
 * Presentation Page: DashboardPage
 * A presentational coordinator that binds Application Hook state to Presentational UI views.
 */
export const DashboardPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const dashboard = useOeeDashboard();

  return (
    <div
      id="dashboard-root-layout"
      className={`font-sans selection:bg-blue-600 selection:text-white transition-colors ${
        isDark ? 'bg-[#070d1a] text-slate-100' : 'bg-slate-100 text-slate-900'
      } ${dashboard.viewMode === 'FULLSCREEN_IMAGE' ? 'h-screen max-h-screen overflow-hidden flex flex-col' : 'min-h-screen'}`}
    >
      {/* Floating View & Theme Mode Switcher (hidden in fullscreen mode) */}
      {!dashboard.isFullscreen && (
        <div
          id="floating-view-switcher"
          className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 backdrop-blur-md rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xl border transition-colors ${
            isDark
              ? 'bg-[#0b1528]/90 border-[#1e3a5f] text-slate-300'
              : 'bg-white/95 border-slate-300 text-slate-700'
          }`}
        >
          <button
            id="btn-switch-fullscreen-view"
            onClick={() => dashboard.setViewMode('FULLSCREEN_IMAGE')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              dashboard.viewMode === 'FULLSCREEN_IMAGE'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>OEE Shift Overview</span>
          </button>

          <button
            id="btn-switch-audit-view"
            onClick={() => dashboard.setViewMode('DETAILED_AUDIT')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              dashboard.viewMode === 'DETAILED_AUDIT'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Detailed Audit Dashboard</span>
          </button>

          <span className={`w-[1px] h-4 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></span>

          {/* Quick Theme Switcher Button */}
          <button
            id="btn-quick-toggle-theme"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'hover:bg-slate-800 text-amber-300'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      )}

      {dashboard.viewMode === 'FULLSCREEN_IMAGE' ? (
        /* FULLSCREEN SINGLE-SCREEN VIEW (Industrial reference layout) */
        <FullscreenOeeView
          machine={dashboard.currentMachine}
          allMachines={dashboard.machines}
          metrics={dashboard.currentMetrics}
          isFullscreen={dashboard.isFullscreen}
          onToggleFullscreen={dashboard.toggleBrowserFullscreen}
          onOpenMqttModal={dashboard.openMqttModal}
          isSimulating={dashboard.isSimulating}
          onToggleSimulate={dashboard.toggleSimulate}
          onSwitchMachine={dashboard.selectMachine}
          onOpenFormula={dashboard.openFormulaModal}
          onViewAllEvents={() => dashboard.setViewMode('DETAILED_AUDIT')}
          onUpdateMachineStatus={dashboard.updateMachineStatus}
          onLogReject={dashboard.logReject}
          onDispatchMqttCommand={dashboard.dispatchMqttCommand}
          onApplyJobConfig={dashboard.dispatchMqttJobConfig}
        />
      ) : (
        /* DETAILED AUDIT DASHBOARD VIEW */
        <div
          id="detailed-audit-view-container"
          className={`min-h-screen flex flex-col transition-colors ${
            isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
          }`}
        >
          {/* Header Zone */}
          <HeaderZone
            currentMachine={dashboard.currentMachine}
            allMachines={dashboard.machines}
            selectedPlant={dashboard.selectedPlant}
            selectedLine={dashboard.selectedLine}
            selectedShift={dashboard.selectedShift}
            selectedDate={dashboard.selectedDate}
            isSimulating={dashboard.isSimulating}
            onSelectMachine={dashboard.selectMachine}
            onSelectLine={dashboard.selectLine}
            onSelectShift={dashboard.selectShift}
            onToggleSimulate={dashboard.toggleSimulate}
            onOpenLogModal={dashboard.openLogModal}
            onOpenHelpModal={() => dashboard.openFormulaModal('OEE')}
            teepEnabled={dashboard.teepEnabled}
            onToggleTeep={dashboard.toggleTeep}
          />

          {/* Main Content Sections - Full width across screen */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-20">
            <HeroKpiZone
              metrics={dashboard.currentMetrics}
              machine={dashboard.currentMachine}
              teepEnabled={dashboard.teepEnabled}
              onOpenFormula={dashboard.openFormulaModal}
            />

            <ProductionZone
              metrics={dashboard.currentMetrics}
              machine={dashboard.currentMachine}
            />

            <MachineStatusZone
              machine={dashboard.currentMachine}
              allMachines={dashboard.machines}
              metrics={dashboard.currentMetrics}
              onSelectMachine={dashboard.selectMachine}
              onUpdateMachineStatus={dashboard.updateMachineStatus}
            />

            <LossAnalysisZone
              machine={dashboard.currentMachine}
              metrics={dashboard.currentMetrics}
            />

            <TrendZone
              hourlyTrends={dashboard.currentMachine.hourlyTrends}
              targetOee={dashboard.currentMachine.targetOee}
              totalTargetQty={dashboard.currentMachine.jobConfig?.targetQuantity ?? dashboard.currentMachine.targetCount}
              totalCount={dashboard.currentMachine.telemetry?.tot ?? dashboard.currentMachine.totalCount}
            />

            <AlarmsZone
              alarms={dashboard.alarms}
              onAcknowledgeAlarm={dashboard.acknowledgeAlarm}
              onResolveAlarm={dashboard.resolveAlarm}
            />
          </main>

          <footer
            id="audit-view-footer"
            className={`w-full border-t px-4 sm:px-6 lg:px-8 py-3 text-center text-xs font-mono transition-colors ${
              isDark ? 'border-slate-900 bg-slate-950/80 text-slate-500' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Single-Page OEE Manufacturing Floor Dashboard • ISO 22400 / TPM Compliant • Availability (91.2%) × Performance (94.5%) × Quality (95.6%) = 82.4%
          </footer>
        </div>
      )}

      {/* Modals */}
      <LogEventModal
        isOpen={dashboard.isLogModalOpen}
        onClose={dashboard.closeLogModal}
        machineId={dashboard.currentMachine.id}
        onAddDowntime={dashboard.logDowntime}
        onAddReject={dashboard.logReject}
      />

      <FormulaHelpModal
        isOpen={dashboard.isHelpModalOpen}
        onClose={dashboard.closeFormulaModal}
        highlightMetric={dashboard.formulaMetricHighlight}
      />

      {/* MQTT Edge Controller Inspector Modal */}
      <MqttEdgeInspectorModal
        isOpen={dashboard.isMqttModalOpen}
        onClose={dashboard.closeMqttModal}
        machine={dashboard.currentMachine}
        onSendCommand={dashboard.dispatchMqttCommand}
        onSendJobConfig={dashboard.dispatchMqttJobConfig}
      />
    </div>
  );
};
