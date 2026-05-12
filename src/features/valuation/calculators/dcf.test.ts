import { describe, it, expect } from 'vitest';
import { calculateDCF } from './dcf';
import type { DCFParams } from '../types';

function params(overrides: Partial<DCFParams> = {}): DCFParams {
  return {
    forecastPeriod: 5,
    riskFreeRate: 2.5,
    marketRiskPremium: 5.5,
    beta: 1.1,
    costOfDebt: 4.0,
    taxRate: 22.0,
    debtWeight: 30,
    customWacc: null,
    initialGrowthRate: 8,
    terminalGrowthRate: 2,
    growthYears: 3,
    growthDecay: true,
    baseFcf: 100,
    fcfAdjustment: 0,
    ...overrides,
  };
}

describe('calculateDCF', () => {
  it('produces a positive enterprise value with healthy inputs', () => {
    const r = calculateDCF(params(), 10, 100, 50);
    expect(r.enterprise_value!).toBeGreaterThan(0);
    expect(r.equity_value).toBe(r.enterprise_value! - 50);
  });

  it('lower WACC ⇒ higher value (monotonic)', () => {
    const low = calculateDCF(params(), 8, 100, 0);
    const high = calculateDCF(params(), 12, 100, 0);
    expect(low.equity_value).toBeGreaterThan(high.equity_value);
  });

  it('higher terminal growth ⇒ higher value', () => {
    const slow = calculateDCF(params({ terminalGrowthRate: 1 }), 10, 100, 0);
    const fast = calculateDCF(params({ terminalGrowthRate: 3 }), 10, 100, 0);
    expect(fast.equity_value).toBeGreaterThan(slow.equity_value);
  });

  it('emits WACC sensitivity buckets around the base', () => {
    const r = calculateDCF(params(), 10, 100, 0);
    expect(r.sensitivity?.wacc).toBeDefined();
    expect(Object.keys(r.sensitivity!.wacc).length).toBeGreaterThan(1);
  });

  it('forecasts forecastPeriod years of FCF', () => {
    const r = calculateDCF(params({ forecastPeriod: 7 }), 10, 100, 0);
    const fcfs = (r.details as { fcfs: number[] }).fcfs;
    expect(fcfs.length).toBe(7);
  });
});
