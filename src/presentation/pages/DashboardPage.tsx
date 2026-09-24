// /src/presentation/pages/DashboardPage.tsx
// Presentation coordinator: wires DI container (via providers) into the
// application hook, owns fullscreen side effects, renders presentational zones.
// Must NOT fetch, MUST NOT touch repositories — only hooks + UI composition.

import React, { useMemo } from 'react';
import { useOeeDashboard } from '../../application/hooks/useOeeDashboard';
import { useTheme } from '../providers/ThemeProvider';
import { useDiContainer } from '../providers/DiProvider';
import { useFullscreen } from '../hooks/useFullscreen';
import { FullscreenOeeView } from '../components/fullscreen/FullscreenOeeView';
import { HeaderZone } from '../components/HeaderZone';
import { HeroKpiZone } from '../components/HeroKpiZone';
import { ProductionZone } from '../components/ProductionZone';
import { MachineStatusZone } from '../components/MachineStatusZone';
import { LossAnalysisZone } from '../components/LossAnalysisZone';
import { TrendZone } from '../components/TrendZone';
import { AlarmsZone } from '../components/AlarmsZone';
import { LogEventModal } from '../components/LogEventModal';
import { FormulaHelpModal } from '../components/FormulaHelpModal';
import { MqttEdgeInspectorModal } from '../components/MqttEdgeInspectorModal';
import { AuthPinModal } from '../components/AuthPinModal';
import { DeviceConfigModal } from '../components/DeviceConfigModal';
import { ProductionSetupModal } from '../components/ProductionSetupModal';
import { LayoutDashboard, Tv, Sun, Moon } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const container = useDiContainer();
  const { isFullscreen, toggleBrowserFullscreen } = useFullscreen();

  const deps = useMemo(() => ({
    calculateOeeUseCase: container.calculateOeeUseCase,
    getMachinesUseCase: container.getMachinesUseCase,
    updateMachineStatusUseCase: container.updateMachineStatusUseCase,
    logDowntimeUseCase: container.logDowntimeUseCase,
    logRejectUseCase: container.logRejectUseCase,
    simulateMachinePulseUseCase: container.simulateMachinePulseUseCase,
    manageAlarmsUseCase: container.manageAlarmsUseCase,
    mqttEdgeCommandUseCase: container.mqttEdgeCommandUseCase,
    getDowntimeReasonsUseCase: container.getDowntimeReasonsUseCase,
    getHourlyTrendsUseCase: container.getHourlyTrendsUseCase,
    subscribeTelemetryUseCase: container.subscribeTelemetryUseCase,
    listLabelableDowntimesUseCase: container.listLabelableDowntimesUseCase,
    labelDowntimeReasonUseCase: container.labelDowntimeReasonUseCase,
    configureDeviceUseCase: container.configureDeviceUseCase,
    listWorkOrdersUseCase: container.listWorkOrdersUseCase,
    authGateway: container.authGateway,
    useBackend: container.useBackend,
  }), [container]);

  const dashboard = useOeeDashboard(deps);

  if (dashboard.loadError && !dashboard.currentMachine && !dashboard.isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#070d1a] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
        <div className={`max-w-md w-full rounded-xl border p-6 text-center shadow-xl ${isDark ? 'bg-[#0d1728] border-slate-800' : 'bg-white border-slate-300'}`}>
          <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Backend tidak terjangkau</h2>
          <p className="mt-2 text-xs font-mono break-words">{dashboard.loadError}</p>
          <p className="mt-2 text-xs opacity-80">Periksa docker gateway / proxy, lalu coba lagi. {dashboard.useBackend ? '' : 'Aktifkan VITE_USE_BACKEND=true untuk lane backend.'}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={dashboard.retryLoad}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold cursor-pointer"
            >
              Coba lagi
            </button>
            {dashboard.useBackend && (
              <button
                type="button"
                onClick={dashboard.openAuthModal}
                className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer border ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-200 text-slate-800'}`}
              >
                Login operator
              </button>
            )}
          </div>
        </div>
        <AuthPinModal
          isOpen={dashboard.isAuthModalOpen}
          error={dashboard.authError}
          onClose={dashboard.closeAuthModal}
          onSubmit={(pin, operatorId) => dashboard.loginWithPin(pin, operatorId)}
        />
      </div>
    );
  }

  if (dashboard.isLoading || !dashboard.currentMachine || !dashboard.currentMetrics) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-mono text-sm ${isDark ? 'bg-[#070d1a] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
        Loading OEE dashboard…
      </div>
    );
  }

  const machine = dashboard.currentMachine;
  const metrics = dashboard.currentMetrics;

  return (
    <div
      id="dashboard-root-layout"
      className={`font-sans selection:bg-blue-600 selection:text-white transition-colors w-full max-w-full overflow-x-clip ${
        isDark ? 'bg-[#070d1a] text-slate-100' : 'bg-slate-100 text-slate-900'
      } ${dashboard.viewMode === 'FULLSCREEN_IMAGE' ? 'h-screen max-h-screen overflow-hidden flex flex-col' : 'min-h-screen'}`}
    >
      {!isFullscreen && (
        <div
          id="floating-view-switcher"
          className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 backdrop-blur-md rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xl border transition-colors ${
            isDark
              ? 'bg-[#0b1528]/90 border-[#1e3a5f] text-slate-300'
              : 'bg-white/95 border-slate-300 text-slate-700'
          }`}
        >
          <button type="button"
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

          <button type="button"
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

          <button type="button"
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
        <FullscreenOeeView
          machine={machine}
          allMachines={dashboard.machines}
          metrics={metrics}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleBrowserFullscreen}
          onOpenMqttModal={dashboard.openMqttModal}
          isSimulating={dashboard.isSimulating}
          useBackend={dashboard.useBackend}
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
            onUpdateMachineStatus={dashboard.updateMachineStatus}
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
              onUpdateMachineStatus={dashboard.updateMachineStatus}
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
              alarms={dashboard.alarms}
              onAcknowledgeAlarm={dashboard.acknowledgeAlarm}
              onResolveAlarm={dashboard.resolveAlarm}
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
                <span>Status: <strong className={machine.connectionStatus === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}>{machine.connectionStatus || '—'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span>Planned Time: <strong>{metrics.plannedProductionTimeMin || 420}m</strong></span>
                <span>OEE: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{metrics.oeePct?.toFixed(1)}%</strong></span>
                <span className="hidden sm:inline">A × P × Q = {metrics.availabilityPct?.toFixed(1)}% × {metrics.performancePct?.toFixed(1)}% × {metrics.qualityPct?.toFixed(1)}%</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      <LogEventModal
        isOpen={dashboard.isLogModalOpen}
        onClose={dashboard.closeLogModal}
        machineId={machine.id}
        onAddDowntime={dashboard.logDowntime}
        onAddReject={dashboard.logReject}
        isBackendMode={dashboard.useBackend}
        labelableDowntimes={dashboard.labelableDowntimes}
      />

      <FormulaHelpModal
        isOpen={dashboard.isHelpModalOpen}
        onClose={dashboard.closeFormulaModal}
        highlightMetric={dashboard.formulaMetricHighlight}
      />

      {/* MQTT Edge Inspector — lane simulasi saja. Lane backend memakai
          Perangkat + Setup Produksi (REST nyata). */}
      {!dashboard.useBackend && (
      <MqttEdgeInspectorModal
        isOpen={dashboard.isMqttModalOpen}
        onClose={dashboard.closeMqttModal}
        machine={machine}
        onSendCommand={dashboard.dispatchMqttCommand}
        onSendJobConfig={dashboard.dispatchMqttJobConfig}
        useBackend={dashboard.useBackend}
      />
      )}

      <DeviceConfigModal
        isOpen={dashboard.isDeviceConfigModalOpen}
        onClose={dashboard.closeDeviceConfigModal}
        registry={dashboard.deviceRegistry}
        registryError={dashboard.deviceRegistryError}
        isBackendMode={dashboard.useBackend}
        onRefresh={dashboard.refreshDeviceRegistry}
        onSaveDeviceMetadata={dashboard.saveDeviceMetadata}
        onBindDevice={dashboard.bindDeviceToMachine}
        onUnbindDevice={dashboard.unbindDeviceFromMachine}
      />

      <ProductionSetupModal
        isOpen={dashboard.isProductionSetupModalOpen}
        onClose={dashboard.closeProductionSetupModal}
        isBackendMode={dashboard.useBackend}
        machineId={machine.id}
        deviceId={machine.deviceId || null}
        pendingWorkOrders={dashboard.pendingWorkOrders}
        workOrderError={dashboard.workOrderError}
        preview={dashboard.workOrderPreview}
        busy={dashboard.productionSetupBusy}
        onLoadPending={dashboard.loadPendingWorkOrders}
        onPreview={dashboard.previewWorkOrder}
        onClearPreview={dashboard.clearWorkOrderPreview}
        onDispatch={dashboard.dispatchWorkOrder}
        onComplete={dashboard.completeWorkOrder}
        onCancel={dashboard.cancelWorkOrder}
      />

      <AuthPinModal
        isOpen={dashboard.isAuthModalOpen}
        error={dashboard.authError}
        onClose={dashboard.closeAuthModal}
        onSubmit={(pin, operatorId) => dashboard.loginWithPin(pin, operatorId)}
      />
    </div>
  );
};
