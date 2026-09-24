import { describe, expect, it } from 'vitest';
import {
  mapWorkOrderDto,
  mapWorkOrderListDto,
  mapWorkOrderResolveDto,
} from '../src/application/dto/work-order.dto';

describe('mapWorkOrderDto', () => {
  it('maps snake_case with status normalization', () => {
    const out = mapWorkOrderDto({ wo_id: 'WO-1', machine_id: 'MC-1', status: 'active', target_qty: 100 });
    expect(out.woId).toBe('WO-1');
    expect(out.status).toBe('ACTIVE');
    expect(out.targetQty).toBe(100);
  });

  it('falls back to PENDING for unknown statuses', () => {
    expect(mapWorkOrderDto({ wo_id: 'W', status: 'WARP' }).status).toBe('PENDING');
    expect(mapWorkOrderDto({ wo_id: 'W' }).status).toBe('PENDING');
  });
});

describe('mapWorkOrderListDto', () => {
  it('unwraps {data} envelopes and bare arrays', () => {
    const env = mapWorkOrderListDto({ data: [{ wo_id: 'A' }, { wo_id: 'B' }] });
    const bare = mapWorkOrderListDto([{ wo_id: 'A' }]);
    expect(env.map((w) => w.woId)).toEqual(['A', 'B']);
    expect(bare.map((w) => w.woId)).toEqual(['A']);
  });

  it('returns [] for garbage', () => {
    expect(mapWorkOrderListDto(null)).toEqual([]);
    expect(mapWorkOrderListDto({})).toEqual([]);
  });
});

describe('mapWorkOrderResolveDto', () => {
  it('maps shift plan and coerces cycle time strings', () => {
    const out = mapWorkOrderResolveDto({
      wo_id: 'WO-9',
      std_cycle_time_sec: '9.5',
      target_qty: 560,
      shift_plan: {
        shift_start: '06:00',
        shift_end: '14:00',
        planned_break_min: 60,
        planned_operating_sec: 25200,
      },
    });
    expect(out.stdCycleTimeSec).toBeCloseTo(9.5);
    expect(out.shiftPlan.shiftStart).toBe('06:00');
    expect(out.shiftPlan.plannedOperatingSec).toBe(25200);
  });
});
