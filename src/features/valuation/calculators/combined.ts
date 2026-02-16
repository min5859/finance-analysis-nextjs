import type { CombinedParams, ValuationResult } from '../types';
import type { PerformanceData, BalanceSheetData, CashFlowData } from '@/types/company';
import { latest } from '@/lib/format';

export function calculateCombined(
  p: CombinedParams,
  perfData: PerformanceData,
  bsData: BalanceSheetData,
  cfData: CashFlowData,
): ValuationResult {
  const results: { method: string; value: number; weight: number }[] = [];

  if (p.useDcf) {
    const waccD = p.dcfWacc / 100;
    const tg = p.dcfTerminalGrowth / 100;
    const tv = p.dcfBaseFcf * (1 + tg) / (waccD - tg);
    const pv = tv / Math.pow(1 + waccD, 5);
    let pvSum = 0;
    let fcf = p.dcfBaseFcf;
    for (let i = 1; i <= 5; i++) {
      pvSum += fcf / Math.pow(1 + waccD, i);
      fcf *= 1 + tg;
    }
    const ev = pvSum + pv;
    const eq = ev - latest(bsData?.총부채 ?? [0]);
    results.push({ method: 'DCF', value: Math.round(eq), weight: p.dcfWeight });
  }

  if (p.useMultiples) {
    const netIncome = latest(perfData?.순이익 ?? [0]);
    const equity = latest(bsData?.자본총계 ?? [0]);
    const opProfit = latest(perfData?.영업이익 ?? [0]);
    const perVal = netIncome * p.perMultiple;
    const pbrVal = equity * p.pbrMultiple;
    const evEbitdaVal = opProfit * 1.3 * p.evEbitdaMultiple - latest(bsData?.총부채 ?? [0]);
    const avg = (perVal + pbrVal + evEbitdaVal) / 3 * (1 + p.multiplesDiscount / 100);
    results.push({ method: '상대가치법', value: Math.round(avg), weight: p.multiplesWeight });
  }

  if (p.useAsset) {
    const assets = latest(bsData?.총자산 ?? [0]) * (1 + p.assetAdj / 100);
    const liabilities = latest(bsData?.총부채 ?? [0]) * (1 + p.liabilityAdj / 100);
    results.push({ method: '자산가치법', value: Math.round(assets - liabilities), weight: p.assetWeight });
  }

  const totalWeight = results.reduce((a, r) => a + r.weight, 0);
  const weightedValue = totalWeight > 0
    ? Math.round(results.reduce((a, r) => a + r.value * r.weight, 0) / totalWeight)
    : 0;

  return {
    method: '복합 가치평가법',
    equity_value: weightedValue,
    details: {
      methods: results,
      total_weight: totalWeight,
    },
  };
}
