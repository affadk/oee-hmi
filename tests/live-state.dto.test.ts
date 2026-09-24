import { describe, expect, it } from 'vitest';
import { mapLiveStateDto, mapLiveStateListDto } from '../src/application/dto/live-state.dto';

describe('mapLiveStateDto', () => {
  it('normalizes backend FSM PLANNED_DOWNTIME/UNPLANNED_DOWNTIME to domain states', () => {
    expect(mapLiveStateDto({ fsm_state: 'PLANNED_DOWNTIME' }).currentState).toBe('PLANNED_DT');
    expect(mapLiveStateDto({ fsm_state: 'UNPLANNED_DOWNTIME' }).currentState).toBe('UNPLANNED_DT');
    expect(mapLiveStateDto({ current_state: 'RUNNING' }).currentState).toBe('RUNNING');
  });

  it('accepts camelCase and snake_case shapes', () => {
    const camel = mapLiveStateDto({ deviceId: 'D1', machineId: 'M1', totalCount: 10 });
    const snake = mapLiveStateDto({ device_id: 'D1', machine_id: 'M1', total_count: 10 });
    expect(camel.deviceId).toBe('D1');
    expect(snake.deviceId).toBe('D1');
    expect(camel.totalCount).toBe(10);
    expect(snake.totalCount).toBe(10);
  });

  it('coerces numeric strings and falls back to 0', () => {
    expect(mapLiveStateDto({ availability: '91.2' }).availability).toBeCloseTo(91.2);
    expect(mapLiveStateDto({ availability: 'bogus' }).availability).toBe(0);
  });

  it('maps unknown states to UNCONFIGURED instead of crashing', () => {
    expect(mapLiveStateDto({ fsm_state: 'WARP_DRIVE' }).currentState).toBe('UNCONFIGURED');
  });
});

describe('mapLiveStateListDto', () => {
  it('returns [] for non-array envelopes', () => {
    expect(mapLiveStateListDto(null)).toEqual([]);
    expect(mapLiveStateListDto({ data: [] })).toEqual([]);
  });

  it('maps each snapshot', () => {
    const out = mapLiveStateListDto([{ device_id: 'D1' }, { device_id: 'D2' }]);
    expect(out.map((s) => s.deviceId)).toEqual(['D1', 'D2']);
  });
});
