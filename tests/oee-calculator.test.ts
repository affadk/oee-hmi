import { describe, expect, it } from 'vitest';
import { OeeCalculator } from '../src/domain/services/OeeCalculator';
import type { MachineConfig } from '../src/domain/entities/Machine';
import { makeMachine } from './helpers';

describe('OeeCalculator.calculate with wire telemetry', () => {
  it('decodes x100 wire ints to percents', () => {
    const m = OeeCalculator.calculate(makeMachine());
    expect(m.availabilityPct).toBeCloseTo(91.2);
    expect(m.performancePct).toBeCloseTo(94.5);
    expect(m.qualityPct).toBeCloseTo(95.6);
    expect(m.oeePct).toBeCloseTo(82.4);
  });

  it('treats wire 0 as valid data (not missing)', () => {
    const m = OeeCalculator.calculate(
      makeMachine({ telemetry: { ...makeMachine().telemetry, a: 0, p: 0, q: 0, oee: 0 } }),
    );
    expect(m.availabilityPct).toBe(0);
    expect(m.oeePct).toBe(0);
  });
});

describe('OeeCalculator.calculate without wire telemetry (ISO-22400 fallback)', () => {
  const noWire = (): MachineConfig => ({
    ...makeMachine(),
    // Runtime-missing telemetry: previously forced A/P/Q/OEE to 0.
    telemetry: undefined as unknown as MachineConfig['telemetry'],
  });

  it('derives availability from run vs planned time', () => {
    // planned 480-60=420, unplanned 60 → run 360 → 85.7%
    expect(OeeCalculator.calculate(noWire()).availabilityPct).toBeCloseTo(85.7, 1);
  });

  it('derives quality from good/total and OEE as A×P×Q', () => {
    const m = OeeCalculator.calculate(noWire());
    expect(m.qualityPct).toBeCloseTo((904 / 945) * 100, 1);
    expect(m.oeePct).toBeCloseTo((m.availabilityPct * m.performancePct * m.qualityPct) / 10000, 1);
  });

  it('yields 0 quality for zero counts instead of NaN', () => {
    const empty = OeeCalculator.calculate({ ...noWire(), totalCount: 0, rejectCount: 0 });
    expect(empty.qualityPct).toBe(0);
  });
});

describe('OeeCalculator TEEP', () => {
  it('scales OEE by shift-window calendar utilization (480/1440)', () => {
    const m = OeeCalculator.calculate(makeMachine());
    expect(m.calendarUtilizationPct).toBeCloseTo(33.3, 1);
    expect(m.teepPct).toBeCloseTo((m.oeePct * m.calendarUtilizationPct) / 100, 1);
  });
});
