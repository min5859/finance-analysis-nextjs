import type { MultiplesParams, ValuationResult } from '../types';
import type { PerformanceData, BalanceSheetData, CashFlowData } from '@/types/company';
import { latest } from '@/lib/format';

export function calculateMultiples(
  p: MultiplesParams,
  perfData: PerformanceData,
  bsData: BalanceSheetData,
  cfData: CashFlowData,
): ValuationResult {
  const netIncome = latest(perfData?.순이익 ?? [0]);
  const equity = latest(bsData?.자본총계 ?? [0]);
  const revenue = latest(perfData?.매출액 ?? [0]);
  const opProfit = latest(perfData?.영업이익 ?? [0]);

  const baseValues: Record<string, number> = {
    PER: netIncome,
    PBR: equity,
    PSR: revenue,
    'EV/EBITDA': opProfit * 1.3,
    'EV/Sales': revenue,
    'P/FCF': latest(cfData?.FCF ?? [0]) || opProfit * 0.7,
  };

  const valuations: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const m of p.selectedMultiples) {
    const base = baseValues[m] || 0;
    const multiple = p.industryMultiples[m] || 0;
    const val = base * multiple * (1 + p.discountPremium / 100);
    valuations[m] = Math.round(val);
    const weight = (p.multipleWeights[m] || 0) / 100;
    weightedSum += val * weight;
    totalWeight += weight;
  }

  const finalValue = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    method: '상대가치법',
    equity_value: finalValue,
    enterprise_value: finalValue + latest(bsData?.총부채 ?? [0]),
    details: { valuations, weights: p.multipleWeights, discount_premium: p.discountPremium },
  };
}
