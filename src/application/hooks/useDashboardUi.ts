// /src/application/hooks/useDashboardUi.ts
// Focused hook: view-level UI state (simulation toggle, TEEP,
// modal visibility, formula highlight). No use-cases, no IO.
// LAYER RULES: React only — no domain/infrastructure imports needed.

import { useCallback, useEffect, useState } from 'react';

export interface DashboardUiApi {
  isSimulating: boolean;
  toggleSimulate: () => void;
  teepEnabled: boolean;
  toggleTeep: () => void;
  isLogModalOpen: boolean;
  openLogModal: () => void;
  closeLogModal: () => void;
  isHelpModalOpen: boolean;
  openFormulaModal: (metricName: string) => void;
  closeFormulaModal: () => void;
  isMqttModalOpen: boolean;
  openMqttModal: () => void;
  closeMqttModal: () => void;
  formulaMetricHighlight: string;
}

export function useDashboardUi(useBackend: boolean): DashboardUiApi {
  const [isSimulating, setIsSimulating] = useState<boolean>(!useBackend);
  const [teepEnabled, setTeepEnabled] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isMqttModalOpen, setIsMqttModalOpen] = useState<boolean>(false);
  const [formulaMetricHighlight, setFormulaMetricHighlight] = useState<string>('OEE');

  // Sync simulation state with data source mode
  useEffect(() => {
    if (useBackend) {
      setIsSimulating(false);
    }
  }, [useBackend]);

  const toggleSimulate = useCallback(() => setIsSimulating((prev) => !prev), []);
  const toggleTeep = useCallback(() => setTeepEnabled((prev) => !prev), []);

  const openFormulaModal = useCallback((metricName: string) => {
    setFormulaMetricHighlight(metricName);
    setIsHelpModalOpen(true);
  }, []);
  const closeFormulaModal = useCallback(() => setIsHelpModalOpen(false), []);
  const openLogModal = useCallback(() => setIsLogModalOpen(true), []);
  const closeLogModal = useCallback(() => setIsLogModalOpen(false), []);
  const openMqttModal = useCallback(() => setIsMqttModalOpen(true), []);
  const closeMqttModal = useCallback(() => setIsMqttModalOpen(false), []);

  return {
    isSimulating,
    toggleSimulate,
    teepEnabled,
    toggleTeep,
    isLogModalOpen,
    openLogModal,
    closeLogModal,
    isHelpModalOpen,
    openFormulaModal,
    closeFormulaModal,
    isMqttModalOpen,
    openMqttModal,
    closeMqttModal,
    formulaMetricHighlight,
  };
}
