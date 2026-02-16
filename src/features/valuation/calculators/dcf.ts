import type { DCFParams, ValuationResult } from '../types';

export function calculateDCF(
  p: DCFParams,
  wacc: number,
  adjustedFcf: number,
  latestDebt: number,
): ValuationResult {
  const waccDecimal = wacc / 100;
  const initGrowth = p.initialGrowthRate / 100;
  const termGrowth = p.terminalGrowthRate / 100;
  const netDebt = latestDebt;

  const growthRates: number[] = [];
  for (let yr = 0; yr < p.forecastPeriod; yr++) {
    if (yr < p.growthYears) {
      if (p.growthDecay) {
        const decay = (p.growthYears - yr) / p.growthYears;
        growthRates.push(initGrowth * decay + termGrowth * (1 - decay));
      } else {
        growthRates.push(initGrowth);
      }
    } else {
      growthRates.push(termGrowth);
    }
  }

  const fcfs: number[] = [];
  let curFcf = adjustedFcf;
  for (const gr of growthRates) {
    fcfs.push(curFcf);
    curFcf *= (1 + gr);
  }

  const pvs = fcfs.map((fcf, i) => fcf / Math.pow(1 + waccDecimal, i + 1));
  const terminalValue = fcfs[fcfs.length - 1] * (1 + termGrowth) / (waccDecimal - termGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + waccDecimal, p.forecastPeriod);
  const ev = pvs.reduce((a, b) => a + b, 0) + pvTerminal;
  const equityValue = ev - netDebt;

  // Sensitivity: WACC
  const waccSens: Record<string, number> = {};
  for (let w = Math.max(wacc - 3, 1); w <= wacc + 3; w += 1.5) {
    const wd = w / 100;
    const tpvs = fcfs.map((f, i) => f / Math.pow(1 + wd, i + 1));
    const ttv = fcfs[fcfs.length - 1] * (1 + termGrowth) / (wd - termGrowth);
    const tptv = ttv / Math.pow(1 + wd, p.forecastPeriod);
    waccSens[`${w.toFixed(1)}%`] = Math.round(tpvs.reduce((a, b) => a + b, 0) + tptv - netDebt);
  }

  return {
    method: 'DCF',
    enterprise_value: Math.round(ev),
    equity_value: Math.round(equityValue),
    details: {
      forecast_period: p.forecastPeriod,
      wacc: wacc,
      base_fcf: adjustedFcf,
      net_debt: netDebt,
      fcfs: fcfs.map((f) => Math.round(f)),
      growth_rates: growthRates.map((g) => +(g * 100).toFixed(1)),
      present_values: pvs.map((v) => Math.round(v)),
      terminal_value: Math.round(terminalValue),
      pv_terminal: Math.round(pvTerminal),
      terminal_pct: +((pvTerminal / ev) * 100).toFixed(1),
    },
    sensitivity: { wacc: waccSens },
  };
}
