'use client';

import { useState, useMemo } from 'react';
import type { PerformanceData, BalanceSheetData, CashFlowData, GrowthRatesData } from '@/types/company';
import type { DCFParams, ValuationResult } from '../types';
import { calculateDCF } from '../calculators/dcf';
import { formatBillion, latest } from '@/lib/format';
import ParamGroup from '@/components/ui/ParamGroup';
import NumberInput from '@/components/ui/NumberInput';
import RangeInput from '@/components/ui/RangeInput';
import InfoBox from '@/components/ui/InfoBox';
import SubmitButton from '@/components/ui/SubmitButton';

interface DCFFormProps {
  perfData: PerformanceData;
  bsData: BalanceSheetData;
  cfData: CashFlowData;
  growthData: GrowthRatesData;
  onSubmit: (r: ValuationResult) => void;
}

export default function DCFForm({ bsData, cfData, growthData, onSubmit }: DCFFormProps) {
  const latestDebt = latest(bsData?.총부채 ?? [0]);
  const latestAssets = latest(bsData?.총자산 ?? [0]);
  const debtRatio = latestAssets > 0 ? Math.round((latestDebt / latestAssets) * 100) : 30;

  const recentFcf = latest(cfData?.FCF ?? [0]);
  const historicGrowth = useMemo(() => {
    const rates = growthData?.매출액성장률 ?? [];
    if (rates.length === 0) return 3;
    const valid = rates.filter((r: number) => r > -50 && r !== 0);
    return valid.length > 0 ? valid.reduce((a: number, b: number) => a + b, 0) / valid.length : 3;
  }, [growthData]);

  const [p, setP] = useState<DCFParams>({
    forecastPeriod: 5,
    riskFreeRate: 2.5,
    marketRiskPremium: 5.5,
    beta: 1.1,
    costOfDebt: 4.0,
    taxRate: 22.0,
    debtWeight: debtRatio,
    customWacc: null,
    initialGrowthRate: Math.max(-10, Math.min(historicGrowth, 15)),
    terminalGrowthRate: Math.min(2, Math.max(0, historicGrowth / 3)),
    growthYears: 3,
    growthDecay: true,
    baseFcf: recentFcf || 100,
    fcfAdjustment: 0,
  });

  const set = (key: keyof DCFParams, val: number | boolean | null) => setP((prev) => ({ ...prev, [key]: val }));

  const costOfEquity = p.riskFreeRate + p.beta * p.marketRiskPremium;
  const calculatedWacc = (costOfEquity * (100 - p.debtWeight) / 100) + (p.costOfDebt * (1 - p.taxRate / 100) * p.debtWeight / 100);
  const wacc = p.customWacc !== null ? p.customWacc : calculatedWacc;
  const adjustedFcf = p.baseFcf * (1 + p.fcfAdjustment / 100);

  const calculate = () => {
    onSubmit(calculateDCF(p, wacc, adjustedFcf, latestDebt));
  };

  return (
    <div className="space-y-4">
      <ParamGroup title="예측 기간 설정">
        <RangeInput label="예측 기간 (년)" value={p.forecastPeriod} min={3} max={10} step={1} onChange={(v) => set('forecastPeriod', v)} />
      </ParamGroup>

      <ParamGroup title="할인율 (WACC) 설정">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="무위험수익률 (%)" value={p.riskFreeRate} step={0.1} onChange={(v) => set('riskFreeRate', v)} />
          <NumberInput label="베타 (β)" value={p.beta} step={0.05} onChange={(v) => set('beta', v)} />
          <NumberInput label="시장위험프리미엄 (%)" value={p.marketRiskPremium} step={0.1} onChange={(v) => set('marketRiskPremium', v)} />
          <NumberInput label="부채비용 (%)" value={p.costOfDebt} step={0.1} onChange={(v) => set('costOfDebt', v)} />
          <RangeInput label="부채 비중 (%)" value={p.debtWeight} min={0} max={100} step={1} onChange={(v) => set('debtWeight', v)} />
          <NumberInput label="법인세율 (%)" value={p.taxRate} step={0.5} onChange={(v) => set('taxRate', v)} />
        </div>
        <InfoBox>계산된 WACC (가중평균자본비용): <strong>{calculatedWacc.toFixed(2)}%</strong></InfoBox>
        <label className="flex items-center gap-2 text-sm mt-2">
          <input type="checkbox" checked={p.customWacc !== null} onChange={(e) => set('customWacc', e.target.checked ? calculatedWacc : null)} />
          직접 입력
        </label>
        {p.customWacc !== null && (
          <NumberInput label="직접 입력 WACC (%)" value={p.customWacc} step={0.1} onChange={(v) => set('customWacc', v)} />
        )}
      </ParamGroup>

      <ParamGroup title="성장률 설정">
        <InfoBox>과거 평균 성장률: <strong>{historicGrowth.toFixed(1)}%</strong></InfoBox>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="초기 성장률 (%)" value={p.initialGrowthRate} step={0.5} onChange={(v) => set('initialGrowthRate', v)} />
          <NumberInput label="영구 성장률 (%)" value={p.terminalGrowthRate} step={0.1} onChange={(v) => set('terminalGrowthRate', v)} />
          <RangeInput label="성장 예측 기간 (년)" value={p.growthYears} min={1} max={p.forecastPeriod} step={1} onChange={(v) => set('growthYears', v)} />
          <label className="flex items-center gap-2 text-sm self-center">
            <input type="checkbox" checked={p.growthDecay} onChange={(e) => set('growthDecay', e.target.checked)} />
            성장률 점진적 감소
          </label>
        </div>
      </ParamGroup>

      <ParamGroup title="현금흐름 조정">
        <InfoBox>최근 FCF: <strong>{formatBillion(recentFcf)}억원</strong></InfoBox>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="FCF 기준값 (억원)" value={p.baseFcf} step={10} onChange={(v) => set('baseFcf', v)} />
          <RangeInput label="FCF 조정 (%)" value={p.fcfAdjustment} min={-50} max={50} step={5} onChange={(v) => set('fcfAdjustment', v)} />
        </div>
        <InfoBox>조정된 FCF 기준값: <strong>{formatBillion(Math.round(adjustedFcf))}억원</strong></InfoBox>
      </ParamGroup>

      <SubmitButton onClick={calculate} />
    </div>
  );
}
