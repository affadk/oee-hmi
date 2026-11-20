import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/infrastructure/backend/api-clients/endpoints';

describe('endpoints (pure path builders, no network)', () => {
  it('builds static collection paths', () => {
    expect(endpoints.liveStateAll()).toBe('/api/v1/live-state');
    expect(endpoints.workOrders()).toBe('/api/v1/work-orders');
    expect(endpoints.authLogin()).toBe('/api/v1/auth/login');
    expect(endpoints.authPasswordChange()).toBe('/api/v1/auth/password/change');
    expect(endpoints.authMe()).toBe('/api/v1/auth/me');
    expect(endpoints.systemAccessMode()).toBe('/api/v1/system/access-mode');
  });

  it('encodes dynamic segments', () => {
    expect(endpoints.liveStateByDevice('STM32 01/x')).toBe('/api/v1/live-state/STM32%2001%2Fx');
    expect(endpoints.workOrderResolve('WO/9', 'DEV&A')).toBe(
      '/api/v1/work-orders/WO%2F9/resolve?device_id=DEV%26A',
    );
    expect(endpoints.downtimeReason(42)).toBe('/api/v1/downtime-events/42/reason');
  });
});
