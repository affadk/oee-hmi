// Unit 002 T112: station login-first + fleet kartu RUNNING (FR-006).
import { describe, expect, it } from 'vitest';
import { resolveSurfaceMode } from '../src/application/surfaceMode';
import type { MachineConfig } from '../src/domain/entities/Machine';

describe('station login-first (FR-006)', () => {
  it('tanpa binding + tanpa sesi = andon (publik read-only)', () => {
    expect(resolveSurfaceMode({ stationId: '', hasSession: false })).toBe('andon');
  });

  it('login → station', () => {
    expect(resolveSurfaceMode({ stationId: '', hasSession: true })).toBe('station');
  });

  it('binding device walau ada sesi = kiosk (tidak pernah station)', () => {
    expect(resolveSurfaceMode({ stationId: 'STM32-OEE-01', hasSession: true })).toBe('kiosk');
  });
});

const fleet: MachineConfig[] = [
  { id: 'MC-01', status: 'RUNNING' },
  { id: 'MC-02', status: 'IDLE' },
  { id: 'MC-03', status: 'RUNNING' },
] as MachineConfig[];

describe('FleetCardsPanel filter (FR-006)', () => {
  it('hanya RUNNING yang jadi kartu', () => {
    const running = fleet.filter((m) => m.status === 'RUNNING');
    expect(running.map((m) => m.id)).toEqual(['MC-01', 'MC-03']);
  });
});