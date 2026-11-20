// Unit 003 T208: poll bounded ACK edge (FR-005/006) — tanpa renderer.
import { describe, expect, it } from 'vitest';
import {
  pollWorkOrderAck,
  ACK_POLL_INTERVAL_MS,
  ACK_WAIT_CAP_MS,
} from '../src/application/hooks/useWorkOrderAckWait';

/** Sleep instan + jam virtual yang maju per sleep (deterministik, tanpa timer nyata). */
function fakeClock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
    elapsed: () => t,
  };
}

function seq(values: string[]) {
  let i = 0;
  return async () => {
    const v = values[Math.min(i, values.length - 1)]!;
    i += 1;
    return v;
  };
}

describe('pollWorkOrderAck', () => {
  it('ACTIVE → berhenti (ACK SUCCESS)', async () => {
    const clock = fakeClock();
    const readStatus = seq(['PENDING', 'PENDING', 'ACTIVE', 'ACTIVE']);
    const status = await pollWorkOrderAck({ readStatus, isCancelled: () => false, sleep: clock.sleep, now: clock.now });
    expect(status).toBe('ACTIVE');
    expect(clock.elapsed()).toBeLessThanOrEqual(ACK_WAIT_CAP_MS);
  });

  it('ABORTED → berhenti', async () => {
    const clock = fakeClock();
    const status = await pollWorkOrderAck({
      readStatus: seq(['PENDING', 'ABORTED']),
      isCancelled: () => false,
      sleep: clock.sleep,
      now: clock.now,
    });
    expect(status).toBe('ABORTED');
  });

  it('tak pernah ACK → TIMEOUT setelah cap (bukan loop tanpa batas)', async () => {
    const clock = fakeClock();
    let reads = 0;
    const status = await pollWorkOrderAck({
      readStatus: async () => {
        reads += 1;
        return 'PENDING';
      },
      isCancelled: () => false,
      sleep: clock.sleep,
      now: clock.now,
    });
    expect(status).toBe('TIMEOUT');
    expect(clock.elapsed()).toBeGreaterThanOrEqual(ACK_WAIT_CAP_MS);
    // Cap 20s / interval 2s = 10 read — bounded, bukan fetch-loop.
    expect(reads).toBeLessThanOrEqual(Math.ceil(ACK_WAIT_CAP_MS / ACK_POLL_INTERVAL_MS) + 1);
  });

  it('error read transient → lanjut sampai ACTIVE', async () => {
    const clock = fakeClock();
    let i = 0;
    const status = await pollWorkOrderAck({
      readStatus: async () => {
        i += 1;
        if (i === 1) throw new Error('network');
        return 'ACTIVE';
      },
      isCancelled: () => false,
      sleep: clock.sleep,
      now: clock.now,
    });
    expect(status).toBe('ACTIVE');
  });

  it('dibatalkan (unmount/run baru) → null, tanpa state', async () => {
    const clock = fakeClock();
    const status = await pollWorkOrderAck({
      readStatus: seq(['PENDING']),
      isCancelled: () => true,
      sleep: clock.sleep,
      now: clock.now,
    });
    expect(status).toBeNull();
  });
});
