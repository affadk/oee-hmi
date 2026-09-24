import { describe, expect, it } from 'vitest';
import { resolveShiftWindowIso } from '../src/domain/services/ShiftTimeline';

// Wall-clock components are local-time by construction, so expectations built
// the same way are timezone-independent.
const at = (day: number, h: number, m: number): Date => new Date(2026, 8, day, h, m, 0, 0);

describe('resolveShiftWindowIso', () => {
  it('resolves a morning shift containing now, clamped to now', () => {
    const w = resolveShiftWindowIso('06:00', '14:00', at(22, 10, 0));
    expect(w?.from).toBe(at(22, 6, 0).toISOString());
    expect(w?.to).toBe(at(22, 10, 0).toISOString());
  });

  it('resolves an overnight shift containing now (after midnight)', () => {
    const w = resolveShiftWindowIso('22:00', '06:00', at(22, 2, 0));
    expect(w?.from).toBe(at(21, 22, 0).toISOString());
    expect(w?.to).toBe(at(22, 2, 0).toISOString());
  });

  it('resolves an overnight shift containing now (before midnight)', () => {
    const w = resolveShiftWindowIso('22:00', '06:00', at(21, 23, 30));
    expect(w?.from).toBe(at(21, 22, 0).toISOString());
    expect(w?.to).toBe(at(21, 23, 30).toISOString());
  });

  it('falls back to the previous instance when now precedes the window', () => {
    const w = resolveShiftWindowIso('06:00', '14:00', at(22, 5, 0));
    expect(w?.from).toBe(at(21, 6, 0).toISOString());
    expect(w?.to).toBe(at(21, 14, 0).toISOString());
  });

  it('returns null for unparseable input', () => {
    expect(resolveShiftWindowIso(undefined, '14:00', at(22, 10, 0))).toBeNull();
    expect(resolveShiftWindowIso('06:00', '—', at(22, 10, 0))).toBeNull();
    expect(resolveShiftWindowIso('', '', at(22, 10, 0))).toBeNull();
  });
});
