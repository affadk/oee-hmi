// /src/presentation/pages/OverviewPage.tsx
// "OEE Shift Overview" page — route /overview. TV/floor fullscreen layout.
// Presentational only: data + actions arrive via the shared dashboard outlet
// context from the parent route (DashboardPage). "Audit View" navigates to
// the /audit route.

import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FullscreenOeeView } from './components/FullscreenOeeView';
import type { DashboardOutletContext } from '../DashboardPage';

export const OverviewPage: React.FC = () => {
  const { dashboard, isFullscreen, toggleBrowserFullscreen } = useOutletContext<DashboardOutletContext>();
  const navigate = useNavigate();

  const machine = dashboard.currentMachine;
  const metrics = dashboard.currentMetrics;
  if (!machine || !metrics) return null;

  return (
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
      onViewAllEvents={() => navigate('/audit')}
      onUpdateMachineStatus={dashboard.updateMachineStatus}
      onLogReject={dashboard.logReject}
      onDispatchMachineCommand={dashboard.dispatchMachineCommand}
      commandsDisabled={!dashboard.canSendCommands}
      disabledReason={dashboard.gateReason}
      onApplyJobConfig={dashboard.applyJobConfig}
      backendHealth={dashboard.backendHealth}
      catalog={dashboard.catalog}
      onRefreshCatalog={dashboard.refreshCatalog}
      shiftSegments={dashboard.shiftSegments}
      livePoints={dashboard.liveTrend}
      workOrderPreview={dashboard.workOrderPreview}
      onPreviewWorkOrder={dashboard.previewWorkOrder}
      onProceedToSetup={dashboard.openProductionSetupModal}
      machineLine={dashboard.machineLine}
      sessionOperatorId={dashboard.authSession?.operator.id ?? null}
      onInitiateFromZones={dashboard.initiateFromZones}
    />
  );
};