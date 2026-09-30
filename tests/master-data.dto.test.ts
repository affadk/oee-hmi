import { describe, expect, it } from 'vitest';
import {
  mapDeviceDto,
  mapDeviceListDto,
  mapMachineDto,
  mapMachineListDto,
  mapOperatorDto,
  mapOperatorListDto,
  mapProductDto,
  mapProductListDto,
} from '../src/infrastructure/backend/dto/master-data.dto';

describe('master-data dto (camelCase backend shape)', () => {
  it('maps machine with boundDevice and numeric coercion', () => {
    const out = mapMachineDto({
      machineId: 'CNC-MILLING-01',
      machineName: 'Milling 5-Axis CNC #1',
      deviceId: 'STM32-OEE-01',
      modbusSlaveId: 1,
      createdAt: '2026-09-06T03:58:15.976Z',
      boundDevice: { deviceId: 'STM32-OEE-01', macAddress: '00:08:DC:55:01:0A', isOnline: false },
    });
    expect(out.machineId).toBe('CNC-MILLING-01');
    expect(out.modbusSlaveId).toBe(1);
    expect(out.deviceId).toBe('STM32-OEE-01');
    expect(out.boundDevice?.macAddress).toBe('00:08:DC:55:01:0A');
    expect(out.boundDevice?.isOnline).toBe(false);
  });

  it('maps device with boundMachine', () => {
    const out = mapDeviceDto({
      deviceId: 'STM32-MZWO-ONLINE',
      model: null,
      macAddress: '00:1A:2B:3C:4D:71',
      ipAddress: '192.168.1.171',
      firmwareVersion: 'v2.1.0',
      isOnline: false,
      lastSeenAt: '2026-09-29T07:11:39.935Z',
      createdAt: '2026-09-07T04:05:41.988Z',
      boundMachine: { machineId: 'CNC-LATHE-01', machineName: 'CNC Lathe 01' },
    });
    expect(out.macAddress).toBe('00:1A:2B:3C:4D:71');
    expect(out.boundMachine?.machineId).toBe('CNC-LATHE-01');
  });

  it('maps product with numeric-string stdCycleTimeSec', () => {
    const out = mapProductDto({
      productId: 'PRD-COUPLING-M10',
      productName: 'Flexible Motor Coupling M10',
      stdCycleTimeSec: '10.00',
      createdAt: '2026-09-06T03:58:15.980Z',
    });
    expect(out.stdCycleTimeSec).toBeCloseTo(10);
  });
});

describe('master-data dto (snake_case + envelope tolerance)', () => {
  it('maps snake_case machine/device/product', () => {
    const machine = mapMachineDto({
      machine_id: 'M1',
      machine_name: 'Mill',
      device_id: 'D1',
      modbus_slave_id: 2,
      created_at: '2026-09-06T00:00:00.000Z',
      bound_device: { device_id: 'D1', mac_address: 'aa', is_online: true },
    });
    expect(machine.machineId).toBe('M1');
    expect(machine.modbusSlaveId).toBe(2);
    expect(machine.boundDevice?.isOnline).toBe(true);

    const device = mapDeviceDto({
      device_id: 'D1',
      mac_address: 'aa',
      is_online: 'true',
      last_seen_at: '2026-09-29T00:00:00.000Z',
      created_at: '2026-09-07T00:00:00.000Z',
      bound_machine: { machine_id: 'M1', machine_name: 'Mill' },
    });
    expect(device.deviceId).toBe('D1');
    expect(device.isOnline).toBe(true);
    expect(device.boundMachine?.machineName).toBe('Mill');

    const product = mapProductDto({ product_id: 'P1', product_name: 'Gear', std_cycle_time_sec: '12.5' });
    expect(product.productId).toBe('P1');
    expect(product.stdCycleTimeSec).toBeCloseTo(12.5);
  });

  it('tolerates {data:[...]} envelopes for list endpoints', () => {
    const machines = mapMachineListDto({ data: [{ machine_id: 'M1' }, { machineId: 'M2' }], meta: { count: 2 } });
    expect(machines.map((m) => m.machineId)).toEqual(['M1', 'M2']);
    expect(mapDeviceListDto({ data: [{ device_id: 'D1' }] }).map((d) => d.deviceId)).toEqual(['D1']);
    expect(mapProductListDto({ data: [{ product_id: 'P1' }] }).map((p) => p.productId)).toEqual(['P1']);
  });

  it('returns [] for non-list shapes instead of fabricating', () => {
    expect(mapMachineListDto(null)).toEqual([]);
    expect(mapMachineListDto({ data: { machineId: 'M1' } })).toEqual([]);
    expect(mapMachineListDto('nope')).toEqual([]);
  });
});

describe('master-data dto (operator role + null-safety)', () => {
  it('normalizes role and defaults unknown to OPERATOR', () => {
    expect(mapOperatorDto({ operator_id: 'O1', role: 'supervisor' }).role).toBe('SUPERVISOR');
    expect(mapOperatorDto({ operator_id: 'O2', role: 'WARP' }).role).toBe('OPERATOR');
    expect(mapOperatorDto({ operator_id: 'O3' }).role).toBe('OPERATOR');
  });

  it('maps operator list and inactive flag', () => {
    const ops = mapOperatorListDto([
      { operatorId: 'O1', operatorName: 'Budi', role: 'OPERATOR', lineId: null, isActive: true, createdAt: 'x' },
      { operator_id: 'O2', operator_name: 'Sari', role: 'ADMIN', line_id: 'L1', is_active: 0, created_at: 'y' },
    ]);
    expect(ops).toHaveLength(2);
    expect(ops[0]?.isActive).toBe(true);
    expect(ops[1]?.isActive).toBe(false);
    expect(ops[1]?.lineId).toBe('L1');
  });

  it('nulls boundDevice/boundMachine when no nested object present', () => {
    expect(mapMachineDto({ machineId: 'M1' }).boundDevice).toBeNull();
    expect(mapDeviceDto({ deviceId: 'D1' }).boundMachine).toBeNull();
  });
});
