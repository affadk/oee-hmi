// Unit 001 Fase 1 (T007/T008): WO PENDING_CLOSE + field workflow ADR-0021 (FR-016).
import { describe, expect, it } from 'vitest';
import { mapWorkOrderDto } from '../src/infrastructure/backend/dto/work-order.dto';
import { isActiveWorkOrder } from '../src/domain/entities/backend/WorkOrder';

describe('work-order dto — PENDING_CLOSE (ADR-0021)', () => {
  it('memetakan status PENDING_CLOSE apa adanya', () => {
    const item = mapWorkOrderDto({ wo_id: 'WO-1', machine_id: 'CNC-MILLING-01', status: 'PENDING_CLOSE', target_qty: 100 });
    expect(item.status).toBe('PENDING_CLOSE');
  });

  it('PENDING_CLOSE masih aktif (menempati mesin sampai konfirmasi operator)', () => {
    expect(isActiveWorkOrder({ status: 'PENDING_CLOSE' })).toBe(true);
    expect(isActiveWorkOrder({ status: 'COMPLETED' })).toBe(false);
    expect(isActiveWorkOrder({ status: 'ABORTED' })).toBe(false);
  });

  it('field workflow aditif terpetakan (snake & camel)', () => {
    const item = mapWorkOrderDto({
      wo_id: 'WO-1', machine_id: 'M-1', status: 'ACTIVE', target_qty: 10,
      dispatched_at: '2026-11-20T01:00:00Z', ackedAt: '2026-11-20T01:00:05Z',
      actual_start_at: '2026-11-20T01:01:00Z', actual_end_at: null,
      provisional: true, count_uncertain: true,
    });
    expect(item.dispatchedAt).toBe('2026-11-20T01:00:00Z');
    expect(item.ackedAt).toBe('2026-11-20T01:00:05Z');
    expect(item.actualStartAt).toBe('2026-11-20T01:01:00Z');
    expect(item.actualEndAt).toBeNull();
    expect(item.provisional).toBe(true);
    expect(item.countUncertain).toBe(true);
  });

  it('status tak dikenal tetap fallback PENDING (perilaku lama)', () => {
    expect(mapWorkOrderDto({ wo_id: 'WO-1', machine_id: 'M-1', status: 'WEIRD' }).status).toBe('PENDING');
  });
});
