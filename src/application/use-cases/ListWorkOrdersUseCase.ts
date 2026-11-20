// /src/application/use-cases/ListWorkOrdersUseCase.ts

import type { IWorkOrderRepository } from '../../domain/ports/IOeeBackend';
import type {
  InitiateFromZonesResult,
  WorkOrderListItem,
  WorkOrderQuery,
  WorkOrderResolveResult,
  ZoneRawStrings,
  ZoneType,
  ZoneValidation,
} from '../../domain/entities/backend/WorkOrder';

export class ListWorkOrdersUseCase {
  constructor(private readonly workOrders: IWorkOrderRepository) {}

  list(query?: WorkOrderQuery, signal?: AbortSignal): Promise<WorkOrderListItem[]> {
    return this.workOrders.list(query, signal);
  }

  /** Safe read — resolves WO + machine + product + operator + shift plan without publishing MQTT. */
  resolve(woId: string, deviceId: string, signal?: AbortSignal): Promise<WorkOrderResolveResult> {
    if (!woId || !deviceId) throw new Error('woId and deviceId are required.');
    return this.workOrders.resolve(woId, deviceId, signal);
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
    if (!woId) throw new Error('woId is required.');
    if (!Number.isFinite(finalRejectCount) || finalRejectCount < 0) throw new Error('finalRejectCount must be a finite number >= 0.');
    return this.workOrders.complete(woId, finalRejectCount, notes);
  }

  cancel(woId: string, reason?: string): Promise<void> {
    return this.workOrders.cancel(woId, reason);
  }

  /** unit 002 FR-004: pre-flight satu zona QR v2 (§C.7). */
  validateZone(zoneType: ZoneType, deviceId: string, rawString: string, signal?: AbortSignal): Promise<ZoneValidation> {
    if (!deviceId) throw new Error('deviceId is required.');
    if (!rawString?.trim()) throw new Error('rawString is required.');
    return this.workOrders.validateZone(zoneType, deviceId, rawString, signal);
  }

  /** unit 002 FR-004: inisiasi WO dari 4 zona + dispatch MQTT (§C.8). */
  initiateFromZones(deviceId: string, zones: ZoneRawStrings, signal?: AbortSignal): Promise<InitiateFromZonesResult> {
    if (!deviceId) throw new Error('deviceId is required.');
    if (!zones?.product || !zones?.machine || !zones?.operator || !zones?.shift) {
      throw new Error('4 zona QR wajib lengkap (product, machine, operator, shift).');
    }
    return this.workOrders.initiateFromZones(deviceId, zones, signal);
  }
}
