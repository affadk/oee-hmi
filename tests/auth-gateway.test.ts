// Unit 001 Fase 1 (T008): auth gateway password + station + refresh error-aware
// + capability/access-mode projection + Retry-After (FR-001..FR-008).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OeeHttpAuthGateway } from '../src/infrastructure/backend/api-clients/oeeApiClient';
import { BackendHttpError } from '../src/infrastructure/backend/api-clients/httpClient';
import type { IAuthTokenStorage } from '../src/domain/ports/IAuthTokenStorage';

class MemoryTokenStorage implements IAuthTokenStorage {
  token: string | null = null;
  station: string | null = null;
  getToken() { return this.token; }
  setToken(t: string) { this.token = t; }
  clearToken() { this.token = null; }
  getStationId() { return this.station; }
  setStationId(s: string) { this.station = s; }
}

function stubFetchOnce(status: number, body: unknown, headers?: Record<string, string>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
  }));
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OeeHttpAuthGateway — password login (020/spec 044)', () => {
  it('mengirim operator_id + password + station_id ke /auth/login dan memetakan must_change_password', async () => {
    const calls = stubFetchOnce(200, {
      success: true, token: 't1', expires_in: 900,
      operator: { id: 'OPR-1001', username: 'budi', role: 'OPERATOR', line_id: 'LINE-01', must_change_password: true },
    });
    const storage = new MemoryTokenStorage();
    const gw = new OeeHttpAuthGateway(storage);
    const session = await gw.loginWithPassword('OPR-1001', 'rahasia-8', 'STM32-OEE-01');
    expect(calls[0]?.url).toContain('/api/v1/auth/login');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      operator_id: 'OPR-1001', password: 'rahasia-8', station_id: 'STM32-OEE-01',
    });
    expect(session.operator.mustChangePassword).toBe(true);
    expect(session.operator.lineId).toBe('LINE-01');
    expect(storage.getToken()).toBe('t1');
  });

  it('station kosong tidak dikirim sebagai string kosong', async () => {
    const calls = stubFetchOnce(200, { token: 't2', expires_in: 900 });
    const gw = new OeeHttpAuthGateway(new MemoryTokenStorage());
    await gw.loginWithPassword('OPR-1001', 'rahasia-8');
    expect(JSON.parse(String(calls[0]?.init.body)).station_id).toBeUndefined();
  });

  it('429 login membawa retryAfterSec dari header Retry-After (FR-003)', async () => {
    stubFetchOnce(429, { error: 'TOO_MANY_REQUESTS', message: 'slow down' }, { 'Retry-After': '42' });
    const gw = new OeeHttpAuthGateway(new MemoryTokenStorage());
    await expect(gw.loginWithPassword('OPR-1001', 'rahasia-8')).rejects.toMatchObject({
      status: 429, retryAfterSec: 42,
    });
  });
});

describe('OeeHttpAuthGateway — refresh sliding (G13/FR-006)', () => {
  it('null hanya bila tak ada token; fetch tidak dipanggil', async () => {
    const calls = stubFetchOnce(200, {});
    const gw = new OeeHttpAuthGateway(new MemoryTokenStorage());
    expect(await gw.refreshSession()).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('error AUTHZ_STALE dipropagate (bukan ditelan jadi null)', async () => {
    stubFetchOnce(401, { error: 'AUTHZ_STALE', message: 'stale' });
    const storage = new MemoryTokenStorage();
    storage.setToken('old');
    const gw = new OeeHttpAuthGateway(storage);
    await expect(gw.refreshSession()).rejects.toBeInstanceOf(BackendHttpError);
    await expect(gw.refreshSession()).rejects.toMatchObject({ code: 'AUTHZ_STALE' });
  });

  it('sukses mengganti token tersimpan', async () => {
    stubFetchOnce(200, { token: 'new', expires_in: 900 });
    const storage = new MemoryTokenStorage();
    storage.setToken('old');
    const gw = new OeeHttpAuthGateway(storage);
    const session = await gw.refreshSession();
    expect(session?.token).toBe('new');
    expect(storage.getToken()).toBe('new');
  });
});

describe('OeeHttpAuthGateway — rotasi password (spec 043)', () => {
  it('body kanonis current_password/new_password', async () => {
    const calls = stubFetchOnce(200, { success: true, message: 'ok' });
    const storage = new MemoryTokenStorage();
    storage.setToken('t');
    const gw = new OeeHttpAuthGateway(storage);
    await gw.changePassword('lama-888', 'baru-999');
    expect(calls[0]?.url).toContain('/api/v1/auth/password/change');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ current_password: 'lama-888', new_password: 'baru-999' });
  });
});

describe('OeeHttpAuthGateway — capability & access-mode (FR-007/008)', () => {
  it('membaca bentuk nested {authz:{capabilities}} dan menandai unknown fail-closed', async () => {
    stubFetchOnce(200, {
      operator: { id: 'OPR-1001' },
      authz: { capabilities: [
        { key: 'device_command.reset', decision: 'deny' },
        { key: 'device_command.pause', decision: 'allow' },
        { key: 'work_order.cancel', decision: 'maybe' },
      ] },
    });
    const gw = new OeeHttpAuthGateway(new MemoryTokenStorage());
    const caps = await gw.getCapabilities();
    expect(caps['device_command.reset']).toBe('deny');
    expect(caps['device_command.pause']).toBe('allow');
    expect(caps['work_order.cancel']).toBe('unknown');
  });

  it('access-mode tunnel read-only', async () => {
    stubFetchOnce(200, { mode: 'public', channel: 'tunnel', mutations_allowed: false });
    const gw = new OeeHttpAuthGateway(new MemoryTokenStorage());
    expect(await gw.getAccessMode()).toEqual({ mode: 'public', channel: 'tunnel', mutationsAllowed: false });
  });
});
