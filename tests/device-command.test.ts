// Unit 001 Fase 2 (T014/T015): perintah kanonis 6 enum + COUNT_ADJUST count
// (FR-015) di gateway; guard reason/count sebelum fetch.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OeeHttpDeviceCommandGateway } from '../src/infrastructure/backend/api-clients/oeeApiClient';

function stubFetchOnce(status: number, body: unknown) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('device command gateway — 6 enum + count (FR-015)', () => {
  it('COUNT_ADJUST mengirim count integer', async () => {
    const calls = stubFetchOnce(200, { success: true, transaction_id: 'CMD-1' });
    const gw = new OeeHttpDeviceCommandGateway();
    const res = await gw.sendCommand({ deviceId: 'STM32-OEE-01', command: 'COUNT_ADJUST', reason: 'Koreksi pasca edge offline', count: 42 });
    expect(res.transactionId).toBe('CMD-1');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      command: 'COUNT_ADJUST', reason: 'Koreksi pasca edge offline', count: 42,
    });
  });

  it('COUNT_ADJUST tanpa count ditolak sebelum fetch', async () => {
    const calls = stubFetchOnce(200, {});
    const gw = new OeeHttpDeviceCommandGateway();
    await expect(gw.sendCommand({ deviceId: 'D1', command: 'COUNT_ADJUST', reason: 'Koreksi hitungan' }))
      .rejects.toThrow(/count/);
    expect(calls).toHaveLength(0);
  });

  it('count di luar 0..999999 ditolak', async () => {
    stubFetchOnce(200, {});
    const gw = new OeeHttpDeviceCommandGateway();
    await expect(gw.sendCommand({ deviceId: 'D1', command: 'COUNT_ADJUST', reason: 'Koreksi hitungan', count: 1_000_000 }))
      .rejects.toThrow(/count/);
  });

  it('PAUSE tidak mengirim count; PLANNED_DT_START diteruskan', async () => {
    const calls = stubFetchOnce(200, { success: true, transaction_id: 'CMD-2' });
    const gw = new OeeHttpDeviceCommandGateway();
    await gw.sendCommand({ deviceId: 'D1', command: 'PAUSE', reason: 'Feeder adjustment' });
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ command: 'PAUSE', reason: 'Feeder adjustment' });
    await gw.sendCommand({ deviceId: 'D1', command: 'PLANNED_DT_START', reason: 'Istirahat terjadwal shift' });
    expect(JSON.parse(String(calls[1]?.init.body)).command).toBe('PLANNED_DT_START');
  });

  it('reason < 5 karakter ditolak sebelum fetch', async () => {
    const calls = stubFetchOnce(200, {});
    const gw = new OeeHttpDeviceCommandGateway();
    await expect(gw.sendCommand({ deviceId: 'D1', command: 'PAUSE', reason: 'abc' })).rejects.toThrow(/5 characters/);
    expect(calls).toHaveLength(0);
  });
});
