// /src/presentation/pages/DashboardPage.tsx
// Presentation coordinator & parent route: wires DI container (via providers)
// into the application hook, owns fullscreen side effects, the loading/error
// shells, the shared modal layer, and the floating page switcher.
// Must NOT fetch, MUST NOT touch repositories — only hooks + UI composition.
//
// The two pages — OEE Shift Overview (/overview) and Detailed Audit Dashboard
// (/audit) — render as child routes via <Outlet>, sharing ONE dashboard state
// instance so switching pages never refetches or resets machine/session state.

import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useOeeDashboard } from '../../application/hooks/useOeeDashboard';
import type { UseOeeDashboardReturn } from '../../application/hooks/useOeeDashboard';
import { useTheme } from '../providers/ThemeProvider';
import { useDiContainer } from '../providers/DiProvider';
import { useFullscreen } from '../hooks/useFullscreen';
import { LogEventModal } from '../components/modals/LogEventModal';
import { FormulaHelpModal } from '../components/modals/FormulaHelpModal';
import { MqttEdgeInspectorModal } from '../components/modals/MqttEdgeInspectorModal/MqttEdgeInspectorModal';
import { AuthPinModal } from '../components/modals/AuthPinModal';
import { DeviceConfigModal } from '../components/modals/DeviceConfigModal/DeviceConfigModal';
import { ProductionSetupModal } from '../components/modals/ProductionSetupModal';
import { WorkOrderDetailModal } from '../components/modals/WorkOrderDetailModal';
import { LayoutDashboard, Tv, Sun, Moon } from 'lucide-react';

/** Shape handed to child pages through the router outlet context. */
export interface DashboardOutletContext {
  dashboard: UseOeeDashboardReturn;
  isFullscreen: boolean;
  toggleBrowserFullscreen: () => void;
}

export const DashboardPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const container = useDiContainer();
  const { isFullscreen, toggleBrowserFullscreen } = useFullscreen();
  const navigate = useNavigate();
  const location = useLocation();
  // Halaman aktif dari URL: satu-satunya route selain /audit adalah /overview.
  const isOverview = location.pathname !== '/audit';

  const deps = useMemo(() => ({
    calculateOeeUseCase: container.calculateOeeUseCase,
    getMachinesUseCase: container.getMachinesUseCase,
    updateMachineStatusUseCase: container.updateMachineStatusUseCase,
    logDowntimeUseCase: container.logDowntimeUseCase,
    logRejectUseCase: container.logRejectUseCase,
    simulateMachinePulseUseCase: container.simulateMachinePulseUseCase,
    manageAlarmsUseCase: container.manageAlarmsUseCase,
    machineCommandUseCase: container.machineCommandUseCase,
    getDowntimeReasonsUseCase: container.getDowntimeReasonsUseCase,
    getActiveDowntimesUseCase: container.getActiveDowntimesUseCase,
    getHourlyTrendsUseCase: container.getHourlyTrendsUseCase,
    getRejectBreakdownUseCase: container.getRejectBreakdownUseCase,
    getAggregateUseCase: container.getAggregateUseCase,
    getHistoryUseCase: container.getHistoryUseCase,
    subscribeTelemetryUseCase: container.subscribeTelemetryUseCase,
    listLabelableDowntimesUseCase: container.listLabelableDowntimesUseCase,
    labelDowntimeReasonUseCase: container.labelDowntimeReasonUseCase,
    configureDeviceUseCase: container.configureDeviceUseCase,
    listWorkOrdersUseCase: container.listWorkOrdersUseCase,
    exportTelemetryUseCase: container.exportTelemetryUseCase,
    getHealthUseCase: container.getHealthUseCase,
    errorReporter: container.errorReporter,
    getShiftSummaryUseCase: container.getShiftSummaryUseCase,
    getShiftTimelineUseCase: container.getShiftTimelineUseCase,
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
  const outletContext: DashboardOutletContext = {
    dashboard,
    isFullscreen,
    toggleBrowserFullscreen,
  };

  return (
    <div
      id="dashboard-root-layout"
      className={`font-sans selection:bg-blue-600 selection:text-white transition-colors w-full max-w-full overflow-x-clip min-h-screen ${
        isDark ? 'bg-[#070d1a] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
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
            onClick={() => navigate('/overview')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOverview
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>OEE Shift Overview</span>
          </button>

          <button type="button"
            id="btn-switch-audit-view"
            onClick={() => navigate('/audit')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              !isOverview
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
      <Outlet context={outletContext} />

      <LogEventModal
        isOpen={dashboard.isLogModalOpen}
        onClose={dashboard.closeLogModal}
        machineId={dashboard.currentMachine.id}
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
        machine={dashboard.currentMachine}
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
        onSaveMachineMetadata={dashboard.saveMachineMetadata}
        onBindDevice={dashboard.bindDeviceToMachine}
        onUnbindDevice={dashboard.unbindDeviceFromMachine}
      />

      <ProductionSetupModal
        isOpen={dashboard.isProductionSetupModalOpen}
        onClose={dashboard.closeProductionSetupModal}
        isBackendMode={dashboard.useBackend}
        machineId={dashboard.currentMachine.id}
        deviceId={dashboard.currentMachine.deviceId || null}
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
        onOpenDetail={dashboard.openWorkOrderDetail}
      />

      <WorkOrderDetailModal
        isOpen={dashboard.isWorkOrderDetailOpen}
        detail={dashboard.workOrderDetail}
        onClose={dashboard.closeWorkOrderDetail}
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