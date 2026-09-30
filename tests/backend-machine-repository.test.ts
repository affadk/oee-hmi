// Fallback job-config saat WO resolve gagal (DEVICE_OFFLINE/CONFLICT):
// metadata produk/operator/target tetap tampil dari GET work-orders/:id.
import { describe, expect, it } from 'vitest';
import { BackendMachineRepository } from '../src/infrastructure/backend/services/BackendMachineRepository';
import type { LiveStateSnapshot } from '../src/domain/entities/backend/LiveState';
import type { MachineRecord } from '../src/domain/entities/backend/Device';
import type { WorkOrderListItem } from '../src/domain/entities/backend/WorkOrder';
import type { ITelemetryRepository } from '../src/domain/ports/IOeeBackend';

const snapshot: LiveStateSnapshot = {
  deviceId: 'STM32-OEE-01',
  machineId: 'CNC-MILLING-01',
  woId: 'WO-20260903-01',
  currentState: 'RUNNING',
  availability: 92.5,
  performance: 95,
  quality: 97.4,
  oee: 85.5,
  totalCount: 2000,
  goodCount: 1950,
  rejectCount: 50,
  lastCycleTimeSec: 4.48,
  operatingTimeSec: 28800,
  runTimeSec: 24500,
  downtimeSec: 4300,
  spindleRpm: 1450,
  machineTempC: 42.5,
  plcAlarmCode: 0,
  uptimeSeconds: 86400,
  freeHeapBytes: 45000,
  lastTelemetryAt: '2026-09-29T07:11:48.000Z',
  updatedAt: '2026-09-29T07:11:49.107Z',
};

const machineRecord: MachineRecord = {
  machineId: 'CNC-MILLING-01',
  machineName: 'Milling 5-Axis CNC #1',
  deviceId: 'STM32-OEE-01',
  modbusSlaveId: 1,
  createdAt: '2026-09-06T03:58:15.976Z',
  boundDevice: { deviceId: 'STM32-OEE-01', macAddress: '00:08:DC:55:01:0A', isOnline: false },
};

const woDetail: WorkOrderListItem = {
  woId: 'WO-20260903-01',
  machineId: 'CNC-MILLING-01',
  machineName: 'Milling 5-Axis CNC #1',
  productId: 'PRD-GEAR-BOX-12',
  productName: 'Helical Gearbox 12mm',
  operatorId: 'OPR-1001',
  operatorName: 'Budi Santoso',
  targetQty: 500,
  status: 'COMPLETED',
  createdAt: '2026-09-06T03:58:15.984Z',
  startTime: '2026-09-07T04:02:38.651Z',
  endTime: '2026-09-06T05:06:04.043Z',
};

const emptyPage = { data: [], meta: { limit: 0, hasMore: false, nextCursor: null, count: 0 } };

function makeRepo(resolveError: Error) {
  const liveStateRepo = { getAllSnapshots: async () => [snapshot], getSnapshotByDevice: async () => snapshot };
  const masterDataRepo = {
    listMachines: async () => [machineRecord],
    listDevices: async () => [],
    listProducts: async () => [],
    listOperators: async () => [],
    getDevice: async () => null,
    updateDevice: async () => null,
    getMachine: async () => machineRecord,
    updateMachine: async () => machineRecord,
    bindDevice: async () => machineRecord,
    unbindMachine: async () => undefined,
  };
  const workOrderRepo = {
    list: async () => [] as WorkOrderListItem[],
    getDetail: async () => woDetail,
    resolve: async () => { throw resolveError; },
    dispatch: async () => undefined,
    complete: async () => undefined,
    cancel: async () => undefined,
  };
  const commandGateway = { sendCommand: async () => ({ success: true, transactionId: 't' }) };
  const telemetryRepo = {
    getHistory: async () => [],
    getAggregate: async () => [],
    getActiveDowntimes: async () => [],
    getDowntimes: async () => emptyPage,
    getLabelableDowntimes: async () => [],
    getHourlyTrends: async () => emptyPage,
    getOperationalEvents: async () => emptyPage,
    getAllOperationalEvents: async () => emptyPage,
    acknowledgeOperationalEvent: async () => null,
    labelDowntimeReason: async () => undefined,
    getRejectBreakdown: async () => [],
    getDeviceHealth: async () => null,
    getExport: async () => new Blob(),
  };
  return new BackendMachineRepository(
    liveStateRepo as never,
    masterDataRepo as never,
    workOrderRepo as never,
    commandGateway as never,
    telemetryRepo as unknown as ITelemetryRepository,
  );
}

describe('BackendMachineRepository WO metadata fallback', () => {
  it('fills job config from work-order detail when resolve fails (DEVICE_OFFLINE)', async () => {
    const repo = makeRepo(Object.assign(new Error('Edge controller offline'), { code: 'DEVICE_OFFLINE' }));
    const machines = await repo.getAllMachines();
    expect(machines).toHaveLength(1);
    expect(machines[0]?.jobConfig.productName).toBe('Helical Gearbox 12mm');
    expect(machines[0]?.jobConfig.operatorName).toBe('Budi Santoso');
    expect(machines[0]?.jobConfig.targetQuantity).toBe(500);
    expect(machines[0]?.jobConfig.workOrder).toBe('WO-20260903-01');
  });

  it('returns null job-config metadata when both resolve and detail fail', async () => {
    const repo = makeRepo(Object.assign(new Error('offline'), { code: 'DEVICE_OFFLINE' }));
    (repo as unknown as { workOrderRepo: { getDetail: () => Promise<never> } }).workOrderRepo.getDetail = async () => { throw new Error('404'); };
    const machines = await repo.getAllMachines();
    expect(machines).toHaveLength(1);
    expect(machines[0]?.jobConfig.productName).toBe('');
    expect(machines[0]?.jobConfig.targetQuantity).toBe(0);
  });

  it('recovers via the machine active WO when snapshot woId is stale (CONFLICT)', async () => {
    // Skenario nyata: snapshot masih menunjuk WO lama, mesin sudah pindah ke WO
    // ACTIVE baru → resolve(woId basi) 409 CONFLICT; resolve(WO aktif) 200.
    const activeWo = { ...woDetail, woId: 'WO-SIM-20260906-02', productName: 'Precision Shaft Pin 8mm', targetQty: 600, status: 'ACTIVE' as const };
    const repo = makeRepo(Object.assign(new Error('conflict'), { code: 'CONFLICT' }));
    const internal = repo as unknown as {
      workOrderRepo: {
        list: () => Promise<WorkOrderListItem[]>;
        resolve: (woId: string, deviceId: string) => Promise<unknown>;
      };
    };
    internal.workOrderRepo.list = async () => [activeWo];
    internal.workOrderRepo.resolve = async (woId: string) => {
      if (woId !== 'WO-SIM-20260906-02') throw Object.assign(new Error('conflict'), { code: 'CONFLICT' });
      return {
        woId, machineId: 'CNC-MILLING-01', productId: 'PRD-SHAFT-PIN-08',
        productName: 'Precision Shaft Pin 8mm', stdCycleTimeSec: 8.5,
        operatorId: 'OPR-1002', operatorName: 'Ahmad Pratama', targetQty: 600,
        shiftPlan: { shiftStart: '16:00', shiftEnd: '00:00', plannedBreakMin: 45, plannedOperatingSec: 26100 },
        targetPerHour: 83, break: { start: '23:15', end: '00:00', minutes: 45 }, status: 'ACTIVE',
      };
    };

    const machines = await repo.getAllMachines();
    expect(machines[0]?.jobConfig.workOrder).toBe('WO-SIM-20260906-02');
    expect(machines[0]?.jobConfig.productName).toBe('Precision Shaft Pin 8mm');
    expect(machines[0]?.jobConfig.targetQuantity).toBe(600);
    expect(machines[0]?.jobConfig.shiftStart).toBe('16:00');
    expect(machines[0]?.jobConfig.plannedBreakMin).toBe(45);
  });
});
