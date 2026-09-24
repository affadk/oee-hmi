// /src/application/hooks/useWorkOrders.ts
// Focused hook: backend work-order lifecycle (pending list, resolve preview,
// dispatch/complete/cancel) + production-setup modal.
// LAYER RULES: domain ports + React only — no infrastructure/*, no seeds, no DOM.

import { useCallback, useState } from 'react';
import type { MachineConfig } from '../../domain/entities/Machine';
import type { WorkOrderListItem, WorkOrderResolveResult } from '../../domain/entities/backend/WorkOrder';
import type { GetMachinesUseCase } from '../use-cases/GetMachinesUseCase';
import type { ListWorkOrdersUseCase } from '../use-cases/ListWorkOrdersUseCase';

export interface WorkOrdersDeps {
  useBackend: boolean;
  currentDeviceId: string;
  listWorkOrdersUseCase: ListWorkOrdersUseCase;
  getMachinesUseCase: GetMachinesUseCase;
  runProtected: (action: () => Promise<void>) => Promise<void>;
  setMachines: React.Dispatch<React.SetStateAction<MachineConfig[]>>;
}

export interface WorkOrdersApi {
  isProductionSetupModalOpen: boolean;
  openProductionSetupModal: () => void;
  closeProductionSetupModal: () => void;
  pendingWorkOrders: WorkOrderListItem[];
  workOrderError: string;
  workOrderPreview: { woId: string; result: WorkOrderResolveResult } | null;
  productionSetupError: string;
  productionSetupBusy: boolean;
  loadPendingWorkOrders: () => Promise<void>;
  previewWorkOrder: (woId: string) => Promise<void>;
  clearWorkOrderPreview: () => void;
  dispatchWorkOrder: (woId: string, deviceId: string) => Promise<void>;
  completeWorkOrder: (woId: string, finalRejectCount: number) => Promise<void>;
  cancelWorkOrder: (woId: string, reason?: string) => Promise<void>;
}

export function useWorkOrders(deps: WorkOrdersDeps): WorkOrdersApi {
  const { useBackend, currentDeviceId, listWorkOrdersUseCase, getMachinesUseCase, runProtected, setMachines } = deps;

  const [isProductionSetupModalOpen, setIsProductionSetupModalOpen] = useState<boolean>(false);
  const [pendingWorkOrders, setPendingWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [workOrderError, setWorkOrderError] = useState<string>('');
  const [workOrderPreview, setWorkOrderPreview] = useState<{ woId: string; result: WorkOrderResolveResult } | null>(null);
  const [productionSetupError, setProductionSetupError] = useState<string>('');
  const [productionSetupBusy, setProductionSetupBusy] = useState<boolean>(false);

  // ===== Production setup (§C list/resolve/dispatch/complete/cancel) =====
  const openProductionSetupModal = useCallback(() => {
    setProductionSetupError('');
    setWorkOrderPreview(null);
    setIsProductionSetupModalOpen(true);
  }, []);

  const closeProductionSetupModal = useCallback(() => setIsProductionSetupModalOpen(false), []);

  const loadPendingWorkOrders = useCallback(async () => {
    if (!useBackend) return;
    setWorkOrderError('');
    try {
      const pending = await listWorkOrdersUseCase.list({ status: 'PENDING', limit: 50 });
      setPendingWorkOrders(pending);
    } catch (err) {
      setWorkOrderError(err instanceof Error ? err.message : 'Gagal memuat work order.');
      throw err;
    }
  }, [listWorkOrdersUseCase, useBackend]);

  const previewWorkOrder = useCallback(async (woId: string) => {
    if (!useBackend) throw new Error('Preview work order hanya tersedia pada mode backend.');
    if (!currentDeviceId) throw new Error('Perangkat belum terikat pada mesin ini.');
    setWorkOrderError('');
    try {
      const result = await listWorkOrdersUseCase.resolve(woId, currentDeviceId);
      setWorkOrderPreview({ woId, result });
    } catch (err) {
      setWorkOrderPreview(null);
      throw err;
    }
  }, [currentDeviceId, listWorkOrdersUseCase, useBackend]);

  const clearWorkOrderPreview = useCallback(() => setWorkOrderPreview(null), []);

  const dispatchWorkOrder = useCallback(async (woId: string, deviceId: string) => {
    if (!useBackend) throw new Error('Dispatch work order hanya tersedia pada mode backend.');
    setProductionSetupBusy(true);
    try {
      await runProtected(async () => {
        await listWorkOrdersUseCase.dispatch(woId, deviceId, 'Dispatch dari Production Setup dashboard');
        const machineList = await getMachinesUseCase.executeAll();
        setMachines(machineList);
        const pending = await listWorkOrdersUseCase.list({ status: 'PENDING', limit: 50 });
        setPendingWorkOrders(pending);
        setWorkOrderPreview(null);
      });
    } catch (err) {
      setProductionSetupError(err instanceof Error ? err.message : 'Dispatch gagal.');
      throw err;
    } finally {
      setProductionSetupBusy(false);
    }
  }, [getMachinesUseCase, listWorkOrdersUseCase, runProtected, setMachines, useBackend]);

  const completeWorkOrder = useCallback(async (woId: string, finalRejectCount: number) => {
    if (!useBackend) throw new Error('Complete work order hanya tersedia pada mode backend.');
    setProductionSetupBusy(true);
    try {
      await runProtected(async () => {
        await listWorkOrdersUseCase.complete(woId, finalRejectCount);
        const machineList = await getMachinesUseCase.executeAll();
        setMachines(machineList);
      });
    } catch (err) {
      setProductionSetupError(err instanceof Error ? err.message : 'Complete work order gagal.');
      throw err;
    } finally {
      setProductionSetupBusy(false);
    }
  }, [getMachinesUseCase, listWorkOrdersUseCase, runProtected, setMachines, useBackend]);

  const cancelWorkOrder = useCallback(async (woId: string, reason?: string) => {
    if (!useBackend) throw new Error('Cancel work order hanya tersedia pada mode backend.');
    setProductionSetupBusy(true);
    try {
      await runProtected(async () => {
        await listWorkOrdersUseCase.cancel(woId, reason);
        const machineList = await getMachinesUseCase.executeAll();
        setMachines(machineList);
      });
    } catch (err) {
      setProductionSetupError(err instanceof Error ? err.message : 'Cancel work order gagal.');
      throw err;
    } finally {
      setProductionSetupBusy(false);
    }
  }, [getMachinesUseCase, listWorkOrdersUseCase, runProtected, setMachines, useBackend]);

  return {
    isProductionSetupModalOpen,
    openProductionSetupModal,
    closeProductionSetupModal,
    pendingWorkOrders,
    workOrderError,
    workOrderPreview,
    productionSetupError,
    productionSetupBusy,
    loadPendingWorkOrders,
    previewWorkOrder,
    clearWorkOrderPreview,
    dispatchWorkOrder,
    completeWorkOrder,
    cancelWorkOrder,
  };
}
