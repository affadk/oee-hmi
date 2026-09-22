// /src/application/use-cases/ListWorkOrdersUseCase.ts

import type { IWorkOrderRepository } from '../../domain/ports/IOeeBackend';
import type { WorkOrderListItem, WorkOrderQuery } from '../../domain/entities/backend/WorkOrder';

export class ListWorkOrdersUseCase {
  constructor(private readonly workOrders: IWorkOrderRepository) {}

  list(query?: WorkOrderQuery, signal?: AbortSignal): Promise<WorkOrderListItem[]> {
    return this.workOrders.list(query, signal);
  }

  detail(woId: string, signal?: AbortSignal): Promise<WorkOrderListItem> {
    if (!woId) throw new Error('woId is required.');
    return this.workOrders.getDetail(woId, signal);
  }

  dispatch(woId: string, deviceId: string, notes?: string): Promise<void> {
    if (!woId || !deviceId) throw new Error('woId and deviceId are required.');
    return this.workOrders.dispatch(woId, deviceId, notes);
  }

  complete(woId: string, finalRejectCount: number, notes?: string): Promise<void> {
    if (finalRejectCount < 0) throw new Error('finalRejectCount must be >= 0.');
    return this.workOrders.complete(woId, finalRejectCount, notes);
  }

  cancel(woId: string, reason?: string): Promise<void> {
    return this.workOrders.cancel(woId, reason);
  }
}
